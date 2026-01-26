"""
Tests for Scans endpoints
"""
import io
import pytest
from fastapi.testclient import TestClient


class TestScanUpload:
    """Tests for POST /api/scans/upload"""

    def test_upload_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.post("/api/scans/upload")
        assert response.status_code == 401

    def test_upload_success(self, client: TestClient, patient_auth_cookie):
        """Should upload a scan file successfully."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        # Create a mock file
        file_content = b"mock dicom content"
        files = {"file": ("test_scan.dcm", io.BytesIO(file_content), "application/octet-stream")}
        data = {
            "modality": "CT",
            "body_part": "Chest",
            "source": "Test Hospital"
        }
        
        response = client.post("/api/scans/upload", files=files, data=data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert "scan" in result
        assert result["scan"]["modality"] == "CT"
        assert result["scan"]["body_part"] == "Chest"


class TestScanList:
    """Tests for GET /api/scans"""

    def test_list_unauthorized(self, client: TestClient):
        """Should return 401 without auth."""
        response = client.get("/api/scans")
        assert response.status_code == 401

    def test_list_patient_sees_own_scans(self, client: TestClient, patient_auth_cookie):
        """Patient should only see their own scans."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/scans")
        
        assert response.status_code == 200
        result = response.json()
        assert "scans" in result
        assert "total" in result
        assert isinstance(result["scans"], list)

    def test_list_admin_can_filter(self, client: TestClient, admin_auth_cookie):
        """Admin should be able to filter by patient_id."""
        client.cookies.set("auth_token", admin_auth_cookie["auth_token"])
        
        response = client.get("/api/scans?patient_id=test_patient")
        
        assert response.status_code == 200

    def test_list_filter_by_modality(self, client: TestClient, patient_auth_cookie):
        """Should filter by modality."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/scans?modality=CT")
        
        assert response.status_code == 200


class TestScanGet:
    """Tests for GET /api/scans/{scan_id}"""

    def test_get_not_found(self, client: TestClient, patient_auth_cookie):
        """Should return 404 for non-existent scan."""
        client.cookies.set("auth_token", patient_auth_cookie["auth_token"])
        
        response = client.get("/api/scans/nonexistent_scan_id")
        
        assert response.status_code == 404
