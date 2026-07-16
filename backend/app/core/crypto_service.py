"""
crypto_service.py — AES-256-GCM Cryptographic Service
ReadyNest Analytics Engine — Phase 3

Provides symmetric encrypt/decrypt operations for the Zero-Trust
network shielding pipeline. Every encryption pass generates a fresh
12-byte IV. The wire format is:

    hex(iv[12] + ciphertext_with_gcm_tag[N+16])

The caller wraps this hex string in: {"payload": "<hex>"}

Key derivation: loads AES_SECRET_KEY from settings and ensures exactly
32 bytes (pads with 0x00 or truncates). For production, inject a
high-entropy 256-bit key via environment variable.
"""

import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def _derive_key(secret: Optional[str] = None) -> bytes:
    """Derive a 32-byte AES key from the configured secret string."""
    raw = (secret or settings.AES_SECRET_KEY).encode("utf-8")
    if len(raw) < 32:
        raw = raw.ljust(32, b"\x00")
    elif len(raw) > 32:
        raw = raw[:32]
    return raw


def encrypt(plaintext: str, secret: Optional[str] = None) -> str:
    """
    Encrypt a UTF-8 plaintext string with AES-256-GCM.

    Returns a lowercase hex string encoding:
        iv (12 bytes) + ciphertext+tag (len(plaintext)+16 bytes)

    This hex blob is safe to embed directly into JSON as {"payload": "<hex>"}.
    """
    key = _derive_key(secret)
    iv = os.urandom(12)                          # 96-bit nonce — NIST recommended for GCM
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    return (iv + ct_with_tag).hex()


def decrypt(hex_payload: str, secret: Optional[str] = None) -> str:
    """
    Decrypt a hex-encoded AES-256-GCM payload produced by encrypt().

    Raises ValueError on authentication tag mismatch (tampered data).
    """
    try:
        raw = bytes.fromhex(hex_payload)
    except ValueError as exc:
        raise ValueError("crypto_service.decrypt: invalid hex payload") from exc

    iv = raw[:12]
    ct_with_tag = raw[12:]

    key = _derive_key(secret)
    aesgcm = AESGCM(key)
    try:
        plaintext_bytes = aesgcm.decrypt(iv, ct_with_tag, None)
    except Exception as exc:
        raise ValueError("crypto_service.decrypt: GCM authentication failed — payload may be tampered") from exc

    return plaintext_bytes.decode("utf-8")
