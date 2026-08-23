"""Audio upload validation.

Kept separate from the route/service layer so validation rules (formats,
size limits) can be unit tested without touching FastAPI or Groq.
"""

from dataclasses import dataclass

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a"}


@dataclass
class ValidationResult:
    ok: bool
    error: str | None = None


def validate_upload(filename: str | None, content_length: int, max_bytes: int) -> ValidationResult:
    if not filename:
        return ValidationResult(False, "No filename provided.")

    extension = _extension_of(filename)
    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        return ValidationResult(False, f"Unsupported file type '{extension}'. Supported formats: {supported}.")

    if content_length <= 0:
        return ValidationResult(False, "Uploaded file is empty.")

    if content_length > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        return ValidationResult(False, f"File exceeds the {max_mb:.0f}MB upload limit.")

    return ValidationResult(True)


def _extension_of(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()
