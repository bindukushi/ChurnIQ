from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database.session import get_db
from app.database.models import PredictionRecord, User
from app.auth.security import get_current_user
from app.services.report_service import build_csv, build_excel, build_pdf_report
from app.routers.dashboard_router import kpis as get_kpis

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _prediction_records_as_dicts(db: Session, limit: int = 500) -> list[dict]:
    records = (
        db.query(PredictionRecord)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "customer_code": r.customer.customer_code if r.customer else "-",
            "prediction": r.prediction,
            "probability": r.probability,
            "confidence": r.confidence,
            "risk_level": r.risk_level,
            "model_used": r.model_used,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for r in records
    ]


def _stream(content: bytes, media_type: str, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/predictions/csv")
def predictions_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = _prediction_records_as_dicts(db)
    return _stream(build_csv(data), "text/csv", "prediction_report.csv")


@router.get("/predictions/excel")
def predictions_excel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = _prediction_records_as_dicts(db)
    return _stream(
        build_excel(data, sheet_name="Predictions"),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "prediction_report.xlsx",
    )


@router.get("/predictions/pdf")
def predictions_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = _prediction_records_as_dicts(db)
    kpi_obj = get_kpis(db=db, current_user=current_user)
    pdf_bytes = build_pdf_report("Churn Prediction Report", kpi_obj.model_dump(), data)
    return _stream(pdf_bytes, "application/pdf", "prediction_report.pdf")
