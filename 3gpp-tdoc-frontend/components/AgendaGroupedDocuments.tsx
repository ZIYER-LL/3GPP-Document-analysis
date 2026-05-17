"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DocumentItem = {
  id: number;
  tdoc_id?: string | null;
  title?: string | null;
  source?: string | null;
  doc_role?: string | null;
  agenda?: string | null;
  agenda_item?: string | null;
  agenda_item_desc?: string | null;
  release?: string | null;
  spec?: string | null;
  is_cr?: boolean;
  tdoc_url?: string | null;
};

export default function AgendaGroupedDocuments({
  documents,
}: {
  documents: DocumentItem[];
}) {
  const groupedDocs = useMemo(() => groupByAgendaItem(documents), [documents]);
  const allAgendaItems = useMemo(
    () => Object.keys(groupedDocs).sort(naturalSort),
    [groupedDocs]
  );

  const [selectedAgendaItem, setSelectedAgendaItem] = useState<string>("全部");
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const visibleAgendaItems = useMemo(() => {
    if (selectedAgendaItem === "全部") {
      return allAgendaItems;
    }
    return allAgendaItems.filter((item) => item === selectedAgendaItem);
  }, [allAgendaItems, selectedAgendaItem]);

  function toggleSection(item: string) {
    setCollapsedMap((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const item of allAgendaItems) {
      next[item] = false;
    }
    setCollapsedMap(next);
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const item of allAgendaItems) {
      next[item] = true;
    }
    setCollapsedMap(next);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">文稿列表</h1>
            <p className="text-sm text-gray-600">
              当前按 Agenda Item 分组展示，可筛选并支持分组展开/收起。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">筛选 Agenda Item</label>
              <select
                value={selectedAgendaItem}
                onChange={(e) => setSelectedAgendaItem(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="全部">全部</option>
                {allAgendaItems.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                全部展开
              </button>
              <button
                onClick={collapseAll}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                全部收起
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="mb-3 text-sm font-semibold text-gray-800">
            Agenda Item 导航
          </div>

          <div className="max-h-[70vh] space-y-2 overflow-auto">
            {visibleAgendaItems.length === 0 ? (
              <div className="text-sm text-gray-500">暂无可显示的分组</div>
            ) : (
              visibleAgendaItems.map((item) => {
                const count = groupedDocs[item]?.length || 0;
                return (
                  <a
                    key={item}
                    href={`#${makeAnchorId(item)}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="truncate">{item}</span>
                    <span className="ml-3 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {count}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {visibleAgendaItems.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
              没有匹配当前筛选条件的文稿。
            </div>
          ) : (
            visibleAgendaItems.map((agendaItem) => {
              const docs = groupedDocs[agendaItem] || [];
              const desc =
                docs.find((d) => d.agenda_item_desc)?.agenda_item_desc || "";
              const collapsed = collapsedMap[agendaItem] ?? false;

              return (
                <section
                  id={makeAnchorId(agendaItem)}
                  key={agendaItem}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm scroll-mt-6"
                >
                  <div className="border-b bg-gray-50 px-5 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold">{agendaItem}</h2>
                        {desc ? (
                          <p className="mt-1 text-sm text-gray-600">{desc}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
                          {docs.length} 篇
                        </div>
                        <button
                          onClick={() => toggleSection(agendaItem)}
                          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
                        >
                          {collapsed ? "展开" : "收起"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {!collapsed && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left">
                          <tr>
                            <th className="px-4 py-3">TDoc</th>
                            <th className="px-4 py-3">标题</th>
                            <th className="px-4 py-3">来源</th>
                            <th className="px-4 py-3">类型</th>
                            <th className="px-4 py-3">Release</th>
                            <th className="px-4 py-3">Spec</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc) => (
                            <tr key={doc.id} className="border-t align-top">
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2">
                                  <Link
                                    href={`/documents/${doc.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {doc.tdoc_id || "-"}
                                  </Link>

                                  <Link
                                    href={`/documents/${doc.id}`}
                                    className="inline-flex w-fit items-center rounded-md bg-black px-2.5 py-1 text-xs text-white hover:opacity-90"
                                  >
                                    去分析
                                  </Link>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {doc.title || "-"}
                                </div>
                                {doc.tdoc_url ? (
                                  <a
                                    href={doc.tdoc_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs text-gray-500 hover:text-black"
                                  >
                                    原始链接
                                  </a>
                                ) : null}
                              </td>
                              <td className="px-4 py-3">{doc.source || "-"}</td>
                              <td className="px-4 py-3">
                                {doc.doc_role || "-"}
                              </td>
                              <td className="px-4 py-3">
                                {doc.release || "-"}
                              </td>
                              <td className="px-4 py-3">{doc.spec || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>

    
  );
}

function groupByAgendaItem(documents: DocumentItem[]) {
  const grouped: Record<string, DocumentItem[]> = {};

  for (const doc of documents) {
    const key = (doc.agenda_item || "未分类 Agenda Item").trim();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(doc);
  }

  return grouped;
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function makeAnchorId(value: string) {
  return `agenda-${value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5\-\.]/g, "-")}`;
}