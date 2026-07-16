"""
middleware.py — Zero-Trust Network Shielding Middleware
ReadyNest Analytics Engine — Phase 3

Implements SecureNetworkShieldMiddleware, a Starlette BaseHTTPMiddleware
subclass that intercepts all outgoing /api/v1/* responses and re-encrypts
the JSON body with AES-256-GCM before it leaves the server.

Wire format sent to clients:
    {"payload": "<hex(iv + ciphertext + gcm_tag)>"}

This renders the Network tab in browser DevTools unreadable, enforcing
Zero-Trust transport opaqueness.

Excluded paths:
    - OPTIONS pre-flight requests (CORS)
    - Non /api/v1/ paths (e.g. OpenAPI docs, root health check)
"""

import json

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.crypto_service import encrypt


class SecureNetworkShieldMiddleware(BaseHTTPMiddleware):
    """
    Intercepts FastAPI responses on /api/v1/* routes and replaces the
    response body with an AES-256-GCM encrypted hex payload.
    """

    # Paths exempt from encryption (must remain readable by browser/proxy)
    _EXEMPT_PREFIXES = (
        "/docs",
        "/redoc",
        "/openapi.json",
        "/",
        "/api/v1/export",
    )

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Only shield /api/v1/ endpoints on non-preflight requests
        path = request.url.path
        is_api = path.startswith("/api/v1")
        is_options = request.method == "OPTIONS"
        is_exempt = any(
            path == prefix or path.startswith(prefix + "/")
            for prefix in self._EXEMPT_PREFIXES
            if prefix != "/"
        ) or path == "/"

        if not is_api or is_options or is_exempt:
            return response

        # Accumulate the response body stream
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        try:
            plain_text = body.decode("utf-8")

            # Encrypt with fresh IV on every response
            hex_payload = encrypt(plain_text)

            # Build shielded envelope — {"payload": "<hex>"}
            shielded = json.dumps({"payload": hex_payload})
            shielded_bytes = shielded.encode("utf-8")

            headers = dict(response.headers)
            headers["content-length"] = str(len(shielded_bytes))
            headers["content-type"] = "application/json; charset=utf-8"

            return Response(
                content=shielded_bytes,
                status_code=response.status_code,
                headers=headers,
                media_type="application/json",
            )

        except Exception as exc:  # pragma: no cover
            # Never expose raw error detail — return a shielded error envelope
            err = json.dumps({"detail": f"Shield encryption failure: {type(exc).__name__}"})
            return Response(
                content=err,
                status_code=500,
                media_type="application/json",
            )
