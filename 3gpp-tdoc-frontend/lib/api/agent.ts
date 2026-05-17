import type {
  AgentExecuteRequest,
  AgentExecuteResponse,
} from "@/lib/api/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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

export async function executeAgentTask(
  message: string,
): Promise<AgentExecuteResponse> {
  const body: AgentExecuteRequest = { message };

  const response = await fetch(`${API_BASE_URL}/agent/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      // ignore
    }

    throw new Error(
      extractErrorMessage(payload, "任务提交失败，请检查后端接口是否正常。"),
    );
  }

  return (await response.json()) as AgentExecuteResponse;
}