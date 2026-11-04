from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


#Create job
@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db)
):
    new_job = Job(
        title=job_data.title,
        department=job_data.department,
        location=job_data.location,
        employment_type=job_data.employment_type,
        description=job_data.description
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


#Get all jobs
@router.get("", response_model=list[JobResponse])
def get_jobs(
    skip: int = 0,
    limit: int = 100,
    job_status: str | None = None,
    db: Session = Depends(get_db)
):
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Invalid pagination values"
        )

    query = db.query(Job)

    if job_status is not None:
        if job_status not in ["Open", "Closed"]:
            raise HTTPException(
                status_code=400,
                detail="Status must be Open or Closed"
            )

        query = query.filter(Job.status == job_status)

    return query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()


#Get Job by Id
@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job


#Update job
@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: UUID,
    job_data: JobUpdate,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    update_data = job_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No update information provided"
        )

    if "status" in update_data:
        if update_data["status"] not in ["Open", "Closed"]:
            raise HTTPException(
                status_code=400,
                detail="Status must be Open or Closed"
            )

    for field, value in update_data.items():
        setattr(job, field, value)

    job.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(job)

    return job


#Close job
@router.patch("/{job_id}/close", response_model=JobResponse)
def close_job(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    if job.status == "Closed":
        raise HTTPException(
            status_code=400,
            detail="Job is already closed"
        )

    job.status = "Closed"
    job.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(job)

    return job


#Delete job
@router.delete("/{job_id}")
def delete_job(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    existing_application = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a job that has applications"
        )

    try:
        db.delete(job)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this job because it is referenced by other records"
        )

    return {
        "message": "Job deleted successfully",
        "job_id": str(job_id)
    }