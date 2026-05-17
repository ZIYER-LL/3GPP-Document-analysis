"use client";
import Link from "next/link";
import { Plus, MessageSquare, Database, UploadCloud, ChevronLeft, ChevronRight } from "lucide-react";

export default function ChatSessionsSidebar({ sessions, currentSessionId, onSelectSession, onCreateSession, collapsed, onToggleCollapse }) {
  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-6 flex items-center justify-between">
        {!collapsed && <span className="text-[11px] font-black tracking-[0.2em] text-slate-900 uppercase">Sessions</span>}
        <button onClick={onToggleCollapse} className="p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-500">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="px-3 mb-4">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <Plus size={16} /> {!collapsed && "新建对话"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions.map((s) => {
          const active = currentSessionId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectSession?.(s.id)}
              className={`w-full group flex flex-col p-3 rounded-xl transition-all ${
                active ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={14} className={active ? "text-blue-500" : "text-slate-400"} />
                {!collapsed && (
                  <span className={`text-[13px] truncate font-medium ${active ? "text-slate-950" : "text-slate-600"}`}>
                    {s.title || "新对话"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 工作区底部快捷方式 */}
      {!collapsed && (
        <div className="px-4 mt-4 pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Workspace</p>
          <Link href="/documents" className="flex items-center gap-3 text-[13px] font-medium text-slate-600 hover:text-slate-950 transition-colors">
            <Database size={14} /> 文稿列表
          </Link>
          <Link href="/import" className="flex items-center gap-3 text-[13px] font-medium text-slate-600 hover:text-slate-950 transition-colors">
            <UploadCloud size={14} /> 导入清单
          </Link>
        </div>
      )}
    </div>
  );
}