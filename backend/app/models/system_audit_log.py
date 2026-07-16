from sqlalchemy import Column, String, DateTime, ForeignKey
import datetime
from app.models.base import Base

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"
    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_performed = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
