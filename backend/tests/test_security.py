import pytest
import datetime
from app.security import (
    hash_password,
    verify_password,
    encrypt_payload,
    decrypt_payload,
    create_access_token,
    verify_token
)
from app.config import settings

def test_password_hashing():
    password = "SuperSecurePassword123!"
    hashed = hash_password(password)
    
    # Verify hash has correct structure
    assert hashed.startswith("pbkdf2_sha256$")
    
    # Verify validation works
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_aes_gcm_cryptography_roundtrip():
    secret_key = "test_secret_key_must_be_32_bytes"
    plaintext = '{"sensitive_data": "highly_confidential_metrics", "tenant_id": 12}'
    
    ciphertext = encrypt_payload(plaintext, secret_key)
    assert ciphertext != plaintext
    
    decrypted = decrypt_payload(ciphertext, secret_key)
    assert decrypted == plaintext

def test_aes_gcm_incorrect_key_fails():
    secret_key_a = "y3K9xP2wL4mN7qR1sT8uV5wX0zA3bC6d"
    secret_key_b = "wrong_secret_key_32_bytes_long_X"
    plaintext = "critical_tenant_data"
    
    ciphertext = encrypt_payload(plaintext, secret_key_a)
    
    with pytest.raises(Exception):
        decrypt_payload(ciphertext, secret_key_b)

def test_jwt_issuance_and_verification():
    data = {"sub": "user_123", "tenant_id": "tenant_uuid_abc", "role": "analyst"}
    token = create_access_token(data, expires_delta=datetime.timedelta(minutes=5))
    
    decoded = verify_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_123"
    assert decoded["tenant_id"] == "tenant_uuid_abc"
    assert decoded["role"] == "analyst"

def test_jwt_invalid_token_fails():
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    decoded = verify_token(invalid_token)
    assert decoded is None
