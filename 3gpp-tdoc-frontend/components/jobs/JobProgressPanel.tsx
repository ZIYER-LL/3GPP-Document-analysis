"use client";

import type { JobDetail, JobLogEntry, JobStatus } from "@/lib/api/types";

interface JobProgressPanelProps {
  job: JobDetail;
}

function statusLabel(status: JobStatus) {
  switch (status) {
    case "queued":
      return "排队中";
    case "planning":
      return "规划中";
    case "processing":
      return "处理中";
    case "done":
      return "已完成";
    case "failed":
      return "失败";
    case "pending":
      return "待处理";
    default:
      return status;
  }
}

function statusClassName(status: JobStatus) {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "planning":
      return "bg-purple-100 text-purple-800";
    case "queued":
    case "pending":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function normalizeLog(log: JobLogEntry | string): JobLogEntry {
  if (typeof log === "string") {
    return { message: log };
  }
  return log;
}

export default function JobProgressPanel({ job }: JobProgressPanelProps) {
  const progress = Math.max(0, Math.min(100, job.progress ?? 0));
  const meetingName =
    job.parsed_task?.meeting_list ?? job.source_meeting_name ?? "-";
  const agendaItem =
    job.parsed_task?.agenda_item ?? job.target_agenda_item ?? "-";
  const logs = (job.logs ?? []).slice(-8).map(normalizeLog);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            任务进度
          </div>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            Job #{job.id}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
            job.status,
          )}`}
        >
          {statusLabel(job.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Meeting List</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {meetingName}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Agenda</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {String(agendaItem)}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">已完成 / 总数</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {job.completed_items ?? 0} / {job.total_items ?? 0}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">失败数</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {job.failed_items ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">总体进度</span>
          <span className="text-gray-600">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-medium text-gray-700">用户指令</div>
        <div className="mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-800">
          {job.user_prompt}
        </div>
      </div>

      {job.error_message && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="font-medium">错误信息</div>
          <div className="mt-1 whitespace-pre-wrap">{job.error_message}</div>
        </div>
      )}

      <div className="mt-5">
        <div className="text-sm font-medium text-gray-700">最近日志</div>
        {logs.length === 0 ? (
          <div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
            暂无日志
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {logs.map((log, index) => (
              <div
                key={`${log.created_at ?? "log"}-${index}`}
                className="rounded-xl bg-gray-50 p-3 text-sm text-gray-800"
              >
                <div className="whitespace-pre-wrap">{log.message}</div>
                {log.created_at && (
                  <div className="mt-1 text-xs text-gray-500">
                    {log.created_at}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}