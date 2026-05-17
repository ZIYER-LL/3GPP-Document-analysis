"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import JobItemsTable from "@/components/jobs/JobItemsTable";
import JobProgressPanel from "@/components/jobs/JobProgressPanel";
import { getJob, getJobDownloadUrl } from "@/lib/api/jobs";
import type { JobDetail } from "@/lib/api/types";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const jobId = useMemo(() => {
    if (!rawId) return NaN;
    return Number(rawId);
  }, [rawId]);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId)) {
      setLoading(false);
      setError("无效的任务 ID。");
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const fetchJobDetail = async () => {
      try {
        const detail = await getJob(jobId);
        if (cancelled) return;

        setJob(detail);
        setError(null);
        setLoading(false);

        if (detail.status === "done" || detail.status === "failed") {
          if (timer !== null) {
            window.clearInterval(timer);
          }
        }
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "获取任务详情失败。");
        setLoading(false);
      }
    };

    fetchJobDetail();
    timer = window.setInterval(fetchJobDetail, 2000);

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [jobId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-gray-500">任务详情加载中...</div>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="text-sm text-red-700">
            {error ?? "未找到对应任务。"}
          </div>
          <Link
            href="/chat"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            返回聊天页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">3GPP TDoc Agent</div>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            任务详情 #{job.id}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            查看任务进度、子项执行结果、总报告预览与下载入口。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/chat"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            返回聊天页
          </Link>
          <a
            href={getJobDownloadUrl(job.id, "md")}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            下载 Markdown
          </a>
          <a
            href={getJobDownloadUrl(job.id, "docx")}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            下载 DOCX
          </a>
        </div>
      </div>

      <div className="space-y-6">
        <JobProgressPanel job={job} />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">总报告预览</h2>
          <p className="mt-1 text-sm text-gray-500">
            这里展示后端生成的 Markdown 总报告内容。
          </p>

          {job.final_report_md ? (
            <pre className="mt-4 max-h-[560px] overflow-auto rounded-xl bg-gray-50 p-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {job.final_report_md}
            </pre>
          ) : (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              当前还没有总报告内容，可能任务仍在处理中。
            </div>
          )}
        </div>

        <JobItemsTable items={job.items ?? []} />
      </div>
    </main>
  );
}