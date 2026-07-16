"""
main.py — FastAPI Application Entry Point
ReadyNest Analytics Engine
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import auth, pipeline, dashboard, export
from app.core.db import seed_database
from app.core.middleware import SecureNetworkShieldMiddleware

# Resolve absolute path to statically exported frontend directory
frontend_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/out")
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup hook
    seed_database()
    yield

app = FastAPI(
    title="ReadyNest Analytics Engine",
    description="Multi-tenant secure ETL and ML execution pipeline backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Security Headers Middleware ──────────────────────────────────────
# Replaces headers previously set in next.config.mjs to cover all static asset views
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:* ws://127.0.0.1:*;"
    )
    return response

# ── CORS ────────────────────────────────────────────────────────────
# In production, restrict allow_origins to the exact client origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Zero-Trust AES-256-GCM Response Shield ──────────────────────────
# Must be registered AFTER CORSMiddleware so CORS headers are present
# on encrypted responses.
app.add_middleware(SecureNetworkShieldMiddleware)

# ── API Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(pipeline.router)
app.include_router(dashboard.router)
app.include_router(export.router)


# ── SPA Fallback Handler ─────────────────────────────────────────────
# Serving SPA router fallbacks for direct navigations or page reloads
@app.exception_handler(StarletteHTTPException)
async def spa_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and not request.url.path.startswith("/api"):
        index_path = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


# Lifespan managed startup hooks replace deprecated on_event triggers


# ── Mount Frontend Static Assets ─────────────────────────────────────
# Mounted at root "/" to serve the compiled HTML, JS, and CSS files.
# Must be mounted AFTER all routers and exception handlers.
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    # Fallback endpoint if static assets are not compiled
    @app.get("/")
    def read_root():
        return {
            "app": "ReadyNest Analytics Engine",
            "secure": True,
            "warning": "Frontend static assets not found. Run 'npm run build' inside /frontend.",
        }
