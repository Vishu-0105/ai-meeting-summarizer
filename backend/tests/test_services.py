import json
from unittest.mock import MagicMock, patch

import pytest

from app.services.summarization_service import SummarizationError, SummarizationService
from app.services.transcription_service import TranscriptionError, TranscriptionService

VALID_ANALYSIS_JSON = json.dumps(
    {
        "title": "Weekly Sync",
        "executive_summary": "The team reviewed progress and assigned follow-ups.",
        "key_points": ["Reviewed metrics"],
        "decisions": ["Ship the feature next week"],
        "action_items": [
            {"task": "Write tests", "assignee": "Alex", "deadline": "Monday", "priority": "high"}
        ],
    }
)


def _mock_groq_client(monkeypatch, target_module, response_text=None, raise_exc=None):
    mock_client = MagicMock()
    if raise_exc:
        mock_client.chat.completions.create.side_effect = raise_exc
        mock_client.audio.transcriptions.create.side_effect = raise_exc
    else:
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content=response_text))]
        )
        mock_client.audio.transcriptions.create.return_value = response_text

    monkeypatch.setattr(f"{target_module}.Groq", lambda api_key: mock_client)
    return mock_client


def test_transcription_success(monkeypatch):
    _mock_groq_client(monkeypatch, "app.services.transcription_service", response_text="Hello team, let's begin.")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()

    service = TranscriptionService()
    result = service.transcribe(b"fake-bytes", "meeting.mp3")
    assert result.text == "Hello team, let's begin."
    assert result.duration_ms >= 0
    get_settings.cache_clear()


def test_transcription_raises_without_api_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    from app.config import get_settings
    get_settings.cache_clear()

    service = TranscriptionService()
    with pytest.raises(TranscriptionError):
        service.transcribe(b"fake-bytes", "meeting.mp3")
    get_settings.cache_clear()


def test_transcription_wraps_api_failure(monkeypatch):
    _mock_groq_client(
        monkeypatch, "app.services.transcription_service", raise_exc=RuntimeError("network down")
    )
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()

    service = TranscriptionService()
    with pytest.raises(TranscriptionError):
        service.transcribe(b"fake-bytes", "meeting.mp3")
    get_settings.cache_clear()


def test_summarization_success(monkeypatch):
    _mock_groq_client(
        monkeypatch, "app.services.summarization_service", response_text=VALID_ANALYSIS_JSON
    )
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()

    service = SummarizationService()
    result = service.analyze("Alex: I'll write the tests by Monday.")
    assert result.analysis.title == "Weekly Sync"
    assert result.analysis.action_items[0].assignee == "Alex"
    get_settings.cache_clear()


def test_summarization_retries_once_then_succeeds(monkeypatch):
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = [
        MagicMock(choices=[MagicMock(message=MagicMock(content="not valid json"))]),
        MagicMock(choices=[MagicMock(message=MagicMock(content=VALID_ANALYSIS_JSON))]),
    ]
    monkeypatch.setattr("app.services.summarization_service.Groq", lambda api_key: mock_client)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()

    service = SummarizationService()
    result = service.analyze("transcript text")
    assert result.analysis.title == "Weekly Sync"
    assert mock_client.chat.completions.create.call_count == 2
    get_settings.cache_clear()


def test_summarization_raises_after_two_failed_attempts(monkeypatch):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="still not valid json"))]
    )
    monkeypatch.setattr("app.services.summarization_service.Groq", lambda api_key: mock_client)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    from app.config import get_settings
    get_settings.cache_clear()

    service = SummarizationService()
    with pytest.raises(SummarizationError):
        service.analyze("transcript text")
    assert mock_client.chat.completions.create.call_count == 2
    get_settings.cache_clear()
