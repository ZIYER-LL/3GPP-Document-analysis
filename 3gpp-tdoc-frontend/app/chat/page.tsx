"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ChatInput from "@/components/chat/ChatInput";
import ChatSessionsSidebar from "@/components/chat/ChatSessionsSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import JobItemsTable from "@/components/jobs/JobItemsTable";
import JobProgressPanel from "@/components/jobs/JobProgressPanel";
import { 
  Plus, 
  PanelRight, 
  FileText, 
  Download, 
  ExternalLink,
  Activity
} from "lucide-react";
import { 
  createChatSession, 
  getChatMessages, 
  getChatSessions, 
  sendChatMessage, 
  type ChatSessionSummary, 
  type StoredChatMessage 
} from "@/lib/api/chat";
import { getJob, getJobDownloadUrl } from "@/lib/api/jobs";
import type { ChatMessage, JobDetail } from "@/lib/api/types";

function toUiMessage(message: StoredChatMessage): ChatMessage {
  return {
    id: String(message.id),
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
    jobId: message.related_job_id ?? undefined,
  };
}

function findLatestRelatedJobId(messages: StoredChatMessage[]): number | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].related_job_id) return messages[i].related_job_id;
  }
  return null;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [storedMessages, setStoredMessages] = useState<StoredChatMessage[]>([]);
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sessionTitle = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId)?.title ?? "新会话";
  }, [sessions, currentSessionId]);

  async function refreshSessions(selectLatestIfNeeded = false) {
    try {
      const data = await getChatSessions();
      setSessions(data);
      if (data.length > 0 && (selectLatestIfNeeded || currentSessionId === null)) {
        setCurrentSessionId((prev) => prev ?? data[0].id);
      }
    } catch (e) { console.error("Refresh sessions failed", e); }
  }

  async function loadSession(sessionId: number) {
    setLoadingSession(true);
    try {
      const data = await getChatMessages(sessionId);
      setStoredMessages(data);
      setMessages(data.map(toUiMessage));
      const latestJobId = findLatestRelatedJobId(data);
      setCurrentJobId(latestJobId);
      if (latestJobId) {
        const job = await getJob(latestJobId);
        setCurrentJob(job);
      } else { setCurrentJob(null); }
    } catch (e) { console.error("Load session failed", e); }
    finally { setLoadingSession(false); }
  }

  async function handleCreateSession() {
    console.log("Creating new session..."); // 先加个 log 调试
    try {
      const session = await createChatSession();
      await refreshSessions();
      setCurrentSessionId(session.id); // 切换到新 ID
      setMessages([]); // 清空当前消息流
      setCurrentJob(null); // 清空右侧面板
    } catch (e) {
      console.error("Create session failed", e);
    }
  }

  async function handleSubmit(value: string) {
    let sessionId = currentSessionId;
    try {
      if (!sessionId) {
        const created = await createChatSession();
        sessionId = created.id;
        setCurrentSessionId(created.id);
        await refreshSessions();
      }
      setIsSending(true);
      const result = await sendChatMessage(sessionId, value);
      const nextStored = [...storedMessages, result.user_message, result.assistant_message];
      setStoredMessages(nextStored);
      setMessages(nextStored.map(toUiMessage));
      if (result.created_job_id) setCurrentJobId(result.created_job_id);
    } catch (e) { console.error("Send message failed", e); }
    finally { setIsSending(false); }
  }

  useEffect(() => { refreshSessions(true); }, []);
  useEffect(() => { if (currentSessionId) loadSession(currentSessionId); }, [currentSessionId]);

  useEffect(() => {
    if (!currentJobId) return;
    const timer = setInterval(async () => {
      try {
        const job = await getJob(currentJobId);
        setCurrentJob(job);
        if (job.status === "done" || job.status === "failed") clearInterval(timer);
      } catch (e) { clearInterval(timer); }
    }, 3000);
    return () => clearInterval(timer);
  }, [currentJobId]);

  return (
    <main className="h-[calc(100vh-64px)] w-full overflow-hidden bg-white flex">
      {/* 侧边栏 */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 border-r border-slate-100 bg-slate-50/50 flex-shrink-0`}>
        <ChatSessionsSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onCreateSession={handleCreateSession}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* 主对话区 */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight truncate max-w-[300px]">
              {sessionTitle}
            </h2>
            {loadingSession && <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            3GPP Intelligence Agent
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} isLoading={isSending} />
        </div>

        <div className="p-6 bg-white border-t border-slate-50">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSubmit={handleSubmit} disabled={isSending || loadingSession} />
          </div>
        </div>
      </div>

      {/* 任务检查器面板 */}
      <aside className="w-[380px] border-l border-slate-100 bg-slate-50/30 overflow-y-auto hidden 2xl:block flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-900">
            <PanelRight size={16} strokeWidth={2} className="text-slate-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">Inspector / 任务状态</h3>
          </div>

          {currentJob ? (
            <div className="space-y-6">
              <JobProgressPanel job={currentJob} />
              
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <h4 className="text-[12px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" /> 报告输出控制台
                </h4>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <a href={getJobDownloadUrl(currentJob.id, "md")} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Download size={12} /> MARKDOWN
                  </a>
                  <a href={getJobDownloadUrl(currentJob.id, "docx")} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-950 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors">
                    <Download size={12} /> DOCX EXPORT
                  </a>
                </div>

                {currentJob.final_report_md && (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 mb-4">
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500 font-mono italic">
                      {currentJob.final_report_md.substring(0, 500)}...
                    </pre>
                  </div>
                )}

                <Link href={`/jobs/${currentJob.id}`} className="flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-tighter hover:underline">
                  View Full Audit Log <ExternalLink size={10} />
                </Link>
              </div>

              <JobItemsTable items={currentJob.items ?? []} />
            </div>
          ) : (
            <div className="mt-32 text-center px-10">
              <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                等待任务指令... <br/> 成功识别 TDoc 分析请求后，此处将激活实时监控面板。
              </p>
            </div>
          )}
        </div>
      </aside>
    </main>
  );
}