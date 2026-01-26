"""
Report Service - PDF generation for scan results
"""
import os
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from ..config import get_settings
from ..models.report import Report
from ..models.scan import Scan
from ..models.inference import InferenceResult
from . import scan_service, inference_service

settings = get_settings()

# In-memory report store
_report_store: dict[str, Report] = {}


def _ensure_reports_dir() -> Path:
    """Ensure reports directory exists."""
    reports_path = Path(settings.upload_dir) / "reports"
    reports_path.mkdir(parents=True, exist_ok=True)
    return reports_path


def generate_pdf_report(
    scan: Scan,
    inference: Optional[InferenceResult],
    include_heatmap: bool = True,
    notes: Optional[str] = None
) -> Optional[Report]:
    """
    Generate a PDF report for a scan with inference results.
    
    Returns Report object with download URL.
    """
    report_id = f"rpt_{uuid.uuid4().hex[:8]}"
    reports_dir = _ensure_reports_dir()
    pdf_path = reports_dir / f"{report_id}.pdf"
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        textColor=colors.HexColor('#1a365d')
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor('#2d3748')
    )
    
    story = []
    
    # Title
    story.append(Paragraph("MediChainAI Scan Report", title_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Scan Details Section
    story.append(Paragraph("Scan Details", heading_style))
    
    scan_data = [
        ["Scan ID", scan.id],
        ["Modality", scan.modality],
        ["Body Part", scan.body_part],
        ["Upload Date", scan.uploaded_at.strftime("%Y-%m-%d %H:%M UTC")],
        ["Status", scan.status.value.title()],
        ["Source", scan.source or "Not specified"],
    ]
    
    scan_table = Table(scan_data, colWidths=[2 * inch, 4 * inch])
    scan_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(scan_table)
    
    # AI Analysis Section
    if inference:
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph("AI Analysis Results", heading_style))
        
        # Risk color coding
        risk_colors = {
            "Low": colors.HexColor('#38a169'),
            "Medium": colors.HexColor('#d69e2e'),
            "High": colors.HexColor('#e53e3e'),
        }
        risk_color = risk_colors.get(inference.risk_level.value, colors.black)
        
        inference_data = [
            ["Risk Score", f"{inference.risk_score}/100"],
            ["Risk Level", inference.risk_level.value],
            ["Confidence", f"{inference.confidence}%"],
            ["Analysis Date", inference.timestamp.strftime("%Y-%m-%d %H:%M UTC")],
        ]
        
        inf_table = Table(inference_data, colWidths=[2 * inch, 4 * inch])
        inf_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
            ('TEXTCOLOR', (1, 1), (1, 1), risk_color),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(inf_table)
        
        # Findings
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Findings", heading_style))
        story.append(Paragraph(inference.findings, styles['Normal']))
        
        if inference.tx_hash:
            story.append(Spacer(1, 0.1 * inch))
            story.append(Paragraph(
                f"<i>Blockchain TX: {inference.tx_hash}</i>",
                styles['Normal']
            ))
    
    # Additional Notes
    if notes:
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph("Additional Notes", heading_style))
        story.append(Paragraph(notes, styles['Normal']))
    
    # Heatmap placeholder
    if include_heatmap and inference:
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph("AI Heatmap Analysis", heading_style))
        story.append(Paragraph(
            "<i>[Heatmap visualization would be rendered here in production]</i>",
            styles['Normal']
        ))
    
    # Disclaimer
    story.append(Spacer(1, 0.5 * inch))
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096')
    )
    story.append(Paragraph(
        "DISCLAIMER: This AI-generated report is intended to assist medical professionals "
        "and should not be used as the sole basis for medical decisions. Always consult "
        "with a qualified healthcare provider for proper diagnosis and treatment.",
        disclaimer_style
    ))
    
    # Build PDF
    doc.build(story)
    
    # Write to file
    with open(pdf_path, 'wb') as f:
        f.write(buffer.getvalue())
    
    file_size = os.path.getsize(pdf_path)
    
    # Create report record
    report = Report(
        id=report_id,
        scan_id=scan.id,
        patient_id=scan.patient_id,
        generated_at=datetime.now(timezone.utc),
        download_url=f"/api/reports/{report_id}/download",
        file_size=file_size
    )
    
    _report_store[report_id] = report
    return report


def get_report(report_id: str) -> Optional[Report]:
    """Get a report by ID."""
    return _report_store.get(report_id)


def get_report_path(report_id: str) -> Optional[Path]:
    """Get the file path for a report."""
    report = _report_store.get(report_id)
    if not report:
        return None
    
    reports_dir = Path(settings.upload_dir) / "reports"
    pdf_path = reports_dir / f"{report_id}.pdf"
    
    if pdf_path.exists():
        return pdf_path
    return None


def get_reports_by_patient(patient_id: str) -> list[Report]:
    """Get all reports for a patient."""
    return [
        r for r in _report_store.values()
        if r.patient_id == patient_id
    ]


def get_all_reports() -> list[Report]:
    """Get all reports."""
    return list(_report_store.values())
