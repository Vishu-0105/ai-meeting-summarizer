"""Pydantic schemas.

MeetingAnalysis/ActionItem validate the LLM's structured output before it
is ever trusted or persisted. The other schemas shape API responses.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ActionItem(BaseModel):
    task: str
    assignee: str | None = None
    deadline: str | None = None
    priority: Literal["high", "medium", "low"] = "medium"

    @field_validator("assignee", "deadline", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        # The LLM sometimes returns "unknown"/"" instead of null - normalize
        # all of these to None so the frontend has one consistent signal
        # for "not identifiable" rather than several magic strings.
        if isinstance(value, str) and value.strip().lower() in {"", "unknown", "null", "n/a", "none"}:
            return None
        return value


class MeetingAnalysis(BaseModel):
    title: str
    executive_summary: str
    key_points: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)


class MeetingStatusResponse(BaseModel):
    meeting_id: str
    status: str
    error_message: str | None = None


class MeetingResponse(BaseModel):
    id: str
    filename: str
    status: str
    error_message: str | None
    duration_seconds: float | None
    transcript: str | None
    title: str | None
    executive_summary: str | None
    key_points: list[str] | None
    decisions: list[str] | None
    action_items: list[ActionItem] | None
    asr_duration_ms: int | None
    llm_duration_ms: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MeetingSummaryListItem(BaseModel):
    """Lighter-weight shape used for the dashboard list view."""

    id: str
    filename: str
    title: str | None
    status: str
    duration_seconds: float | None
    executive_summary: str | None
    action_item_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    meeting_id: str
    status: str
