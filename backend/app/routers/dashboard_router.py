from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import Customer, PredictionRecord, User
from app.schemas.schemas import DashboardKPIs
from app.auth.security import get_current_user
from app.ml.predict import load_leaderboard

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
def kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_churn = (
        db.query(func.count(PredictionRecord.id))
        .filter(PredictionRecord.prediction == "Churn")
        .scalar() or 0
    )
    avg_tenure = db.query(func.avg(Customer.tenure)).scalar() or 0.0
    avg_charges = db.query(func.avg(Customer.monthly_charges)).scalar() or 0.0
    monthly_revenue = db.query(func.sum(Customer.monthly_charges)).scalar() or 0.0

    retention_rate = 100.0
    if total_customers:
        retention_rate = round(100 * (1 - total_churn / max(total_customers, 1)), 2)

    lb = load_leaderboard()
    best = next(
        (m for m in lb.get("leaderboard", []) if m["model_name"] == lb.get("best_model")),
        None,
    )
    prediction_accuracy = best["accuracy"] * 100 if best else 0.0

    return DashboardKPIs(
        total_customers=total_customers,
        total_churn=total_churn,
        retention_rate=retention_rate,
        monthly_revenue=round(float(monthly_revenue), 2),
        average_tenure=round(float(avg_tenure), 1),
        average_charges=round(float(avg_charges), 2),
        prediction_accuracy=round(prediction_accuracy, 2),
    )


@router.get("/risk-distribution")
def risk_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(PredictionRecord.risk_level, func.count(PredictionRecord.id))
        .group_by(PredictionRecord.risk_level)
        .all()
    )
    return {level: count for level, count in rows}


@router.get("/churn-by-contract")
def churn_by_contract(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(
            Customer.contract,
            func.count(PredictionRecord.id).label("total"),
            func.sum(case((PredictionRecord.prediction == "Churn", 1), else_=0)).label("churned"),
        )
        .join(PredictionRecord, PredictionRecord.customer_id == Customer.id)
        .group_by(Customer.contract)
        .all()
    )
    return [
        {"contract": r[0], "total": r[1], "churned": r[2] or 0}
        for r in rows
    ]
