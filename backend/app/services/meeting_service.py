"""Orchestrates the audio -> transcript -> analysis -> storage pipeline
and provides the data-access layer for meetings.

Kept separate from the API routes so the background-processing pipeline
can be unit tested without spinning up FastAPI.
"""

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.meeting import Meeting, MeetingStatus
from app.services.summarization_service import SummarizationError, SummarizationService
from app.services.transcription_service import TranscriptionError, TranscriptionService

logger = get_logger(__name__)


def create_pending_meeting(db: Session, filename: str) -> Meeting:
    meeting = Meeting(filename=filename, status=MeetingStatus.PENDING)
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def get_meeting(db: Session, meeting_id: str) -> Meeting | None:
    return db.get(Meeting, meeting_id)


def list_meetings(db: Session) -> list[Meeting]:
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()


def delete_meeting(db: Session, meeting_id: str) -> bool:
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        return False
    db.delete(meeting)
    db.commit()
    return True


def process_meeting(
    db: Session,
    meeting_id: str,
    file_bytes: bytes,
    filename: str,
    transcription_service: TranscriptionService | None = None,
    summarization_service: SummarizationService | None = None,
) -> None:
    """Runs the full pipeline for one meeting and persists results.

    Designed to run inside a FastAPI BackgroundTask: any exception is
    caught and recorded on the meeting row rather than propagated, since
    there is no request left to return an HTTP error to by the time this
    runs.
    """
    transcription_service = transcription_service or TranscriptionService()
    summarization_service = summarization_service or SummarizationService()

    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        logger.error("process_meeting called with unknown meeting_id=%s", meeting_id)
        return

    try:
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()

        transcription = transcription_service.transcribe(file_bytes, filename)
        meeting.transcript = transcription.text
        meeting.asr_duration_ms = transcription.duration_ms

        meeting.status = MeetingStatus.ANALYZING
        db.commit()

        analysis = summarization_service.analyze(transcription.text)
        meeting.title = analysis.analysis.title
        meeting.executive_summary = analysis.analysis.executive_summary
        meeting.key_points = analysis.analysis.key_points
        meeting.decisions = analysis.analysis.decisions
        meeting.action_items = [item.model_dump() for item in analysis.analysis.action_items]
        meeting.llm_duration_ms = analysis.duration_ms

        meeting.status = MeetingStatus.COMPLETED
        db.commit()
        logger.info("Meeting %s processed successfully", meeting_id)

    except (TranscriptionError, SummarizationError) as exc:
        logger.warning("Meeting %s failed: %s", meeting_id, exc)
        meeting.status = MeetingStatus.FAILED
        meeting.error_message = str(exc)
        db.commit()

    except Exception as exc:  # last-resort safety net for background task
        logger.exception("Unexpected error processing meeting %s", meeting_id)
        meeting.status = MeetingStatus.FAILED
        meeting.error_message = "An unexpected error occurred while processing this meeting."
        db.commit()
