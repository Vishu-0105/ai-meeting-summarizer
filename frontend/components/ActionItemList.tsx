import { User, Calendar } from "lucide-react";
import type { ActionItem } from "@/types/meeting";

const PRIORITY_STYLES: Record<ActionItem["priority"], string> = {
  high: "bg-node-rose text-node-rose-ink border-node-rose-ink/25",
  medium: "bg-node-amber text-node-amber-ink border-node-amber-ink/25",
  low: "bg-paper-dim text-ink-muted border-line",
};

export default function ActionItemList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        No action items were identified in this meeting.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="rounded-card border border-line bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug text-ink">{item.task}</p>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[item.priority]}`}
            >
              {item.priority}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {item.assignee || "Unassigned"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {item.deadline || "No deadline specified"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
