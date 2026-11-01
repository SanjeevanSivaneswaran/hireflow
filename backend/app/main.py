
from fastapi import FastAPI

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
