from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse


router = APIRouter(
    prefix="/api/applications",
    tags=["Application Notes"]
)


@router.post(
    "/{application_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED
)
def create_note(
    application_id: UUID,
    note_data: NoteCreate,
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

    content = note_data.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Note cannot be empty"
        )

    new_note = Note(
        application_id=application_id,
        content=content
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


@router.get(
    "/{application_id}/notes",
    response_model=list[NoteResponse]
)
def get_application_notes(
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
        db.query(Note)
        .filter(Note.application_id == application_id)
        .order_by(Note.created_at.desc(), Note.id.desc())
        .all()
    )
