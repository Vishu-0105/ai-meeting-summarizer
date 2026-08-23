# Sample evaluation data

This folder is where you add real audio clips and their hand-written
ground-truth transcripts to measure transcription accuracy (WER) and to
feed the Prompt A vs. Prompt B comparison script.

**No audio files or measured results are included in this repository.**
This development environment had no microphone, no text-to-speech tool,
and no live `GROQ_API_KEY`, so no transcription or LLM call was ever
actually made here — meaning there is nothing genuine to measure. Rather
than invent numbers, this folder ships with working scripts and clear
instructions so you can generate real results yourself in a few minutes.

## Structure

```text
sample_data/
├── README.md              (this file)
└── transcripts/            put ground-truth .txt files here
```

Add your own audio files anywhere convenient (they're gitignored by
default — see the root `.gitignore`) and a matching ground-truth
transcript in `transcripts/`, e.g.:

```text
my_meeting.mp3
sample_data/transcripts/my_meeting_ground_truth.txt
```

## How to measure transcription accuracy (WER)

1. Record or find 2-3 short (1-3 minute) audio clips of speech — ideally
   varying in speaker count, accent, and background noise, since a
   single clip isn't representative.
2. Hand-transcribe each clip exactly as spoken into a `.txt` file in
   `transcripts/`.
3. With `GROQ_API_KEY` set in `backend/.env`, run:

   ```bash
   cd backend
   python scripts/evaluate_wer.py --audio ../my_meeting.mp3 --ground-truth sample_data/transcripts/my_meeting_ground_truth.txt
   ```

4. The script transcribes the real audio via Groq Whisper and prints the
   Word Error Rate alongside both transcripts so you can see exactly
   where they diverge.

Record the WER, the clip's characteristics (length, speaker count,
audio quality), and any patterns you notice in `docs/evaluation.md`.

## How to compare Prompt A vs. Prompt B

1. Take (or write) a realistic meeting transcript as a `.txt` file —
   ideally one with a mix of firm decisions, mere suggestions, and at
   least one action item with an explicit owner/deadline and one
   without, since that's what stresses the anti-hallucination
   instructions in Prompt B.
2. Run:

   ```bash
   cd backend
   python scripts/compare_prompts.py --transcript path/to/transcript.txt
   ```

3. The script calls the real Groq LLM with both prompts and prints both
   JSON outputs side by side. Compare them against the criteria in
   `docs/evaluation.md` (hallucination, decisions vs. suggestions, null
   vs. invented fields, structural validity) and record what you
   observe.
