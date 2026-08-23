"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileAudio, X } from "lucide-react";
import { ApiError, uploadMeeting } from "@/lib/api";

const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a"];

function isSupported(file: File): boolean {
  const name = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isSupported(file)) {
      setError(`Unsupported file type. Please use ${SUPPORTED_EXTENSIONS.join(", ")}.`);
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadMeeting(selectedFile);
      router.push(`/meetings/${result.meeting_id}`);
    } catch (err) {
      setIsUploading(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong while uploading. Check your connection and try again.");
      }
    }
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload meeting audio"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-8 py-14 text-center transition-colors ${
          isDragging
            ? "border-accent bg-accent-soft"
            : "border-line bg-white hover:border-accent/50 hover:bg-accent-soft/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(",")}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
          <UploadCloud className="h-6 w-6" strokeWidth={2} />
        </span>
        <p className="mt-4 font-display text-xl text-ink">Drop your meeting here</p>
        <p className="mt-1 text-sm text-ink-muted">or browse your files</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-ink-faint">
          MP3 · WAV · M4A
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between rounded-card border border-line bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <FileAudio className="h-5 w-5 text-accent-deep" />
            <div>
              <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
              <p className="text-xs text-ink-faint">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove selected file"
            onClick={() => setSelectedFile(null)}
            className="rounded-full p-1.5 text-ink-faint hover:bg-paper-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-node-rose-ink">
          {error}
        </p>
      )}

      {selectedFile && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading…" : "Summarize this meeting"}
        </button>
      )}
    </div>
  );
}
