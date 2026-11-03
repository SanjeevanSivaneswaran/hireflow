from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


INTERVIEW_TYPES = ["Online", "Onsite"]

INTERVIEW_STATUSES = [
    "Scheduled",
    "Completed",
    "Cancelled",
]


class InterviewCreate(BaseModel):
    application_id: UUID
    scheduled_at: datetime
    interview_type: str
    location_or_link: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("scheduled_at")
    @classmethod
    def validate_timezone(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Interview datetime must include a timezone")
        return value

    @field_validator("interview_type")
    @classmethod
    def validate_type(cls, value):
        if value not in INTERVIEW_TYPES:
            raise ValueError("Interview type must be Online or Onsite")
        return value


class InterviewUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    interview_type: Optional[str] = None
    location_or_link: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    scheduled_at: datetime
    interview_type: str
    location_or_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime