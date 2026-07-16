"""
log_mirror.py — Secure Compliance Audit Log Mirroring Service
ReadyNest Analytics Engine — Phase 8
"""

import os
import json
import datetime
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models import SystemAuditLog

try:
    import boto3
except ImportError:
    boto3 = None

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".mirror_state")

def get_last_processed_id() -> int:
    """Reads the last successfully mirrored audit log ID."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return int(f.read().strip())
        except Exception:
            pass
    return 0

def save_last_processed_id(last_id: int):
    """Saves the last processed audit log ID state."""
    with open(STATE_FILE, "w") as f:
        f.write(str(last_id))

def mirror_logs(db: Session):
    """
    Scans new audit logs, packages them as JSON, and writes them to
    a WORM bucket (or local read-only mock directory) as immutable logs.
    """
    last_id = get_last_processed_id()
    
    # Establish database bypass to scan logs across all tenants for compliance archiving
    if "sqlite" in str(db.get_bind().url):
        db.info["bypass_rls"] = True
    else:
        db.execute(text("SET LOCAL app.bypass_rls = 'true'"))
        
    logs = db.query(SystemAuditLog).filter(SystemAuditLog.id > last_id).order_by(SystemAuditLog.id.asc()).all()
    
    if not logs:
        return
        
    log_data = []
    max_id = last_id
    for log in logs:
        log_data.append({
            "id": log.id,
            "tenant_id": str(log.tenant_id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action_performed": log.action_performed,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat()
        })
        max_id = max(max_id, log.id)
        
    # Compile text payload
    payload = json.dumps(log_data, indent=2)
    filename = f"audit_logs_{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    
    bucket_name = os.getenv("WORM_COLD_STORAGE_BUCKET")
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    if boto3 and bucket_name and aws_access_key and aws_secret_key:
        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key
            )
            s3.put_object(
                Bucket=bucket_name,
                Key=filename,
                Body=payload.encode("utf-8"),
                ContentType="application/json"
            )
            print(f"Mirrored {len(logs)} log records to S3 WORM bucket: {filename}")
            save_last_processed_id(max_id)
            return
        except Exception as e:
            print(f"S3 mirror upload failed: {e}. Executing fallback...")
            
    # Local WORM-equivalent fallback
    write_to_fallback_storage(filename, payload, len(logs), max_id)

def write_to_fallback_storage(filename: str, payload: str, record_count: int, max_id: int):
    """Writes logs to an immutable local directory folder mimicking S3 WORM properties."""
    fallback_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../cold_storage"))
    os.makedirs(fallback_dir, exist_ok=True)
    
    filepath = os.path.join(fallback_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(payload)
        
    # Restrict permissions to read-only (immutable flag emulation)
    try:
        os.chmod(filepath, 0o444)
    except Exception:
        pass
        
    print(f"Mirrored {record_count} log records to local mock WORM cold storage: {filepath}")
    save_last_processed_id(max_id)
