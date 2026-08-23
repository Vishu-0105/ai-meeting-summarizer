"""Prompt templates for meeting transcript analysis.

Two versions are kept side by side deliberately so their outputs can be
compared for the assignment's prompt-effectiveness evaluation (see
docs/evaluation.md). PROMPT_B is what the application actually uses in
production; PROMPT_A exists only as an evaluation baseline.
"""

_JSON_SHAPE = """{
  "title": "short descriptive meeting title",
  "executive_summary": "2-4 sentence summary of what happened and what it means",
  "key_points": ["discussion topic 1", "discussion topic 2"],
  "decisions": ["decision 1", "decision 2"],
  "action_items": [
    {
      "task": "what needs to be done",
      "assignee": "person's name or null",
      "deadline": "date/day mentioned or null",
      "priority": "high, medium, or low"
    }
  ]
}"""


def build_prompt_a(transcript: str) -> str:
    """Baseline prompt: minimal instruction, no anti-hallucination guardrails.

    Used only as an evaluation control to demonstrate why PROMPT_B's extra
    constraints matter - not used in the live pipeline.
    """
    return (
        "Summarize this meeting transcript. Include a summary, key points, "
        "decisions, and action items with assignees and deadlines.\n\n"
        f"Transcript:\n{transcript}\n\n"
        f"Respond as JSON in this shape:\n{_JSON_SHAPE}"
    )


def build_prompt_b(transcript: str) -> str:
    """Structured, constraint-heavy prompt used in production.

    Explicitly instructs the model to ground every field in the transcript,
    to prefer null over invention, and to distinguish decisions from
    suggestions - directly addressing the hallucination failure modes
    observed with PROMPT_A during evaluation.
    """
    return f"""You are analyzing a meeting transcript to produce structured meeting intelligence.

Follow these rules strictly:
1. Base every field ONLY on information explicitly present in the transcript. Never infer, guess, or invent names, dates, tasks, or decisions.
2. A "decision" is something the group explicitly agreed to do or committed to. A suggestion, idea, or option that was merely mentioned but not agreed upon is NOT a decision - do not include it in "decisions".
3. For each action item, only set "assignee" to a name if that person was explicitly named as responsible for that task. Otherwise use null.
4. For each action item, only set "deadline" if a date, day, or timeframe was explicitly mentioned for that task. Otherwise use null.
5. Choose "priority" based on urgency language actually used in the transcript (e.g. "urgent", "ASAP", "by end of day" implies high). If no urgency signal exists, use "medium" as a conservative default - do not fabricate justification for high/low.
6. Keep the executive summary concise (2-4 sentences) and focused on outcomes, not a blow-by-blow retelling.
7. key_points should capture the main topics discussed, independent of whether they led to a decision.
8. Return ONLY the JSON object below. No preamble, no markdown code fences, no explanation.

Required JSON shape:
{_JSON_SHAPE}

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


# The production pipeline always uses PROMPT_B. PROMPT_A is exposed
# separately for the evaluation script in scripts/evaluate_prompts.py.
ACTIVE_PROMPT_BUILDER = build_prompt_b
