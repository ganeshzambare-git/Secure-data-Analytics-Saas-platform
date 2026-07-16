from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.db import get_db, set_tenant_context
from app.models import Tenant, User
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# --- Pydantic Schemas ---

class TenantResolveRequest(BaseModel):
    company_name: str = Field(..., description="Organization company name")

class TenantResolveResponse(BaseModel):
    exists: bool
    tenant_id: str = None
    company_name: str = None

class TokenRequest(BaseModel):
    tenant_id: str = Field(..., description="Target Tenant UUID")
    username: str = Field(..., description="Corporate username")
    password: str = Field(..., description="Plaintext password")
    role: str = Field(..., description="Role selected: admin or analyst")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    tenant_id: str

# --- Endpoints ---

@router.post("/tenant-resolve", response_model=TenantResolveResponse)
def resolve_tenant(payload: TenantResolveRequest, db: Session = Depends(get_db)):
    # Query database for tenant name (case-insensitive)
    tenant = db.query(Tenant).filter(Tenant.company_name.ilike(payload.company_name)).first()
    if not tenant:
        return TenantResolveResponse(exists=False)
    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization account is currently deactivated."
        )
    return TenantResolveResponse(
        exists=True,
        tenant_id=str(tenant.id),
        company_name=tenant.company_name
    )

@router.post("/token", response_model=TokenResponse)
def login_and_issue_token(payload: TokenRequest, db: Session = Depends(get_db)):
    # Start transaction, limit database context to target tenant RLS space
    try:
        set_tenant_context(db, payload.tenant_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant identifier format."
        )
        
    user = db.query(User).filter_by(username=payload.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization username or password credentials."
        )
        
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization username or password credentials."
        )
        
    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not possess the selected authorization role."
        )
        
    # Generate Token carrying organization details
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "tenant_id": str(user.tenant_id),
        "role": user.role
    }
    
    token = create_access_token(data=token_data)
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        tenant_id=str(user.tenant_id)
    )
