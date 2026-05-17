"use client";

import { useState } from "react";
import { uploadTdocList } from "@/lib/api";

interface UploadResult {
  job_id?: number | string;
  total_rows?: number;
  success_rows?: number;
  failed_rows?: number;
  message?: string;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "上传失败";
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await uploadTdocList(file);
      setResult(data);
    } catch (err) {
      setError(errorToMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <div className="text-sm text-gray-500">3GPP TDoc Import</div>
        <h1 className="mt-1 text-3xl font-semibold text-gray-900">
          导入 3GPP 文稿清单
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          上传 Excel 清单文件，系统会解析并写入文稿数据库，供后续浏览、分析和 Agent 任务使用。
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              选择清单文件
            </label>
            <input
              type="file"
              accept=".xlsx,.xlsm,.xls"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError("");
                setResult(null);
              }}
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
            />
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            当前文件：<span className="font-medium text-gray-900">{file ? file.name : "未选择"}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "导入中..." : "开始导入"}
            </button>

            {loading && (
              <span className="text-sm text-gray-500">
                正在上传并解析文件，请稍候...
              </span>
            )}
          </div>
        </div>
      </form>

      {result && (
        <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-green-800">导入成功</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-xs text-green-700">Job ID</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {result.job_id ?? "-"}
              </div>
            </div>

            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-xs text-green-700">总行数</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {result.total_rows ?? "-"}
              </div>
            </div>

            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-xs text-green-700">成功行数</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {result.success_rows ?? "-"}
              </div>
            </div>

            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-xs text-green-700">失败行数</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {result.failed_rows ?? "-"}
              </div>
            </div>
          </div>

          {result.message && (
            <div className="mt-4 rounded-xl bg-white/70 p-3 text-sm text-gray-700">
              {result.message}
            </div>
          )}
        </section>
      )}

      {error && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          <div className="font-medium">导入失败</div>
          <div className="mt-1 whitespace-pre-wrap">{error}</div>
        </section>
      )}
    </main>
  );
}