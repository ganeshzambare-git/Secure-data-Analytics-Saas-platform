# ReadyNest Analytics Engine - Agent Directives

Welcome to the ReadyNest Analytics Engine repository. This codebase implements a highly secure, multi-tenant ETL and Machine Learning platform with Zero-Trust response shielding.

## Operational Rules

1. **Anti-Gravity Paradigm**: Implement changes incrementally. Verify schema alignment, compile code, and run tests before declaring a phase complete.
2. **Strict Multi-Tenant Row Isolation**: Never perform a database query without setting `app.current_tenant_id` in the current session.
3. **Response Shielding**: Do not expose raw unencrypted API responses. All custom router controllers must wrap payloads using the AES-256-GCM encryption middleware.
4. **Project Brain Updates**: At the end of every task, update the relevant files in the `brain/` directory to document new architectural changes, decisions, and patterns.

## Directory Structure
- `/backend/`: FastAPI application, Celery workers, and init SQL scripts.
- `/frontend/`: Next.js frontend application with Client-Side Shielding context.
- `/brain/`: Project Brain memory files.
