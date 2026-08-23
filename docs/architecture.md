# Architecture

## Overview

Fieldnote is a monolithic two-tier application: a FastAPI backend and a
Next.js frontend, communicating over a REST API. The backend is the only
component that talks to Groq — the frontend never sees or handles the
Groq API key.

```text
                          USER
                            |
                            v
                   Next.js Frontend (3000)
                            |
                            | REST (fetch)
                            v
                   FastAPI Backend (8000)
                            |
              +-------------+-------------+
              |                           |
              v                           v
       Groq AI Services               SQLite
              |
        +-----+-----+
        |           |
        v           v
    Whisper        LLM
   (transcribe)  (analyze)
        |           |
        v           v
   Transcript   Structured
                 Analysis
        \           /
         \         /
          v       v
     Meeting record persisted
              |
              v
       Returned to frontend
```

## Processing pipeline

Uploads are processed asynchronously so the HTTP request returns
immediately rather than blocking on ASR + LLM latency:

```text
Frontend                FastAPI                  Background task
   |                       |                            |
   |--- POST /upload ----->|                            |
   |                       |-- validate file            |
   |                       |-- create Meeting(pending)  |
   |<-- 202 {meeting_id} --|                            |
   |                       |-- schedule background task-->|
   |                                                     |
   |-- GET /status (poll) ------------------------------>|
   |                                                     |-- status=transcribing
   |                                                     |-- call Groq Whisper
   |                                                     |-- status=analyzing
   |                                                     |-- call Groq LLM
   |                                                     |-- validate w/ Pydantic
   |                                                     |-- status=completed | failed
   |<-- {status: completed} -----------------------------|
   |-- GET /meetings/{id} (full record) ----------------->|
```

`FastAPI BackgroundTasks` runs the pipeline in-process after the response
is sent. This was chosen over Celery/Redis because a single-meeting
pipeline (transcribe + analyze) completes in seconds to low minutes, not
hours — a task queue would add operational complexity (a broker, a worker
process, retries/dead-letter handling) without a corresponding benefit at
this scale. See ADR-style reasoning in "Why no task queue?" below.

## Backend module layout

```text
backend/app/
├── main.py                    FastAPI app, CORS, router wiring, lifespan
├── config.py                  Settings loaded once from environment
├── api/routes/
│   ├── meetings.py            upload/list/get/status/delete endpoints
│   └── health.py               liveness check
├── services/
│   ├── transcription_service.py   Groq Whisper wrapper
│   ├── summarization_service.py   Groq LLM wrapper + validation/retry
│   └── meeting_service.py         orchestrates the pipeline, DB access
├── models/meeting.py           SQLAlchemy ORM model
├── schemas/meeting.py          Pydantic request/response/LLM-output schemas
├── prompts/meeting_analysis.py Prompt A (baseline) and Prompt B (production)
├── database/database.py        engine/session/init
├── core/logging.py             centralized logger, never logs secrets
└── utils/audio.py              extension/size/empty validation
```

Each service is independent and mockable: `transcription_service.py` and
`summarization_service.py` share no code, so either provider could be
swapped without touching the other. `meeting_service.py` is the only
module that knows about both — it's the orchestration layer.

## Why these architectural choices?

**Monolith, not microservices.** The assignment is a single-user
placement project, not a system meant to scale independently across
transcription and analysis load. One FastAPI process is simpler to run,
debug, and explain in an interview, and nothing about the workload
(bursty, single-user, low volume) justifies splitting it.

**FastAPI BackgroundTasks, not Celery/Redis.** A task queue earns its
complexity when: (a) jobs can queue up faster than they're processed, (b)
jobs need to survive a process restart, or (c) work needs to be
distributed across multiple worker machines. None of those apply here —
this is why the brief explicitly asked not to add Celery/Redis/Kafka.

**SQLite, not Postgres.** Single-writer, low-concurrency, no need for a
separate DB server for a project that a grader will run locally on one
machine.

**One `meetings` table, not normalized action items.** Action items only
ever get read alongside their parent meeting, never queried
independently, so a JSON column avoids a join for no benefit.

**Pydantic validation on LLM output.** The LLM is treated as an untrusted
input source. Its JSON is parsed and validated through `MeetingAnalysis`
before ever reaching the database — if it fails validation, one retry is
attempted with a stricter follow-up instruction; if that also fails, the
meeting is marked `failed` with a clear error rather than storing
malformed or hallucinated data.

## Frontend structure

```text
frontend/
├── app/
│   ├── page.tsx                 landing page (hero, upload, how-it-works)
│   ├── meetings/page.tsx        dashboard (list of meetings)
│   └── meetings/[id]/page.tsx   workspace (transcript + AI insights tabs)
├── components/                  UploadDropzone, ProcessingStages,
│                                 MeetingCard, TranscriptView, SummaryCard,
│                                 DecisionList, ActionItemList, StatusBadge,
│                                 Navbar, PipelinePreview
├── lib/api.ts                   typed fetch wrapper + status polling
└── types/meeting.ts             types mirroring the backend Pydantic schemas
```

The frontend never calls Groq directly — every API call goes through
`lib/api.ts` to the FastAPI backend at `NEXT_PUBLIC_API_URL`.

## Status polling

`pollMeetingStatus()` in `lib/api.ts` polls `GET /api/meetings/{id}/status`
every 2 seconds until the status is `completed` or `failed`, then the
meeting detail page re-fetches the full record. This was chosen over
WebSockets/SSE because the pipeline is short-lived (seconds to low
minutes) and a handful of polls is simpler to implement, test, and reason
about than a persistent connection, with no real UX cost at this latency.
