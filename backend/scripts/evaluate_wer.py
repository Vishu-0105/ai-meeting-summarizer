"""Computes Word Error Rate for one audio file against a ground-truth transcript.

This script performs a REAL transcription call against the Groq API - it
does not simulate or fabricate output. Requires GROQ_API_KEY to be set
(backend/.env) and a working internet connection.

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/evaluate_wer.py --audio path/to/audio.mp3 --ground-truth path/to/ground_truth.txt

Add more audio/ground-truth pairs and re-run to build up a picture of
transcription accuracy across different meeting styles (multiple
speakers, background noise, accents, etc.) - a single WER number from
one clip is not representative.
"""

import argparse
import sys
from pathlib import Path

# Allow running as `python scripts/evaluate_wer.py` from the backend/ directory.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from jiwer import wer

from app.services.transcription_service import TranscriptionError, TranscriptionService


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute WER for a transcribed meeting clip.")
    parser.add_argument("--audio", required=True, help="Path to the audio file (mp3/wav/m4a).")
    parser.add_argument("--ground-truth", required=True, help="Path to a .txt file with the reference transcript.")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    ground_truth_path = Path(args.ground_truth)

    if not audio_path.exists():
        print(f"Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    if not ground_truth_path.exists():
        print(f"Ground truth file not found: {ground_truth_path}", file=sys.stderr)
        sys.exit(1)

    reference = ground_truth_path.read_text(encoding="utf-8").strip()
    audio_bytes = audio_path.read_bytes()

    print(f"Transcribing {audio_path.name} via Groq Whisper...")
    service = TranscriptionService()
    try:
        result = service.transcribe(audio_bytes, audio_path.name)
    except TranscriptionError as exc:
        print(f"Transcription failed: {exc}", file=sys.stderr)
        sys.exit(1)

    hypothesis = result.text
    error_rate = wer(reference, hypothesis)

    print("\n--- Reference (ground truth) ---")
    print(reference)
    print("\n--- Hypothesis (generated) ---")
    print(hypothesis)
    print(f"\nWord Error Rate: {error_rate:.3f}  ({error_rate * 100:.1f}%)")
    print(f"Transcription time: {result.duration_ms}ms")


if __name__ == "__main__":
    main()
