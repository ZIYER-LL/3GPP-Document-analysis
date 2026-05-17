"use client";

import Link from "next/link";
import type { JobItem, JobStatus, StepStatus } from "@/lib/api/types";

interface JobItemsTableProps {
  items: JobItem[];
}

function badgeClass(status?: JobStatus | StepStatus) {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "planning":
      return "bg-purple-100 text-purple-800";
    case "queued":
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "skipped":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusLabel(status?: string | null) {
  if (!status) return "-";

  switch (status) {
    case "queued":
      return "排队中";
    case "planning":
      return "规划中";
    case "processing":
      return "处理中";
    case "done":
      return "完成";
    case "failed":
      return "失败";
    case "pending":
      return "待处理";
    case "skipped":
      return "跳过";
    default:
      return status;
  }
}

export default function JobItemsTable({ items }: JobItemsTableProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-gray-500">当前任务还没有子项数据。</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900">文稿子任务</h3>
        <p className="mt-1 text-sm text-gray-500">
          展示每篇文稿的处理状态、步骤状态与摘要结果。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">TDoc</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">下载</th>
              <th className="px-4 py-3 font-medium">提取</th>
              <th className="px-4 py-3 font-medium">摘要</th>
              <th className="px-4 py-3 font-medium">摘要预览</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4 text-gray-500">
                  {item.order_index ?? index + 1}
                </td>

                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">{item.title}</div>

                  {item.document_id ? (
                    <Link
                      href={`/documents/${item.document_id}`}
                      className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-700"
                    >
                      查看文稿详情
                    </Link>
                  ) : null}

                  {item.error_message && (
                    <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                      {item.error_message}
                    </div>
                  )}
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {item.tdoc_id ?? "-"}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                      item.status,
                    )}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                      item.download_status,
                    )}`}
                  >
                    {statusLabel(item.download_status)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                      item.extract_status,
                    )}`}
                  >
                    {statusLabel(item.extract_status)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                      item.summary_status,
                    )}`}
                  >
                    {statusLabel(item.summary_status)}
                  </span>
                </td>

                <td className="max-w-sm px-4 py-4 text-gray-700">
                  {item.summary_text ? (
                    <div className="line-clamp-4 whitespace-pre-wrap">
                      {item.summary_text}
                    </div>
                  ) : (
                    <span className="text-gray-400">暂无摘要</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}