import uuid

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ApplicationActivity(Base):
    __tablename__ = "application_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    activity_type = Column(String(50), nullable=False)

    old_status = Column(String(20))
    new_status = Column(String(20))

    description = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="activities")