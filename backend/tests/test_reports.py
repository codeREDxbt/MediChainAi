"""
Tests for Reports endpoints
"""
import pytest
from fastapi.testclient import TestClient


class TestReportGenerate:
    """Tests for POST /api/reports/{scan_id}/pdf"""

    def test_generate_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.post("/api/reports/scan_123/pdf", json={})
        assert response.status_code == 401

    def test_generate_scan_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent scan."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.post("/api/reports/nonexistent/pdf", json={})
        
        assert response.status_code == 404

    def test_generate_with_options(self, client: TestClient, patient_auth_cookie):
        """Should accept report generation options."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        # Will 404 without real scan, but validates request body
        response = client.post("/api/reports/test_scan/pdf", json={
            "include_heatmap": True,
            "notes": "Test notes for the report"
        })
        
        assert response.status_code == 404  # Scan doesn't exist


class TestReportList:
    """Tests for GET /api/reports"""

    def test_list_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/reports")
        assert response.status_code == 401

    def test_list_patient_success(self, client: TestClient, patient_auth_cookie):
        """Patient should see their reports."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/reports")
        
        assert response.status_code == 200
        data = response.json()
        assert "reports" in data
        assert "total" in data

    def test_list_admin_success(self, client: TestClient, admin_auth_cookie):
        """Admin should see all reports."""
        client.cookies.set("auth_token", admin_auth_cookie["auth_token"])
        
        response = client.get("/api/reports")
        
        assert response.status_code == 200


class TestReportGet:
    """Tests for GET /api/reports/{report_id}"""

    def test_get_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent report."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/reports/nonexistent_report")
        
        assert response.status_code == 404


class TestReportDownload:
    """Tests for GET /api/reports/{report_id}/download"""

    def test_download_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent report."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/reports/nonexistent/download")
        
        assert response.status_code == 404
