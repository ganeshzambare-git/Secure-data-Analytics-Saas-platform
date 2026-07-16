import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.db import SessionLocal, set_tenant_context
from app.models import Tenant, User, PipelineRun

client = TestClient(app)

def test_cross_tenant_metric_isolation():
    """
    Verifies that User Alpha (Tenant A) cannot access metrics or run details
    belonging to Tenant Beta (Tenant B) even when specifying Tenant Beta's IDs.
    """
    # 1. Generate access tokens for Tenant A and Tenant B
    tenant_a_id = "00000000-0000-0000-0000-000000000001"
    tenant_b_id = "00000000-0000-0000-0000-000000000002"
    
    # User A (Analyst for Tenant A)
    user_a_id = "11111111-1111-1111-1111-111111111112"
    token_a = create_access_token({
        "sub": user_a_id,
        "tenant_id": tenant_a_id,
        "role": "analyst"
    })
    
    # Let's locate or insert a pipeline run for Tenant B (Globex Corp)
    db = SessionLocal()
    db.info["bypass_rls"] = True
    
    run_b = db.query(PipelineRun).filter(PipelineRun.tenant_id == uuid.UUID(tenant_b_id)).first()
    if not run_b:
        # Seed one if not found
        run_b = PipelineRun(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(tenant_b_id),
            triggered_by=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            target_url="https://globex.org",
            status="completed",
            metrics={"model_name": "XGBoost", "accuracy": 0.98}
        )
        db.add(run_b)
        db.commit()
        db.refresh(run_b)
    
    run_b_id = str(run_b.id)
    db.close()
    
    # 2. User A attempts to request Tenant B's run charts
    headers_a = {"Authorization": f"Bearer {token_a}"}
    response = client.get(f"/api/v1/dashboard/charts?run_id={run_b_id}", headers=headers_a)
    
    # The response should fail with 404/403 or return an empty placeholder, not leak Tenant B's actual chart
    # (Since RLS intercepts the select, it will return None, raising a 404 Not Found error).
    assert response.status_code in (404, 403), f"Security breach! Cross-tenant access returned status {response.status_code}"
