const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface ChatSessionSummary {
  id: number;
  title: string;
  latest_job_id?: number | null;
  preview?: string;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
}

export interface StoredChatMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  related_job_id?: number | null;
  created_at?: string;
}

export interface SendChatMessageResponse {
  session: ChatSessionSummary;
  user_message: StoredChatMessage;
  assistant_message: StoredChatMessage;
  created_job_id?: number | null;
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

async function handleJsonResponse<T>(res: Response, fallback: string): Promise<T> {
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

export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
    cache: "no-store",
  });
  return handleJsonResponse<ChatSessionSummary[]>(res, "获取会话列表失败");
}

export async function createChatSession(
  title?: string,
): Promise<ChatSessionSummary> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  const data = await handleJsonResponse<{ session: ChatSessionSummary }>(
    res,
    "创建会话失败",
  );
  return data.session;
}

export async function getChatMessages(
  sessionId: number | string,
): Promise<StoredChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    cache: "no-store",
  });
  return handleJsonResponse<StoredChatMessage[]>(res, "获取会话消息失败");
}

export async function sendChatMessage(
  sessionId: number | string,
  content: string,
): Promise<SendChatMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  return handleJsonResponse<SendChatMessageResponse>(res, "发送消息失败");
}