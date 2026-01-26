"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.auth import AuthUser, UserRole
from app.services import auth_service


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_patient_user() -> AuthUser:
    """Create a mock patient user."""
    return AuthUser(
        id="usr_test_patient",
        address="0x1234567890abcdef1234567890abcdef12345678",
        role=UserRole.PATIENT,
        name="Test Patient"
    )


@pytest.fixture
def mock_admin_user() -> AuthUser:
    """Create a mock admin user."""
    return AuthUser(
        id="usr_test_admin",
        address="0x82d7b44000000000000000000000007b44",
        role=UserRole.ADMIN,
        name="Test Admin"
    )


@pytest.fixture
def patient_auth_cookie(mock_patient_user: AuthUser) -> dict:
    """Create auth cookie for patient user."""
    token = auth_service.create_jwt_token(mock_patient_user)
    return {"auth_token": token}


@pytest.fixture
def admin_auth_cookie(mock_admin_user: AuthUser) -> dict:
    """Create auth cookie for admin user."""
    token = auth_service.create_jwt_token(mock_admin_user)
    return {"auth_token": token}
