"""
Admin Analytics Pydantic Models
"""
from pydantic import BaseModel, Field


class AdminMetrics(BaseModel):
    """Dashboard metrics for admin view."""
    total_scans: int = Field(..., description="Total number of scans in system")
    total_patients: int = Field(..., description="Total number of patients")
    avg_accuracy: float = Field(..., description="Average model accuracy percentage")
    pending_reviews: int = Field(..., description="Scans pending review")
    total_inferences: int = Field(..., description="Total inference runs")
    scans_this_week: int = Field(..., description="Scans uploaded this week")


class TrendDataPoint(BaseModel):
    """Single data point for trend charts."""
    date: str = Field(..., description="Date label")
    scans: int = Field(..., description="Number of scans")
    inferences: int = Field(..., description="Number of inferences")


class TrendData(BaseModel):
    """Time-series trend data for charts."""
    data: list[TrendDataPoint] = Field(..., description="Trend data points")
    period: str = Field(..., description="Time period (e.g., '7d', '30d')")


class ModalityCount(BaseModel):
    """Count by imaging modality."""
    modality: str
    count: int


class StatusCount(BaseModel):
    """Count by scan status."""
    status: str
    count: int


class RiskCount(BaseModel):
    """Count by risk level."""
    risk_level: str
    count: int


class CategoryBreakdown(BaseModel):
    """Breakdown of scans by various categories."""
    by_modality: list[ModalityCount] = Field(..., description="Counts by modality")
    by_status: list[StatusCount] = Field(..., description="Counts by status")
    by_risk: list[RiskCount] = Field(..., description="Counts by risk level")
