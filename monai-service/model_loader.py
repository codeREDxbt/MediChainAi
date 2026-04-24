"""
model_loader.py
---------------
Singleton that downloads and caches the MONAI bundle from the Model Zoo
the first time it is needed. Subsequent calls return the cached model.
"""

import logging
from functools import lru_cache
from pathlib import Path

import torch
from monai.bundle import download, ConfigParser
from monai.bundle.scripts import get_all_bundles_list

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Bundle configuration per modality / task
# ---------------------------------------------------------------------------
BUNDLE_CONFIG: dict[str, dict] = {
    "CT": {
        "bundle_name": "spleen_ct_segmentation",
        "source": "monaihosting",
        "enabled": True,
        "input_kind": "3d_volume",
        "input_requirement": "a 3D CT volume such as NIfTI or compatible multi-frame DICOM",
        "label_names": {
            "background": 0,
            "spleen": 1,
        },
        "description": "Spleen CT segmentation using a SegResNet model",
    },
    "MRI": {
        "bundle_name": "brats_mri_segmentation",
        "source": "monaihosting",
        "enabled": True,
        "input_kind": "4ch_volume",
        "input_requirement": "a 4-channel brain MRI volume with BraTS-style sequences",
        "label_names": {
            "background": 0,
            "necrotic_tumor": 1,
            "edema": 2,
            "enhancing_tumor": 4,
        },
        "description": "Brain MRI tumor segmentation (BraTS UNETR)",
    },
    "X-Ray": {
        "bundle_name": "chest_xray_classification",
        "source": "monaihosting",
        "enabled": False,
        "input_kind": "2d_image",
        "input_requirement": "a 2D chest X-ray image",
        "label_names": {
            "normal": 0,
            "pneumonia": 1,
        },
        "description": "Chest X-Ray classification (unavailable in the current MONAI model zoo release)",
        "availability_note": (
            "No compatible MONAI chest X-ray bundle is available in the current MONAI model-zoo release "
            "used by this service. Upload a volumetric CT/MRI study or use a supported specialized modality."
        ),
    },
    "Mammography": {
        "bundle_name": "breast_density_classification",
        "source": "monaihosting",
        "enabled": True,
        "input_kind": "2d_image",
        "input_requirement": "a 2D mammography image",
        "label_names": {
            "density_a": 0,
            "density_b": 1,
            "density_c": 2,
            "density_d": 3,
        },
        "description": "Breast density classification (BI-RADS A-D)",
    },
    "Ultrasound": {
        "bundle_name": "unconfigured_ultrasound_bundle",
        "source": "monaihosting",
        "enabled": False,
        "input_kind": "2d_image",
        "input_requirement": "a supported ultrasound bundle and matching scan type",
        "label_names": {},
        "description": "Ultrasound analysis (not configured in this build)",
        "availability_note": "No ultrasound MONAI bundle is configured in this build.",
    },
    "PET": {
        "bundle_name": "unconfigured_pet_bundle",
        "source": "monaihosting",
        "enabled": False,
        "input_kind": "3d_volume",
        "input_requirement": "a supported PET bundle and matching volumetric PET study",
        "label_names": {},
        "description": "PET analysis (not configured in this build)",
        "availability_note": "No PET MONAI bundle is configured in this build.",
    },
}

# Fallback when modality not in config
DEFAULT_MODALITY = "CT"

# Local cache directory (persists across restarts)
CACHE_DIR = Path(__file__).parent / ".model_cache"
CACHE_DIR.mkdir(exist_ok=True)

# In-memory model cache: modality → (model, config_parser, transforms)
_model_cache: dict[str, dict] = {}


@lru_cache(maxsize=1)
def _available_bundle_names() -> set[str]:
    return {name for name, _version in get_all_bundles_list()}


def _get_modality_config(modality: str) -> dict:
    normalized = _normalize_modality(modality)
    return BUNDLE_CONFIG.get(normalized, BUNDLE_CONFIG[DEFAULT_MODALITY])


def get_bundle_catalog() -> list[dict]:
    available_names = _available_bundle_names()
    catalog: list[dict] = []

    for modality, cfg in BUNDLE_CONFIG.items():
        bundle_name = cfg["bundle_name"]
        enabled = cfg.get("enabled", True)
        available = enabled and bundle_name in available_names
        availability_note = cfg.get("availability_note")
        if enabled and not available:
            availability_note = (
                f"Configured bundle '{bundle_name}' is not available in the current MONAI model-zoo release."
            )

        catalog.append({
            "modality": modality,
            "bundle_name": bundle_name,
            "description": cfg["description"],
            "labels": cfg["label_names"],
            "available": available,
            "input_requirement": cfg.get("input_requirement"),
            "availability_note": availability_note,
        })

    return catalog


def get_bundle_for_modality(modality: str) -> dict:
    """Return cached model components, loading them on first call."""
    cfg = _get_modality_config(modality)
    bundle_name = cfg["bundle_name"]

    if not cfg.get("enabled", True):
        raise RuntimeError(cfg.get("availability_note", f"No MONAI bundle is enabled for modality '{modality}'."))

    if bundle_name not in _available_bundle_names():
        raise RuntimeError(
            f"Configured bundle '{bundle_name}' is not available in the current MONAI model-zoo release."
        )

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
        try:
            inferer = parser.get_parsed_content("inferer")
        except Exception:
            inferer = None

        # Load network weights
        network = parser.get_parsed_content("network")
        ckpt_path = model_dir / "models" / "model.pt"
        network.load_state_dict(torch.load(str(ckpt_path), map_location="cpu"))
        network.eval()

        bundle_data = {
            "network": network,
            "preprocessing": preprocessing,
            "postprocessing": postprocessing,
            "inferer": inferer,
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
    if "MAMMO" in m or "MAMMOGRAPHY" in m:
        return "Mammography"
    if "X-RAY" in m or "XRAY" in m or "CXR" in m:
        return "X-Ray"
    if "ULTRA" in m:
        return "Ultrasound"
    if "PET" in m:
        return "PET"
    return DEFAULT_MODALITY


def get_bundle_config_for_modality(modality: str) -> dict:
    return _get_modality_config(modality)
