"""
Scan Service - File handling and scan CRUD operations
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from ..config import get_settings
from ..models.scan import Scan, ScanStatus

settings = get_settings()

# In-memory scan store (use database in production)
_scan_store: dict[str, Scan] = {}


def _ensure_upload_dir() -> Path:
    """Ensure upload directory exists and return path."""
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def _generate_scan_id() -> str:
    """Generate a unique scan ID."""
    return f"scan_{uuid.uuid4().hex[:8]}"


def _is_valid_extension(filename: str) -> bool:
    """Check if file extension is allowed."""
    ext = filename.lower().split(".")[-1]
    # Handle .nii.gz
    if filename.lower().endswith(".nii.gz"):
        ext = "nii.gz"
    return ext in settings.allowed_extensions


async def upload_scan(
    file: UploadFile,
    patient_id: str,
    modality: str,
    body_part: str,
    source: Optional[str] = None
) -> Optional[Scan]:
    """
    Upload and store a scan file.
    
    Returns the created Scan or None if upload fails.
    """
    if not file.filename:
        return None
    
    if not _is_valid_extension(file.filename):
        return None
    
    # Check file size
    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        return None
    
    # Generate IDs and paths
    scan_id = _generate_scan_id()
    upload_dir = _ensure_upload_dir()
    
    # Create patient subdirectory
    patient_dir = upload_dir / patient_id
    patient_dir.mkdir(exist_ok=True)
    
    # Save file with scan_id prefix
    ext = "." + file.filename.split(".")[-1]
    if file.filename.lower().endswith(".nii.gz"):
        ext = ".nii.gz"
    
    file_path = patient_dir / f"{scan_id}{ext}"
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create scan record
    scan = Scan(
        id=scan_id,
        patient_id=patient_id,
        modality=modality.upper(),
        body_part=body_part.title(),
        status=ScanStatus.PENDING,
        uploaded_at=datetime.now(timezone.utc),
        file_path=str(file_path),
        file_name=file.filename,
        file_size=len(content),
        source=source
    )
    
    _scan_store[scan_id] = scan
    return scan


def get_scan(scan_id: str) -> Optional[Scan]:
    """Get a scan by ID."""
    return _scan_store.get(scan_id)


def get_scans_by_patient(patient_id: str) -> list[Scan]:
    """Get all scans for a patient."""
    return [
        scan for scan in _scan_store.values()
        if scan.patient_id == patient_id
    ]


def get_all_scans(
    patient_id: Optional[str] = None,
    modality: Optional[str] = None,
    status: Optional[ScanStatus] = None
) -> list[Scan]:
    """Get all scans with optional filters (admin only)."""
    scans = list(_scan_store.values())
    
    if patient_id:
        scans = [s for s in scans if s.patient_id == patient_id]
    if modality:
        scans = [s for s in scans if s.modality.upper() == modality.upper()]
    if status:
        scans = [s for s in scans if s.status == status]
    
    return sorted(scans, key=lambda s: s.uploaded_at, reverse=True)


def update_scan_status(scan_id: str, status: ScanStatus) -> Optional[Scan]:
    """Update a scan's status."""
    scan = _scan_store.get(scan_id)
    if scan:
        scan.status = status
        _scan_store[scan_id] = scan
    return scan


def delete_scan(scan_id: str) -> bool:
    """Delete a scan and its file."""
    scan = _scan_store.get(scan_id)
    if not scan:
        return False
    
    # Delete file
    try:
        if os.path.exists(scan.file_path):
            os.remove(scan.file_path)
    except OSError:
        pass
    
    del _scan_store[scan_id]
    return True


def get_scan_count() -> int:
    """Get total number of scans."""
    return len(_scan_store)


def get_patient_count() -> int:
    """Get unique patient count."""
    return len(set(s.patient_id for s in _scan_store.values()))


def get_scans_by_status(status: ScanStatus) -> list[Scan]:
    """Get scans by status."""
    return [s for s in _scan_store.values() if s.status == status]
