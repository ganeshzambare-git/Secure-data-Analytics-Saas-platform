"""
auth.py — Authentication API Routes
ReadyNest Analytics Engine — Phase 3

Endpoints
---------
POST /api/v1/auth/tenant-resolve
    Phase 1 of the two-stage authentication protocol.
    Accepts an organization name, returns tenant UUID or HTTP 404.

POST /api/v1/auth/token
    Phase 2 — credentials verification and JWT issuance.
    Returns a 15-minute access token carrying sub, tenant_id, role, exp.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.db import get_db, set_tenant_context
from app.models import Tenant, User
from app.core.auth_utils import verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ── Pydantic Schemas ─────────────────────────────────────────────────

class TenantResolveRequest(BaseModel):
    organization_name: str = Field(..., description="Corporate workspace / organization name")


class TenantResolveResponse(BaseModel):
    resolved: bool
    tenant_id: str
    company_name: str


class TokenRequest(BaseModel):
    tenant_id: str = Field(..., description="Target Tenant UUID")
    username:  str = Field(..., description="Corporate username")
    password:  str = Field(..., description="Plaintext password")
    role:      str = Field(..., description="RBAC role: admin | analyst")


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    role:         str
    username:     str
    tenant_id:    str


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/tenant-resolve", response_model=TenantResolveResponse)
def resolve_tenant(payload: TenantResolveRequest, db: Session = Depends(get_db)):
    """
    Phase 1 — Tenant Recognition.

    Looks up the tenants table by company_name (case-insensitive).
    Returns HTTP 404 if the workspace is not registered or inactive.
    """
    tenant = (
        db.query(Tenant)
        .filter(Tenant.company_name.ilike(payload.organization_name))
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace address not registered. Please contact your system administrator.",
        )

    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization account is currently deactivated. Contact your system administrator.",
        )

    return TenantResolveResponse(
        resolved=True,
        tenant_id=str(tenant.id),
        company_name=tenant.company_name,
    )


@router.post("/token", response_model=TokenResponse)
def login_and_issue_token(payload: TokenRequest, db: Session = Depends(get_db)):
    """
    Phase 2 — Identity & Credentials Verification.

    Validates username/password/role against the users table scoped to
    the supplied tenant_id via RLS context. Issues a 15-minute JWT on
    success.
    """
    # Establish RLS tenant boundary before querying users
    try:
        set_tenant_context(db, payload.tenant_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant identifier format.",
        )

    user = db.query(User).filter_by(username=payload.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization username or password credentials.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization username or password credentials.",
        )

    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not possess the selected authorization role.",
        )

    # Issue short-lived JWT (15-minute expiry) with Phase 3 claims block
    token = create_access_token(
        sub=str(user.id),
        tenant_id=str(user.tenant_id),
        role=user.role,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        tenant_id=str(user.tenant_id),
    )
