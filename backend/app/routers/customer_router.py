from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import Customer, User
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("")
def list_customers(
    search: Optional[str] = Query(None, description="Search by customer code"),
    contract: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Customer)
    if search:
        q = q.filter(Customer.customer_code.ilike(f"%{search}%"))
    if contract:
        q = q.filter(Customer.contract == contract)

    total = q.count()
    items = (
        q.order_by(Customer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": c.id,
                "customer_code": c.customer_code,
                "tenure": c.tenure,
                "monthly_charges": c.monthly_charges,
                "total_charges": c.total_charges,
                "contract": c.contract,
                "internet_service": c.internet_service,
                "num_support_calls": c.num_support_calls,
            }
            for c in items
        ],
    }


@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": c.id,
        "customer_code": c.customer_code,
        "tenure": c.tenure,
        "monthly_charges": c.monthly_charges,
        "total_charges": c.total_charges,
        "num_support_calls": c.num_support_calls,
        "contract": c.contract,
        "internet_service": c.internet_service,
        "tech_support": c.tech_support,
        "online_security": c.online_security,
        "payment_method": c.payment_method,
        "paperless_billing": c.paperless_billing,
        "senior_citizen": c.senior_citizen,
        "partner": c.partner,
        "dependents": c.dependents,
        "predictions": [
            {
                "id": p.id,
                "prediction": p.prediction,
                "probability": p.probability,
                "risk_level": p.risk_level,
                "created_at": p.created_at.isoformat(),
            }
            for p in c.predictions
        ],
    }
