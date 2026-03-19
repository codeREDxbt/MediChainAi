"""
model_loader.py
---------------
Singleton that downloads and caches the MONAI bundle from the Model Zoo
the first time it is needed. Subsequent calls return the cached model.
"""

import logging
import tempfile
from pathlib import Path
from typing import Optional

import torch
from monai.bundle import download, ConfigParser
from monai.transforms import Compose

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Bundle configuration per modality / task
# ---------------------------------------------------------------------------
BUNDLE_CONFIG: dict[str, dict] = {
    "CT": {
        "bundle_name": "spleen_ct_segmentation",
        "source": "monaihosting",
        "label_names": {
            "background": 0,
            "spleen": 1,
        },
        "description": "Spleen CT segmentation using a SegResNet model",
    },
    "MRI": {
        "bundle_name": "brats_mri_segmentation",
        "source": "monaihosting",
        "label_names": {
            "background": 0,
            "necrotic_tumor": 1,
            "edema": 2,
            "enhancing_tumor": 4,
        },
        "description": "Brain MRI tumor segmentation (BraTS UNETR)",
    },
    "X-Ray": {
        # Chest X-Ray classification bundle
        "bundle_name": "chest_xray_classification",
        "source": "monaihosting",
        "label_names": {
            "normal": 0,
            "pneumonia": 1,
        },
        "description": "Chest X-Ray classification (COVID / pneumonia / normal)",
    },
}

# Fallback when modality not in config
DEFAULT_MODALITY = "CT"

# Local cache directory (persists across restarts)
CACHE_DIR = Path(__file__).parent / ".model_cache"
CACHE_DIR.mkdir(exist_ok=True)

# In-memory model cache: modality → (model, config_parser, transforms)
_model_cache: dict[str, dict] = {}


def get_bundle_for_modality(modality: str) -> dict:
    """Return cached model components, loading them on first call."""
    normalized = _normalize_modality(modality)
    cfg = BUNDLE_CONFIG.get(normalized, BUNDLE_CONFIG[DEFAULT_MODALITY])
    bundle_name = cfg["bundle_name"]

    if bundle_name in _model_cache:
        logger.info("Using cached MONAI bundle: %s", bundle_name)
        return _model_cache[bundle_name]

    logger.info("Downloading MONAI bundle '%s' from %s …", bundle_name, cfg["source"])
    model_dir = CACHE_DIR / bundle_name

    try:
        # Download bundle if not already present
        if not model_dir.exists():
            download(
                name=bundle_name,
                source=cfg["source"],
                bundle_dir=str(CACHE_DIR),
            )

        # Parse configuration
        config_path = model_dir / "configs" / "inference.json"
        if not config_path.exists():
            # Some bundles use .yaml
            config_path = model_dir / "configs" / "inference.yaml"

        parser = ConfigParser()
        parser.read_config(str(config_path))

        # Build inference transforms
        preprocessing = parser.get_parsed_content("preprocessing")
        postprocessing = parser.get_parsed_content("postprocessing")

        # Load network weights
        network = parser.get_parsed_content("network")
        ckpt_path = model_dir / "models" / "model.pt"
        network.load_state_dict(torch.load(str(ckpt_path), map_location="cpu"))
        network.eval()

        bundle_data = {
            "network": network,
            "preprocessing": preprocessing,
            "postprocessing": postprocessing,
            "config": cfg,
            "parser": parser,
        }
        _model_cache[bundle_name] = bundle_data
        logger.info("MONAI bundle '%s' loaded successfully.", bundle_name)
        return bundle_data

    except Exception as exc:
        logger.error("Failed to load MONAI bundle '%s': %s", bundle_name, exc)
        raise RuntimeError(f"MONAI model loading failed for bundle '{bundle_name}': {exc}") from exc


def _normalize_modality(modality: str) -> str:
    """Map user-facing modality strings to our bundle keys."""
    m = modality.strip().upper()
    if "CT" in m:
        return "CT"
    if "MRI" in m or "MR" in m:
        return "MRI"
    if "X-RAY" in m or "XRAY" in m or "CXR" in m:
        return "X-Ray"
    return DEFAULT_MODALITY
