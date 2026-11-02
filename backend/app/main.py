from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

app = FastAPI(
    title="HireFlow API",
    description="AI-powered Applicant Tracking System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to HireFlow API",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "HireFlow"
    }


@app.get("/api/db-health")
def database_health():

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "Supabase PostgreSQL"
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )
