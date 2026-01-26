"""
Inference Service - AI inference execution (mock and real modes)
"""
import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Optional

from ..models.inference import InferenceMode, InferenceResult, RiskLevel
from ..models.scan import ScanStatus
from . import scan_service

# In-memory inference results store
_inference_store: dict[str, list[InferenceResult]] = {}

# Mock findings for different risk levels
_MOCK_FINDINGS = {
    RiskLevel.LOW: [
        "No significant abnormalities detected. Normal tissue patterns observed.",
        "Scan appears within normal limits. No areas of concern identified.",
        "Clear imaging with no notable findings. Routine follow-up recommended.",
    ],
    RiskLevel.MEDIUM: [
        "Minor irregularity detected. Recommend follow-up imaging in 6 months.",
        "Small area of interest identified. Further evaluation may be warranted.",
        "Subtle changes noted. Clinical correlation recommended.",
    ],
    RiskLevel.HIGH: [
        "Irregular density detected. Suggests potential nodular formation. Urgent follow-up recommended.",
        "Significant finding requiring immediate clinical attention. Specialist referral advised.",
        "Abnormal pattern observed. Further diagnostic workup strongly recommended.",
    ],
}


def _generate_mock_result(scan_id: str, mode: InferenceMode) -> InferenceResult:
    """Generate mock inference result for fast mode."""
    # Random risk distribution weighted towards low
    risk_roll = random.random()
    if risk_roll < 0.6:
        risk_level = RiskLevel.LOW
        risk_score = random.randint(0, 30)
    elif risk_roll < 0.85:
        risk_level = RiskLevel.MEDIUM
        risk_score = random.randint(31, 65)
    else:
        risk_level = RiskLevel.HIGH
        risk_score = random.randint(66, 100)
    
    findings = random.choice(_MOCK_FINDINGS[risk_level])
    confidence = round(random.uniform(85.0, 99.9), 1)
    
    return InferenceResult(
        id=f"inf_{uuid.uuid4().hex[:8]}",
        scan_id=scan_id,
        risk_score=risk_score,
        risk_level=risk_level,
        findings=findings,
        confidence=confidence,
        timestamp=datetime.now(timezone.utc),
        mode=mode,
        tx_hash=f"0x{uuid.uuid4().hex[:8]}...{uuid.uuid4().hex[-4:]}"
    )


async def run_inference(scan_id: str, mode: InferenceMode) -> Optional[InferenceResult]:
    """
    Run AI inference on a scan.
    
    Fast mode: Returns mock results immediately
    Real mode: Simulates processing delay (would integrate with real ML model)
    """
    # Verify scan exists
    scan = scan_service.get_scan(scan_id)
    if not scan:
        return None
    
    # Update scan status to processing
    scan_service.update_scan_status(scan_id, ScanStatus.PROCESSING)
    
    if mode == InferenceMode.REAL:
        # Simulate processing time (2-5 seconds)
        await asyncio.sleep(random.uniform(2.0, 5.0))
    
    # Generate result
    result = _generate_mock_result(scan_id, mode)
    
    # Store result
    if scan_id not in _inference_store:
        _inference_store[scan_id] = []
    _inference_store[scan_id].append(result)
    
    # Update scan status based on result
    if result.risk_level == RiskLevel.HIGH:
        scan_service.update_scan_status(scan_id, ScanStatus.REVIEW)
    else:
        scan_service.update_scan_status(scan_id, ScanStatus.VERIFIED)
    
    return result


def get_latest_inference(scan_id: str) -> Optional[InferenceResult]:
    """Get the most recent inference result for a scan."""
    results = _inference_store.get(scan_id, [])
    if not results:
        return None
    return results[-1]


def get_all_inferences(scan_id: str) -> list[InferenceResult]:
    """Get all inference results for a scan."""
    return _inference_store.get(scan_id, [])


def get_total_inference_count() -> int:
    """Get total number of inferences run."""
    return sum(len(results) for results in _inference_store.values())


def get_average_confidence() -> float:
    """Calculate average confidence across all inferences."""
    all_results = [r for results in _inference_store.values() for r in results]
    if not all_results:
        return 0.0
    return sum(r.confidence for r in all_results) / len(all_results)


def get_risk_distribution() -> dict[str, int]:
    """Get count of inferences by risk level."""
    distribution = {level.value: 0 for level in RiskLevel}
    for results in _inference_store.values():
        for result in results:
            distribution[result.risk_level.value] += 1
    return distribution
