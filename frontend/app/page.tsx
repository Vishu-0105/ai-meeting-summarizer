import { FileAudio, Sparkles, ListChecks } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import PipelinePreview from "@/components/PipelinePreview";

const HOW_IT_WORKS = [
  {
    icon: FileAudio,
    title: "Upload the recording",
    body: "Drop in your meeting audio. MP3, WAV, and M4A are supported out of the box.",
  },
  {
    icon: Sparkles,
    title: "AI transcribes and reads it",
    body: "Whisper transcribes the audio, then an LLM reads the transcript for decisions, topics, and commitments.",
  },
  {
    icon: ListChecks,
    title: "Get clear next steps",
    body: "Walk away with a summary, key decisions, and action items with owners and deadlines when they were stated.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <div className="max-w-xl">
            <h1 className="font-display text-[2.75rem] leading-[1.08] tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
              Turn every meeting into{" "}
              <span className="relative inline-block">
                <em className="font-medium text-accent italic">clear</em>
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  height="8"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 5.5C20 1.5 45 1 65 4C78 6 90 5.5 99 2.5"
                    stroke="#4CBB6C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>{" "}
              next steps.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              AI-powered transcription and meeting intelligence for faster, clearer
              follow-through — no more re-listening for who owns what.
            </p>

            <div className="mt-10">
              <UploadDropzone />
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PipelinePreview />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-line bg-paper-dim/60">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
            How it works
          </p>
          <h2 className="mt-3 max-w-lg font-display text-3xl leading-tight text-ink sm:text-4xl">
            From raw audio to action items, in three steps.
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-card border border-line bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="font-mono text-xs text-ink-faint">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
