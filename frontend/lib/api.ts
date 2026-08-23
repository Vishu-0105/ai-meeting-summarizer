import type { Meeting, MeetingListItem, MeetingStatusResponse, UploadResponse } from "@/types/meeting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // response body wasn't JSON - fall through to generic message
  }
  return `Request failed with status ${response.status}.`;
}

export async function uploadMeeting(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/meetings/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}

export async function getMeetingStatus(meetingId: string): Promise<MeetingStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/status`);
  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}

export async function getMeeting(meetingId: string): Promise<Meeting> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`);
  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}

export async function listMeetings(): Promise<MeetingListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/meetings`, { cache: "no-store" });
  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
}

/**
 * Polls status until the pipeline reaches completed/failed, calling
 * onUpdate after every poll so the UI can reflect intermediate stages
 * (transcribing/analyzing) rather than only the final state.
 */
export function pollMeetingStatus(
  meetingId: string,
  onUpdate: (status: MeetingStatusResponse) => void,
  intervalMs = 2000
): () => void {
  let cancelled = false;

  const tick = async () => {
    if (cancelled) return;
    try {
      const status = await getMeetingStatus(meetingId);
      if (cancelled) return;
      onUpdate(status);
      if (status.status !== "completed" && status.status !== "failed") {
        setTimeout(tick, intervalMs);
      }
    } catch {
      // Transient network errors during polling shouldn't kill the flow -
      // just retry on the next interval instead of surfacing every blip.
      if (!cancelled) setTimeout(tick, intervalMs);
    }
  };

  tick();
  return () => {
    cancelled = true;
  };
}
