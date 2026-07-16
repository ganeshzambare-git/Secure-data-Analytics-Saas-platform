# Feature Map - ReadyNest Analytics Engine

- **Authentication Gateway**
  - Tenant Resolve: `/api/v1/auth/tenant-resolve`
  - Login / JWT Issue: `/api/v1/auth/token`
  - Backend: `backend/app/api/auth.py`
  - Frontend: `frontend/src/app/page.tsx`

- **Database Layer & RLS** ✅ Phase 2 Complete
  - Schema DDL: `backend/init_db.sql`, `backend/scratch_init_neon.py`
  - ORM Models: `backend/app/models/schemas.py` (SQLAlchemy 2.0 Mapped)
  - Session Context: `backend/app/core/db.py` — `get_tenant_db_session`, `set_tenant_context`
  - Tests: `backend/tests/test_tenant_isolation.py` — 6/6 passing

- **System Admin Deck**
  - Tenant onboarding, activation toggle: `/api/v1/pipeline/onboard-tenant`, `/api/v1/pipeline/tenants/{id}/toggle`
  - Frontend: `frontend/src/app/dashboard/admin/page.tsx`

- **Data Scraper Terminal & ETL Hub**
  - Scrape target URL, trigger ETL cleaning: `/api/v1/pipeline/scrape`
  - List pipeline runs: `/api/v1/pipeline/runs`
  - Asynchronous scraping & ETL: Celery worker tasks in `backend/app/services/worker.py`
  - Frontend: `frontend/src/app/dashboard/analyst/page.tsx`

- **Machine Learning Workshop**
  - Model fitting, evaluation: `/api/v1/pipeline/train`
  - ML calculations (XGBoost/Scikit-learn): Celery worker tasks in `backend/app/services/worker.py`

- **Visual Insights Dashboard**
  - Serve pre-compiled SVGs: `/api/v1/dashboard/charts`
  - Rendering module: Plotly engine inside `backend/app/api/dashboard.py`

