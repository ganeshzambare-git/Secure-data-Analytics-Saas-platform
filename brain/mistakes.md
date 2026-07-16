# Mistakes Prevented - ReadyNest Analytics Engine

## 1. PostgreSQL RLS Session Variable Error
- **Problem**: Querying tables with RLS enabled without configuring a tenant ID context throws an error or yields zero rows, which could cause authentication routes to fail.
- **Fix**: Exempt global public endpoints (like `tenant-resolve` or user login) from RLS checks, or fetch the user's base identity via a security bypass connection, then set the tenant variable inside the tenant-specific session.

## 2. In-Memory Decryption State Resets
- **Problem**: Hard page reloads in Next.js clear in-memory states, causing the decryption session context to lose keys.
- **Fix**: Save secure session credentials (like encrypted JWT tokens) in session storage, which remains isolated to the current tab, and rebuild key hooks on load.

## 3. SQLite UUID Type Binding Error
- **Problem**: SQLite handles UUID mappings as character columns. Under SQLAlchemy 2.0 type processing, passing a string representation of a UUID directly to a `UUID(as_uuid=True)` mapped column results in `AttributeError: 'str' object has no attribute 'hex'` during ORM insert/filter executions because the processor expects a python `uuid.UUID` object.
- **Fix**: Coerce string tenant context variables and event listener bindings to native `uuid.UUID` objects in session-level parameters, and intercept inserts to convert any string-based seeded IDs to native Python `uuid.UUID` types.

