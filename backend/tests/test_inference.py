"""
Tests for Inference endpoints
"""
import pytest
from fastapi.testclient import TestClient


class TestInferenceRun:
    """Tests for POST /api/inference/{scan_id}/run"""

    def test_run_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.post("/api/inference/scan_123/run", json={"mode": "fast"})
        assert response.status_code == 401

    def test_run_scan_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent scan."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.post("/api/inference/nonexistent/run", json={"mode": "fast"})
        
        assert response.status_code == 404

    def test_run_fast_mode_defaults(self, client: TestClient, patient_auth_cookie):
        """Should accept request with default mode."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        # This will 404 without a real scan, but validates the endpoint works
        response = client.post("/api/inference/test_scan/run", json={})
        
        assert response.status_code == 404  # Scan doesn't exist


class TestInferenceLatest:
    """Tests for GET /api/inference/{scan_id}/latest"""

    def test_latest_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/inference/scan_123/latest")
        assert response.status_code == 401

    def test_latest_scan_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent scan."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/inference/nonexistent/latest")
        
        assert response.status_code == 404


class TestInferenceHistory:
    """Tests for GET /api/inference/{scan_id}/history"""

    def test_history_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/inference/scan_123/history")
        assert response.status_code == 401
