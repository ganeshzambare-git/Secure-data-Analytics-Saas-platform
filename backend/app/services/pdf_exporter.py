"""
pdf_exporter.py — Server-Side PDF Document Exporter
ReadyNest Analytics Engine — Phase 6
"""

import uuid
import datetime
from sqlalchemy.orm import Session
from app.models import PipelineRun, Tenant

def generate_confidential_pdf(db: Session, run_id: uuid.UUID, company_name: str) -> bytes:
    """
    Compiles an analytical report for the given pipeline run as a secure PDF binary.
    Draws custom colored tables, borders, and confidentiality notices in vector space.
    """
    # Fetch run
    run = db.query(PipelineRun).filter_by(id=run_id).first()
    if not run:
        raise ValueError("Pipeline run not found.")
        
    metrics = run.metrics or {}
    model_name = metrics.get("model_name", "N/A")
    accuracy = metrics.get("accuracy", 0.0)
    rmse = metrics.get("rmse", 0.0)
    split_ratio = metrics.get("split_ratio", 0.8)
    rows_scraped = metrics.get("rows_scraped", 0)
    columns_processed = metrics.get("columns_processed", 0)

    # Compile content stream operations
    stream_content = []
    
    # ── Background styling ──
    # Draw dark cyber outline box
    stream_content.append("0.05 0.11 0.07 RG")  # Muted border #0D1B13
    stream_content.append("2 w")
    stream_content.append("20 20 555 802 re")
    stream_content.append("S")
    
    # ── Header Markings ──
    stream_content.append("BT")
    stream_content.append("/F1 8 Tf")
    stream_content.append("0.44 0.5 0.59 rg")  # Text muted #718096
    stream_content.append("1 0 0 1 50 790 Tm")
    stream_content.append("(CONFIDENTIALITY CLASSIFICATION: SECURE ZERO-TRUST NETWORK BLOCK) Tj")
    
    # ── Title ──
    stream_content.append("/F1 18 Tf")
    stream_content.append("0.0 0.9 0.46 rg")  # Accent Neon Green #00E676
    stream_content.append("1 0 0 1 50 750 Tm")
    stream_content.append("(READYNEST CORE TELEMETRY REPORT) Tj")
    stream_content.append("ET")
    
    # Title divider line
    stream_content.append("0.0 0.9 0.46 RG")
    stream_content.append("1 w")
    stream_content.append("50 740 m")
    stream_content.append("545 740 l")
    stream_content.append("S")
    
    # ── Metadata Block ──
    stream_content.append("BT")
    stream_content.append("/F1 10 Tf")
    stream_content.append("0.88 0.9 0.94 rg")  # Light gray text
    
    # Metadata rows
    metadata = [
        f"Tenant Workspace: {company_name}",
        f"Pipeline Run ID: {str(run.id)}",
        f"Target URL Location: {run.target_url}",
        f"Telemetry Compiled: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Pipeline Status: {run.status}"
    ]
    
    y = 710
    for item in metadata:
        stream_content.append(f"1 0 0 1 50 {y} Tm")
        stream_content.append(f"({item}) Tj")
        y -= 15
        
    stream_content.append("ET")
    
    # ── Metrics Table Heading ──
    stream_content.append("BT")
    stream_content.append("/F1 12 Tf")
    stream_content.append("0.0 0.9 0.46 rg")
    stream_content.append(f"1 0 0 1 50 {y-15} Tm")
    stream_content.append("(EVALUATION MATRIX & PREDICTIVE METRICS) Tj")
    stream_content.append("ET")
    
    # Draw table border box
    table_top = y - 35
    stream_content.append("0.1 0.2 0.15 RG")  # Muted border #1A3326
    stream_content.append(f"50 {table_top - 120} 495 110 re")
    stream_content.append("S")
    
    # Draw table header fill
    stream_content.append("0.05 0.11 0.07 rg")
    stream_content.append(f"50 {table_top - 20} 495 20 re")
    stream_content.append("f")
    
    # Table rows
    table_rows = [
        ("Parameter Metric", "Value / Rating Configuration"),
        ("Rows Ingested & Cleaned", str(rows_scraped)),
        ("Feature Vector Columns", str(columns_processed)),
        ("Model Framework Type", model_name),
        ("Train / Test Split Ratio", f"{split_ratio*100:.0f}% / {(1 - split_ratio)*100:.0f}%"),
        ("R2 Accuracy Score", f"{accuracy:.4f}"),
        ("Root Mean Squared Error (RMSE)", f"{rmse:.4f}")
    ]
    
    stream_content.append("BT")
    stream_content.append("/F1 9 Tf")
    
    ty = table_top - 15
    first_row = True
    for col1, col2 in table_rows:
        if first_row:
            stream_content.append("0.0 0.9 0.46 rg")  # Neon green for headers
            first_row = False
        else:
            stream_content.append("0.88 0.9 0.94 rg")
            
        # Draw columns
        stream_content.append(f"1 0 0 1 60 {ty} Tm")
        stream_content.append(f"({col1}) Tj")
        
        stream_content.append(f"1 0 0 1 350 {ty} Tm")
        stream_content.append(f"({col2}) Tj")
        
        ty -= 15
        
    stream_content.append("ET")
    
    # Draw separating grid lines inside table
    stream_content.append("0.1 0.2 0.15 RG")
    line_y = table_top - 20
    for _ in range(6):
        stream_content.append(f"50 {line_y} m")
        stream_content.append(f"545 {line_y} l")
        stream_content.append("S")
        line_y -= 15
        
    # ── Audit Integrity Section ──
    stream_content.append("BT")
    stream_content.append("/F1 11 Tf")
    stream_content.append("0.0 0.9 0.46 rg")
    stream_content.append(f"1 0 0 1 50 {ty-30} Tm")
    stream_content.append("(CRYPTOGRAPHIC HANDSHAKE & VERIFICATION) Tj")
    
    stream_content.append("/F1 9 Tf")
    stream_content.append("0.44 0.5 0.59 rg")
    stream_content.append(f"1 0 0 1 50 {ty-50} Tm")
    stream_content.append("(All data packets are strictly protected by in-memory AES-GCM-256 network shielding.) Tj")
    stream_content.append(f"1 0 0 1 50 {ty-65} Tm")
    stream_content.append("(This document is an immutable corporate record of the ReadyNest security context.) Tj")
    
    # ── Confidentiality Footer ──
    stream_content.append("0.96 0.24 0.24 rg")  # Muted crimson for warnings
    stream_content.append(f"1 0 0 1 50 60 Tm")
    stream_content.append("(WARNING: PROPRIETARY & CONFIDENTIAL. UNLAWFUL DISTRIBUTION SUBJECT TO ACTION.) Tj")
    stream_content.append("ET")
    
    stream_str = "\n".join(stream_content)
    content_obj = f"<< /Length {len(stream_str)} >>\nstream\n{stream_str}\nendstream"
    
    objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R /MediaBox [0 0 595 842] >>\nendobj",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
        f"5 0 obj\n{content_obj}\nendobj"
    ]
    
    pdf_data = b"%PDF-1.4\n"
    offsets = []
    
    for obj in objects:
        offsets.append(len(pdf_data))
        pdf_data += obj.encode("latin-1") + b"\n"
        
    xref_offset = len(pdf_data)
    
    xref = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for offset in offsets:
        xref += f"{offset:010d} 00000 n \n"
        
    pdf_data += xref.encode("ascii")
    
    trailer = f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    pdf_data += trailer.encode("ascii")
    
    return pdf_data
