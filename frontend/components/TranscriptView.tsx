import { Copy } from "lucide-react";

export default function TranscriptView({ transcript }: { transcript: string }) {
  const paragraphs = transcript
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-faint">Speaker identification unavailable</p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/40 hover:text-accent-deep"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-card border border-line bg-white p-5">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, index) => (
            <p key={index} className="text-sm leading-relaxed text-ink-muted">
              {p}
            </p>
          ))
        ) : (
          <p className="text-sm text-ink-faint">Transcript is empty.</p>
        )}
      </div>
    </div>
  );
}
