"""
Inference Pydantic Models
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class InferenceMode(str, Enum):
    """Inference execution mode."""
    FAST = "fast"
    REAL = "real"


class RiskLevel(str, Enum):
    """Risk level classification."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class InferenceRequest(BaseModel):
    """Request body for inference endpoint."""
    mode: InferenceMode = Field(
        default=InferenceMode.FAST,
        description="Inference mode: 'fast' for mock results, 'real' for actual processing"
    )


class InferenceResult(BaseModel):
    """Result of AI inference on a scan."""
    id: str = Field(..., description="Inference result ID")
    scan_id: str = Field(..., description="Associated scan ID")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score 0-100")
    risk_level: RiskLevel = Field(..., description="Risk classification")
    findings: str = Field(..., description="AI-generated findings summary")
    confidence: float = Field(..., ge=0, le=100, description="Confidence percentage")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Inference timestamp")
    mode: InferenceMode = Field(..., description="Mode used for inference")
    tx_hash: Optional[str] = Field(None, description="Blockchain transaction hash")
