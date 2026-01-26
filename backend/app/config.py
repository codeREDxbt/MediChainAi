"""
MediChainAI Backend Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # App settings
    app_name: str = "MediChainAI API"
    debug: bool = True
    api_version: str = "v1"
    
    # Security
    jwt_secret: str = "medichain-dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7
    nonce_expiration_minutes: int = 5
    
    # File uploads
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 100
    allowed_extensions: list[str] = ["dcm", "nii", "nii.gz", "png", "jpg", "jpeg"]
    
    # Admin addresses (lowercase)
    admin_addresses: list[str] = ["0x82d7b44000000000000000000000007b44"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
