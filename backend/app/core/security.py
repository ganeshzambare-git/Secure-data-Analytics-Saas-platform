import os
import base64
import datetime
from typing import Optional
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

# --- Password Hashing Logic ---
# To keep implementation dependency overhead low and performant, 
# we utilize standard hashlib with pbkdf2_sha256.
import hashlib

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    salt_hex = salt.hex()
    rounds = 100000
    pwd_bytes = password.encode('utf-8')
    hash_bytes = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt, rounds)
    return f"pbkdf2_sha256${rounds}${salt_hex}${hash_bytes.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        rounds = int(parts[1])
        salt_hex = parts[2]
        stored_hash = parts[3]
        pwd_bytes = password.encode('utf-8')
        test_hash = hashlib.pbkdf2_hmac('sha256', pwd_bytes, bytes.fromhex(salt_hex), rounds)
        return test_hash.hex() == stored_hash
    except Exception:
        return False

# --- AES-256-GCM Encryption / Decryption ---

def encrypt_payload(plaintext: str, secret_key: str = settings.AES_SECRET_KEY) -> str:
    key_bytes = secret_key.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b'\0')
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
        
    aesgcm = AESGCM(key_bytes)
    nonce = os.urandom(12)
    plaintext_bytes = plaintext.encode('utf-8')
    ciphertext = aesgcm.encrypt(nonce, plaintext_bytes, None)
    
    # Concatenate nonce + ciphertext
    encrypted_packet = nonce + ciphertext
    return base64.b64encode(encrypted_packet).decode('utf-8')

def decrypt_payload(ciphertext_b64: str, secret_key: str = settings.AES_SECRET_KEY) -> str:
    key_bytes = secret_key.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b'\0')
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
        
    encrypted_packet = base64.b64decode(ciphertext_b64)
    nonce = encrypted_packet[:12]
    ciphertext = encrypted_packet[12:]
    
    aesgcm = AESGCM(key_bytes)
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode('utf-8')

# --- JWT Signing Utility ---

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        print(f"JWT Verification Failed: {e}")
        return None
