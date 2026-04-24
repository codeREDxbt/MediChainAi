"""
MONAI inference helpers for MediChainAi.

This module now distinguishes between:
- real bundle inference, where MONAI produces an actual model probability
- unavailable / incompatible uploads, where no trained MONAI result exists

It intentionally avoids fabricating fallback labels or confidence scores.
"""

import base64
import io
import logging
import os
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)


LABEL_COLOURS: list[tuple[int, int, int]] = [
    (0, 0, 0),
    (255, 80, 80),
    (80, 200, 80),
    (80, 80, 255),
    (255, 200, 80),
    (200, 80, 255),
]


def run_inference(file_bytes: bytes, filename: str, modality: str) -> dict[str, Any]:
    ext = _get_ext(filename)

    if ext == "dcm":
        return _infer_dicom(file_bytes, modality)
    if ext in ("nii", "nii.gz"):
        return _infer_nifti(file_bytes, modality)
    if ext in ("jpg", "jpeg", "png", "webp", "bmp"):
        return _infer_image(file_bytes, filename, modality)
    raise ValueError(f"Unsupported file format: .{ext}")


def _infer_dicom(file_bytes: bytes, modality: str) -> dict[str, Any]:
    import pydicom

    with tempfile.NamedTemporaryFile(suffix=".dcm", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        ds = pydicom.dcmread(tmp_path)
        try:
            pixel_array = ds.pixel_array.astype(np.float32)
        except Exception as exc:
            return _build_unavailable_result(
                modality,
                "DICOM",
                "The uploaded DICOM could not be decompressed by the available pixel-data handlers.",
                technical_reason=str(exc),
            )
        compatibility_error = _validate_bundle_input(modality, pixel_array, source="DICOM")
        if compatibility_error:
            return _build_unavailable_result(modality, "DICOM", compatibility_error)
        return _run_monai_bundle(tmp_path, _prepare_preview_array(pixel_array), modality, source="DICOM")
    finally:
        os.unlink(tmp_path)


def _infer_nifti(file_bytes: bytes, modality: str) -> dict[str, Any]:
    import nibabel as nib

    suffix = ".nii.gz" if len(file_bytes) > 2 and file_bytes[:2] == b"\x1f\x8b" else ".nii"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        img = nib.load(tmp_path)
        data = img.get_fdata().astype(np.float32)
        compatibility_error = _validate_bundle_input(modality, data, source="NIfTI")
        if compatibility_error:
            return _build_unavailable_result(modality, "NIfTI", compatibility_error)
        return _run_monai_bundle(tmp_path, _prepare_preview_array(data), modality, source="NIfTI")
    finally:
        os.unlink(tmp_path)


def _infer_image(file_bytes: bytes, filename: str, modality: str) -> dict[str, Any]:
    ext = _get_ext(filename)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("L")
        pixel_array = np.array(img, dtype=np.float32)
        compatibility_error = _validate_bundle_input(modality, pixel_array, source="Image")
        if compatibility_error:
            return _build_unavailable_result(modality, "Image", compatibility_error)
        return _run_monai_bundle(tmp_path, pixel_array, modality, source="Image")
    finally:
        os.unlink(tmp_path)


def _run_monai_bundle(
    input_path: str,
    original_pixel_array: np.ndarray,
    modality: str,
    source: str,
) -> dict[str, Any]:
    try:
        from model_loader import get_bundle_for_modality

        bundle = get_bundle_for_modality(modality)
        network: torch.nn.Module = bundle["network"]
        preprocessing = bundle.get("preprocessing")
        inferer = bundle.get("inferer")
        config = bundle["config"]
        label_names: dict[str, int] = config["label_names"]
        model_used = config["bundle_name"]
        model_description = config.get("description", model_used)
        prepared = preprocessing({"image": input_path}) if preprocessing else {"image": input_path}
        input_tensor = _as_batched_tensor(prepared.get("image"))
        input_tensor = input_tensor.to(_get_model_device(network))

        with torch.no_grad():
            raw_output = inferer(input_tensor, network) if inferer else network(input_tensor)

        output = _extract_tensor(raw_output)
        if output is None:
            raise RuntimeError("Loaded bundle returned an unsupported output type")

        if _is_classification_output(output):
            return _build_classification_result(
                output=output,
                label_names=label_names,
                modality=modality,
                source=source,
                model_used=model_used,
                model_description=model_description,
            )

        return _build_segmentation_result(
            output=output,
            label_names=label_names,
            original_pixel_array=original_pixel_array,
            modality=modality,
            source=source,
            model_used=model_used,
            model_description=model_description,
        )
    except Exception as exc:
        logger.warning("MONAI bundle execution unavailable for %s %s input: %s", modality, source, exc)
        return _build_unavailable_result(
            modality,
            source,
            "The configured MONAI bundle could not run on this upload, so no trained MONAI report was produced.",
            technical_reason=str(exc),
        )


def _build_segmentation_result(
    output: torch.Tensor,
    label_names: dict[str, int],
    original_pixel_array: np.ndarray,
    modality: str,
    source: str,
    model_used: str,
    model_description: str,
) -> dict[str, Any]:
    probabilities = torch.softmax(output, dim=1)
    pred_mask = probabilities.argmax(dim=1).squeeze().detach().cpu().numpy()
    display_mask = _prepare_preview_array(pred_mask)
    unique_labels = np.unique(pred_mask)
    detected = [name for name, idx in label_names.items() if idx in unique_labels and name != "background"]
    primary_label = detected[0] if detected else "No significant finding"
    coverage = float(np.sum(pred_mask > 0) / pred_mask.size)
    confidence = _compute_model_confidence(probabilities, pred_mask)
    urgent = _is_urgent(primary_label, coverage)
    is_volume = pred_mask.ndim == 3
    processed_target = "volume" if is_volume else "image"
    scope_note = _build_scope_note(model_used, model_description, modality)
    summary = _build_segmentation_summary(primary_label, modality, coverage, source, processed_target)
    details = [
        "Analysis mode: trained MONAI bundle.",
        f"Scan type used for review: {modality}.",
        f"Model confidence: {confidence}% based on MONAI probabilities.",
        f"Highlighted part of the processed {processed_target}: {round(coverage * 100, 1)}%.",
        f"Processed output size: {_describe_shape(pred_mask)}.",
        f"Model label returned: {', '.join(detected) if detected else 'no named label'}.",
        f"Model package: {model_used} ({model_description}).",
        scope_note,
        "This is AI-generated scan guidance and should be checked with a clinician.",
    ]

    return {
        "label": primary_label,
        "confidence": confidence,
        "analysis_mode": "bundle",
        "confidence_source": "model_probability",
        "findings": {
            "summary": summary,
            "details": details,
            "urgent": urgent,
        },
        "segmentation_overlay_base64": _mask_to_overlay_b64(display_mask, label_names, original_pixel_array),
        "model_used": model_used,
        "model_description": model_description,
        "scope_note": scope_note,
    }


def _build_classification_result(
    output: torch.Tensor,
    label_names: dict[str, int],
    modality: str,
    source: str,
    model_used: str,
    model_description: str,
) -> dict[str, Any]:
    logits = output.reshape(output.shape[0], -1)
    probabilities = torch.softmax(logits, dim=1)
    top_idx = int(probabilities.argmax(dim=1).item())
    confidence = round(float(probabilities[0, top_idx].item() * 100), 1)
    label_lookup = {idx: name for name, idx in label_names.items()}
    primary_label = label_lookup.get(top_idx, f"class_{top_idx}")
    urgent = _is_urgent(primary_label, 0.0)
    scope_note = _build_scope_note(model_used, model_description, modality)
    summary = _build_classification_summary(primary_label, confidence, modality, source)
    top_scores = _classification_scores(probabilities, label_lookup)

    details = [
        "Analysis mode: trained MONAI classification bundle.",
        f"Scan type used for review: {modality}.",
        f"Predicted label: {primary_label.replace('_', ' ')}.",
        f"Model confidence: {confidence}% based on class probabilities.",
        f"Class probability breakdown: {top_scores}.",
        "This model classifies the image and does not create a colored segmentation overlay.",
        f"Model package: {model_used} ({model_description}).",
        scope_note,
        "This is AI-generated scan guidance and should be checked with a clinician.",
    ]

    return {
        "label": primary_label,
        "confidence": confidence,
        "analysis_mode": "bundle",
        "confidence_source": "model_probability",
        "findings": {
            "summary": summary,
            "details": details,
            "urgent": urgent,
        },
        "segmentation_overlay_base64": None,
        "model_used": model_used,
        "model_description": model_description,
        "scope_note": scope_note,
    }


def _build_unavailable_result(
    modality: str,
    source: str,
    reason: str,
    technical_reason: str | None = None,
) -> dict[str, Any]:
    from model_loader import get_bundle_config_for_modality

    config = get_bundle_config_for_modality(modality)
    model_used = config["bundle_name"]
    model_description = config.get("description", model_used)
    input_requirement = config.get("input_requirement", "a compatible medical scan")
    scope_note = _build_scope_note(model_used, model_description, modality)
    details = [
        "Analysis mode: no trained MONAI result was generated for this upload.",
        f"Scan type used for review: {modality}.",
        reason,
        f"Requested MONAI package: {model_used} ({model_description}).",
        f"Compatible input required: {input_requirement}.",
        "No real MONAI confidence is available because the trained bundle did not run on this upload.",
        scope_note,
        "Upload a compatible study or enable the text-report provider if you need a narrative image description.",
    ]
    if technical_reason:
        details.append(f"Technical reason: {technical_reason}")

    return {
        "label": "No compatible MONAI result",
        "confidence": None,
        "analysis_mode": "unavailable",
        "confidence_source": "not_available",
        "findings": {
            "summary": f"{modality} scan ({source}) review did not produce a trained MONAI result. {reason}",
            "details": details,
            "urgent": False,
        },
        "segmentation_overlay_base64": None,
        "model_used": model_used,
        "model_description": model_description,
        "scope_note": scope_note,
    }


def _extract_tensor(raw_output: Any) -> torch.Tensor | None:
    if isinstance(raw_output, torch.Tensor):
        return raw_output
    if isinstance(raw_output, (list, tuple)) and raw_output:
        first = raw_output[0]
        return first if isinstance(first, torch.Tensor) else None
    if isinstance(raw_output, dict):
        for key in ("pred", "logits", "output"):
            value = raw_output.get(key)
            if isinstance(value, torch.Tensor):
                return value
    return None


def _is_classification_output(output: torch.Tensor) -> bool:
    if output.ndim == 2:
        return True
    if output.ndim == 4 and output.shape[2] == 1 and output.shape[3] == 1:
        return True
    return False


def _get_model_device(network: torch.nn.Module) -> torch.device:
    try:
        return next(network.parameters()).device
    except StopIteration:
        return torch.device("cpu")


def _as_batched_tensor(image: Any) -> torch.Tensor:
    if image is None:
        raise RuntimeError("Bundle preprocessing did not produce an input tensor")

    tensor = image if isinstance(image, torch.Tensor) else torch.as_tensor(image)
    tensor = tensor.float()

    while tensor.ndim < 3:
        tensor = tensor.unsqueeze(0)

    if tensor.ndim in (3, 4):
        tensor = tensor.unsqueeze(0)

    return tensor


def _validate_bundle_input(modality: str, data: np.ndarray, source: str) -> str | None:
    from model_loader import get_bundle_config_for_modality

    config = get_bundle_config_for_modality(modality)
    if not config.get("enabled", True):
        return config.get("availability_note", f"No MONAI bundle is enabled for modality '{modality}'.")

    input_kind = config.get("input_kind", "3d_volume")
    input_requirement = config.get("input_requirement", "a compatible medical scan")
    arr = np.asarray(data)

    if input_kind == "2d_image":
        if arr.ndim < 2:
            return f"The uploaded {source.lower()} could not be interpreted as a 2D image."
        return None

    if input_kind == "3d_volume":
        if arr.ndim < 3:
            return (
                f"This upload is a flat 2D {source.lower()} preview, but the configured {modality} MONAI "
                f"bundle requires {input_requirement}."
            )
        return None

    if input_kind == "4ch_volume":
        if arr.ndim < 4 or 4 not in arr.shape:
            return (
                f"This upload does not contain the channel layout needed by the configured MRI MONAI bundle. "
                f"It requires {input_requirement}."
            )
        return None

    return None


def _compute_model_confidence(probabilities: torch.Tensor, pred_mask: np.ndarray) -> float:
    max_probs = probabilities.max(dim=1).values.squeeze().detach().cpu().numpy()
    selected = max_probs[pred_mask > 0]
    if selected.size == 0:
        selected = max_probs.reshape(-1)
    return round(float(np.mean(selected) * 100), 1)


def _classification_scores(probabilities: torch.Tensor, label_lookup: dict[int, str]) -> str:
    score_parts: list[str] = []
    values = probabilities.squeeze().detach().cpu().numpy()
    for idx, value in enumerate(values):
        label = label_lookup.get(idx, f"class_{idx}")
        score_parts.append(f"{label}: {round(float(value * 100), 1)}%")
    return ", ".join(score_parts)


def _is_urgent(label: str, coverage: float) -> bool:
    urgent_keywords = ["tumor", "lesion", "enhancing", "hemorrhage", "edema", "necrotic", "pneumonia"]
    return any(keyword in label.lower() for keyword in urgent_keywords) or coverage > 0.40


def _build_segmentation_summary(
    label: str,
    modality: str,
    coverage: float,
    source: str,
    processed_target: str,
) -> str:
    pct = round(coverage * 100, 1)
    if label == "No significant finding":
        return (
            f"{modality} scan ({source}) review completed using the trained MONAI bundle. "
            f"The model did not assign a named target label on the processed {processed_target}, "
            f"and {pct}% of the {processed_target} was highlighted during analysis."
        )
    return (
        f"{modality} scan ({source}) review completed using the trained MONAI bundle. "
        f"The model highlighted '{label}' on the processed {processed_target}, covering about {pct}%."
    )


def _build_classification_summary(label: str, confidence: float, modality: str, source: str) -> str:
    readable = label.replace("_", " ")
    return (
        f"{modality} scan ({source}) review completed using the trained MONAI classifier. "
        f"The model predicted '{readable}' with {confidence}% confidence."
    )


def _build_scope_note(model_used: str, model_description: str, modality: str) -> str:
    if model_used == "spleen_ct_segmentation":
        return (
            "This CT bundle is trained for spleen segmentation, so it does not provide a full diagnosis "
            "for every chest, lung, or abdominal condition."
        )
    if model_used == "brats_mri_segmentation":
        return "This MRI bundle focuses on brain tumor regions and is not a general-purpose MRI diagnosis model."
    if model_used == "breast_density_classification":
        return (
            "This mammography bundle predicts BI-RADS density categories and is not a general-purpose "
            "breast cancer detection model."
        )
    if model_used == "chest_xray_classification":
        return (
            "This X-Ray bundle is limited to the labels it was trained on and should not be treated as a "
            "complete radiology report."
        )
    return f"Model scope: {model_description}. This does not replace a full clinical review of the {modality} scan."


def _prepare_preview_array(data: np.ndarray) -> np.ndarray:
    arr = np.asarray(data).astype(np.float32)

    if arr.ndim == 2:
        return arr

    if arr.ndim == 3:
        axis = int(np.argmin(arr.shape))
        index = arr.shape[axis] // 2
        return np.take(arr, index, axis=axis).astype(np.float32)

    if arr.ndim >= 4:
        if arr.shape[0] == 4:
            return _prepare_preview_array(arr[0])
        if arr.shape[-1] == 4:
            return _prepare_preview_array(arr[..., 0])
        return _prepare_preview_array(arr[0])

    return arr.squeeze().astype(np.float32)


def _describe_shape(arr: np.ndarray) -> str:
    if arr.ndim == 3:
        return "x".join(str(dim) for dim in arr.shape) + " voxels"
    if arr.ndim == 2:
        return f"{arr.shape[1]}x{arr.shape[0]} pixels"
    return "x".join(str(dim) for dim in arr.shape)


def _mask_to_overlay_b64(mask: np.ndarray, label_names: dict[str, int], original: np.ndarray) -> str | None:
    try:
        arr = original.copy()
        if arr.max() > arr.min():
            arr = (arr - arr.min()) / (arr.max() - arr.min()) * 255
        arr = arr.astype(np.uint8)

        from PIL import Image as PILImage

        arr_img = PILImage.fromarray(arr).convert("RGB")
        mask_img = PILImage.fromarray(mask.astype(np.uint8))
        mask_resized = np.array(mask_img.resize((arr.shape[1], arr.shape[0]), PILImage.NEAREST))

        overlay = np.array(arr_img).copy()
        for name, idx in label_names.items():
            if name == "background" or idx == 0:
                continue
            colour = LABEL_COLOURS[idx % len(LABEL_COLOURS)]
            region = mask_resized == idx
            for channel, value in enumerate(colour):
                overlay[:, :, channel][region] = (
                    overlay[:, :, channel][region] * 0.45 + value * 0.55
                ).astype(np.uint8)

        out = io.BytesIO()
        PILImage.fromarray(overlay).save(out, format="PNG")
        encoded = base64.b64encode(out.getvalue()).decode()
        return f"data:image/png;base64,{encoded}"
    except Exception as exc:
        logger.warning("Overlay generation failed: %s", exc)
        return None


def _get_ext(filename: str) -> str:
    low = filename.lower()
    if low.endswith(".nii.gz"):
        return "nii.gz"
    return Path(filename).suffix.lstrip(".")
