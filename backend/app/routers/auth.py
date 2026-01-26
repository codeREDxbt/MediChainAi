"""
Auth Router - SIWE authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Response, status

from ..models.auth import (
    AuthUser,
    NonceResponse,
    UserRole,
    VerifyRequest,
    VerifyResponse,
)
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/nonce", response_model=NonceResponse)
async def generate_nonce(response: Response):
    """
    Generate a nonce for SIWE authentication.
    
    The nonce is stored server-side and expires after 5 minutes.
    It should be included in the SIWE message that the user signs.
    """
    nonce = auth_service.generate_nonce()
    
    # Also set nonce in cookie for verification
    response.set_cookie(
        key="siwe_nonce",
        value=nonce,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="strict",
        max_age=300  # 5 minutes
    )
    
    return NonceResponse(nonce=nonce)


@router.post("/verify", response_model=VerifyResponse)
async def verify_signature(request: VerifyRequest, response: Response):
    """
    Verify SIWE signature and issue JWT token.
    
    The signature must be valid for the provided message.
    On success, a JWT token is set as an httpOnly cookie.
    """
    # Verify the SIWE signature
    verification = auth_service.verify_siwe_signature(
        request.message, 
        request.signature
    )
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Get address and determine role
    address = verification["address"]
    nonce = verification.get("nonce")
    
    # Validate nonce if present
    if nonce and not auth_service.validate_nonce(nonce):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired nonce"
        )
    
    # Determine user role
    role = auth_service.get_user_role(address)
    
    # Create user
    user_id = f"usr_{address[2:10].lower()}"
    name = "Admin User" if role == UserRole.ADMIN else f"User {address[:6]}...{address[-4:]}"
    
    user = AuthUser(
        id=user_id,
        address=address,
        role=role,
        name=name
    )
    
    # Generate JWT token
    token = auth_service.create_jwt_token(user)
    
    # Set auth cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="strict",
        max_age=60 * 60 * 24 * 7  # 7 days
    )
    
    # Clear nonce cookie
    response.delete_cookie("siwe_nonce")
    
    return VerifyResponse(
        success=True,
        user=user,
        token=token
    )


@router.post("/logout")
async def logout(response: Response):
    """
    Log out the current user by clearing auth cookies.
    """
    response.delete_cookie("auth_token")
    return {"success": True, "message": "Logged out successfully"}


# Import dependency for /me endpoint
from ..dependencies import get_current_user
from fastapi import Depends


@router.get("/me", response_model=AuthUser)
async def get_me(current_user: AuthUser = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user
