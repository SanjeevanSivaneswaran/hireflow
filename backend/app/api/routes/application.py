from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationActivityResponse,
)
from app.models.activity import ApplicationActivity



router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)


# Create an application
@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == application_data.candidate_id
    ).first()

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if candidate.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Archived candidates cannot apply for jobs"
        )

    job = db.query(Job).filter(
        Job.id == application_data.job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    if job.status != "Open":
        raise HTTPException(
            status_code=400,
            detail="Applications can only be created for open jobs"
        )

    existing_application = db.query(Application).filter(
        Application.candidate_id == application_data.candidate_id,
        Application.job_id == application_data.job_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=409,
            detail="This candidate has already applied for this job"
        )

    new_application = Application(
        candidate_id=application_data.candidate_id,
        job_id=application_data.job_id,
        status="Applied"
    )

    try:
        db.add(new_application)
        db.flush()  # Flush to get the new application's ID for activity logging

        activity = ApplicationActivity(
            application_id=new_application.id,
            activity_type="application_created",
            new_status="Applied",
            description="Application created with initial status Applied."
        )
        db.add(activity)
        db.commit()
        db.refresh(new_application)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This candidate has already applied for this job"
        )

    return new_application


# List applications
@router.get("", response_model=list[ApplicationResponse])
def get_applications(
    skip: int = 0,
    limit: int = 100,
    job_id: UUID | None = None,
    application_status: str | None = None,
    db: Session = Depends(get_db)
):
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Invalid pagination values"
        )

    allowed_statuses = {
        "Applied",
        "Screening",
        "Interview",
        "Offer",
        "Hired",
        "Rejected",
    }

    if (
        application_status is not None
        and application_status not in allowed_statuses
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    query = db.query(Application)

    if job_id is not None:
        query = query.filter(Application.job_id == job_id)

    if application_status is not None:
        query = query.filter(
            Application.status == application_status
        )

    return (
        query.order_by(Application.applied_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# Get one application
@router.get(
    "/{application_id}",
    response_model=ApplicationResponse
)
def get_application(
    application_id: UUID,
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return application


# Update application status
@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: UUID,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if application.status == status_data.status:
        raise HTTPException(
            status_code=400,
            detail="Application already has this status"
        )

    old_status = application.status
    new_status = status_data.status

    application.status = new_status
    application.updated_at = datetime.now(timezone.utc)

    activity = ApplicationActivity(
        application_id=application.id,
        activity_type="status_changed",
        old_status=old_status,
        new_status=new_status,
        description=f"Status changed from {old_status} to {new_status}."
    )

    db.add(activity)
    db.commit()
    db.refresh(application)
    return application

@router.get(
    "/{application_id}/activities",
    response_model=list[ApplicationActivityResponse]
)
def get_application_activities(
    application_id: UUID,
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return (
        db.query(ApplicationActivity)
        .filter(
            ApplicationActivity.application_id == application_id
        )
        .order_by(
            ApplicationActivity.created_at.desc(),
            ApplicationActivity.id.desc()
        )
        .all()
    )


   
