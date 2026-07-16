# Glossary - ReadyNest Analytics Engine

- **Tenant**: A corporate organization that owns a distinct sandbox in the database.
- **RLS**: Row-Level Security. Database security paradigm that dynamically filters database queries according to the executor's session environment variables.
- **FORCE ROW LEVEL SECURITY**: A PostgreSQL table modifier that applies RLS policies even to database superusers and table owners, closing the ownership bypass loophole.
- **Client-Side Shielding**: Blocking the client browser from accessing unencrypted network response payloads, disabling context menu inspection, and intercepting keyboard inspection shortcuts.
- **ETL Canvas**: Data collection and processing zone where analysts run BeautifulSoup URL scraper and apply pandas algorithms to clean raw outputs.
- **ML Workshop**: Workbench to configure, split, train, and test XGBoost or Scikit-learn models on processed dataset rows.
- **get_tenant_db_session**: An async FastAPI dependency that opens a PostgreSQL async session and binds it to a specific tenant ID via `SET LOCAL app.current_tenant_id` inside a transaction block to prevent multi-tenant state leaks on pooled connections.
- **mapped_column**: SQLAlchemy 2.0 declarative column descriptor used with `Mapped[T]` type annotations for strongly typed ORM schema definitions.
- **psycopg2-binary / asyncpg**: Python PostgreSQL DBAPI drivers. `psycopg2-binary` is used for synchronous SQLAlchemy sessions; `asyncpg` is used for async engine connections.
- **SQLite RLS Emulator**: A custom ORM event listener in `db.py` that intercepts SELECT, INSERT, and UPDATE queries to enforce tenant boundary checks during local development without a PostgreSQL instance.

