import Link from "next/link";
import { ListChecks, Clock } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { MeetingListItem } from "@/types/meeting";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export default function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  const duration = formatDuration(meeting.duration_seconds);

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-card border border-line bg-white p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(22,26,32,0.06)] focus-visible:outline-offset-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug text-ink">
          {meeting.title || meeting.filename}
        </h3>
        <StatusBadge status={meeting.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span>{formatDate(meeting.created_at)}</span>
        {duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {duration}
          </span>
        )}
      </div>

      {meeting.executive_summary && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{meeting.executive_summary}</p>
      )}

      {meeting.status === "completed" && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-accent-deep">
          <ListChecks className="h-3.5 w-3.5" />
          {meeting.action_item_count} action item{meeting.action_item_count === 1 ? "" : "s"}
        </div>
      )}
    </Link>
  );
}
