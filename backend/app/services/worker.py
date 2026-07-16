import time
import json
import uuid
from sqlalchemy.orm import Session

from app.core.db import SessionLocal, set_tenant_context
from app.models import PipelineRun, Tenant, User, SystemAuditLog
from app.services.celery_app import celery_app
from app.core.security import encrypt_payload, decrypt_payload

from app.services.scraper import scrape_url
from app.services.etl import run_etl
from app.services.ml_workshop import train_model

@celery_app.task(name="app.services.worker.execute_scraping_and_etl")
def execute_scraping_and_etl(tenant_id: str, triggered_by_id: str, target_url: str) -> str:
    """
    Asynchronous task that orchestrates:
    1. Creating a PipelineRun record (status: Scraping).
    2. Calling modular scrape_url.
    3. Storing raw encrypted payload.
    4. Running the ETL formatting and row engineering.
    """
    db = SessionLocal()
    run = None
    try:
        set_tenant_context(db, tenant_id)
        
        # 1. Create run record initial state
        run = PipelineRun(
            tenant_id=uuid.UUID(tenant_id),
            triggered_by=uuid.UUID(triggered_by_id),
            target_url=target_url,
            status="Scraping",
            metrics={"status": "Scraping page elements"}
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        
        # 2. Call scraper
        try:
            scraped_result = scrape_url(target_url)
            raw_data = scraped_result["scraped_data"]
        except PermissionError as p_err:
            # 403 Forbidden check
            run.status = "failed"
            run.metrics = {
                "error": "Critical Handshake Interruption: Code 403 (Forbidden)",
                "status": "Pipeline failed"
            }
            db.add(run)
            db.commit()
            raise p_err
        except Exception as scrap_err:
            print(f"Scraper error: {scrap_err}. Proceeding with empty list for synthetic fallback.")
            raw_data = []
            
        # Encrypt raw data and save raw state
        raw_json_str = json.dumps(raw_data)
        encrypted_raw_bytes = encrypt_payload(raw_json_str).encode('utf-8')
        run.encrypted_dataset_payload = encrypted_raw_bytes
        run.status = "Scraped"
        db.add(run)
        db.commit()
        
        # 3. Call ETL data engineering pipeline
        metrics = run_etl(db, run.id)
        
        # Log Audit Record
        audit = SystemAuditLog(
            tenant_id=uuid.UUID(tenant_id),
            user_id=uuid.UUID(triggered_by_id),
            action_performed=f"Scraped and ETL cleaned: {target_url}",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        
        return str(run.id)
        
    except Exception as e:
        db.rollback()
        if run and run.status != "failed":
            run.status = "failed"
            run.metrics = {"error": str(e), "status": "Pipeline failed"}
            db.add(run)
            db.commit()
        print(f"Error in execute_scraping_and_etl pipeline: {e}")
        raise e
    finally:
        db.close()

@celery_app.task(name="app.services.worker.train_ml_model")
def train_ml_model(
    tenant_id: str, 
    triggered_by_id: str, 
    run_id: str, 
    model_type: str, 
    split_ratio: float,
    feature_columns: list = None,
    test_size: float = None
) -> dict:
    """
    Asynchronous task wrapping ML Workshop modeling controller.
    """
    db = SessionLocal()
    try:
        set_tenant_context(db, tenant_id)
        
        # Default parameter fallbacks
        if not feature_columns:
            feature_columns = ["title_length", "has_number", "link_depth", "is_external"]
            
        if test_size is None:
            test_size = float(1.0 - split_ratio)
            
        metrics_update = train_model(
            db=db,
            tenant_id=tenant_id,
            user_id=triggered_by_id,
            run_id=run_id,
            model_type=model_type,
            feature_columns=feature_columns,
            test_size=test_size
        )
        return metrics_update
        
    except Exception as e:
        db.rollback()
        print(f"Error in train_ml_model worker: {e}")
        raise e
    finally:
        db.close()
