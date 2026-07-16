"""
key_rotation.py — Master Cryptographic Key Seed Rotation
ReadyNest Analytics Engine — Phase 9
"""

import os
import secrets
import string
from app.core.config import settings

ENV_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../.env")
BACKEND_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env")

def generate_secure_key(length: int = 32) -> str:
    """Generates a cryptographically secure random alphanumeric string key."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def rotate_key():
    print("=== ReadyNest Master Key Seed Rotation Engine ===")
    
    new_key = generate_secure_key(32)
    print("New 256-bit Cryptographic Key Seed generated successfully.")
    
    # Target files to update: both workspace root .env and backend .env
    targets = [ENV_FILE_PATH, BACKEND_ENV_PATH]
    
    updated = False
    for path in targets:
        dir_name = os.path.dirname(os.path.abspath(path))
        os.makedirs(dir_name, exist_ok=True)
        
        lines = []
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
        # Look for existing AES_SECRET_KEY and replace it
        replaced = False
        new_lines = []
        for line in lines:
            if line.strip().startswith("AES_SECRET_KEY="):
                new_lines.append(f"AES_SECRET_KEY={new_key}\n")
                replaced = True
            else:
                new_lines.append(line)
                
        if not replaced:
            new_lines.append(f"AES_SECRET_KEY={new_key}\n")
            
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
            
        print(f"Updated configuration key at: {path}")
        updated = True
        
    # Dynamically update the configuration setting in memory
    settings.AES_SECRET_KEY = new_key
    print(f"In-memory settings configuration key loaded successfully.")
    print("=== Master Cryptographic Key Rotation Completed (100% SUCCESS) ===")

if __name__ == "__main__":
    rotate_key()
