import type { JobDetail } from "@/lib/api/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface RecentJob {
  id: number;
  user_prompt: string;
  source_meeting_name?: string | null;
  target_agenda_item?: string | number | null;
  status: string;
  progress: number;
  total_items?: number;
  completed_items?: number;
  failed_items?: number;
  created_at?: string;
  updated_at?: string;
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

export async function getJob(jobId: number | string): Promise<JobDetail> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw new Error(extractErrorMessage(payload, "获取任务详情失败"));
  }

  return res.json();
}

export async function getRecentJobs(limit = 20): Promise<RecentJob[]> {
  const res = await fetch(`${API_BASE_URL}/jobs/recent?limit=${limit}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw new Error(extractErrorMessage(payload, "获取历史任务失败"));
  }

  return res.json();
}

export function getJobDownloadUrl(
  jobId: number | string,
  format: "md" | "docx",
): string {
  return `${API_BASE_URL}/jobs/${jobId}/download?format=${format}`;
}