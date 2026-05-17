"use client";

import Link from "next/link";

interface RecentJob {
  id: number;
  user_prompt: string;
  source_meeting_name?: string | null;
  target_agenda_item?: string | number | null;
  status: string;
  progress: number;
  created_at?: string;
}

interface RecentJobsSidebarProps {
  jobs: RecentJob[];
  currentJobId?: number | null;
  onSelectJob?: (jobId: number) => void;
  collapsed?: boolean;
}

function statusLabel(status: string) {
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
    default:
      return status;
  }
}

function statusDotClass(status: string) {
  switch (status) {
    case "done":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    case "processing":
      return "bg-blue-500";
    case "planning":
      return "bg-purple-500";
    case "queued":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
}

export default function RecentJobsSidebar({
  jobs,
  currentJobId,
  onSelectJob,
  collapsed = false,
}: RecentJobsSidebarProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-3 py-4 text-center">
          <div className="text-xs font-semibold tracking-wide text-gray-500">
            任务
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {jobs.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-2 py-3 text-center text-xs text-gray-400">
              无
            </div>
          ) : (
            jobs.map((job) => {
              const active = currentJobId === job.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onSelectJob?.(job.id)}
                  title={`Job #${job.id} · ${statusLabel(job.status)}`}
                  className={`flex w-full flex-col items-center rounded-xl border px-2 py-3 text-center transition ${
                    active
                      ? "border-gray-900 bg-gray-100"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`mb-2 h-2.5 w-2.5 rounded-full ${statusDotClass(
                      job.status,
                    )}`}
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    #{job.id}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="text-base font-semibold text-gray-900">历史任务</h2>
        <p className="mt-1 text-xs text-gray-500">
          快速查看并切换之前执行过的分析任务
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {jobs.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
            还没有历史任务
          </div>
        ) : (
          jobs.map((job) => {
            const active = currentJobId === job.id;

            return (
              <div
                key={job.id}
                className={`rounded-xl border p-3 transition ${
                  active
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectJob?.(job.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Job #{job.id}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusDotClass(
                          job.status,
                        )}`}
                      />
                      <span className="text-xs text-gray-500">
                        {statusLabel(job.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm text-gray-700">
                    {job.user_prompt}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {job.source_meeting_name || "-"} / Agenda{" "}
                    {job.target_agenda_item ?? "-"}
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all"
                      style={{ width: `${job.progress || 0}%` }}
                    />
                  </div>
                </button>

                <div className="mt-3">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    打开详情页
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}