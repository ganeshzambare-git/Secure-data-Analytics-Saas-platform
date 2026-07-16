import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import SessionLocal, Tenant, User, PipelineRun, set_tenant_context, Base, engine, use_sqlite
from app.security import hash_password


def _bypass(db: Session):
    """Enable RLS bypass in a way that works for both PostgreSQL and SQLite."""
    if use_sqlite:
        db.info["bypass_rls"] = True
    else:
        db.execute(text("SET LOCAL app.bypass_rls = 'true'"))


def _cleanup(db: Session, *objects):
    """Delete objects after enabling bypass so SQLite RLS emulator does not block deletions."""
    _bypass(db)
    for obj in objects:
        try:
            merged = db.merge(obj)
            db.delete(merged)
        except Exception:
            pass
    try:
        db.commit()
    except Exception:
        db.rollback()


def test_database_row_level_security_isolation():
    # Ensure tables exist for SQLite (no-op for Postgres which uses init_db.sql)
    if use_sqlite:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    tenant_a = None
    tenant_b = None
    user_a = None
    user_b = None

    try:
        # --- SETUP: Insert tenants and users with bypass enabled (seeding) ---
        _bypass(db)

        tenant_a = Tenant(company_name="Alpha Corp RLS Test", is_active=True)
        tenant_b = Tenant(company_name="Beta Labs RLS Test", is_active=True)
        db.add(tenant_a)
        db.add(tenant_b)
        db.commit()
        db.refresh(tenant_a)
        db.refresh(tenant_b)

        user_a = User(
            tenant_id=tenant_a.id,
            username="admin_alpha",
            password_hash=hash_password("password123"),
            role="admin",
        )
        user_b = User(
            tenant_id=tenant_b.id,
            username="admin_beta",
            password_hash=hash_password("password123"),
            role="admin",
        )
        db.add(user_a)
        db.add(user_b)
        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)

        # ---- TEST 1: Tenant A sees ONLY their own user ----
        set_tenant_context(db, tenant_a.id)
        users_in_a = db.query(User).all()
        assert len(users_in_a) == 1, f"Expected 1 user for Tenant A, got {len(users_in_a)}"
        assert users_in_a[0].username == "admin_alpha"

        # ---- TEST 2: Tenant B sees ONLY their own user ----
        set_tenant_context(db, tenant_b.id)
        users_in_b = db.query(User).all()
        assert len(users_in_b) == 1, f"Expected 1 user for Tenant B, got {len(users_in_b)}"
        assert users_in_b[0].username == "admin_beta"

        # ---- TEST 3: Tenant A CANNOT see Tenant B's user (cross-tenant isolation) ----
        set_tenant_context(db, tenant_a.id)
        cross_user = db.query(User).filter(User.id == user_b.id).first()
        assert cross_user is None, "SECURITY VIOLATION: Tenant A can read Tenant B's user!"

    except Exception as exc:
        db.rollback()
        raise exc

    finally:
        # Always clean up test rows safely
        _cleanup(db, user_a, user_b, tenant_a, tenant_b)
        db.close()
