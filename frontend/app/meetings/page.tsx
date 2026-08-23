"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileAudio, Loader2 } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";
import { ApiError, listMeetings } from "@/lib/api";
import type { MeetingListItem } from "@/types/meeting";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMeetings()
      .then((data) => {
        if (!cancelled) setMeetings(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load meetings. Is the backend running?");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Your meetings</h1>
        </div>
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Upload a meeting
        </Link>
      </div>

      <div className="mt-10">
        {error && (
          <div className="rounded-card border border-node-rose-ink/25 bg-node-rose p-6 text-sm text-node-rose-ink">
            {error}
          </div>
        )}

        {!error && meetings === null && (
          <div className="flex items-center gap-2 py-16 text-ink-faint">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading meetings…</span>
          </div>
        )}

        {!error && meetings !== null && meetings.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line py-20 text-center">
            <FileAudio className="h-8 w-8 text-ink-faint" />
            <p className="font-display text-lg text-ink">No meetings yet</p>
            <p className="max-w-xs text-sm text-ink-muted">
              Upload your first recording and it will show up here once it&apos;s processed.
            </p>
            <Link
              href="/"
              className="mt-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:border-accent/40 hover:text-accent-deep"
            >
              Go to upload
            </Link>
          </div>
        )}

        {!error && meetings !== null && meetings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
