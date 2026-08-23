# Evaluation

This document explains how each part of the system is evaluated. Where
this project's development environment could not produce a genuine
measurement — no microphone/TTS to generate audio, no live
`GROQ_API_KEY` — that is stated explicitly rather than filled in with
invented numbers. Every methodology described here is backed by a real,
runnable script in `backend/scripts/`.

## A. Transcription accuracy (Word Error Rate)

**Metric:** Word Error Rate (WER) — the standard ASR accuracy metric,
computed as `(substitutions + deletions + insertions) / reference word
count` between a hand-written ground-truth transcript and the model's
output. Lower is better; 0.0 is a perfect match.

**Tooling:** `backend/scripts/evaluate_wer.py` (uses the `jiwer` library)
takes an audio file and a ground-truth `.txt`, calls the real
`TranscriptionService` (Groq `whisper-large-v3-turbo` by default), and
prints the WER alongside both transcripts.

**Status in this repository:** No audio files or ground-truth transcripts
are included (see `sample_data/README.md` for why), and no WER has been
measured in this environment. **No numbers are claimed here.** Follow the
steps in `sample_data/README.md` to generate real clips and measure this
yourself — it takes about ten minutes with `GROQ_API_KEY` set.

**Known limitations to watch for when you do measure it:**
- WER is sensitive to formatting differences (numerals vs. spelled-out
  numbers, punctuation, filler words like "um") that don't reflect real
  transcription errors — normalize both transcripts consistently before
  comparing.
- A single short clip is not representative; measure across a few clips
  with different speaker counts, accents, and background noise.
- Whisper models generally perform worse on overlapping speech (multiple
  people talking at once), which is common in real meetings — this is
  worth specifically testing for.

## B. Summary quality

**Evaluated dimensions:**
- **Relevance** — does the executive summary capture what the meeting
  was actually about, not a generic restatement?
- **Completeness** — are the major topics and outcomes represented, or
  are things missing?
- **Factual consistency** — does every claim in the summary trace back
  to something actually said in the transcript? This is the main defense
  against hallucination.

**Methodology:** Manual rubric scoring (1-5 per dimension) by a human
reviewer reading the transcript and summary side by side. This is
explicitly a manual, qualitative evaluation — no automated summary-
quality metric (e.g. ROUGE) is used, because those metrics compare
against a reference summary, and writing "correct" reference summaries
for a meeting is itself a judgment call, not a clear ground truth.

**Status:** Not yet run in this environment (no live LLM output has been
generated here — see below). Once you've completed a real meeting
upload with your own `GROQ_API_KEY`, read the transcript and summary
together and score using the rubric above; record your findings here.

## C. Action-item quality

**Evaluated dimensions:**
- **Task extraction** — are real commitments captured, and are vague
  mentions correctly excluded?
- **Assignee extraction** — is a name only assigned when the transcript
  explicitly names a responsible person? (`null` should appear whenever
  it doesn't.)
- **Deadline extraction** — same standard, applied to dates/timeframes.

**Methodology:** For each action item the LLM extracts, manually check
it against the transcript: was this actually said, and is the
assignee/deadline (or `null`) accurate? Count false positives
(invented items), false negatives (missed items), and incorrect
assignee/deadline extractions.

**Status:** Not yet run — same reason as above.

## D. Prompt effectiveness: Prompt A vs. Prompt B

Two prompts are implemented side by side in
`backend/app/prompts/meeting_analysis.py` specifically so they can be
compared:

- **Prompt A** — a minimal, single-paragraph instruction with no
  anti-hallucination guardrails. Used only as an evaluation baseline;
  never called by the running application.
- **Prompt B** — the structured, constraint-heavy prompt actually used
  in production. It explicitly instructs the model to ground every
  field in the transcript, prefer `null` over invention, and distinguish
  agreed decisions from mere suggestions.

**Tooling:** `backend/scripts/compare_prompts.py` runs both prompts
against the same transcript and prints both JSON outputs for manual
side-by-side comparison.

**Comparison criteria** (apply manually to the two outputs):
1. Does either output contain a name, date, or task not present in the
   transcript? (hallucination)
2. Does either output convert a suggestion ("maybe we could...") into a
   confirmed decision?
3. Are `assignee`/`deadline` correctly `null` when the transcript doesn't
   name one, or does either prompt invent a plausible-sounding fill-in?
4. Is the returned JSON valid and does it match the required schema
   without needing the retry?

**Status:** Not yet run — no live LLM output has been generated in this
environment. Run `compare_prompts.py` with your own transcript and
`GROQ_API_KEY`, then fill in your observations here using the four
criteria above. Expect Prompt A to be more prone to (2) and (3) in
particular, since it has no explicit instruction against them — but this
should be confirmed empirically, not assumed.

## E. System performance

**Metric:** wall-clock duration of each pipeline stage, captured
automatically by the running application (`asr_duration_ms` and
`llm_duration_ms` on every `Meeting` record, visible in the meeting
workspace UI and returned by `GET /api/meetings/{id}`).

**Status:** No numbers are claimed here since no live processing has run
in this environment. Once you process a real meeting, the durations will
be visible directly in the UI and in the API response — no separate
measurement step is needed.

## Summary of what's genuinely verified vs. what requires your API key

| Area | Verified in this environment | Requires your `GROQ_API_KEY` |
|---|---|---|
| Upload validation, error handling, CRUD, background-task wiring | ✅ 27 automated tests, all mocked | — |
| Frontend rendering of all states (processing, completed, failed, tabs) | ✅ verified in-browser (processing/completed states verified with mocked API responses) | — |
| Real transcription accuracy (WER) | ❌ not measured | ✅ run `scripts/evaluate_wer.py` |
| Real summary/action-item quality | ❌ not measured | ✅ upload a real meeting and review |
| Real Prompt A vs. B comparison | ❌ not run | ✅ run `scripts/compare_prompts.py` |
| Real end-to-end pipeline timing | ❌ not measured | ✅ visible after one real upload |
