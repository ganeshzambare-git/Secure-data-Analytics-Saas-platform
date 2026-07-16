"""
auth_utils.py — Authentication & JWT Utility Module
ReadyNest Analytics Engine — Phase 3

Centralises all authentication-related helpers:
  - Password hashing / verification (PBKDF2-SHA256, delegated to security.py)
  - JWT access token issuance (15-minute lifetime)
  - JWT verification / claims extraction

JWT claims block:
    {
      "sub":       "usr_uuid_string",
      "tenant_id": "tenant_uuid_string",
      "role":      "admin|analyst",
      "exp":       <unix_timestamp>
    }
"""

import datetime
from typing import Optional

import jwt

from app.core.config import settings
# Re-export password helpers from security.py — no duplication of logic
from app.core.security import hash_password, verify_password  # noqa: F401

# ------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15          # Phase 3 spec: short-lived tokens


# ------------------------------------------------------------------
# JWT Helpers
# ------------------------------------------------------------------

def create_access_token(
    sub: str,
    tenant_id: str,
    role: str,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """
    Issue a signed JWT access token.

    Args:
        sub:          User UUID string (maps to users.id).
        tenant_id:    Tenant UUID string (maps to tenants.id).
        role:         RBAC role — 'admin' or 'analyst'.
        expires_delta: Override default 15-minute expiry.

    Returns:
        Compact serialised JWT string.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    delta = expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = now + delta

    claims = {
        "sub":       sub,
        "tenant_id": tenant_id,
        "role":      role,
        "exp":       expire,
    }

    return jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.

    Returns the claims dict on success, or None if the token is
    expired, malformed, or carries an invalid signature.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.PyJWTError:
        return None
