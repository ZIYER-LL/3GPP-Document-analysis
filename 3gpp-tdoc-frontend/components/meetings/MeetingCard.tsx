import Link from "next/link";
import type { MeetingRecord } from "@/lib/api/meetings";

interface MeetingCardProps {
  meeting: MeetingRecord;
}

function statusLabel(status: string) {
  switch (status) {
    case "uploaded":
      return "已上传";
    case "processing":
      return "处理中";
    case "transcribed":
      return "已转写";
    case "done":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "transcribed":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {meeting.title || meeting.original_filename || `Meeting #${meeting.id}`}
          </h3>
          <p className="mt-1 truncate text-sm text-gray-500">
            {meeting.original_filename || "-"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClass(
            meeting.status,
          )}`}
        >
          {statusLabel(meeting.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
        <div>
          <div className="text-xs text-gray-400">语言</div>
          <div className="mt-1 text-gray-900">{meeting.language || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">时长</div>
          <div className="mt-1 text-gray-900">
            {formatDuration(meeting.duration_seconds)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">纪要状态</div>
          <div className="mt-1 text-gray-900">{meeting.summary_status}</div>
        </div>
      </div>
    </Link>
  );
}