"use client";

import {
  Sparkles,
  FileText,
  Info,
  PlayCircle,
  Loader2,
  FileAudio,
} from "lucide-react";
import type { MeetingRecord } from "@/lib/api/meetings";

interface MeetingSummaryPanelProps {
  meeting: MeetingRecord;
  onTranscribe?: () => void;
  onSummarize?: () => void;
  transcribing?: boolean;
  summarizing?: boolean;
}

function prettyMeetingStatus(meeting: MeetingRecord) {
  if (meeting.status === "uploaded") return "已上传";
  if (meeting.status === "transcribing") return "转写中";
  if (meeting.status === "transcribed") return "已转写";
  if (meeting.status === "summarizing") return "纪要生成中";
  if (meeting.status === "done") return "已完成";
  if (meeting.status === "failed") return "失败";
  return meeting.status || "-";
}

function prettySummaryStatus(meeting: MeetingRecord) {
  if (meeting.summary_status === "not_started") return "未开始";
  if (meeting.summary_status === "processing") return "生成中";
  if (meeting.summary_status === "done") return "已完成";
  if (meeting.summary_status === "failed") return "失败";
  return meeting.summary_status || "-";
}

export default function MeetingSummaryPanel({
  meeting,
  onTranscribe,
  onSummarize,
  transcribing = false,
  summarizing = false,
}: MeetingSummaryPanelProps) {
  const isTranscribing = transcribing || meeting.status === "transcribing";
  const isSummarizing =
    summarizing ||
    meeting.status === "summarizing" ||
    meeting.summary_status === "processing";

  const canTranscribe = !isTranscribing && !isSummarizing;
  const canSummarize =
    !!meeting.transcript_text && !isTranscribing && !isSummarizing;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-gray-500">
          <Info size={14} />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Meeting Properties
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Original File
            </div>
            <div className="mt-1 truncate text-sm font-medium text-gray-900">
              {meeting.original_filename || "Untitled Media"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
                Length
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {meeting.duration_seconds ?? 0}s
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
                Meeting Status
              </div>
              <div className="mt-1 text-sm font-medium text-blue-600">
                {prettyMeetingStatus(meeting)}
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
                Summary Status
              </div>
              <div className="mt-1 text-sm font-medium text-gray-800">
                {prettySummaryStatus(meeting)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onTranscribe}
            disabled={!canTranscribe}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-gray-950 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isTranscribing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <PlayCircle size={16} />
            )}
            {isTranscribing ? "转写中..." : "开始转写"}
          </button>

          <button
            type="button"
            onClick={onSummarize}
            disabled={!canSummarize}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSummarizing ? (
              <Loader2 size={16} className="animate-spin text-blue-500" />
            ) : (
              <Sparkles size={16} className="text-blue-500" />
            )}
            {isSummarizing ? "生成 AI 纪要中..." : "生成 AI 纪要"}
          </button>

          {!meeting.transcript_text && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
              请先完成转写，再生成 AI 纪要。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-gray-500">
          <FileText size={14} />
          <span className="text-xs font-semibold uppercase tracking-widest">
            AI Meeting Summary
          </span>
        </div>

        {meeting.summary_text ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {meeting.summary_text}
          </div>
        ) : meeting.summary_status === "failed" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {meeting.summary_error || "AI 纪要生成失败。"}
          </div>
        ) : isSummarizing ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 px-6 py-12 text-center">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <div className="mt-3 text-sm font-medium text-gray-700">
              正在生成 AI 纪要...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <FileAudio size={18} className="text-gray-300" />
            <div className="mt-3 text-sm text-gray-500">
              当前还没有 AI 纪要
            </div>
          </div>
        )}
      </section>
    </div>
  );
}