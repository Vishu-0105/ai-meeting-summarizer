"""Meeting endpoints.

Upload creates a DB record and immediately returns, then kicks off
processing via FastAPI BackgroundTasks. The frontend polls /status until
the pipeline reaches a terminal state (completed/failed).
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.logging import get_logger
from app.database.database import SessionLocal, get_db
from app.schemas.meeting import (
    MeetingResponse,
    MeetingStatusResponse,
    MeetingSummaryListItem,
    UploadResponse,
)
from app.services import meeting_service
from app.utils.audio import validate_upload

router = APIRouter(prefix="/api/meetings", tags=["meetings"])
logger = get_logger(__name__)


def _run_pipeline_with_own_session(meeting_id: str, file_bytes: bytes, filename: str) -> None:
    # The request's DB session closes as soon as the response is sent, so
    # the background task needs its own session with its own lifecycle.
    db = SessionLocal()
    try:
        meeting_service.process_meeting(db, meeting_id, file_bytes, filename)
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    db: Session = Depends(get_db),
) -> UploadResponse:
    settings = get_settings()
    file_bytes = await file.read()

    validation = validate_upload(file.filename, len(file_bytes), settings.max_upload_bytes)
    if not validation.ok:
        raise HTTPException(status_code=400, detail=validation.error)

    meeting = meeting_service.create_pending_meeting(db, file.filename)
    logger.info("Created meeting %s for file %s", meeting.id, file.filename)

    background_tasks.add_task(_run_pipeline_with_own_session, meeting.id, file_bytes, file.filename)

    return UploadResponse(meeting_id=meeting.id, status=meeting.status)


@router.get("", response_model=list[MeetingSummaryListItem])
def list_meetings(db: Session = Depends(get_db)) -> list[MeetingSummaryListItem]:
    meetings = meeting_service.list_meetings(db)
    return [
        MeetingSummaryListItem(
            id=m.id,
            filename=m.filename,
            title=m.title,
            status=m.status,
            duration_seconds=m.duration_seconds,
            executive_summary=m.executive_summary,
            action_item_count=len(m.action_items) if m.action_items else 0,
            created_at=m.created_at,
        )
        for m in meetings
    ]


@router.get("/{meeting_id}/status", response_model=MeetingStatusResponse)
def get_meeting_status(meeting_id: str, db: Session = Depends(get_db)) -> MeetingStatusResponse:
    meeting = meeting_service.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return MeetingStatusResponse(
        meeting_id=meeting.id, status=meeting.status, error_message=meeting.error_message
    )


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)) -> MeetingResponse:
    meeting = meeting_service.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return MeetingResponse.model_validate(meeting)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)) -> None:
    deleted = meeting_service.delete_meeting(db, meeting_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meeting not found.")
