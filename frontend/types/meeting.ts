export type MeetingStatus = "pending" | "transcribing" | "analyzing" | "completed" | "failed";

export type Priority = "high" | "medium" | "low";

export interface ActionItem {
  task: string;
  assignee: string | null;
  deadline: string | null;
  priority: Priority;
}

export interface Meeting {
  id: string;
  filename: string;
  status: MeetingStatus;
  error_message: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  title: string | null;
  executive_summary: string | null;
  key_points: string[] | null;
  decisions: string[] | null;
  action_items: ActionItem[] | null;
  asr_duration_ms: number | null;
  llm_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingListItem {
  id: string;
  filename: string;
  title: string | null;
  status: MeetingStatus;
  duration_seconds: number | null;
  executive_summary: string | null;
  action_item_count: number;
  created_at: string;
}

export interface MeetingStatusResponse {
  meeting_id: string;
  status: MeetingStatus;
  error_message: string | null;
}

export interface UploadResponse {
  meeting_id: string;
  status: MeetingStatus;
}
