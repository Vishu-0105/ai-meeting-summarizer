"use client";

import { motion } from "framer-motion";
import { Mic, FileAudio, Sparkles, ListChecks, CheckCircle2 } from "lucide-react";

type Tone = "violet" | "rose" | "amber" | "sky" | "green";

interface Node {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  tone: Tone;
  className: string;
}

const TONE_STYLES: Record<Tone, { bg: string; border: string; iconBg: string; iconText: string; dot: string }> = {
  violet: { bg: "bg-node-violet", border: "border-node-violet-ink/20", iconBg: "bg-node-violet-ink/15", iconText: "text-node-violet-ink", dot: "bg-node-violet-ink" },
  rose: { bg: "bg-node-rose", border: "border-node-rose-ink/20", iconBg: "bg-node-rose-ink/15", iconText: "text-node-rose-ink", dot: "bg-node-rose-ink" },
  amber: { bg: "bg-node-amber", border: "border-node-amber-ink/20", iconBg: "bg-node-amber-ink/15", iconText: "text-node-amber-ink", dot: "bg-node-amber-ink" },
  sky: { bg: "bg-node-sky", border: "border-node-sky-ink/20", iconBg: "bg-node-sky-ink/15", iconText: "text-node-sky-ink", dot: "bg-node-sky-ink" },
  green: { bg: "bg-accent-soft", border: "border-accent/25", iconBg: "bg-accent/15", iconText: "text-accent-deep", dot: "bg-accent" },
};

const NODES: Node[] = [
  { icon: FileAudio, title: "Meeting audio", subtitle: "mp3 · wav · m4a", tone: "sky", className: "left-0 top-0" },
  { icon: Mic, title: "Whisper ASR", subtitle: "whisper-large-v3-turbo", tone: "violet", className: "left-6 top-24 sm:left-10" },
  { icon: Sparkles, title: "LLM analysis", subtitle: "structured extraction", tone: "amber", className: "left-0 top-48" },
  { icon: ListChecks, title: "Action items", subtitle: "assignee · deadline", tone: "rose", className: "left-8 top-72 sm:left-12" },
  { icon: CheckCircle2, title: "Ready", subtitle: "meeting intelligence", tone: "green", className: "left-2 top-[24rem]" },
];

export default function PipelinePreview() {
  return (
    <div
      className="relative hidden h-[30rem] w-full max-w-sm select-none lg:block"
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <line x1="70" y1="40" x2="110" y2="120" stroke="#D8D6CC" strokeWidth="1.5" strokeDasharray="4 5" />
        <line x1="120" y1="150" x2="80" y2="215" stroke="#D8D6CC" strokeWidth="1.5" strokeDasharray="4 5" />
        <line x1="90" y1="245" x2="130" y2="315" stroke="#D8D6CC" strokeWidth="1.5" strokeDasharray="4 5" />
        <line x1="140" y1="345" x2="90" y2="405" stroke="#D8D6CC" strokeWidth="1.5" strokeDasharray="4 5" />
      </svg>

      {NODES.map((node, index) => {
        const style = TONE_STYLES[node.tone];
        const Icon = node.icon;
        return (
          <motion.div
            key={node.title}
            initial={{ opacity: 0.001, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index + 0.1, duration: 0.35, ease: "easeOut" }}
            className={`absolute w-56 rounded-card border ${style.border} ${style.bg} px-4 py-3 shadow-[0_4px_18px_rgba(22,26,32,0.05)] ${node.className}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${style.iconBg} ${style.iconText}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-ink">{node.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] leading-tight text-ink-faint">{node.subtitle}</p>
                </div>
              </div>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse-soft`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
