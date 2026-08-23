"""Transcript -> structured meeting intelligence via a Groq-hosted LLM.

The LLM's raw output is never trusted directly: it is JSON-parsed and
validated through MeetingAnalysis, with one automatic retry using a
stricter follow-up instruction if the first attempt fails validation.
"""

import json
import time

from groq import Groq
from pydantic import ValidationError

from app.config import get_settings
from app.core.logging import get_logger
from app.prompts.meeting_analysis import ACTIVE_PROMPT_BUILDER
from app.schemas.meeting import MeetingAnalysis

logger = get_logger(__name__)


class SummarizationError(Exception):
    """Raised when the transcript cannot be turned into valid structured output."""


class SummarizationResult:
    def __init__(self, analysis: MeetingAnalysis, duration_ms: int):
        self.analysis = analysis
        self.duration_ms = duration_ms


class SummarizationService:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._client = Groq(api_key=self._settings.groq_api_key) if self._settings.groq_api_key else None

    def analyze(self, transcript: str) -> SummarizationResult:
        if not self._client:
            raise SummarizationError(
                "GROQ_API_KEY is not configured on the server. Set it in backend/.env."
            )

        start = time.perf_counter()
        prompt = ACTIVE_PROMPT_BUILDER(transcript)

        raw = self._call_llm(prompt)
        analysis = self._try_parse(raw)

        if analysis is None:
            logger.warning("First LLM response failed validation, retrying once with a stricter prompt")
            retry_prompt = (
                prompt
                + "\n\nYour previous response was not valid JSON matching the required shape. "
                "Return ONLY the raw JSON object, with no markdown formatting or extra text."
            )
            raw = self._call_llm(retry_prompt)
            analysis = self._try_parse(raw)

        if analysis is None:
            raise SummarizationError("The AI model did not return a valid structured analysis after retrying.")

        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.info("Analyzed transcript in %dms using %s", duration_ms, self._settings.llm_model)
        return SummarizationResult(analysis=analysis, duration_ms=duration_ms)

    def _call_llm(self, prompt: str) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self._settings.llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
        except Exception as exc:
            logger.error("LLM call failed: %s", exc)
            raise SummarizationError("The summarization service is currently unavailable.") from exc

        return response.choices[0].message.content or ""

    @staticmethod
    def _try_parse(raw: str) -> MeetingAnalysis | None:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            # Strip markdown code fences some models add despite instructions.
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
            return MeetingAnalysis.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.warning("Failed to parse/validate LLM output: %s", exc)
            return None
