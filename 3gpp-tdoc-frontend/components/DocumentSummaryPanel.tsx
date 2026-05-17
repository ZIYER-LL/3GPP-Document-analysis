"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DocumentSummaryPanel({
  docId,
  initialSummary,
  initialStatus,
}: {
  docId: number;
  initialSummary?: string | null;
  initialStatus?: string | null;
}) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [status, setStatus] = useState(initialStatus || "not_started");
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setStatus("processing");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/${docId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "分析失败");
      }

      setSummary(data.summary_text || "");
      setStatus(data.analysis_status || "done");
    } catch (err: any) {
      setStatus("failed");
      setError(err.message || "分析失败");
    }
  }

  function downloadResult(format: "md" | "docx") {
    window.open(
      `${API_BASE}/api/v1/documents/${docId}/analysis/download?format=${format}`,
      "_blank"
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AI 文稿分析</h2>
          <div className="text-sm text-gray-500">状态：{status}</div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={status === "processing"}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {status === "processing" ? "分析中..." : "生成分析"}
        </button>
      </div>

      {summary ? (
        <div className="rounded-lg bg-gray-50 p-4 text-sm leading-7 whitespace-pre-wrap">
          {summary}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          暂无分析结果
        </div>
      )}

      {error ? (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {summary && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => downloadResult("md")}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            下载 Markdown
          </button>
          <button
            onClick={() => downloadResult("docx")}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            下载 DOCX
          </button>
        </div>
      )}
    </div>
  );
}