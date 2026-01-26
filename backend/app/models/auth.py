"""
Authentication Pydantic Models
"""
from enum import Enum
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User role enumeration."""
    PATIENT = "patient"
    ADMIN = "admin"


class AuthUser(BaseModel):
    """Authenticated user model."""
    id: str = Field(..., description="User ID derived from wallet address")
    address: str = Field(..., description="Ethereum wallet address")
    role: UserRole = Field(..., description="User role (patient or admin)")
    name: str = Field(..., description="Display name")


class NonceResponse(BaseModel):
    """Response for nonce generation endpoint."""
    nonce: str = Field(..., description="Random nonce for SIWE message")


class VerifyRequest(BaseModel):
    """Request body for SIWE verification."""
    message: str = Field(..., description="SIWE message string")
    signature: str = Field(..., description="Wallet signature of the message")


class VerifyResponse(BaseModel):
    """Response for successful SIWE verification."""
    success: bool = Field(..., description="Whether verification succeeded")
    user: AuthUser = Field(..., description="Authenticated user details")
    token: str = Field(..., description="JWT access token")
