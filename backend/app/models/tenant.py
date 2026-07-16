from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.models.base import Base

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String(36), primary_key=True)
    company_name = Column(String(255), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
