# MONAI Inference Service

Medical-image AI microservice for **MediChainAi**, powered by [MONAI](https://monai.io).

## Supported Inputs

| Format | Extension | Modalities |
|--------|-----------|------------|
| DICOM | `.dcm` | CT, MRI, X-Ray, PET, Ultrasound |
| NIfTI | `.nii`, `.nii.gz` | CT, MRI |
| Standard image | `.jpg` `.jpeg` `.png` `.webp` `.bmp` | X-Ray, 2D slices |

> **Textual input** is handled separately by the existing OpenRouter/Llama 3.2 Vision integration in Next.js (`/api/scans/[id]/analyze`). MONAI is a pixel-level imaging engine, not a language model.

## Available MONAI Bundles

| Modality | Task | Bundle |
|----------|------|--------|
| CT | Organ segmentation | `spleen_ct_segmentation` |
| MRI | Brain tumour segmentation | `brats_mri_segmentation` |
| Mammography | Breast density classification | `breast_density_classification` |

`X-Ray`, `PET`, and `Ultrasound` are exposed in the API schema, but this local build does not currently ship a compatible MONAI bundle for those modalities.

## Setup (Local Dev)

```bash
# 1. Create Python virtual environment
cd monai-service
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies (~2 GB with PyTorch)
pip install -r requirements.txt

# 3. Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service auto-downloads the required MONAI bundle (~150–400 MB) on first use.
Bundles are cached in `.model_cache/` so subsequent starts are instant.

## Setup (Docker)

```bash
# From the project root
docker compose up monai-service
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service status + loaded models |
| `GET` | `/models` | List all available MONAI bundles |
| `POST` | `/analyze` | Analyse an uploaded scan file |

When `MONAI_SHARED_SECRET` is set on the MONAI service, `/analyze` requires this header:

```http
x-monai-shared-secret: <same-secret-value>
```

This is intended for server-to-server calls from the Next.js backend route (`/api/ai/monai`).

### POST /analyze

```
Content-Type: multipart/form-data

file     – scan file (DICOM / NIfTI / PNG / JPG …)
modality – CT | MRI | X-Ray | Ultrasound | PET (default: CT)
```

**Response**

```json
{
  "label": "spleen",
  "confidence": 87.3,
  "findings": {
    "summary": "CT scan processed. Primary finding: spleen. Affected region covers ~12% of scan area.",
    "details": ["Scan resolution: 256×256 px.", "Segmented region coverage: 12.1%.", "…"],
    "urgent": false
  },
  "segmentation_overlay_base64": "data:image/png;base64,…",
  "model_used": "spleen_ct_segmentation",
  "inference_seconds": 4.2,
  "filename": "scan.dcm",
  "modality": "CT"
}
```

## How It Fits Into MediChainAi

```
Patient uploads scan
        │
        ├─► /api/ai/monai  (POST {scanId})
        │       │
        │       └─► MONAI service → segmentation mask + findings
        │             └─► saved to analysis_results (Supabase)
        │
        └─► /api/scans/[id]/analyze  (existing)
                └─► OpenRouter Llama 3.2 Vision → radiological text report
                      └─► saved to analysis_results (Supabase)
```

Both pipelines write to the same `analysis_results` table.
The `model_source` column distinguishes them (`"monai"` vs `"openrouter"`).
