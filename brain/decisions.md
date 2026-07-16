# Engineering Decisions - ReadyNest Analytics Engine

## Decision 1: Shared-Database, Shared-Schema with Row-Level Security
- **Reason**: Simplifies migrations, schema syncing, and infrastructure costs, while guaranteeing tenant boundary checks natively at the PostgreSQL core engine layer.
- **Alternatives**: Separate Database per Tenant (too complex/costly for initial SaaS scale).

## Decision 2: AES-256-GCM response encryption
- **Reason**: Traditional HTTPS hides transit data but allows developers to inspect APIs in client browsers. AES-256-GCM decryption in-memory ensures that raw credentials or datasets are invisible to the developer console's network tab.

## Decision 3: Pre-Rendered SVGs on Backend
- **Reason**: Rendering Plotly charts to SVGs on the backend prevents transferring clean raw datasets to the browser, protecting client intellectual property.

## Decision 4: SQLAlchemy 2.0 Modern Declarative Mapped & mapped_column Type Annotations
- **Reason**: Enforces strict typing at the Python application level, aligning models directly with PostgreSQL 16 schema column constraints and ensuring static analysis safety.
- **Alternatives**: SQLAlchemy 1.x style Declarative (loose types, less maintainable).

## Decision 5: Session-Scoped Connection-Level State Parameters via get_tenant_db_session
- **Reason**: Using `SET LOCAL app.current_tenant_id` within a transaction boundary ensures the isolation state parameter is bounded to the transaction context, avoiding state leakage on pooled connections shared by concurrent request processes.

## Decision 6: Hex Wire Format for AES-256-GCM Payloads (Phase 3)
- **Reason**: Using lowercase hex encoding (not Base64) for the `{"payload":"<hex>"}` envelope makes the ciphertext self-describing and easy to split (IV = first 24 hex chars = 12 bytes). Hex avoids padding character issues with URL transport and is directly parseable in both Python (`bytes.fromhex`) and JS (`parseInt(byte, 16)`).
- **Alternatives**: Base64 (shorter, but requires atob/btoa and padding handling). The original Phase 1 code used Base64 with a `ciphertext` key — replaced for spec alignment.

## Decision 7: Lazy CryptoKey Import via useRef (Phase 3)
- **Reason**: `window.crypto.subtle.importKey` cannot run during Next.js SSR/static generation (no `window`). Using a `useRef`-based lazy pattern defers key import to the first client-side `decryptPayload()` call, eliminating `ReferenceError: window is not defined` during `next build`.
- **Alternatives**: `useMemo` (fails during SSR), `useEffect` (adds async state complexity and a loading frame).

## Decision 8: Blur-Shield on Window Focus Loss (Phase 3)
- **Reason**: Over-the-shoulder data leakage prevention. When the browser window loses focus or the pointer exits the viewport, a `filter: blur(12px)` is applied to the layout wrapper. This obscures sensitive dashboard data from shoulder-surfers or screen-sharing leaks. Re-focus removes the blur instantly.

## Decision 9: Horizontal-to-Vertical Layout Switching & System Rail Breakpoints (Phase 4)
- **Reason**: Navigating complex admin tasks on a phone or tablet can be difficult. On Desktop/Tablet views, a 64px vertical nav rail keeps navigation items accessible without wasting space. On Mobile views (<768px), the layout switches to a horizontal navigation bar at the bottom/top of the screen.

## Decision 10: 40/60 Asymmetric Split & Responsive Drawer Folding (Phase 4)
- **Reason**: Keeps focus on metrics. In Analyst Workspace, the 40/60 composition grid layout splits configurations on the left and outputs on the right. On Tablet viewports (768px-1200px), the left column parameter panel folds back into an overlay sliding drawer canvas, ensuring that charts and log streams receive full screen space.

## Decision 11: Validation Challenge Modal for Parameter Reveal (Phase 4)
- **Reason**: Zero-trust credential visibility. Revealing sensitive parameters (e.g. Scraper Proxy Credentials or ETL Salts) requires re-entering the user's admin security password signature. Keys are only temporarily revealed for 15 seconds before being masked again.

## Decision 12: High-Density 12-Card KPI Layout Cockpits (Phase 5)
- **Reason**: Visual richness & immediate telemetry check. Instead of simple text boxes, both Admin and Analyst views render a 12-card dashboard panel summarizing CPU core load, RAM, Neon DB connection status, Redis queued tasks, SSL certificates, RLS block counts, and scrape velocity. This provides complete visibility on SaaS health at first glance.

