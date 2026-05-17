"use client";

import { useState } from "react";
import { uploadMeetingAudio } from "@/lib/api/meetings";

interface MeetingUploadFormProps {
  onUploaded?: (meetingId: number) => void;
}

export default function MeetingUploadForm({
  onUploaded,
}: MeetingUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await uploadMeetingAudio(file);
      setSuccessMessage(
        `上传成功，会议 #${result.meeting_id} 已创建。请进入详情页后手动点击“开始转写”。`,
      );
      setFile(null);
      onUploaded?.(result.meeting_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">上传会议录音</h2>
        <p className="mt-1 text-sm text-gray-500">
          支持 mp3、wav、m4a、mp4、aac。上传后可分两步执行：先转写，再生成 AI 纪要。
        </p>
      </div>

      <input
        type="file"
        accept=".mp3,.wav,.m4a,.mp4,.aac,audio/*,video/*"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
          setError("");
          setSuccessMessage("");
        }}
        className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
      />

      <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
        当前文件：{" "}
        <span className="font-medium text-gray-900">
          {file ? file.name : "未选择"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={!file || submitting}
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "上传中..." : "上传会议文件"}
        </button>
      </div>

      {successMessage && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}