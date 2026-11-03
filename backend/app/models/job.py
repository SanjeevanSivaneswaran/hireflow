import uuid

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    employment_type = Column(String(50), nullable=False)
    description = Column(Text)

    status = Column(String(20), nullable=False, default="Open")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("Application", back_populates="job")