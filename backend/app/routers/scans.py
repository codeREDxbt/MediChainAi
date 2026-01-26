"""
Scans Router - Upload and retrieve medical scans
"""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..dependencies import get_current_user, require_admin
from ..models.auth import AuthUser, UserRole
from ..models.scan import Scan, ScanListResponse, ScanStatus, ScanUploadResponse
from ..services import scan_service

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("/upload", response_model=ScanUploadResponse)
async def upload_scan(
    file: UploadFile = File(..., description="Medical scan file (DICOM, NIfTI, etc.)"),
    modality: str = Form(..., description="Imaging modality (CT, MRI, X-Ray, Ultrasound)"),
    body_part: str = Form(..., description="Body part scanned"),
    source: Optional[str] = Form(None, description="Source institution"),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Upload a medical scan file.
    
    Accepts DICOM (.dcm), NIfTI (.nii, .nii.gz), and common image formats.
    Maximum file size: 100MB.
    """
    scan = await scan_service.upload_scan(
        file=file,
        patient_id=current_user.id,
        modality=modality,
        body_part=body_part,
        source=source
    )
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to upload scan. Check file type and size limits."
        )
    
    return ScanUploadResponse(success=True, scan=scan)


@router.get("", response_model=ScanListResponse)
async def list_scans(
    patient_id: Optional[str] = None,
    modality: Optional[str] = None,
    scan_status: Optional[ScanStatus] = None,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    List scans with optional filters.
    
    - Patients can only see their own scans
    - Admins can filter by patient_id to see any patient's scans
    """
    if current_user.role == UserRole.PATIENT:
        # Patients can only see their own scans
        scans = scan_service.get_scans_by_patient(current_user.id)
        
        # Apply additional filters
        if modality:
            scans = [s for s in scans if s.modality.upper() == modality.upper()]
        if scan_status:
            scans = [s for s in scans if s.status == scan_status]
    else:
        # Admins can see all or filter by patient
        scans = scan_service.get_all_scans(
            patient_id=patient_id,
            modality=modality,
            status=scan_status
        )
    
    return ScanListResponse(scans=scans, total=len(scans))


@router.get("/{scan_id}", response_model=Scan)
async def get_scan(
    scan_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get a specific scan by ID.
    
    - Patients can only access their own scans
    - Admins can access any scan
    """
    scan = scan_service.get_scan(scan_id)
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.PATIENT and scan.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return scan
