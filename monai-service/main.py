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
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

SERVICE_DIR = Path(__file__).resolve().parent
REPO_ROOT = SERVICE_DIR.parent

load_dotenv(REPO_ROOT / ".env.local")
load_dotenv(REPO_ROOT / ".env")
load_dotenv(SERVICE_DIR / ".env")

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
    from model_loader import BUNDLE_CONFIG, _model_cache  # type: ignore[attr-defined]
    cached = list(_model_cache.keys())
    return {
        "status": "ok",
        "service": "MediChainAi MONAI Service",
        "version": "1.0.0",
        "cached_models": cached,
        "available_modalities": list(BUNDLE_CONFIG.keys()),
    }


@app.get("/models", summary="List available MONAI bundles")
async def list_models() -> dict[str, Any]:
    from model_loader import BUNDLE_CONFIG
    return {
        "bundles": [
            {
                "modality": mod,
                "bundle_name": cfg["bundle_name"],
                "description": cfg["description"],
                "labels": cfg["label_names"],
            }
            for mod, cfg in BUNDLE_CONFIG.items()
        ]
    }


@app.post("/analyze", summary="Analyze a medical image with MONAI")
async def analyze(
    file: UploadFile = File(..., description="DICOM (.dcm), NIfTI (.nii/.nii.gz), or image file"),
    modality: str = Form(default="CT", description="CT | MRI | X-Ray | Ultrasound"),
    x_monai_shared_secret: str | None = Header(default=None, alias="x-monai-shared-secret"),
) -> JSONResponse:
    """
    Accepts a scan file and modality string.
    Returns structured AI findings + a segmentation overlay PNG (base64).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    expected_secret = os.getenv("MONAI_SHARED_SECRET")
    if expected_secret and not secrets.compare_digest(x_monai_shared_secret or "", expected_secret):
        raise HTTPException(status_code=401, detail="Unauthorized MONAI caller")

    _validate_modality(modality)
    _validate_extension(file.filename)

    logger.info(
        "Received file: %s  modality: %s  size: ~%s bytes",
        file.filename,
        modality,
        file.size or "unknown",
    )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    t0 = time.perf_counter()

    try:
        from inference import run_inference
        result = run_inference(file_bytes, file.filename, modality)
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
            "filename": file.filename,
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
