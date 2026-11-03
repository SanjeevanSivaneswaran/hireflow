from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


APPLICATION_STATUSES = [
    "Applied",
    "Screening",
    "Interview",
    "Offer",
    "Hired",
    "Rejected",
]


class ApplicationCreate(BaseModel):
    candidate_id: UUID
    job_id: UUID


class ApplicationStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        if value not in APPLICATION_STATUSES:
            raise ValueError("Invalid application status")
        return value


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    candidate_id: UUID
    job_id: UUID
    status: str
    applied_at: datetime
    updated_at: datetime


class ApplicationActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    activity_type: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime