from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import Base, engine, SessionLocal
from app.database.models import User, RoleEnum
from app.auth.security import hash_password

from app.routers import (
    auth_router, prediction_router, train_router,
    dashboard_router, customer_router, report_router, chat_router, audit_router,
)


def seed_admin():
    """Create a default admin account on first boot so the platform is usable immediately."""
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@churnai.com").first():
            db.add(User(
                full_name="Platform Admin",
                email="admin@churnai.com",
                hashed_password=hash_password("Admin@12345"),
                role=RoleEnum.admin,
            ))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_admin()
    yield


app = FastAPI(
    title="AI Customer Churn Prediction Platform",
    description="Enterprise-grade churn prediction API with ML model comparison, "
                "SHAP explainability, and an AI retention assistant.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend origin(s) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(prediction_router.router)
app.include_router(train_router.router)
app.include_router(dashboard_router.router)
app.include_router(customer_router.router)
app.include_router(report_router.router)
app.include_router(chat_router.router)
app.include_router(audit_router.router)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok"}
