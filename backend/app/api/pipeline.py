import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

from app.core.db import get_db, set_tenant_context
from app.models import PipelineRun, SystemAuditLog, Tenant, User
from app.core.security import verify_token, hash_password
from app.services.worker import execute_scraping_and_etl, train_ml_model

router = APIRouter(prefix="/api/v1/pipeline", tags=["Data Pipelines"])

# --- Security Dependencies ---

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session authorization header missing or invalid."
        )
        
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or authentication token is invalid."
        )
        
    tenant_id = payload.get("tenant_id")
    user_id = payload.get("sub")
    
    # Establish SQL Tenant Isolation Boundary
    set_tenant_context(db, tenant_id)
    
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity matching session could not be established."
        )
        
    return user

# --- Pydantic Schemas ---

class ScrapeRequest(BaseModel):
    target_url: str = Field(..., description="Target URL website address")

class TrainRequest(BaseModel):
    run_id: str = Field(..., description="Pipeline Run UUID")
    model_type: str = Field("sklearn", description="Model framework: sklearn or xgboost")
    split_ratio: float = Field(0.8, ge=0.5, le=0.9, description="Training split size ratio")

class OnboardTenantRequest(BaseModel):
    company_name: str = Field(..., description="Corporate organization name")
    admin_username: str = Field(..., description="Organization admin username")
    admin_password: str = Field(..., description="Organization admin password")

class TenantToggleRequest(BaseModel):
    is_active: bool

# --- Data Analysts Endpoints ---

@router.get("/runs", response_model=List[dict])
def list_pipeline_runs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # RLS enforces that this query returns ONLY records for current_user.tenant_id
    runs = db.query(PipelineRun).order_by(PipelineRun.updated_at.desc()).all()
    return [
        {
            "id": str(r.id),
            "target_url": r.target_url,
            "status": r.status,
            "metrics": r.metrics,
            "updated_at": r.updated_at.isoformat()
        }
        for r in runs
    ]

@router.post("/scrape")
def trigger_scrape(
    payload: ScrapeRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Trigger scraping task in-process to guarantee synchronous completion for immediate feedback
        run_id = execute_scraping_and_etl(
            str(current_user.tenant_id), 
            str(current_user.id), 
            payload.target_url
        )
        return {"success": True, "run_id": run_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline scraping execution failure: {str(e)}"
        )

@router.post("/train")
def fit_model(
    payload: TrainRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Run ML training algorithm task synchronously
        metrics = train_ml_model(
            str(current_user.tenant_id),
            str(current_user.id),
            payload.run_id,
            payload.model_type,
            payload.split_ratio
        )
        return {"success": True, "metrics": metrics}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model workshop parameters training failure: {str(e)}"
        )

# --- System Administrators Endpoints ---

@router.get("/admin/tenants", response_model=List[dict])
def list_tenants(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires System Administrator authorization privilege."
        )
        
    tenants = db.query(Tenant).order_by(Tenant.company_name).all()
    return [
        {
            "id": str(t.id),
            "company_name": t.company_name,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat()
        }
        for t in tenants
    ]

@router.post("/admin/tenants")
def onboard_tenant(
    payload: OnboardTenantRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires System Administrator authorization privilege."
        )
        
    # Check if tenant exists
    existing = db.query(Tenant).filter(Tenant.company_name.ilike(payload.company_name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corporate organization name already registered."
        )
        
    try:
        # Create Tenant
        tenant = Tenant(company_name=payload.company_name, is_active=True)
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        # Create default Admin user for this tenant
        admin_user = User(
            tenant_id=tenant.id,
            username=payload.admin_username,
            password_hash=hash_password(payload.admin_password),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        
        # Log Global Audit
        audit = SystemAuditLog(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            action_performed=f"Onboarded new corporate tenant: {payload.company_name}",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        
        return {"success": True, "tenant_id": str(tenant.id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to onboard new tenant instance: {str(e)}"
        )

@router.post("/admin/tenants/{tenant_id}/toggle")
def toggle_tenant(
    tenant_id: str,
    payload: TenantToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires System Administrator authorization privilege."
        )
        
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant block not found.")
        
    tenant.is_active = payload.is_active
    db.commit()
    
    # Audit log
    audit = SystemAuditLog(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        action_performed=f"Modified Tenant {tenant.company_name} active state to {payload.is_active}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    
    return {"success": True}

@router.get("/admin/audit-logs", response_model=List[dict])
def list_system_audit_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires System Administrator authorization privilege."
        )
        
    # Since the request is from a global administrator, we want to fetch all logs.
    db.execute(text("SET LOCAL app.bypass_rls = 'true'"))
    
    query = db.query(SystemAuditLog, Tenant.company_name, User.username)\
              .join(Tenant, SystemAuditLog.tenant_id == Tenant.id)\
              .join(User, SystemAuditLog.user_id == User.id)\
              .order_by(SystemAuditLog.timestamp.desc())\
              .all()
              
    return [
        {
            "id": str(log.id),
            "company_name": company_name,
            "username": username,
            "action_performed": log.action_performed,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat()
        }
        for log, company_name, username in query
    ]
