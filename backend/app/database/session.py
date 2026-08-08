import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Default to local SQLite for zero-config local/dev runs.
# In production (docker-compose), set DATABASE_URL to a Postgres DSN, e.g.:
#   postgresql+psycopg2://churn_user:churn_pass@postgres:5432/churn_db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./churn_platform.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
