import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum, Text, JSON
)
from sqlalchemy.orm import relationship

from app.database.session import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    admin = "admin"
    analyst = "analyst"
    manager = "manager"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.analyst, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("PredictionRecord", back_populates="created_by")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=gen_uuid)
    customer_code = Column(String, unique=True, index=True, nullable=False)
    tenure = Column(Integer)
    monthly_charges = Column(Float)
    total_charges = Column(Float)
    num_support_calls = Column(Integer)
    contract = Column(String)
    internet_service = Column(String)
    tech_support = Column(String)
    online_security = Column(String)
    payment_method = Column(String)
    paperless_billing = Column(String)
    senior_citizen = Column(String)
    partner = Column(String)
    dependents = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("PredictionRecord", back_populates="customer")


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)

    prediction = Column(String)          # "Churn" / "Retained"
    probability = Column(Float)
    confidence = Column(Float)
    risk_level = Column(String)
    model_used = Column(String)
    top_features = Column(JSON)
    recommendations = Column(JSON)
    input_payload = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="predictions")
    created_by = relationship("User", back_populates="predictions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
