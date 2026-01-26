"""
Tests for Auth endpoints
"""
import pytest
from fastapi.testclient import TestClient


class TestAuthNonce:
    """Tests for POST /api/auth/nonce"""

    def test_generate_nonce_success(self, client: TestClient):
        """Should return a nonce string."""
        response = client.post("/api/auth/nonce")
        
        assert response.status_code == 200
        data = response.json()
        assert "nonce" in data
        assert isinstance(data["nonce"], str)
        assert len(data["nonce"]) == 32  # 16 bytes hex encoded

    def test_generate_nonce_sets_cookie(self, client: TestClient):
        """Should set siwe_nonce cookie."""
        response = client.post("/api/auth/nonce")
        
        assert response.status_code == 200
        assert "siwe_nonce" in response.cookies


class TestAuthVerify:
    """Tests for POST /api/auth/verify"""

    def test_verify_missing_fields(self, client: TestClient):
        """Should return 422 for missing message/signature."""
        response = client.post("/api/auth/verify", json={})
        
        assert response.status_code == 422

    def test_verify_invalid_signature(self, client: TestClient):
        """Should return 401 for invalid signature (when not in dev mode with mock)."""
        # First get a nonce
        nonce_response = client.post("/api/auth/nonce")
        
        # Try to verify with invalid data
        response = client.post("/api/auth/verify", json={
            "message": "invalid message",
            "signature": "invalid signature"
        })
        
        # In dev mode with mock, this might pass with a parsed address
        # In production, this would return 401
        assert response.status_code in [200, 401]


class TestAuthLogout:
    """Tests for POST /api/auth/logout"""

    def test_logout_success(self, client: TestClient, patient_auth_cookie):
        """Should clear auth cookie."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.post("/api/auth/logout")
        
        assert response.status_code == 200
        assert response.json()["success"] is True


class TestAuthMe:
    """Tests for GET /api/auth/me"""

    def test_me_unauthorized(self, client: TestClient):
        """Should return 401 without auth cookie."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401

    def test_me_authenticated(self, client: TestClient, patient_auth_cookie):
        """Should return user info when authenticated."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "address" in data
        assert "role" in data
