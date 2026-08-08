from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import Customer, PredictionRecord, User, AuditLog
from app.schemas.schemas import CustomerInput, PredictionOut, PredictionHistoryOut
from app.auth.security import get_current_user
from app.ml.predict import predict_one

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post("/predict", response_model=PredictionOut)
def predict(
    payload: CustomerInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = predict_one(payload.model_dump(exclude={"customer_code"}))
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Call POST /api/train first.",
        )

    # Upsert customer record
    customer = None
    if payload.customer_code:
        customer = db.query(Customer).filter(Customer.customer_code == payload.customer_code).first()
        if not customer:
            customer = Customer(customer_code=payload.customer_code, **payload.model_dump(exclude={"customer_code"}))
            db.add(customer)
            db.commit()
            db.refresh(customer)

    record = PredictionRecord(
        customer_id=customer.id if customer else None,
        created_by_id=current_user.id,
        prediction=result["prediction"],
        probability=result["probability"],
        confidence=result["confidence"],
        risk_level=result["risk_level"],
        model_used=result["model_used"],
        top_features=result["top_features"],
        recommendations=result["recommendations"],
        input_payload=payload.model_dump(),
    )
    db.add(record)
    db.add(AuditLog(user_id=current_user.id, action="predict", details=f"risk={result['risk_level']}"))
    db.commit()

    return PredictionOut(**result)


@router.get("/predictions/history", response_model=list[PredictionHistoryOut])
def prediction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(PredictionRecord)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
        .all()
    )
    out = []
    for r in records:
        out.append(PredictionHistoryOut(
            id=r.id,
            customer_code=r.customer.customer_code if r.customer else None,
            prediction=r.prediction,
            will_churn=r.prediction == "Churn",
            probability=r.probability,
            confidence=r.confidence,
            risk_level=r.risk_level,
            top_features=r.top_features,
            recommendations=r.recommendations,
            model_used=r.model_used,
            created_at=r.created_at,
        ))
    return out
