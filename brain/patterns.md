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
All server responses are encrypted via AES-256-GCM.
- Response Schema:
  ```json
  {
    "ciphertext": "base64-encoded-iv:base64-encoded-ciphertext:base64-encoded-tag"
  }
  ```
- React client decrypts the response payload in a central Context Provider before passing JSON objects down to child components.

## UI Key Interception Pattern
Preventing user inspector hooks:
```javascript
window.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))) {
    e.preventDefault();
  }
});
```
