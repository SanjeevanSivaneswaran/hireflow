import uuid

from sqlalchemy import Column, String, Text, DateTime, Numeric, Boolean, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = Column(String(150), nullable=False, index=True)
    email = Column(String(255), unique=True)
    phone = Column(String(30))
    location = Column(String(150))

    professional_summary = Column(Text)
    experience_years = Column(Numeric(4, 1), nullable=False, default=0)

    skills = Column(JSONB, nullable=False, default=list)
    education = Column(JSONB, nullable=False, default=list)
    work_experience = Column(JSONB, nullable=False, default=list)

    resume_filename = Column(String(255))
    resume_storage_path = Column(Text)

    is_archived = Column(Boolean, nullable=False, default=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship(
        "CandidateProject",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )

    applications = relationship(
        "Application",
        back_populates="candidate"
    )


class CandidateProject(Base):
    __tablename__ = "candidate_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    candidate_id = Column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    project_title = Column(String(200), nullable=False)
    description = Column(Text)
    role = Column(String(150))
    technologies = Column(JSONB, nullable=False, default=list)

    start_date = Column(Date)
    end_date = Column(Date)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", back_populates="projects")