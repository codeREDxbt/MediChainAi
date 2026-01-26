"""
Authentication Service - SIWE verification and JWT handling
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError

from ..config import get_settings
from ..models.auth import AuthUser, UserRole

settings = get_settings()

# In-memory nonce store (use Redis in production)
_nonce_store: dict[str, datetime] = {}


def generate_nonce() -> str:
    """Generate a random nonce and store it with expiration."""
    nonce = secrets.token_hex(16)
    _nonce_store[nonce] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.nonce_expiration_minutes
    )
    return nonce


def validate_nonce(nonce: str) -> bool:
    """Validate and consume a nonce."""
    if nonce not in _nonce_store:
        return False
    
    expiration = _nonce_store.pop(nonce)
    return datetime.now(timezone.utc) < expiration


def verify_siwe_signature(message: str, signature: str) -> Optional[dict]:
    """
    Verify SIWE message signature.
    
    In development mode with mock auth, this accepts any properly formatted message.
    In production, use the siwe library for actual verification.
    """
    try:
        from siwe import SiweMessage
        
        siwe_message = SiweMessage.from_message(message)
        # Verify signature - this will raise if invalid
        siwe_message.verify(signature)
        
        return {
            "address": siwe_message.address,
            "chain_id": siwe_message.chain_id,
            "nonce": siwe_message.nonce,
        }
    except Exception as e:
        # For development, allow mock verification
        if settings.debug:
            # Try to parse message manually for dev mode
            try:
                lines = message.split("\n")
                address = None
                nonce = None
                for line in lines:
                    if line.startswith("0x") and len(line) == 42:
                        address = line.strip()
                    if "Nonce:" in line:
                        nonce = line.split(":")[-1].strip()
                
                if address:
                    return {
                        "address": address,
                        "chain_id": 1,
                        "nonce": nonce or "dev-nonce",
                    }
            except:
                pass
        
        print(f"SIWE verification failed: {e}")
        return None


def get_user_role(address: str) -> UserRole:
    """Determine user role based on wallet address."""
    if address.lower() in [a.lower() for a in settings.admin_addresses]:
        return UserRole.ADMIN
    return UserRole.PATIENT


def create_jwt_token(user: AuthUser) -> str:
    """Create a JWT token for authenticated user."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiration_days)
    
    payload = {
        "sub": user.id,
        "address": user.address,
        "role": user.role.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None


def get_user_from_token(token: str) -> Optional[AuthUser]:
    """Get AuthUser from JWT token."""
    payload = decode_jwt_token(token)
    if not payload:
        return None
    
    try:
        return AuthUser(
            id=payload["sub"],
            address=payload["address"],
            role=UserRole(payload["role"]),
            name=f"User {payload['address'][:6]}...{payload['address'][-4:]}"
        )
    except (KeyError, ValueError):
        return None
