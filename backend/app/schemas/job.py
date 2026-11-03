from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class JobBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    department: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=150)
    employment_type: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=150)
    department: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    employment_type: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime