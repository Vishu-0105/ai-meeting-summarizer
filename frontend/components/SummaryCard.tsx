export default function SummaryCard({
  executiveSummary,
  keyPoints,
}: {
  executiveSummary: string;
  keyPoints: string[];
}) {
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-ink">{executiveSummary}</p>

      {keyPoints.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Key topics discussed
          </h4>
          <ul className="mt-2 space-y-1.5">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
