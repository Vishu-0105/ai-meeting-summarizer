"""Runs Prompt A (baseline) and Prompt B (structured) against the same
transcript and prints both outputs side by side for manual comparison.

This script makes REAL calls to the Groq API - it does not fabricate or
simulate LLM output. Requires GROQ_API_KEY to be set (backend/.env).

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/compare_prompts.py --transcript path/to/transcript.txt

The output is not scored automatically - read both JSON blocks and
compare them against docs/evaluation.md's criteria (hallucination,
decision vs. suggestion handling, null-vs-invented fields, structure
validity).
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from groq import Groq

from app.config import get_settings
from app.prompts.meeting_analysis import build_prompt_a, build_prompt_b


def call_llm(client: Groq, model: str, prompt: str) -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


def pretty(raw: str) -> str:
    try:
        return json.dumps(json.loads(raw), indent=2)
    except json.JSONDecodeError:
        return raw + "\n\n[NOTE: response was not valid JSON]"


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare Prompt A vs Prompt B on one transcript.")
    parser.add_argument("--transcript", required=True, help="Path to a .txt transcript file.")
    args = parser.parse_args()

    transcript_path = Path(args.transcript)
    if not transcript_path.exists():
        print(f"Transcript file not found: {transcript_path}", file=sys.stderr)
        sys.exit(1)

    settings = get_settings()
    if not settings.groq_api_key:
        print("GROQ_API_KEY is not set in backend/.env - cannot call the live API.", file=sys.stderr)
        sys.exit(1)

    transcript = transcript_path.read_text(encoding="utf-8").strip()
    client = Groq(api_key=settings.groq_api_key)

    print("Calling Prompt A (baseline)...")
    output_a = call_llm(client, settings.llm_model, build_prompt_a(transcript))

    print("Calling Prompt B (structured, production)...")
    output_b = call_llm(client, settings.llm_model, build_prompt_b(transcript))

    print("\n================ PROMPT A OUTPUT ================")
    print(pretty(output_a))
    print("\n================ PROMPT B OUTPUT ================")
    print(pretty(output_b))
    print(
        "\nCompare the two blocks above for: hallucinated names/dates, "
        "suggestions mislabeled as decisions, null vs. invented fields, "
        "and whether the JSON is valid and matches the required schema."
    )


if __name__ == "__main__":
    main()
