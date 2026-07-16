# Dependency Graph - ReadyNest Analytics Engine

```mermaid
graph TD
    subgraph Frontend
        page[Auth Gateway: page.tsx] --> context[SecureDataContext.tsx]
        context --> dashboard[Dashboard Layout]
        dashboard --> admin[Admin Deck: admin/page.tsx]
        dashboard --> analyst[Analyst Canvas: analyst/page.tsx]
    end
    
    subgraph Backend
        main[FastAPI Core: main.py] --> r_auth[Auth Router: auth.py]
        main --> r_pipe[Pipeline Router: pipeline.py]
        main --> r_dash[Dashboard Router: dashboard.py]
        main --> sec[Security Module: security.py]
        main --> db[DB Connection Module: db.py]
        r_pipe --> cel[Celery tasks/worker.py]
        db --> models[ORM Models: schemas.py]
    end

    subgraph Models["ORM Models (schemas.py)"]
        models --> m_tenant[Tenant]
        models --> m_user[User]
        models --> m_run[PipelineRun]
        models --> m_log[SystemAuditLog]
    end

    subgraph Database
        db_sql[init_db.sql / scratch_init_neon.py] --> db_pg[(PostgreSQL 16 on Neon)]
    end

    context --> |AES-256-GCM encrypted JSON| main
    db --> |Sync RLS Transaction: set_tenant_context| db_pg
    db --> |Async RLS Transaction: get_tenant_db_session| db_pg
    db -.-> |SQLite Fallback: local dev| db_sqlite[(SQLite)]
    cel --> |Pandas ETL / XGBoost| db_pg
```
