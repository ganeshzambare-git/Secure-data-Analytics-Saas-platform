# Implementation Patterns - ReadyNest Analytics Engine

## Multi-Tenant RLS Pattern
Always execute SQL queries in a transaction block where you set the tenant scope:
```sql
BEGIN;
SET LOCAL app.current_tenant_id = 'tenant-uuid';
-- Perform operations
SELECT * FROM users;
COMMIT;
```
In Python SQLAlchemy, this is accomplished via a custom database session wrapper or listener that sets the local session configuration before running commands.

## Cryptographic Payload Encryption Pattern
All server responses on `/api/v1/*` are encrypted via AES-256-GCM in `middleware.py`.
- Wire format:
  ```json
  {
    "payload": "<hex(iv[12] + ciphertext + gcm_tag[16])>"
  }
  ```
- Backend: `crypto_service.encrypt(plaintext)` → hex string. `crypto_service.decrypt(hex)` → plaintext.
- Frontend: `DecryptionContext.decryptPayload(hex)` → parses hex to Uint8Array, splits IV (12 bytes) + ciphertext, decrypts with `window.crypto.subtle.decrypt(AES-GCM)`, returns parsed JSON in volatile memory.

## UI Key Interception Pattern
preventing user inspector hooks:
```javascript
window.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))) {
    e.preventDefault();
  }
});
```

## SQLAlchemy 2.0 Async Session Helper Pattern
Enforce transaction-isolated context management for FastAPI endpoints using async engines:
```python
async def get_tenant_db_session(tenant_id: uuid.UUID) -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await session.execute(
                text("SET LOCAL app.current_tenant_id = :tenant_id;"),
                {"tenant_id": str(tenant_id)}
            )
        try:
            yield session
        finally:
            await session.close()
```

## Responsive Degradation Split/Drawer Pattern
Keep focus on dynamic outputs and charts on tablet/mobile:
- **CSS:** Use `@media (max-width: 1200px)` to hide `.split-left-col` (settings panel) and expand `.split-right-col` to `100%`. Show a `.tablet-only-btn` that triggers `.drawer-content.active` (translating `left: -100%` to `left: 0`).
- **Mobile CSS:** Use `@media (max-width: 768px)` to stack the flex container vertically, stack tables dynamically using `data-label` attribute prefix tags, and set `.terminal-panel` padding/width adjustments.

## Zero-Trust Parameter Masking Challenge
Ensure sensitive proxy or config parameters are never exposed without explicit authentication validation:
1. Wrap the reveal click handler in a state hook setting `showChallenge(true)`.
2. Present a modal screen backdrop requesting the administrator signature password.
3. Compare input string (e.g. `password123`) to session validation parameters.
4. On success, show actual key values for exactly 15 seconds using a `setTimeout` window callback, then automatically restore mask strings `••••••••`.

## High-Density Telemetry KPI Grid Pattern
To display multiple health vectors without page clutter, implement a responsive dashboard grid:
- **CSS:** `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;`
- Each card contains a label header, a large bold metric reading, and a small inline icon indicating the telemetry resource.

## Multi-Step Form Wizard & Preview Pattern
Break complex configuration nodes into step-wise processes:
1. Render step selector navigation controls above input fields.
2. Bind conditional rendering to a state index hook `formStep`.
3. Provide auto-completing suggestions to speed configuration inputs.
4. Display a live JSON output block using target inputs to preview the payload dynamically.

## Single-Port SPA Serving and Fallback Routing Pattern
Host static-exported React SPAs alongside API routers on a single Uvicorn server:
1. Enable `output: "export"` in the frontend bundler (Next.js/Vite).
2. In FastAPI `main.py`, import `StaticFiles` and mount the output folder at the root path `"/"` after all REST route registrations:
   `app.mount("/", StaticFiles(directory="frontend/out", html=True), name="frontend")`
3. Add a Starlette HTTP 404 Exception Handler. If the path does not start with `/api`, serve `index.html` as a fallback response, allowing the React Router to handle page navigation matches.
4. Configure an ASGI HTTP Middleware to add all required security frames (CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`) to all payloads.

## Hyphen-Insensitive SQLite UUID Comparison Pattern
Resolve SQLite GUID mismatch when querying UUID column definitions:
1. When checking or filtering columns mapping to `UUID(as_uuid=True)` in SQLite fallback, coerce python search identifiers to UUID objects (`uuid.UUID`).
2. During SQLAlchemy ORM statement interception (e.g. SQLite RLS `do_orm_execute`), avoid direct parameter comparisons which bind unhyphenated values.
3. Instead, cast the database column to String using `cast(column, String)` and strip all hyphens using `func.replace(..., "-", "")`.
4. Perform the same cleaning on the python search parameter: `str(param).replace("-", "")`.
5. The resulting expression works regardless of column layout schemas:
    `func.replace(cast(column, String), "-", "") == str(param).replace("-", "")`

## Local Workspace Tab Switching Pattern
To unify multiple dashboard screens (e.g. Scraper Terminal, ML Workshop, Visual Insights Board) within a single Analyst Workspace page:
1. Declare a state hook `activeWorkspaceTab` to track the visible view.
2. Render a high-density, horizontal tab navigation bar above the cards layout using curated role-button styles.
3. Conditionally render the workspace sections using short-circuit operators: `{activeWorkspaceTab === "workspace" && ...}`.
4. Manage clean transitions, fullscreen toggle states, and tab-specific telemetry KPI arrays dynamically.
