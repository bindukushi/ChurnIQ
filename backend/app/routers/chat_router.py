from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import PredictionRecord, User
from app.schemas.schemas import ChatRequest, ChatResponse
from app.auth.security import get_current_user
from app.services.chat_service import answer_question

router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = None
    if payload.prediction_id:
        record = db.query(PredictionRecord).filter(PredictionRecord.id == payload.prediction_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Prediction not found")
        ctx = {
            "prediction": record.prediction,
            "probability": record.probability,
            "confidence": record.confidence,
            "risk_level": record.risk_level,
            "model_used": record.model_used,
            "top_features": record.top_features,
            "recommendations": record.recommendations,
        }
    else:
        # fall back to the user's most recent prediction
        record = (
            db.query(PredictionRecord)
            .filter(PredictionRecord.created_by_id == current_user.id)
            .order_by(PredictionRecord.created_at.desc())
            .first()
        )
        if record:
            ctx = {
                "prediction": record.prediction,
                "probability": record.probability,
                "confidence": record.confidence,
                "risk_level": record.risk_level,
                "model_used": record.model_used,
                "top_features": record.top_features,
                "recommendations": record.recommendations,
            }

    reply = answer_question(payload.message, ctx)
    return ChatResponse(reply=reply)
