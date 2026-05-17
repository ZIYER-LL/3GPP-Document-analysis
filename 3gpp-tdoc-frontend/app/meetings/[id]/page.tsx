"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Mic, RefreshCw } from "lucide-react";
import MeetingSummaryPanel from "@/components/meetings/MeetingSummaryPanel";
import TranscriptTimeline from "@/components/meetings/TranscriptTimeline";
import {
  getMeeting,
  getMeetingTranscript,
  startMeetingSummarize,
  startMeetingTranscribe,
  type MeetingRecord,
  type MeetingTranscriptSegment,
} from "@/lib/api/meetings";

type Props = {
  params: Promise<{ id: string }>;
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} 超时，请稍后重试`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function MeetingDetailPage({ params }: Props) {
  const { id: meetingId } = use(params);

  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [segments, setSegments] = useState<MeetingTranscriptSegment[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<"transcribe" | "summarize" | null>(
    null,
  );
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const shouldPoll = useMemo(() => {
    if (!meeting) return false;
    return (
      meeting.status === "transcribing" ||
      meeting.status === "summarizing" ||
      meeting.summary_status === "processing"
    );
  }, [meeting]);

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!meetingId || loadingRef.current) return;

      loadingRef.current = true;
      if (silent) {
        setRefreshing(true);
      } else {
        setPageLoading(true);
      }

      try {
        const meetingData = await withTimeout(
          getMeeting(meetingId),
          8000,
          "会议详情加载",
        );

        if (!mountedRef.current) return;
        setMeeting(meetingData);

        try {
          const transcriptData = await withTimeout(
            getMeetingTranscript(meetingId),
            8000,
            "转写内容加载",
          );
          if (!mountedRef.current) return;
          setSegments(transcriptData.segments || []);
        } catch (transcriptErr) {
          if (!mountedRef.current) return;
          setSegments([]);
          console.warn("Transcript load skipped:", transcriptErr);
        }

        setError("");
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "加载会议详情失败");
      } finally {
        if (!mountedRef.current) return;
        loadingRef.current = false;
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    [meetingId],
  );

  const handleTranscribe = useCallback(async () => {
    try {
      setActionLoading("transcribe");
      setError("");
      await withTimeout(startMeetingTranscribe(meetingId), 10000, "启动转写");
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "开始转写失败");
    } finally {
      if (mountedRef.current) {
        setActionLoading(null);
      }
    }
  }, [meetingId, loadData]);

  const handleSummarize = useCallback(async () => {
    try {
      setActionLoading("summarize");
      setError("");
      await withTimeout(startMeetingSummarize(meetingId), 10000, "启动 AI 纪要");
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "开始生成 AI 纪要失败");
    } finally {
      if (mountedRef.current) {
        setActionLoading(null);
      }
    }
  }, [meetingId, loadData]);

  useEffect(() => {
    setMeeting(null);
    setSegments([]);
    setError("");
    setPageLoading(true);
    loadData();
  }, [meetingId, loadData]);

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      loadData({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [shouldPoll, loadData]);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/meetings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-semibold text-gray-950">
                {meeting?.title || `Meeting #${meetingId}`}
              </h1>
              {refreshing && (
                <RefreshCw size={14} className="animate-spin text-blue-500" />
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              会议详情 · Transcript / AI Summary
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadData()}
              className="ml-auto rounded-lg px-3 py-1 font-medium text-red-700 underline"
            >
              重试
            </button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <section className="min-w-0">
            <div className="mb-4 flex items-center gap-2">
              <Mic size={18} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-950">转写内容</h2>
            </div>

            {pageLoading && !meeting ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                正在加载会议详情...
              </div>
            ) : (
              <TranscriptTimeline segments={segments} />
            )}
          </section>

          <aside>
            {pageLoading && !meeting ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                正在加载纪要面板...
              </div>
            ) : meeting ? (
              <MeetingSummaryPanel
                meeting={meeting}
                onTranscribe={handleTranscribe}
                onSummarize={handleSummarize}
                transcribing={actionLoading === "transcribe"}
                summarizing={actionLoading === "summarize"}
              />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                当前无法显示会议信息。
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}