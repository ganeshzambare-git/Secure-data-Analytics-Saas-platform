from sqlalchemy import Column, String, DateTime, ForeignKey
import datetime
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # 'admin', 'analyst'
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
