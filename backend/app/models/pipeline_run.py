from sqlalchemy import Column, String, DateTime, ForeignKey, LargeBinary, JSON
import datetime
from app.models.base import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    triggered_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_url = Column(String, nullable=False)
    status = Column(String(50), nullable=False)
    encrypted_dataset_payload = Column(LargeBinary, nullable=True)
    metrics = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
