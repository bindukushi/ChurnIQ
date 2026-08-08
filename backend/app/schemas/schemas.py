from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["admin", "analyst", "manager"] = "analyst"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# ---------- Customer / Prediction ----------
class CustomerInput(BaseModel):
    customer_code: Optional[str] = None
    tenure: int = Field(ge=0, le=100)
    monthly_charges: float = Field(ge=0)
    total_charges: float = Field(ge=0)
    num_support_calls: int = Field(ge=0, le=50)
    contract: Literal["Month-to-month", "One year", "Two year"]
    internet_service: Literal["DSL", "Fiber optic", "No"]
    tech_support: Literal["Yes", "No"]
    online_security: Literal["Yes", "No"]
    payment_method: Literal["Electronic check", "Mailed check", "Bank transfer", "Credit card"]
    paperless_billing: Literal["Yes", "No"]
    senior_citizen: Literal["0", "1"]
    partner: Literal["Yes", "No"]
    dependents: Literal["Yes", "No"]


class FeatureImpact(BaseModel):
    feature: str
    impact: float


class PredictionOut(BaseModel):
    prediction: str
    will_churn: bool
    probability: float
    confidence: float
    risk_level: str
    top_features: list[FeatureImpact]
    recommendations: list[str]
    model_used: str


class PredictionHistoryOut(PredictionOut):
    id: str
    customer_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Dashboard ----------
class DashboardKPIs(BaseModel):
    total_customers: int
    total_churn: int
    retention_rate: float
    monthly_revenue: float
    average_tenure: float
    average_charges: float
    prediction_accuracy: float


# ---------- Chat ----------
class ChatRequest(BaseModel):
    message: str
    prediction_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
