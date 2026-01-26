"""
IPFS Naming Conventions

Standardized object_name patterns for IPFS uploads to ensure consistency
across the platform. Even though IPFS uses CIDs for content addressing,
these names provide human-readable metadata for organization.
"""
from enum import Enum
from typing import Optional


class IPFSObjectType(str, Enum):
    """Types of objects stored in IPFS."""
    ORIGINAL_SCAN = "original"
    PREVIEW = "preview"
    INFERENCE_RESULT = "result.json"
    HEATMAP = "heatmap.png"
    REPORT = "report"


def generate_scan_object_name(
    patient_id: str,
    scan_id: str,
    object_type: IPFSObjectType
) -> str:
    """
    Generate IPFS object name for scan-related files.
    
    Patterns:
    - patient/{patientId}/scan/{scanId}/original
    - patient/{patientId}/scan/{scanId}/preview
    
    Args:
        patient_id: Patient identifier
        scan_id: Scan identifier
        object_type: Type of object (original or preview)
    
    Returns:
        Standardized object name for IPFS metadata
    """
    if object_type not in (IPFSObjectType.ORIGINAL_SCAN, IPFSObjectType.PREVIEW):
        raise ValueError(f"Invalid object type for scan: {object_type}")
    
    return f"patient/{patient_id}/scan/{scan_id}/{object_type.value}"


def generate_inference_object_name(
    patient_id: str,
    scan_id: str,
    inference_id: str,
    object_type: IPFSObjectType
) -> str:
    """
    Generate IPFS object name for inference-related files.
    
    Patterns:
    - patient/{patientId}/scan/{scanId}/inference/{inferenceId}/result.json
    - patient/{patientId}/scan/{scanId}/inference/{inferenceId}/heatmap.png
    
    Args:
        patient_id: Patient identifier
        scan_id: Scan identifier
        inference_id: Inference result identifier
        object_type: Type of object (result.json or heatmap.png)
    
    Returns:
        Standardized object name for IPFS metadata
    """
    if object_type not in (IPFSObjectType.INFERENCE_RESULT, IPFSObjectType.HEATMAP):
        raise ValueError(f"Invalid object type for inference: {object_type}")
    
    return f"patient/{patient_id}/scan/{scan_id}/inference/{inference_id}/{object_type.value}"


def generate_report_object_name(
    patient_id: str,
    scan_id: str,
    inference_id: str
) -> str:
    """
    Generate IPFS object name for PDF reports.
    
    Pattern:
    - patient/{patientId}/scan/{scanId}/report/{inferenceId}.pdf
    
    Args:
        patient_id: Patient identifier
        scan_id: Scan identifier
        inference_id: Inference result identifier (report is tied to inference)
    
    Returns:
        Standardized object name for IPFS metadata
    """
    return f"patient/{patient_id}/scan/{scan_id}/report/{inference_id}.pdf"


def parse_object_name(object_name: str) -> dict:
    """
    Parse an IPFS object name back into its components.
    
    Args:
        object_name: Standardized IPFS object name
    
    Returns:
        Dictionary with parsed components (patient_id, scan_id, etc.)
    
    Raises:
        ValueError: If object name doesn't match expected patterns
    """
    parts = object_name.split("/")
    
    if len(parts) < 4 or parts[0] != "patient" or parts[2] != "scan":
        raise ValueError(f"Invalid object name format: {object_name}")
    
    result = {
        "patient_id": parts[1],
        "scan_id": parts[3],
    }
    
    if len(parts) == 5:
        # Scan object: patient/{pid}/scan/{sid}/original or preview
        result["type"] = "scan"
        result["object_type"] = parts[4]
    elif len(parts) == 6 and parts[4] == "report":
        # Report: patient/{pid}/scan/{sid}/report/{iid}.pdf
        result["type"] = "report"
        result["inference_id"] = parts[5].replace(".pdf", "")
    elif len(parts) == 7 and parts[4] == "inference":
        # Inference: patient/{pid}/scan/{sid}/inference/{iid}/result.json or heatmap.png
        result["type"] = "inference"
        result["inference_id"] = parts[5]
        result["object_type"] = parts[6]
    else:
        raise ValueError(f"Unknown object name pattern: {object_name}")
    
    return result


# Convenience functions for common operations
def get_original_scan_name(patient_id: str, scan_id: str) -> str:
    """Get object name for original scan upload."""
    return generate_scan_object_name(patient_id, scan_id, IPFSObjectType.ORIGINAL_SCAN)


def get_preview_name(patient_id: str, scan_id: str) -> str:
    """Get object name for scan preview image."""
    return generate_scan_object_name(patient_id, scan_id, IPFSObjectType.PREVIEW)


def get_inference_result_name(patient_id: str, scan_id: str, inference_id: str) -> str:
    """Get object name for inference result JSON."""
    return generate_inference_object_name(
        patient_id, scan_id, inference_id, IPFSObjectType.INFERENCE_RESULT
    )


def get_heatmap_name(patient_id: str, scan_id: str, inference_id: str) -> str:
    """Get object name for AI heatmap overlay."""
    return generate_inference_object_name(
        patient_id, scan_id, inference_id, IPFSObjectType.HEATMAP
    )


def get_report_name(patient_id: str, scan_id: str, inference_id: str) -> str:
    """Get object name for PDF report."""
    return generate_report_object_name(patient_id, scan_id, inference_id)
