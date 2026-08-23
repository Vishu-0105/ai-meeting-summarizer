"""SQLAlchemy ORM model for a processed meeting."""

import uuid
from datetime import datetime, timezone
from enum import StrEnum

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class MeetingStatus(StrEnum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default=MeetingStatus.PENDING)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    executive_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    decisions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    action_items: Mapped[list | None] = mapped_column(JSON, nullable=True)

    asr_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    llm_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
