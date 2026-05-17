"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  Mic,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
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

interface MeetingDetailClientProps {
  meetingId: string;
}

export default function MeetingDetailClient({
  meetingId,
}: MeetingDetailClientProps) {
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [segments, setSegments] = useState<MeetingTranscriptSegment[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "transcribe" | "summarize" | null
  >(null);
  const [error, setError] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (!meetingId || inFlightRef.current) return;

      inFlightRef.current = true;

      if (silent) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const meetingData = await getMeeting(meetingId);
        if (!mountedRef.current) return;
        setMeeting(meetingData);

        try {
          const transcriptData = await getMeetingTranscript(meetingId);
          if (!mountedRef.current) return;
          setSegments(transcriptData.segments || []);
        } catch {
          if (!mountedRef.current) return;
          setSegments([]);
        }

        setError("");
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "获取会议详情失败");
      } finally {
        if (!mountedRef.current) return;
        inFlightRef.current = false;
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [meetingId],
  );

  useEffect(() => {
    setMeeting(null);
    setSegments([]);
    setError("");
    setInitialLoading(true);
    loadData(false);
  }, [meetingId, loadData]);

  const shouldPoll =
    !!meeting &&
    (meeting.status === "transcribing" ||
      meeting.status === "summarizing" ||
      meeting.summary_status === "processing");

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      loadData(true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [shouldPoll, loadData]);

  const handleTranscribe = useCallback(async () => {
    try {
      setActionLoading("transcribe");
      setError("");
      await startMeetingTranscribe(meetingId);
      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "开始转写失败");
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [meetingId, loadData]);

  const handleSummarize = useCallback(async () => {
    try {
      setActionLoading("summarize");
      setError("");
      await startMeetingSummarize(meetingId);
      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "开始生成 AI 纪要失败");
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, [meetingId, loadData]);

  if (initialLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Init Meeting Workspace...
        </p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "会议不存在或加载失败。"}
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-white">
      {error && (
        <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-8 py-2 text-xs font-bold text-red-600">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={() => loadData(false)} className="ml-auto underline">
            重试
          </button>
        </div>
      )}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/meetings"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-900">
                {meeting.title || "Meeting Workspace"}
              </h1>
              {refreshing && shouldPoll && (
                <RefreshCw size={12} className="animate-spin text-blue-500" />
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>ID: {meetingId.slice(0, 8)}</span>
              <ChevronRight size={10} />
              <span
                className={
                  meeting.status === "done"
                    ? "text-emerald-500"
                    : "text-blue-500"
                }
              >
                {meeting.status || "syncing"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="mx-auto max-w-4xl px-8 py-12">
            <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-slate-900">
                  <Mic size={20} className="text-blue-500" /> Transcript
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Real-time Analysis
                </p>
              </div>
            </div>

            <TranscriptTimeline segments={segments} />
          </div>
        </div>

        <aside className="hidden w-[420px] shrink-0 overflow-y-auto border-l border-slate-100 bg-white xl:block">
          <div className="p-8">
            <MeetingSummaryPanel
              meeting={meeting}
              onTranscribe={handleTranscribe}
              onSummarize={handleSummarize}
              transcribing={actionLoading === "transcribe"}
              summarizing={actionLoading === "summarize"}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}