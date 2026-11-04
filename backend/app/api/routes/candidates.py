
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, cast, String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.candidate import Candidate, CandidateProject
from app.schemas.candidate import CandidateUpdate, CandidateResponse, ReviewedCandidateCreate


router = APIRouter(
    prefix="/api/candidates",
    tags=["Candidates"]
)


# Get all candidates
@router.get("", response_model=list[CandidateResponse])
def get_candidates(
    search: str | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Invalid pagination values"
        )

    query = db.query(Candidate).options(
        selectinload(Candidate.projects)
    )

    if not include_archived:
        query = query.filter(Candidate.is_archived.is_(False))

    if search and search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Candidate.full_name.ilike(search_term),
                Candidate.email.ilike(search_term),
                cast(Candidate.skills, String).ilike(search_term)
            )
        )

    return (
        query
        .order_by(Candidate.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# Save a recuriter-reviewed candidate to the database
@router.post(
    "/from-resume",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED
)
def save_reviewed_candidate(
    candidate_data: ReviewedCandidateCreate,
    db: Session = Depends(get_db)
):
    # Check whether this email already exists.
    if candidate_data.email:
        existing_candidate = (
            db.query(Candidate)
            .filter(Candidate.email == candidate_data.email)
            .first()
        )

        if existing_candidate:
            raise HTTPException(
                status_code=409,
                detail="A candidate with this email already exists."
            )

    # Separate projects from the main candidate information.
    candidate_fields = candidate_data.model_dump(
        exclude={"projects"},
        mode="python"
    )
    candidate_fields["experience_years"] = candidate_data.experience_years

    project_data = candidate_data.projects

    # Create the candidate.
    new_candidate = Candidate(**candidate_fields)

    # Add all reviewed projects.
    for project in project_data:
        new_project = CandidateProject(
            **project.model_dump(mode="python")
        )
        new_candidate.projects.append(new_project)

    try:
        # Save candidate and projects in one transaction.
        db.add(new_candidate)
        db.commit()
        db.refresh(new_candidate)

        # Load saved projects for the response.
        db.refresh(new_candidate)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Could not save candidate. Check for duplicate email or invalid data."
        )

    return new_candidate


# Get candidate by id
@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db)
):
    candidate = (
        db.query(Candidate)
        .options(selectinload(Candidate.projects))
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    return candidate


# update candidate
@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: UUID,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db)
):
    candidate = (
        db.query(Candidate)
        .options(selectinload(Candidate.projects))
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if candidate.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Restore this candidate before editing"
        )

    update_data = candidate_data.model_dump(
        exclude_unset=True,
        mode="json"
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No update information provided"
        )

    for field, value in update_data.items():
        setattr(candidate, field, value)

    candidate.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(candidate)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A candidate with this email may already exist"
        )

    return candidate


# activate candidate
@router.patch("/{candidate_id}/archive")
def archive_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db)
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if candidate.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Candidate is already archived"
        )

    candidate.is_archived = True
    candidate.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Candidate archived successfully",
        "candidate_id": str(candidate_id)
    }


# restore candidate
@router.patch("/{candidate_id}/restore")
def restore_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db)
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if not candidate.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Candidate is already active"
        )

    candidate.is_archived = False
    candidate.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Candidate restored successfully",
        "candidate_id": str(candidate_id)
    }
