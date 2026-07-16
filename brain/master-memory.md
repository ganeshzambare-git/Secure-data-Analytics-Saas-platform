# Master Memory - ReadyNest Analytics Engine

## Project Summary
ReadyNest Analytics Engine is a fully implemented multi-tenant enterprise data scraping, ETL, and predictive ML platform. All nine build phases are complete and verified.

## Architectural Overview
- **Frontend**: Next.js 14 App Router (TypeScript), in-memory AES-256-GCM decryption via Web Crypto API inside `SecureDataContext`, hotkey/right-click interception in root layout.
- **Backend**: FastAPI async routes with `SecureNetworkShieldMiddleware` that encrypts all `/api/v1/` responses with AES-256-GCM before transmission.
- **Database**: PostgreSQL 16 with Row-Level Security (RLS) + `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables. SQLite fallback auto-detected for local development.
- **Worker Queue**: Celery + Redis for BeautifulSoup scraping, Pandas ETL, and XGBoost/Scikit-learn model training tasks.
- **Seeded Tenants**: Acme Corp (admin_acme / analyst_acme) and Globex Corp (admin_globex / analyst_globex), all with password `password123`.

## Key Decisions
- **AES-256-GCM Shielding**: Middleware-level encryption prevents Network Tab inspection. Client decrypts strictly in-memory via `window.crypto.subtle`.
- **PostgreSQL FORCE RLS**: Even the `postgres` superuser is subject to RLS policies, closing the owner bypass loophole.
- **SQLite Dev Fallback**: `db.py` detects missing psycopg2 and auto-switches to SQLite with an ORM-level query interceptor that emulates RLS for local testing.
- **Programmatic SVG Charts**: Dashboard telemetry rendered as SVG strings server-side, preventing raw coordinate exposure to the browser.
- **CSP Headers**: `next.config.mjs` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict Content-Security-Policy.

## Build Status: ALL 9 PHASES COMPLETE ✅

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Docker Compose + Infrastructure | ✅ Done |
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
