"""
export.py — Document Export API Routes
ReadyNest Analytics Engine — Phase 6
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.core.db import get_db
from app.models import User, Tenant
from app.api.pipeline import get_current_user
from app.services.pdf_exporter import generate_confidential_pdf
from fastapi.responses import Response

router = APIRouter(prefix="/api/v1/export", tags=["Document Export"])

@router.get("/pdf")
def export_pdf(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/export/pdf
    Generates and returns the secure vector-graphic PDF report.
    """
    try:
        run_id_uuid = uuid.UUID(run_id)
        tenant = db.query(Tenant).filter_by(id=current_user.tenant_id).first()
        company_name = tenant.company_name if tenant else "Organization"
        
        pdf_bytes = generate_confidential_pdf(db, run_id_uuid, company_name)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=Secure_PDF_Summary.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile secure PDF document: {str(e)}"
        )
