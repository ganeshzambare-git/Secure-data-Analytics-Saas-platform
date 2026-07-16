# Master Memory - ReadyNest Analytics Engine

## Project Summary
ReadyNest Analytics Engine is a fully implemented multi-tenant enterprise data scraping, ETL, and predictive ML platform. All nine build phases are complete and verified.

## Architectural Overview
- **Frontend**: Next.js 14 App Router (TypeScript), in-memory AES-256-GCM decryption via Web Crypto API inside `SecureDataContext`, hotkey/right-click interception in root layout. Reusable atomic UI components folder at `/src/components` containing `GlowInput.tsx`.
- **Backend**: FastAPI async routes in `/app/api`, configuration and middleware in `/app/core`, database ORM models in `/app/models/schemas.py` (SQLAlchemy 2.0 `Mapped`/`mapped_column`), and Celery worker pipelines in `/app/services`.
- **Database**: PostgreSQL 16 on Neon serverless with Row-Level Security (RLS) + `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables. SQLite fallback auto-detected for local development with a custom ORM RLS query rewriter emulator.
- **Worker Queue**: Celery + Redis for BeautifulSoup scraping, Pandas ETL, and XGBoost/Scikit-learn model training tasks.
- **Seeded Tenants**: Acme Corp (admin_acme / analyst_acme) and Globex Corp (admin_globex / analyst_globex), all with password `password123`.

## Key Decisions
- **Asymmetric Core/API Restructure**: Separating FastAPI endpoints (`/app/api`), configurations/middleware (`/app/core`), database ORM schemas (`/app/models`), and background engines (`/app/services`) prevents modular coupling.
- **AES-256-GCM Shielding**: Middleware-level encryption prevents Network Tab inspection. Client decrypts strictly in-memory via `window.crypto.subtle`.
- **PostgreSQL FORCE RLS**: Even the `postgres` superuser is subject to RLS policies, closing the owner bypass loophole.
- **SQLite Dev Fallback**: `db.py` detects missing psycopg2 and auto-switches to SQLite with an ORM-level query interceptor that emulates RLS for local testing.
- **Programmatic SVG Charts**: Dashboard telemetry rendered as SVG strings server-side, preventing raw coordinate exposure to the browser.
- **CSP Headers**: `next.config.mjs` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict Content-Security-Policy.
- **SQLAlchemy 2.0 `Mapped`/`mapped_column`**: Enforces Python-level strong typing aligned with PostgreSQL column constraints. All datetime columns use `DateTime(timezone=True)` with `lambda: datetime.datetime.now(datetime.timezone.utc)`.
- **Transaction-Isolated Async Session (`get_tenant_db_session`)**: Uses `SET LOCAL app.current_tenant_id` inside `session.begin()` to prevent tenant state leakage across pooled async connections.

## Phase 2 Database Layer — Detailed Status ✅

### Tables
| Table | Primary Key | Cascade | RLS | FORCE RLS |
|---|---|---|---|---|
| `tenants` | `UUID gen_random_uuid()` | — | ❌ | ❌ |
| `users` | `UUID gen_random_uuid()` | ON DELETE CASCADE | ✅ | ✅ |
| `pipeline_runs` | `UUID gen_random_uuid()` | ON DELETE CASCADE | ✅ | ✅ |
| `system_audit_logs` | `BIGSERIAL` | ON DELETE SET NULL | ✅ | ✅ |

### Performance Indexes
| Index | Type | Target |
|---|---|---|
| `idx_tenants_company_name` | B-Tree Unique | `tenants(company_name)` |
| `idx_users_tenant_username` | B-Tree Compound Unique | `users(tenant_id, username)` |
| `idx_pipeline_tenant_status` | Partial B-Tree | `pipeline_runs(tenant_id) WHERE status != 'completed'` |

### RLS Policies (applied via `NULLIF(current_setting(...), '')::uuid`)
- `user_tenant_isolation_rule` ON `users` FOR ALL
- `pipeline_tenant_isolation_rule` ON `pipeline_runs` FOR ALL
- `audit_tenant_isolation_rule` ON `system_audit_logs` FOR ALL

### ORM Model File: `/app/models/schemas.py`
- All classes use SQLAlchemy 2.0 `Mapped[T]` + `mapped_column` type-annotated syntax.
- `DateTime(timezone=True)` with `lambda: datetime.datetime.now(datetime.timezone.utc)` — no deprecated `utcnow`.
- `UUID(as_uuid=True)` for all UUID primary/foreign key columns.
- `LargeBinary` for `encrypted_dataset_payload`; `JSONB` for `metrics`.

### DB Session File: `/app/core/db.py`
- **Sync engine**: `create_engine` + `psycopg2` driver — PostgreSQL with `pool_pre_ping`; auto-falls back to SQLite.
- **Async engine**: `create_async_engine` + `asyncpg` driver (`postgresql+asyncpg://...`) for FastAPI async dependencies.
- **`get_tenant_db_session(tenant_id)`**: Async generator; opens a session, executes `SET LOCAL app.current_tenant_id` inside `session.begin()`, yields session, closes on exit.
- **`set_tenant_context(db, tenant_id)`**: Sync helper; for SQLite sets `session.info["current_tenant_id"]` as a `uuid.UUID` object; for PostgreSQL executes `SET LOCAL`.
- **SQLite RLS Emulator**: `before_flush` + `do_orm_execute` ORM event listeners filter writes and reads by `session.info["current_tenant_id"]`.
- **UUID coercion**: `before_insert` listener converts string IDs to native `uuid.UUID` to prevent `AttributeError: 'str' has no attribute 'hex'` on SQLite bindings.

## Build Status: ALL 9 PHASES COMPLETE ✅

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Environment Setup & RESTRICTED Directories | ✅ Done |
| 2 | PostgreSQL Schema + RLS | ✅ Done |
| 3 | Auth routes + AES middleware + React context | ✅ Done |
| 4 | Dark UI + Auth Gateway + Hotkey shield | ✅ Done |
| 5 | BeautifulSoup scraper + Pandas ETL + ML training | ✅ Done |
| 6 | Plotly SSR SVG chart endpoint | ✅ Done |
| 7 | Pytest suite — 6/6 tests passing | ✅ Done |
| 8 | Docker packaging + local server validation | ✅ Done |
| 9 | .env.example + .gitignore + CSP headers | ✅ Done |

## Running Locally
- Backend: `cd backend && venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload`
- Frontend: `cd frontend && npm run dev`
- Tests: `cd backend && venv\Scripts\pytest.exe tests/ -v`
- DB Init / Validation: `cd backend && venv\Scripts\python.exe scratch_init_neon.py`

## Neon Database Connection
- Sync URL: `postgresql://neondb_owner:<pwd>@ep-falling-art-aznlx4c7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
- Async URL: `postgresql+asyncpg://neondb_owner:<pwd>@ep-falling-art-aznlx4c7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

