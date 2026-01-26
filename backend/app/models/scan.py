"""
Scan Pydantic Models
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ScanStatus(str, Enum):
    """Scan processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    VERIFIED = "verified"
    REVIEW = "review"
    ERROR = "error"


class Scan(BaseModel):
    """Scan model representing a medical image scan."""
    id: str = Field(..., description="Unique scan identifier")
    patient_id: str = Field(..., description="Patient/owner ID")
    modality: str = Field(..., description="Imaging modality (CT, MRI, X-Ray, Ultrasound)")
    body_part: str = Field(..., description="Body part scanned")
    status: ScanStatus = Field(default=ScanStatus.PENDING, description="Processing status")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")
    file_path: str = Field(..., description="Path to stored file")
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., description="File size in bytes")
    source: Optional[str] = Field(None, description="Source institution")


class ScanUploadResponse(BaseModel):
    """Response for scan upload endpoint."""
    success: bool = Field(..., description="Whether upload succeeded")
    scan: Scan = Field(..., description="Created scan details")


class ScanListResponse(BaseModel):
    """Response for scan list endpoint."""
    scans: list[Scan] = Field(..., description="List of scans")
    total: int = Field(..., description="Total number of matching scans")
