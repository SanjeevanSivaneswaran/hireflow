from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine
from app.api.routes.jobs import router as jobs_router
from app.api.routes.candidates import router as candidates_router
from app.api.routes.resumes import router as resumes_router

app = FastAPI(
    title="HireFlow API",
    description="AI-powered Applicant Tracking System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(resumes_router)

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
