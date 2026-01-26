"""
Tests for IPFS naming conventions
"""
import pytest

from app.utils.ipfs_naming import (
    IPFSObjectType,
    generate_scan_object_name,
    generate_inference_object_name,
    generate_report_object_name,
    parse_object_name,
    get_original_scan_name,
    get_preview_name,
    get_inference_result_name,
    get_heatmap_name,
    get_report_name,
)


class TestScanObjectNames:
    """Tests for scan-related IPFS object names."""

    def test_original_scan_name(self):
        """Should generate correct original scan path."""
        name = get_original_scan_name("patient_123", "scan_456")
        assert name == "patient/patient_123/scan/scan_456/original"

    def test_preview_name(self):
        """Should generate correct preview path."""
        name = get_preview_name("patient_123", "scan_456")
        assert name == "patient/patient_123/scan/scan_456/preview"

    def test_generate_scan_object_name_original(self):
        """Should generate scan name with explicit type."""
        name = generate_scan_object_name(
            "p1", "s1", IPFSObjectType.ORIGINAL_SCAN
        )
        assert name == "patient/p1/scan/s1/original"

    def test_generate_scan_object_name_invalid_type(self):
        """Should raise error for invalid scan type."""
        with pytest.raises(ValueError):
            generate_scan_object_name("p1", "s1", IPFSObjectType.HEATMAP)


class TestInferenceObjectNames:
    """Tests for inference-related IPFS object names."""

    def test_inference_result_name(self):
        """Should generate correct inference result path."""
        name = get_inference_result_name("patient_1", "scan_2", "inf_3")
        assert name == "patient/patient_1/scan/scan_2/inference/inf_3/result.json"

    def test_heatmap_name(self):
        """Should generate correct heatmap path."""
        name = get_heatmap_name("patient_1", "scan_2", "inf_3")
        assert name == "patient/patient_1/scan/scan_2/inference/inf_3/heatmap.png"

    def test_generate_inference_invalid_type(self):
        """Should raise error for invalid inference type."""
        with pytest.raises(ValueError):
            generate_inference_object_name(
                "p1", "s1", "i1", IPFSObjectType.PREVIEW
            )


class TestReportObjectNames:
    """Tests for report IPFS object names."""

    def test_report_name(self):
        """Should generate correct report path."""
        name = get_report_name("patient_1", "scan_2", "inf_3")
        assert name == "patient/patient_1/scan/scan_2/report/inf_3.pdf"


class TestParseObjectName:
    """Tests for parsing IPFS object names."""

    def test_parse_original_scan(self):
        """Should parse original scan name."""
        result = parse_object_name("patient/p1/scan/s1/original")
        assert result == {
            "patient_id": "p1",
            "scan_id": "s1",
            "type": "scan",
            "object_type": "original",
        }

    def test_parse_preview(self):
        """Should parse preview name."""
        result = parse_object_name("patient/p1/scan/s1/preview")
        assert result["object_type"] == "preview"

    def test_parse_inference_result(self):
        """Should parse inference result name."""
        result = parse_object_name("patient/p1/scan/s1/inference/i1/result.json")
        assert result == {
            "patient_id": "p1",
            "scan_id": "s1",
            "type": "inference",
            "inference_id": "i1",
            "object_type": "result.json",
        }

    def test_parse_heatmap(self):
        """Should parse heatmap name."""
        result = parse_object_name("patient/p1/scan/s1/inference/i1/heatmap.png")
        assert result["object_type"] == "heatmap.png"

    def test_parse_report(self):
        """Should parse report name."""
        result = parse_object_name("patient/p1/scan/s1/report/i1.pdf")
        assert result == {
            "patient_id": "p1",
            "scan_id": "s1",
            "type": "report",
            "inference_id": "i1",
        }

    def test_parse_invalid_format(self):
        """Should raise error for invalid format."""
        with pytest.raises(ValueError):
            parse_object_name("invalid/path")
