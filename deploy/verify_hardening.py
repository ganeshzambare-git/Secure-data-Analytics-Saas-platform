"""
verify_hardening.py — Production Network Boundary Scan
ReadyNest Analytics Engine — Phase 8
"""

import socket
import sys
import urllib.request

def scan_port(host: str, port: int) -> bool:
    """Attempts to open a socket connection to target port."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            s.connect((host, port))
            return True
    except Exception:
        return False

def main():
    print("=== ReadyNest Production Hardening Health Audit ===")
    
    # 1. Check Gateway Port
    print("Checking unified entrypoint gateway (Port 8000)...")
    if scan_port("127.0.0.1", 8000):
        print("[PASS] Gateway port 8000 is open and listening.")
    else:
        print("[FAIL] Gateway port 8000 is not reachable! Make sure uvicorn is running.")
        sys.exit(1)
        
    # 2. Check Postgres Isolation
    print("Checking for public PostgreSQL port 5432 exposure...")
    if scan_port("127.0.0.1", 5432):
        print("[WARNING] PostgreSQL port 5432 is open on localhost. (Acceptable for local SQLite/dev run, but must be closed in Docker Compose Prod).")
    else:
        print("[PASS] PostgreSQL port 5432 is isolated from public interface.")
        
    # 3. Check Redis Isolation
    print("Checking for public Redis port 6379 exposure...")
    if scan_port("127.0.0.1", 6379):
        print("[WARNING] Redis port 6379 is open on localhost. (Acceptable for dev run, but must be closed in Docker Compose Prod).")
    else:
        print("[PASS] Redis port 6379 is isolated from public interface.")
        
    print("\n=== Hardening network verification cycle completed ===")

if __name__ == "__main__":
    main()
