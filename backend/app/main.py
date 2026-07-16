import json
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.routes import auth, pipeline, dashboard
from app.db import seed_database
from app.security import encrypt_payload

app = FastAPI(
    title="ReadyNest Analytics Engine",
    description="Multi-tenant secure ETL and ML execution pipeline backend",
    version="1.0.0"
)

# Configure CORS for Next.js UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the exact client origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Zero-Trust response encryption middleware
class SecureNetworkShieldMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Proceed with request pipeline
        response = await call_next(request)
        
        # Intercept and encrypt all API responses under /api/v1/ (excluding pre-flights)
        if request.url.path.startswith("/api/v1") and request.method != "OPTIONS":
            # Extract content from response body iterator
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            try:
                # Decrypt raw text representation of payload
                plain_text = body.decode("utf-8")
                
                # Encrypt response payload via AES-256-GCM
                ciphertext = encrypt_payload(plain_text)
                
                # Wrap inside standard shielded client-compatible schema
                shielded_json = json.dumps({"ciphertext": ciphertext})
                
                # Update response parameters
                headers = dict(response.headers)
                headers["content-length"] = str(len(shielded_json))
                headers["content-type"] = "application/json"
                
                return Response(
                    content=shielded_json,
                    status_code=response.status_code,
                    headers=headers,
                    media_type="application/json"
                )
            except Exception as e:
                # Shield error outputs from raw exposure
                err_payload = json.dumps({"detail": f"Shield Encryption Failure: {str(e)}"})
                return Response(
                    content=err_payload,
                    status_code=500,
                    media_type="application/json"
                )
                
        return response

app.add_middleware(SecureNetworkShieldMiddleware)

# Include Routers
app.include_router(auth.router)
app.include_router(pipeline.router)
app.include_router(dashboard.router)

# Database seeder execution on startup hook
@app.on_event("startup")
def startup_event():
    seed_database()

@app.get("/")
def read_root():
    return {"app": "ReadyNest Analytics Engine", "secure": True}
