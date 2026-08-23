"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ProcessingStages from "@/components/ProcessingStages";
import TranscriptView from "@/components/TranscriptView";
import SummaryCard from "@/components/SummaryCard";
import DecisionList from "@/components/DecisionList";
import ActionItemList from "@/components/ActionItemList";
import { ApiError, deleteMeeting, getMeeting, pollMeetingStatus } from "@/lib/api";
import type { Meeting, MeetingStatus } from "@/types/meeting";

type Tab = "summary" | "decisions" | "actions" | "transcript";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "decisions", label: "Decisions" },
  { key: "actions", label: "Action items" },
  { key: "transcript", label: "Transcript" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MeetingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [liveStatus, setLiveStatus] = useState<MeetingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [isDeleting, setIsDeleting] = useState(false);

  const meetingId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadMeeting() {
      try {
        const data = await getMeeting(meetingId);
        if (!cancelled) {
          setMeeting(data);
          setLiveStatus(data.status);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load this meeting.");
        }
      }
    }

    loadMeeting();

    const stopPolling = pollMeetingStatus(meetingId, async (status) => {
      if (cancelled) return;
      setLiveStatus(status.status);
      if (status.status === "completed" || status.status === "failed") {
        await loadMeeting();
      }
    });

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [meetingId]);

  const handleDelete = async () => {
    if (!confirm("Delete this meeting? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteMeeting(meetingId);
      router.push("/meetings");
    } catch {
      setIsDeleting(false);
      setError("Could not delete this meeting. Try again.");
    }
  };

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
        <div className="rounded-card border border-node-rose-ink/25 bg-node-rose p-6 text-sm text-node-rose-ink">
          {error}
        </div>
        <Link href="/meetings" className="mt-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to meetings
        </Link>
      </section>
    );
  }

  if (!meeting || !liveStatus) {
    return (
      <section className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-24 text-ink-faint sm:px-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading meeting…</span>
      </section>
    );
  }

  const isProcessing = liveStatus !== "completed" && liveStatus !== "failed";

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
      <Link href="/meetings" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to meetings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-8">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {meeting.title || meeting.filename}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-faint">
            <span>{formatDate(meeting.created_at)}</span>
            {meeting.duration_seconds && <span>{Math.round(meeting.duration_seconds / 60)} min</span>}
            <StatusBadge status={liveStatus} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-node-rose-ink/40 hover:text-node-rose-ink disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      {isProcessing && (
        <div className="mx-auto mt-12 max-w-md rounded-card border border-line bg-white p-8">
          <p className="mb-6 text-center font-display text-xl text-ink">Processing your meeting</p>
          <ProcessingStages status={liveStatus} />
        </div>
      )}

      {liveStatus === "failed" && (
        <div className="mt-8 rounded-card border border-node-rose-ink/25 bg-node-rose p-6">
          <p className="font-semibold text-node-rose-ink">This meeting could not be processed</p>
          <p className="mt-1 text-sm text-node-rose-ink/90">
            {meeting.error_message || "An unexpected error occurred."}
          </p>
        </div>
      )}

      {liveStatus === "completed" && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Transcript
            </h2>
            {meeting.transcript && <TranscriptView transcript={meeting.transcript} />}
          </div>

          <div>
            <div className="flex gap-1 border-b border-line" role="tablist" aria-label="Meeting insights">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-faint hover:text-ink-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-6" role="tabpanel">
              {activeTab === "summary" && meeting.executive_summary && (
                <SummaryCard executiveSummary={meeting.executive_summary} keyPoints={meeting.key_points || []} />
              )}
              {activeTab === "decisions" && <DecisionList decisions={meeting.decisions || []} />}
              {activeTab === "actions" && <ActionItemList items={meeting.action_items || []} />}
              {activeTab === "transcript" && meeting.transcript && (
                <TranscriptView transcript={meeting.transcript} />
              )}
            </div>

            {(meeting.asr_duration_ms || meeting.llm_duration_ms) && (
              <div className="mt-8 flex gap-6 border-t border-line pt-4 text-xs text-ink-faint">
                {meeting.asr_duration_ms && <span>Transcription: {(meeting.asr_duration_ms / 1000).toFixed(1)}s</span>}
                {meeting.llm_duration_ms && <span>Analysis: {(meeting.llm_duration_ms / 1000).toFixed(1)}s</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
