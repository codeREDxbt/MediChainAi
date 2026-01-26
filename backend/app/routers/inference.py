"""
Inference Router - AI inference execution and results
"""
from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_user
from ..models.auth import AuthUser, UserRole
from ..models.inference import InferenceRequest, InferenceResult
from ..services import inference_service, scan_service

router = APIRouter(prefix="/inference", tags=["Inference"])


@router.post("/{scan_id}/run", response_model=InferenceResult)
async def run_inference(
    scan_id: str,
    request: InferenceRequest,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Run AI inference on a scan.
    
    Modes:
    - `fast`: Returns mock results immediately (for testing/demo)
    - `real`: Simulates processing delay (would connect to real ML model in production)
    
    Authorization:
    - Patients can only run inference on their own scans
    - Admins can run inference on any scan
    """
    # Verify scan exists
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
    
    # Run inference
    result = await inference_service.run_inference(scan_id, request.mode)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference failed"
        )
    
    return result


@router.get("/{scan_id}/latest", response_model=InferenceResult)
async def get_latest_inference(
    scan_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get the most recent inference result for a scan.
    
    Returns 404 if no inference has been run on the scan.
    """
    # Verify scan exists and user has access
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
    
    # Get latest result
    result = inference_service.get_latest_inference(scan_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No inference results found for this scan"
        )
    
    return result


@router.get("/{scan_id}/history", response_model=list[InferenceResult])
async def get_inference_history(
    scan_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get all inference results for a scan.
    
    Useful for tracking analysis history over time.
    """
    # Verify scan exists and user has access
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
    
    return inference_service.get_all_inferences(scan_id)
