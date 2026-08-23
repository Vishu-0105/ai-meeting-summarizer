"""Speech-to-text via Groq's Whisper endpoint.

Isolated from summarization on purpose: swapping ASR providers (e.g. to a
self-hosted Whisper) should never require touching LLM logic, and vice
versa.
"""

import time

from groq import Groq

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TranscriptionError(Exception):
    """Raised when audio cannot be transcribed."""


class TranscriptionResult:
    def __init__(self, text: str, duration_ms: int):
        self.text = text
        self.duration_ms = duration_ms


class TranscriptionService:
    """Thin wrapper around the Groq ASR API.

    Any future provider swap only needs a class with a matching
    `transcribe(file_bytes, filename)` method.
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        self._client = Groq(api_key=self._settings.groq_api_key) if self._settings.groq_api_key else None

    def transcribe(self, file_bytes: bytes, filename: str) -> TranscriptionResult:
        if not self._client:
            raise TranscriptionError(
                "GROQ_API_KEY is not configured on the server. Set it in backend/.env."
            )

        start = time.perf_counter()
        try:
            response = self._client.audio.transcriptions.create(
                file=(filename, file_bytes),
                model=self._settings.asr_model,
                response_format="text",
            )
        except Exception as exc:  # Groq SDK raises several exception types
            logger.error("Transcription failed for %s: %s", filename, exc)
            raise TranscriptionError(
                "The speech-to-text service could not process this audio file."
            ) from exc

        duration_ms = int((time.perf_counter() - start) * 1000)
        text = response if isinstance(response, str) else getattr(response, "text", "")
        text = text.strip()

        if not text:
            raise TranscriptionError("Transcription returned no text. The audio may be silent or unclear.")

        logger.info("Transcribed %s in %dms using %s", filename, duration_ms, self._settings.asr_model)
        return TranscriptionResult(text=text, duration_ms=duration_ms)
