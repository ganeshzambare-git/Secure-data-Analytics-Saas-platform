from sqlalchemy import create_engine, text, event, cast, String, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator
import os
import uuid
import datetime

from app.core.config import settings
from app.models import Base, Tenant, User, PipelineRun, SystemAuditLog

# --- SQLite Dialect Custom Type Mappings ---
import json
from sqlalchemy.types import TypeDecorator, CHAR, TEXT
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, JSONB as PostgresJSONB
from sqlalchemy.dialects.sqlite.base import SQLiteDialect
from sqlalchemy.ext.compiler import compiles

class SQLiteUUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)

class SQLiteJSONB(TypeDecorator):
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return json.loads(value)

# Register colspecs on the SQLite dialect class
SQLiteDialect.colspecs[PostgresUUID] = SQLiteUUID
SQLiteDialect.colspecs[PostgresJSONB] = SQLiteJSONB

# DDL compilation overrides for SQLite
@compiles(PostgresUUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"

@compiles(PostgresJSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

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

# --- Initialize Async Engine using Neon Database URL ---
ASYNC_DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_pDfSLZw9PAH3@ep-falling-art-aznlx4c7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
async_engine = create_async_engine(ASYNC_DATABASE_URL, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False, class_=AsyncSession)

# --- Dynamic UUID Generator Hook ---
for model_cls in [Tenant, User, PipelineRun, SystemAuditLog]:
    @event.listens_for(model_cls, 'before_insert')
    def ensure_uuid_id(mapper, connection, target):
        if not target.id:
            target.id = uuid.uuid4()
        elif isinstance(target.id, str):
            target.id = uuid.UUID(target.id)

# --- SQLite Row-Level Security Emulator ---
@event.listens_for(Session, "before_flush")
def enforce_sqlite_rls_flush(session, flush_context, instances):
    if "sqlite" not in str(session.get_bind().url):
        return
    if session.info.get("bypass_rls") is True:
        return
        
    active_tenant = session.info.get("current_tenant_id")
    active_tenant_str = str(active_tenant) if active_tenant else None
    for obj in session.new.union(session.dirty):
        if hasattr(obj, "tenant_id"):
            obj_tenant = str(obj.tenant_id) if obj.tenant_id else None
            if not active_tenant_str or obj_tenant != active_tenant_str:
                raise PermissionError(f"Multi-tenant database boundary check violation: active tenant is {active_tenant_str}, but target object tenant is {obj_tenant}.")

@event.listens_for(Session, "do_orm_execute")
def intercept_sqlite_select_queries(execute_state):
    session = execute_state.session
    if "sqlite" not in str(session.get_bind().url):
        return
    if session.info.get("bypass_rls") is True:
        return
        
    active_tenant = session.info.get("current_tenant_id")
    if active_tenant and isinstance(active_tenant, str):
        active_tenant = uuid.UUID(active_tenant)
    
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
                        func.replace(cast(cls.tenant_id, String), "-", "") == str(active_tenant).replace("-", "")
                    )
            else:
                # If no tenant context is set, force the query to yield empty results
                execute_state.statement = execute_state.statement.where(text("1 = 0"))

# --- Session Helpers ---

async def get_tenant_db_session(tenant_id: uuid.UUID) -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency helper that creates an isolated database session and
    immediately locks the execution scope to the active tenant ID.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Force set transaction-local workspace identity
            await session.execute(
                text("SET LOCAL app.current_tenant_id = :tenant_id;"),
                {"tenant_id": str(tenant_id)}
            )
        try:
            yield session
        finally:
            await session.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def set_tenant_context(db: Session, tenant_id: str):
    if "sqlite" in str(db.get_bind().engine.url):
        if tenant_id and isinstance(tenant_id, str):
            db.info["current_tenant_id"] = uuid.UUID(tenant_id)
        else:
            db.info["current_tenant_id"] = tenant_id
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
            
        acme_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        globex_id = uuid.UUID("00000000-0000-0000-0000-000000000002")

        # Seed tenants if not present
        acme_tenant = db.query(Tenant).filter_by(company_name="Acme Corp").first()
        if not acme_tenant:
            acme_tenant = Tenant(
                id=acme_id,
                company_name="Acme Corp",
                is_active=True
            )
            db.add(acme_tenant)
        else:
            acme_id = acme_tenant.id

        globex_tenant = db.query(Tenant).filter_by(company_name="Globex Corp").first()
        if not globex_tenant:
            globex_tenant = Tenant(
                id=globex_id,
                company_name="Globex Corp",
                is_active=True
            )
            db.add(globex_tenant)
        else:
            globex_id = globex_tenant.id
        db.commit()

        # Seed users if not present
        user_count = db.query(User).count()
        if user_count == 0:
            print("Database has no users. Seeding default users...")
            admin_acme = User(
                id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
                tenant_id=acme_id,
                username="admin_acme",
                password_hash=hash_password("password123"),
                role="admin"
            )
            analyst_acme = User(
                id=uuid.UUID("11111111-1111-1111-1111-111111111112"),
                tenant_id=acme_id,
                username="analyst_acme",
                password_hash=hash_password("password123"),
                role="analyst"
            )
            admin_globex = User(
                id=uuid.UUID("22222222-2222-2222-2222-222222222221"),
                tenant_id=globex_id,
                username="admin_globex",
                password_hash=hash_password("password123"),
                role="admin"
            )
            analyst_globex = User(
                id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
                tenant_id=globex_id,
                username="analyst_globex",
                password_hash=hash_password("password123"),
                role="analyst"
            )
            
            db.add(admin_acme)
            db.add(analyst_acme)
            db.add(admin_globex)
            db.add(analyst_globex)
            db.commit()
            print("Database successfully seeded with users.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
