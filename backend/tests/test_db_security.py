import pytest
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.db import SessionLocal, set_tenant_context, engine, use_sqlite
from app.models import User, Tenant, Base

def test_sql_injection_defense():
    """
    Verifies that SQL Injection payloads passed into query parameters
    are safely parameterized and do not compromise multi-tenant isolation.
    """
    db = SessionLocal()
    try:
        # Establish tenant context for Tenant A
        tenant_a_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        set_tenant_context(db, tenant_a_id)

        # 1. SQL Injection injection query parameters attempt
        # A payload designed to always return true (OR 1=1) and bypass tenant checks
        malicious_input = "' OR '1'='1"
        users = db.query(User).filter(User.username == malicious_input).all()
        
        # Verify that SQLAlchemy parameterized the input and didn't leak other tenants' data
        assert len(users) == 0, "SQL injection payload succeeded in retrieving unauthorized records!"

        # 2. SQL Injection attempting comment block escape
        comment_payload = "analyst_acme' --"
        users_comment = db.query(User).filter(User.username == comment_payload).all()
        assert len(users_comment) == 0, "Comment syntax injection leaked data!"

    finally:
        db.close()

def test_tenant_context_boundary_violations():
    """
    Asserts that attempting to query users without setting the tenant context
    strictly returns an empty query result set, preventing data leakages.
    """
    db = SessionLocal()
    try:
        # Clear or do not set tenant context
        if use_sqlite:
            db.info["current_tenant_id"] = None
            db.info["bypass_rls"] = False
        else:
            db.execute(text("RESET app.current_tenant_id"))
            db.execute(text("SET LOCAL app.bypass_rls = 'false'"))

        # Query users - should yield empty result set
        users = db.query(User).all()
        assert len(users) == 0, "Data leaked when no tenant context was set!"

    finally:
        db.close()
