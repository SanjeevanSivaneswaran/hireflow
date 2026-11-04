from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class WorkExperienceItem(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CandidateProjectBase(BaseModel):
    project_title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    role: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CandidateProjectCreate(CandidateProjectBase):
    pass


class CandidateProjectResponse(CandidateProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID


class CandidateBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    location: Optional[str] = None
    professional_summary: Optional[str] = None

    experience_years: Decimal = Field(default=Decimal("0"), ge=0, le=999.9)

    skills: list[str] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    work_experience: list[WorkExperienceItem] = Field(default_factory=list)


class CandidateCreate(CandidateBase):
    projects: list[CandidateProjectCreate] = Field(default_factory=list)


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    experience_years: Optional[Decimal] = Field(default=None, ge=0, le=999.9)

    skills: Optional[list[str]] = None
    education: Optional[list[EducationItem]] = None
    work_experience: Optional[list[WorkExperienceItem]] = None


class CandidateResponse(CandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_filename: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    projects: list[CandidateProjectResponse] = Field(default_factory=list)



class ReviewedCandidateCreate(CandidateCreate):
    """
    Candidate information reviewed and approved by the recruiter.
    """

    resume_filename: str = Field(
        min_length=1,
        max_length=255
    )

    resume_storage_path: str = Field(
        min_length=1
    )
