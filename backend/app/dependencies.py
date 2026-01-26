"""
Dependency Injection - Auth, database, and common dependencies
"""
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status

from .config import get_settings, Settings
from .models.auth import AuthUser, UserRole
from .services import auth_service

settings = get_settings()


async def get_current_user(
    auth_token: Optional[str] = Cookie(None, alias="auth_token")
) -> AuthUser:
    """
    Dependency to get the current authenticated user from JWT cookie.
    
    Raises HTTPException 401 if not authenticated.
    """
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth_service.get_user_from_token(auth_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(
    auth_token: Optional[str] = Cookie(None, alias="auth_token")
) -> Optional[AuthUser]:
    """
    Dependency to optionally get the current user.
    
    Returns None if not authenticated (doesn't raise).
    """
    if not auth_token:
        return None
    
    return auth_service.get_user_from_token(auth_token)


async def require_admin(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """
    Dependency requiring admin role.
    
    Raises HTTPException 403 if user is not admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def require_patient(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """
    Dependency requiring patient role.
    
    Raises HTTPException 403 if user is not patient.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required"
        )
    return current_user


def get_config() -> Settings:
    """Dependency for app settings."""
    return get_settings()
