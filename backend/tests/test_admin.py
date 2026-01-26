"""
Tests for Admin endpoints
"""
import pytest
from fastapi.testclient import TestClient


class TestAdminMetrics:
    """Tests for GET /api/admin/metrics"""

    def test_metrics_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/admin/metrics")
        assert response.status_code == 401

    def test_metrics_patient_forbidden(self, client: TestClient, patient_auth_cookie):
        """Should return 403 for patient users."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/admin/metrics")
        
        assert response.status_code == 403

    def test_metrics_admin_success(self, client: TestClient, admin_auth_cookie):
        """Should return metrics for admin users."""
        client.cookies.set("auth_token", admin_auth_cookie["auth_token"])
        
        response = client.get("/api/admin/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_scans" in data
        assert "total_patients" in data
        assert "avg_accuracy" in data
        assert "pending_reviews" in data


class TestAdminTrends:
    """Tests for GET /api/admin/trends"""

    def test_trends_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/admin/trends")
        assert response.status_code == 401

    def test_trends_patient_forbidden(self, client: TestClient, patient_auth_cookie):
        """Should return 403 for patient users."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/admin/trends")
        
        assert response.status_code == 403

    def test_trends_admin_success(self, client: TestClient, admin_auth_cookie):
        """Should return trend data for admin users."""
        client.cookies.set("auth_token", admin_auth_cookie["auth_token"])
        
        response = client.get("/api/admin/trends?period=7d")
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "period" in data
        assert data["period"] == "7d"


class TestAdminCategories:
    """Tests for GET /api/admin/categories"""

    def test_categories_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/admin/categories")
        assert response.status_code == 401

    def test_categories_admin_success(self, client: TestClient, admin_auth_cookie):
        """Should return category breakdown for admin users."""
        client.cookies.set("auth_token", admin_auth_cookie["auth_token"])
        
        response = client.get("/api/admin/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "by_modality" in data
        assert "by_status" in data
        assert "by_risk" in data
