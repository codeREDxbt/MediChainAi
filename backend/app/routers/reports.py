"""
Reports Router - PDF report generation and retrieval
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from ..dependencies import get_current_user, require_admin
from ..models.auth import AuthUser, UserRole
from ..models.report import Report, ReportListResponse, ReportRequest
from ..services import inference_service, report_service, scan_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/{scan_id}/pdf", response_model=Report)
async def generate_pdf_report(
    scan_id: str,
    request: ReportRequest = ReportRequest(),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Generate a PDF report for a scan.
    
    The report includes scan details, AI analysis results, and optional notes.
    If include_heatmap is True, an AI heatmap overlay will be included.
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
    
    # Get latest inference result (may be None)
    inference = inference_service.get_latest_inference(scan_id)
    
    # Generate PDF
    report = report_service.generate_pdf_report(
        scan=scan,
        inference=inference,
        include_heatmap=request.include_heatmap,
        notes=request.notes
    )
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )
    
    return report


@router.get("", response_model=ReportListResponse)
async def list_reports(
    current_user: AuthUser = Depends(get_current_user)
):
    """
    List all generated reports.
    
    - Patients see only their own reports
    - Admins see all reports
    """
    if current_user.role == UserRole.PATIENT:
        reports = report_service.get_reports_by_patient(current_user.id)
    else:
        reports = report_service.get_all_reports()
    
    return ReportListResponse(reports=reports, total=len(reports))


@router.get("/{report_id}", response_model=Report)
async def get_report(
    report_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get a specific report by ID.
    """
    report = report_service.get_report(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.PATIENT and report.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Download a PDF report file.
    """
    report = report_service.get_report(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.PATIENT and report.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get file path
    file_path = report_service.get_report_path(report_id)
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found"
        )
    
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"report_{report.scan_id}.pdf"
    )
