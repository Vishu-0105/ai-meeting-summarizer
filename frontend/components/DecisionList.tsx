import { CheckCircle2 } from "lucide-react";

export default function DecisionList({ decisions }: { decisions: string[] }) {
  if (decisions.length === 0) {
    return <p className="text-sm text-ink-faint">No explicit decisions were identified in this meeting.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {decisions.map((decision, index) => (
        <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
          <span>{decision}</span>
        </li>
      ))}
    </ul>
  );
}
