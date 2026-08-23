import type { MeetingStatus } from "@/types/meeting";

const STYLES: Record<MeetingStatus, string> = {
  pending: "bg-paper-dim text-ink-muted border-line",
  transcribing: "bg-node-sky text-node-sky-ink border-node-sky-ink/25",
  analyzing: "bg-node-amber text-node-amber-ink border-node-amber-ink/25",
  completed: "bg-accent-soft text-accent-deep border-accent/25",
  failed: "bg-node-rose text-node-rose-ink border-node-rose-ink/25",
};

const LABELS: Record<MeetingStatus, string> = {
  pending: "Pending",
  transcribing: "Transcribing",
  analyzing: "Analyzing",
  completed: "Completed",
  failed: "Failed",
};

export default function StatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "transcribing" || status === "analyzing" ? "animate-pulse-soft" : ""
        } ${
          status === "completed"
            ? "bg-accent"
            : status === "failed"
            ? "bg-node-rose-ink"
            : status === "pending"
            ? "bg-ink-faint"
            : "bg-current"
        }`}
      />
      {LABELS[status]}
    </span>
  );
}
