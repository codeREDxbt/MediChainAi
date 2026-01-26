"""
Report Pydantic Models
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    """Request body for PDF report generation."""
    include_heatmap: bool = Field(
        default=True,
        description="Include AI heatmap overlay in the report"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes to include in the report"
    )


class Report(BaseModel):
    """Generated report model."""
    id: str = Field(..., description="Report ID")
    scan_id: str = Field(..., description="Associated scan ID")
    patient_id: str = Field(..., description="Patient who owns the report")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Generation timestamp")
    download_url: str = Field(..., description="URL to download the PDF")
    file_size: int = Field(..., description="PDF file size in bytes")


class ReportListResponse(BaseModel):
    """Response for report list endpoint."""
    reports: list[Report] = Field(..., description="List of reports")
    total: int = Field(..., description="Total number of reports")
