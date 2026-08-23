"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { MeetingStatus } from "@/types/meeting";

const STAGES: { key: MeetingStatus; label: string }[] = [
  { key: "pending", label: "Uploading meeting" },
  { key: "transcribing", label: "Transcribing audio" },
  { key: "analyzing", label: "Analyzing conversation" },
  { key: "completed", label: "Extracting insights" },
];

function stageIndex(status: MeetingStatus): number {
  return STAGES.findIndex((s) => s.key === status);
}

export default function ProcessingStages({ status }: { status: MeetingStatus }) {
  const currentIndex = status === "failed" ? -1 : stageIndex(status);

  return (
    <ol className="space-y-4" aria-live="polite">
      {STAGES.map((stage, index) => {
        const isDone = status === "completed" || (currentIndex > index && currentIndex !== -1);
        const isActive = index === currentIndex && status !== "completed";
        const isFailed = status === "failed" && index === 0;

        return (
          <li key={stage.key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                isDone
                  ? "border-accent bg-accent text-white"
                  : isActive
                  ? "border-accent bg-accent-soft text-accent-deep"
                  : isFailed
                  ? "border-node-rose-ink/40 bg-node-rose text-node-rose-ink"
                  : "border-line bg-paper-dim text-ink-faint"
              }`}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-[10px] font-semibold">{index + 1}</span>
              )}
            </span>
            <motion.span
              initial={false}
              animate={{ opacity: isActive || isDone ? 1 : 0.55 }}
              className={`text-sm ${isActive ? "font-semibold text-ink" : "text-ink-muted"}`}
            >
              {stage.label}
            </motion.span>
          </li>
        );
      })}
      {status === "failed" && (
        <li className="flex items-center gap-3 text-sm font-semibold text-node-rose-ink">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-node-rose-ink/40 bg-node-rose text-node-rose-ink">
            !
          </span>
          Processing failed
        </li>
      )}
    </ol>
  );
}
