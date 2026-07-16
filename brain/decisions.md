# Engineering Decisions - ReadyNest Analytics Engine

## Decision 1: Shared-Database, Shared-Schema with Row-Level Security
- **Reason**: Simplifies migrations, schema syncing, and infrastructure costs, while guaranteeing tenant boundary checks natively at the PostgreSQL core engine layer.
- **Alternatives**: Separate Database per Tenant (too complex/costly for initial SaaS scale).

## Decision 2: AES-256-GCM response encryption
- **Reason**: Traditional HTTPS hides transit data but allows developers to inspect APIs in client browsers. AES-256-GCM decryption in-memory ensures that raw credentials or datasets are invisible to the developer console's network tab.

## Decision 3: Pre-Rendered SVGs on Backend
- **Reason**: Rendering Plotly charts to SVGs on the backend prevents transferring clean raw datasets to the browser, protecting client intellectual property.
