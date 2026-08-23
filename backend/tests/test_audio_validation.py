from app.utils.audio import validate_upload

MAX_BYTES = 25 * 1024 * 1024


def test_valid_mp3_passes():
    result = validate_upload("meeting.mp3", 1000, MAX_BYTES)
    assert result.ok


def test_valid_wav_passes():
    result = validate_upload("meeting.WAV", 1000, MAX_BYTES)
    assert result.ok


def test_missing_filename_fails():
    result = validate_upload(None, 1000, MAX_BYTES)
    assert not result.ok


def test_unsupported_extension_fails():
    result = validate_upload("meeting.pdf", 1000, MAX_BYTES)
    assert not result.ok
    assert "Unsupported" in result.error


def test_empty_file_fails():
    result = validate_upload("meeting.mp3", 0, MAX_BYTES)
    assert not result.ok
    assert "empty" in result.error.lower()


def test_oversized_file_fails():
    result = validate_upload("meeting.mp3", MAX_BYTES + 1, MAX_BYTES)
    assert not result.ok
    assert "exceeds" in result.error.lower()
