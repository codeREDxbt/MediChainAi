"""
Admin Router - Analytics and admin-only endpoints
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from ..dependencies import require_admin
from ..models.admin import (
    AdminMetrics,
    CategoryBreakdown,
    ModalityCount,
    RiskCount,
    StatusCount,
    TrendData,
    TrendDataPoint,
)
from ..models.auth import AuthUser
from ..models.scan import ScanStatus
from ..services import inference_service, scan_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics(
    current_user: AuthUser = Depends(require_admin)
):
    """
    Get dashboard metrics for admin overview.
    
    Includes total scans, patients, accuracy, and pending reviews.
    """
    total_scans = scan_service.get_scan_count()
    total_patients = scan_service.get_patient_count()
    pending_reviews = len(scan_service.get_scans_by_status(ScanStatus.REVIEW))
    total_inferences = inference_service.get_total_inference_count()
    avg_accuracy = inference_service.get_average_confidence()
    
    # Calculate scans this week
    all_scans = scan_service.get_all_scans()
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    scans_this_week = len([
        s for s in all_scans 
        if s.uploaded_at.replace(tzinfo=timezone.utc) > week_ago
    ])
    
    return AdminMetrics(
        total_scans=total_scans,
        total_patients=total_patients,
        avg_accuracy=round(avg_accuracy, 1),
        pending_reviews=pending_reviews,
        total_inferences=total_inferences,
        scans_this_week=scans_this_week
    )


@router.get("/trends", response_model=TrendData)
async def get_trends(
    period: str = "7d",
    current_user: AuthUser = Depends(require_admin)
):
    """
    Get time-series trend data for charts.
    
    Supported periods: 7d, 14d, 30d
    """
    days = {"7d": 7, "14d": 14, "30d": 30}.get(period, 7)
    
    all_scans = scan_service.get_all_scans()
    
    data_points = []
    for i in range(days - 1, -1, -1):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        date_str = date.strftime("%b %d")
        
        # Count scans for this day (mock data in dev)
        # In production, this would query by date range
        scan_count = max(0, len(all_scans) // days + (i % 3))
        inf_count = max(0, inference_service.get_total_inference_count() // days + (i % 2))
        
        data_points.append(TrendDataPoint(
            date=date_str,
            scans=scan_count,
            inferences=inf_count
        ))
    
    return TrendData(data=data_points, period=period)


@router.get("/categories", response_model=CategoryBreakdown)
async def get_category_breakdown(
    current_user: AuthUser = Depends(require_admin)
):
    """
    Get breakdown of scans by various categories.
    
    Includes modality, status, and risk level distributions.
    """
    all_scans = scan_service.get_all_scans()
    
    # Count by modality
    modality_counts: dict[str, int] = {}
    for scan in all_scans:
        modality_counts[scan.modality] = modality_counts.get(scan.modality, 0) + 1
    
    by_modality = [
        ModalityCount(modality=m, count=c) 
        for m, c in modality_counts.items()
    ]
    
    # Count by status
    status_counts: dict[str, int] = {}
    for scan in all_scans:
        status_counts[scan.status.value] = status_counts.get(scan.status.value, 0) + 1
    
    by_status = [
        StatusCount(status=s, count=c) 
        for s, c in status_counts.items()
    ]
    
    # Count by risk level
    risk_distribution = inference_service.get_risk_distribution()
    by_risk = [
        RiskCount(risk_level=r, count=c) 
        for r, c in risk_distribution.items()
    ]
    
    return CategoryBreakdown(
        by_modality=by_modality,
        by_status=by_status,
        by_risk=by_risk
    )
