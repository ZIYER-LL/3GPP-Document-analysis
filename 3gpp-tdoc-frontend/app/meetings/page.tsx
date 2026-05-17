"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, AlertCircle, Mic, Plus } from "lucide-react";
import MeetingCard from "@/components/meetings/MeetingCard";
import MeetingUploadForm from "@/components/meetings/MeetingUploadForm";
import { getMeetings, type MeetingRecord } from "@/lib/api/meetings";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadMeetings = useCallback(async (silent = false) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getMeetings();
      if (!mountedRef.current) return;

      setMeetings(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "获取会议列表失败");
    } finally {
      if (!mountedRef.current) return;
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings(false);
  }, [loadMeetings]);

  function handleUploaded() {
    setShowUpload(false);
    loadMeetings(true);
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                <Mic size={14} />
                Meeting Intelligence
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">
                会议纪要中心
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                上传会议音频或视频，执行语音转写，并基于 transcript 生成 AI 会议纪要。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowUpload((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Plus size={16} />
                {showUpload ? "收起上传面板" : "上传会议文件"}
              </button>

              <button
                type="button"
                onClick={() => loadMeetings(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                刷新列表
              </button>
            </div>
          </div>
        </section>

        {showUpload && (
          <section className="mt-6">
            <MeetingUploadForm onUploaded={handleUploaded} />
          </section>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadMeetings(false)}
              className="ml-auto rounded-lg px-3 py-1 font-medium underline"
            >
              重试
            </button>
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">历史会议记录</h2>
              <p className="mt-1 text-sm text-gray-500">
                查看会议转写状态与 AI 纪要结果
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
              正在加载会议列表...
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
              当前还没有会议记录。你可以先上传一个会议音频或视频文件。
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}