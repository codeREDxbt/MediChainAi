"""
main.py  –  MediChainAi MONAI Inference Microservice
------------------------------------------------------
Runs as a standalone FastAPI server.

Start:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    GET  /health              → service + model status
    POST /analyze             → run MONAI analysis on uploaded file
    GET  /models              → list available bundles
"""

import logging
import os
import secrets
import time
import base64
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.datastructures import UploadFile as StarletteUploadFile

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("monai_service")

# ── Optional: warm up the default model on startup ──────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load the default CT bundle so the first request is fast."""
    if os.getenv("MONAI_PRELOAD_MODEL", "true").lower() == "true":
        try:
            logger.info("Pre-loading default MONAI bundle (CT) …")
            from model_loader import get_bundle_for_modality
            get_bundle_for_modality("CT")
            logger.info("Default MONAI bundle ready.")
        except Exception as exc:
            logger.warning("Pre-load failed (will load on first request): %s", exc)
    yield


app = FastAPI(
    title="MediChainAi – MONAI Inference Service",
    description=(
        "Provides medical-image AI analysis powered by the MONAI framework. "
        "Accepts DICOM, NIfTI, and standard image files and returns structured findings."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allows the Next.js dev server to call this service) ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("NEXTJS_ORIGIN", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health", summary="Service health check")
async def health() -> dict[str, Any]:
    from model_loader import _model_cache, get_bundle_catalog  # type: ignore[attr-defined]
    catalog = get_bundle_catalog()
    cached = list(_model_cache.keys())
    return {
        "status": "ok",
        "service": "MediChainAi MONAI Service",
        "version": "1.0.0",
        "cached_models": cached,
        "available_modalities": [entry["modality"] for entry in catalog if entry["available"]],
        "configured_modalities": [entry["modality"] for entry in catalog],
        "bundle_catalog": catalog,
    }


@app.get("/models", summary="List available MONAI bundles")
async def list_models() -> dict[str, Any]:
    from model_loader import get_bundle_catalog
    return {"bundles": get_bundle_catalog()}


@app.post("/analyze", summary="Analyze a medical image with MONAI")
async def analyze(request: Request) -> JSONResponse:
    """
    Accepts either:
      - multipart/form-data with `file` + `modality`
      - application/json with `file_base64`, `filename`, and optional `modality`

    Returns structured AI findings + a segmentation overlay PNG (base64).
    """
    expected_secret = os.getenv("MONAI_SHARED_SECRET")
    provided_secret = request.headers.get("x-monai-shared-secret", "")
    if expected_secret and not secrets.compare_digest(provided_secret, expected_secret):
        raise HTTPException(status_code=401, detail="Unauthorized MONAI caller")

    file_name, file_bytes, modality = await _extract_analyze_payload(request)

    if not file_name:
        raise HTTPException(status_code=400, detail="No filename provided.")

    _validate_modality(modality)
    _validate_extension(file_name)

    logger.info(
        "Received file: %s  modality: %s  size: ~%s bytes",
        file_name,
        modality,
        len(file_bytes),
    )

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    t0 = time.perf_counter()

    try:
        from inference import run_inference
        result = run_inference(file_bytes, file_name, modality)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error("MONAI inference error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    elapsed = round(time.perf_counter() - t0, 2)
    logger.info("Inference completed in %.2fs – label: %s", elapsed, result.get("label"))

    return JSONResponse(
        content={
            **result,
            "inference_seconds": elapsed,
            "filename": file_name,
            "modality": modality,
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Validation helpers
# ═══════════════════════════════════════════════════════════════════════════════

ALLOWED_EXTENSIONS = {
    "dcm", "nii", "gz",   # medical formats (.nii.gz covered via suffix check)
    "jpg", "jpeg", "png", "webp", "bmp",
}

ALLOWED_MODALITIES = {"CT", "MRI", "X-Ray", "Ultrasound", "PET", "Mammography"}


async def _extract_analyze_payload(request: Request) -> tuple[str, bytes, str]:
    content_type = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid multipart request: {exc}") from exc

        file = form.get("file")
        modality = str(form.get("modality") or "CT")

        if isinstance(file, (UploadFile, StarletteUploadFile)):
            return file.filename or "", await file.read(), modality

        if hasattr(file, "filename") and hasattr(file, "read"):
            return str(getattr(file, "filename", "") or ""), await file.read(), modality

        file_type = type(file).__name__ if file is not None else "None"
        raise HTTPException(
            status_code=400,
            detail=f"Multipart request must include a file field named 'file'. Received: {file_type}",
        )

    if "application/json" in content_type:
        try:
            payload = await request.json()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid JSON request: {exc}") from exc

        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="JSON request body must be an object.")

        encoded = payload.get("file_base64")
        file_name = str(payload.get("filename") or "")
        modality = str(payload.get("modality") or "CT")

        if not encoded or not isinstance(encoded, str):
            raise HTTPException(status_code=400, detail="JSON request must include a base64 string in 'file_base64'.")

        try:
            file_bytes = base64.b64decode(encoded, validate=True)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid base64 file payload: {exc}") from exc

        return file_name, file_bytes, modality

    raise HTTPException(
        status_code=415,
        detail="Unsupported Content-Type. Use multipart/form-data or application/json.",
    )


def _validate_modality(modality: str) -> None:
    if modality not in ALLOWED_MODALITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid modality '{modality}'. Allowed: {sorted(ALLOWED_MODALITIES)}",
        )


def _validate_extension(filename: str) -> None:
    low = filename.lower()
    if low.endswith(".nii.gz"):
        return
    ext = low.rsplit(".", 1)[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}'. "
                   f"Supported: {sorted(ALLOWED_EXTENSIONS - {'gz'})} + .nii.gz",
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Dev entrypoint
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "true").lower() == "true",
        log_level="info",
    )