## Decision 13: Volatile Active Sessions & connected apps listing (Phase 5)
- **Reason**: Enforce zero-trust admin environments. Listing connected integrations (Neon, Redis, Celery) and active logins (IP address, user agent details, session age) lets administrators identify rogue nodes or stale connections instantly.

## Decision 14: Multi-Step Wizards & Live Preview stream previews (Phase 5)
- **Reason**: High form validation safety. Splitting Scraper Configurations into 3 wizard steps (URL target, custom request headers with AI autocompletion chips, and simulated stream previews) prevents accidental submission of malformed inputs and provides analysts with real-time feedback on expected outputs before deploy triggers run.

## Decision 15: Serving Next.js Statically from FastAPI on a Single Uvicorn Port
- **Reason**: Streamlined local and production hosting topology. By using `output: "export"` in Next.js, we compile all React code to static HTML/JS/CSS assets in `frontend/out`. Mounting this directory directly in FastAPI using `StaticFiles` allows running both the frontend interface and the Python REST APIs from a single Uvicorn server on port `8000`. SPA routes are caught and redirected to `index.html` via a custom Starlette HTTP 404 exception handler.

## Decision 16: Coerced SQLite UUID Comparison for RLS Emulation
- **Reason**: Type and formatting compatibility. SQLite treats UUIDs as string columns, but inserts can store them with hyphens (e.g. from seed strings) or without hyphens (standard SQLAlchemy UUID compiler output). When intercepting ORM statements in `do_orm_execute` for RLS, comparing raw UUID columns to python `uuid.UUID` objects binds a 32-character unhyphenated hex string which fails to match 36-character hyphenated database entries. Casting the column to String and replacing hyphens on both sides (`func.replace(cast(cls.tenant_id, String), "-", "") == str(active_tenant).replace("-", "")`) guarantees format-insensitive matches under SQLite fallback.

## Decision 17: Pre-Rendered Server-Side Vector Graphics (SVG) for Zero-Leak Visual Dashboards
- **Reason**: Standard React dashboard widgets require sending raw numerical/array coordinates over the wire. Malicious browser inspect extensions or standard developer logs can scrape these values. Direct server-side rendering of static XML SVG strings ensures that only pre-calculated visual assets are transmitted, bypassing local client state entirely.

## Decision 18: Pure Python Vector-Graphic PDF Generation Engine
- **Reason**: To generate stylized, corporate-branded administrative reports as direct PDF binary attachments without risk of compiled C library dependency failures (e.g. ReportLab or Weasyprint compilation issues in restricted server environments), a pure-Python vector coordinate content stream builder is used. It guarantees zero-dependency runtime reliability.

## Decision 19: Precise Exemption Matching in Zero-Trust Shielding Middleware
- **Reason**: While all standard API REST endpoints on `/api/v1/*` must be strictly encrypted, binary file attachments (such as PDF downloads) must download as raw media streams. Refined path comparison boundaries are implemented in the ASGI encryption middleware to skip encryption on `/api/v1/export` while shielding all other critical API endpoints.

## Decision 20: Multi-Stage Non-Root Production Containerization
- **Reason**: To limit the surface footprint and lower container vulnerability vectors, a multi-stage Docker build is implemented. The Next.js static files are generated in an ephemeral Node builder stage, and then copied directly into a minimized Python slim environment running under an unprivileged, non-root user context.

## Decision 21: Private VPC Docker Subnet Separation
- **Reason**: Core stateful data components (PostgreSQL database, Redis cache) must be isolated from direct public routing. They are mounted on a completely internal, non-exposed bridge subnet (`internal: true`) with all host port mappings stripped out, forcing traffic to tunnel solely through the FastAPI gateway container.

## Decision 22: Compliance Log Synchronization Daemon with WORM Fallback
- **Reason**: Strict zero-trust audit compliance requires storing system logs immutably. A background service periodically pulls records from `system_audit_logs`, formats them as JSON, and pipes them to an AWS S3 bucket configured with Object Lock. If cloud access parameters are omitted, it stores them in a local read-only mock directory to emulate WORM attributes.

## Decision 23: Master Cryptographic Key Rotation Utility
- **Reason**: Rotating transient API session key seeds regularly prevents long-term compromise. A standalone script is provided to generate a secure random 256-bit key and write it to the environment config, updating transit-layer encryption keys dynamically without affecting at-rest data schemas.




