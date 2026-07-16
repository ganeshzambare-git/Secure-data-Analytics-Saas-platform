from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, Session
import os
import uuid
import datetime

from app.core.config import settings
from app.models import Base, Tenant, User, PipelineRun, SystemAuditLog

# --- Initialize Engine with SQLite Fallback ---
use_sqlite = False
try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    print(f"PostgreSQL connection failed: {e}. Falling back to SQLite for local development and testing.")
    use_sqlite = True
    db_file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
        "readynest.db"
    )
    settings.DATABASE_URL = f"sqlite:///{db_file_path}"
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Dynamic UUID Generator Hook ---
for model_cls in [Tenant, User, PipelineRun, SystemAuditLog]:
    @event.listens_for(model_cls, 'before_insert')
    def ensure_uuid_id(mapper, connection, target):
        if not target.id:
            target.id = str(uuid.uuid4())

# --- SQLite Row-Level Security Emulator ---
@event.listens_for(Session, "before_flush")
def enforce_sqlite_rls_flush(session, flush_context, instances):
    if "sqlite" not in str(session.get_bind().url):
        return
    if session.info.get("bypass_rls") is True:
        return
        
    active_tenant = session.info.get("current_tenant_id")
    for obj in session.new.union(session.dirty):
        if hasattr(obj, "tenant_id"):
            obj_tenant = str(obj.tenant_id) if obj.tenant_id else None
            if not active_tenant or obj_tenant != active_tenant:
                raise PermissionError(f"Multi-tenant database boundary check violation: active tenant is {active_tenant}, but target object tenant is {obj_tenant}.")

@event.listens_for(Session, "do_orm_execute")
def intercept_sqlite_select_queries(execute_state):
    session = execute_state.session
    if "sqlite" not in str(session.get_bind().url):
        return
    if session.info.get("bypass_rls") is True:
        return
        
    active_tenant = session.info.get("current_tenant_id")
    
    # Intercept and append filter criteria if it is an ORM select query
    if execute_state.is_select:
        target_classes = []
        try:
            for desc in execute_state.statement.column_descriptions:
                entity = desc.get("entity")
                if entity and hasattr(entity, "tenant_id"):
                    target_classes.append(entity)
        except Exception:
            pass
            
        if target_classes:
            if active_tenant:
                for cls in target_classes:
                    execute_state.statement = execute_state.statement.where(
                        cls.tenant_id == active_tenant
                    )
            else:
                # If no tenant context is set, force the query to yield empty results
                execute_state.statement = execute_state.statement.where(text("1 = 0"))

# --- Session Helpers ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def set_tenant_context(db: Session, tenant_id: str):
    if "sqlite" in str(db.get_bind().url):
        db.info["current_tenant_id"] = str(tenant_id) if tenant_id else None
        db.info["bypass_rls"] = False
    else:
        db.execute(text("SET LOCAL app.bypass_rls = 'false'"))
        db.execute(text("SET LOCAL app.current_tenant_id = :tenant_id"), {"tenant_id": str(tenant_id)})

# --- Database Seeder Utility ---
def seed_database():
    from app.core.security import hash_password
    
    if use_sqlite:
        Base.metadata.create_all(bind=engine)
        
    db = SessionLocal()
    try:
        if use_sqlite:
            db.info["bypass_rls"] = True
        else:
            db.execute(text("SET LOCAL app.bypass_rls = 'true'"))
            
        tenant_count = db.query(Tenant).count()
        if tenant_count == 0:
            print("Database empty. Seeding initial tenants and users...")
            
            # 1. Create Acme Corp Tenant
            acme_tenant = Tenant(
                id="00000000-0000-0000-0000-000000000001",
                company_name="Acme Corp",
                is_active=True
            )
            db.add(acme_tenant)
            
            # 2. Create Globex Corp Tenant
            globex_tenant = Tenant(
                id="00000000-0000-0000-0000-000000000002",
                company_name="Globex Corp",
                is_active=True
            )
            db.add(globex_tenant)
            db.commit()
            
            # 3. Create users
            admin_acme = User(
                id="11111111-1111-1111-1111-111111111111",
                tenant_id=acme_tenant.id,
                username="admin_acme",
                password_hash=hash_password("password123"),
                role="admin"
            )
            analyst_acme = User(
                id="11111111-1111-1111-1111-111111111112",
                tenant_id=acme_tenant.id,
                username="analyst_acme",
                password_hash=hash_password("password123"),
                role="analyst"
            )
            admin_globex = User(
                id="22222222-2222-2222-2222-222222222221",
                tenant_id=globex_tenant.id,
                username="admin_globex",
                password_hash=hash_password("password123"),
                role="admin"
            )
            analyst_globex = User(
                id="22222222-2222-2222-2222-222222222222",
                tenant_id=globex_tenant.id,
                username="analyst_globex",
                password_hash=hash_password("password123"),
                role="analyst"
            )
            
            db.add(admin_acme)
            db.add(analyst_acme)
            db.add(admin_globex)
            db.add(analyst_globex)
            
            db.commit()
            print("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
