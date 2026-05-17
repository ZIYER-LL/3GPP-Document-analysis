const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface MeetingRecord {
  id: number;
  title?: string | null;
  source_type: string;
  original_filename?: string | null;
  language?: string | null;
  duration_seconds?: number | null;
  status: string;
  transcript_text?: string | null;
  summary_text?: string | null;
  summary_status: string;
  summary_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MeetingTranscriptSegment {
  id: number;
  segment_index: number;
  speaker_label?: string | null;
  speaker_name?: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
  created_at?: string | null;
}

export interface MeetingTranscriptResponse {
  meeting_id: number;
  segments: MeetingTranscriptSegment[];
}

export interface MeetingUploadResponse {
  meeting_id: number;
  status: string;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") return payload;

  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("请求超时，请检查后端服务是否可用");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function handleJsonResponse<T>(
  res: Response,
  fallback: string,
): Promise<T> {
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = await res.text();
      } catch {
        payload = null;
      }
    }
    throw new Error(extractErrorMessage(payload, fallback));
  }

  return res.json();
}

export async function getMeetings(): Promise<MeetingRecord[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/meetings`, {
    cache: "no-store",
  });
  return handleJsonResponse<MeetingRecord[]>(res, "获取会议列表失败");
}

export async function getMeeting(
  meetingId: number | string,
): Promise<MeetingRecord> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/meetings/${meetingId}`, {
    cache: "no-store",
  });
  return handleJsonResponse<MeetingRecord>(res, "获取会议详情失败");
}

export async function getMeetingTranscript(
  meetingId: number | string,
): Promise<MeetingTranscriptResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/meetings/${meetingId}/transcript`,
    {
      cache: "no-store",
    },
  );
  return handleJsonResponse<MeetingTranscriptResponse>(
    res,
    "获取会议转写失败",
  );
}

export async function uploadMeetingAudio(
  file: File,
): Promise<MeetingUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/meetings/upload`,
    {
      method: "POST",
      body: formData,
    },
    15000,
  );

  return handleJsonResponse<MeetingUploadResponse>(res, "上传会议文件失败");
}

export async function startMeetingTranscribe(
  meetingId: number | string,
): Promise<MeetingUploadResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/meetings/${meetingId}/transcribe`,
    {
      method: "POST",
    },
    10000,
  );

  return handleJsonResponse<MeetingUploadResponse>(res, "开始转写失败");
}

export async function startMeetingSummarize(
  meetingId: number | string,
): Promise<MeetingUploadResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/meetings/${meetingId}/summarize`,
    {
      method: "POST",
    },
    10000,
  );

  return handleJsonResponse<MeetingUploadResponse>(res, "开始生成 AI 纪要失败");
}