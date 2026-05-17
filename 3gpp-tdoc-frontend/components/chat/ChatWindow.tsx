"use client";
import { useEffect, useRef } from "react";
import { Sparkles, User, Hash, Zap, BookOpen, MessageSquareText, ShieldCheck } from "lucide-react";

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading]);

  if (messages.length === 0) {
    return (
      // 关键修复 1: 增加 min-w-0 和 overflow-hidden，确保不会撑开父 flex 容器
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700 relative min-w-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl w-full">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 mx-auto">
            <Sparkles className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
            3GPP 文稿分析助手
          </h2>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4">
            我可以帮您快速解析 TDoc 文稿、对比不同会议的 Agenda 差异，自动生成技术分析报告。
          </p>

          {/* 关键修复 2: grid 布局在窄屏下自动变为单列，防止宽度撑死 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
            {[
              { icon: <Zap size={14} />, title: "快速总结", desc: "分析 TDoc_SA2_156 中的关键决策" },
              { icon: <BookOpen size={14} />, title: "协议对比", desc: "对比 Rel-17 与 18 的架构差异" },
              { icon: <MessageSquareText size={14} />, title: "会议复盘", desc: "基于上传的纪要生成 Action Items" },
              { icon: <ShieldCheck size={14} />, title: "观点分析", desc: "对比不同公司的观点" },
            ].map((item, i) => (
              <div key={i} className="group p-4 rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm text-left hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="text-blue-500">{item.icon}</div>
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">{item.title}</span>
                </div>
                <p className="text-[12px] text-slate-500 leading-snug truncate">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    // 关键修复 3: 最外层必须加 min-w-0
    <div className="h-full overflow-y-auto bg-transparent relative min-w-0">
      <div className="sticky top-0 z-10 h-12 w-full bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-10">
        {messages.map((msg) => {
          const isAi = msg.role === "assistant";
          return (
            <div key={msg.id} className={`flex gap-4 sm:gap-8 group animate-in fade-in slide-in-from-bottom-6 duration-700 ${isAi ? "" : "flex-row-reverse"}`}>
              
              <div className={`shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isAi 
                ? "bg-slate-950 text-white shadow-lg shadow-blue-900/10 ring-4 ring-slate-50" 
                : "bg-white border border-slate-200 text-slate-400"
              }`}>
                {isAi ? <Sparkles size={20} strokeWidth={1.5} /> : <User size={20} strokeWidth={1.5} />}
              </div>

              <div className={`flex-1 min-w-0 space-y-3 ${isAi ? "" : "text-right"}`}>
                <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] ${isAi ? "text-slate-300" : "flex-row-reverse text-slate-300"}`}>
                  {isAi ? "Agent Insight" : "User Request"}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-normal tracking-normal text-slate-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`relative text-[15px] leading-relaxed ${
                  isAi 
                  ? "text-slate-800 font-normal px-1" 
                  : "inline-block text-left bg-slate-950 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm"
                }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>

                  {isAi && msg.parsedTask && (
                    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 overflow-hidden relative min-w-0">
                      <div className="absolute right-0 top-0 p-2 opacity-[0.03] pointer-events-none">
                        <Hash size={60} />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Parsing Context</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 mb-1 uppercase">Target</div>
                          <div className="text-[12px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50 inline-block truncate max-w-full">
                            {msg.parsedTask.task_type}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 mb-1 uppercase">Agenda</div>
                          <div className="text-[12px] font-mono font-bold text-slate-700 italic truncate">
                            #{String(msg.parsedTask.agenda_item)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-8 items-start animate-in fade-in">
            <div className="h-10 w-10 rounded-2xl bg-slate-950 flex items-center justify-center">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
            <div className="flex-1 pt-4">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-12" />
      </div>
      <div className="sticky bottom-0 z-10 h-24 w-full bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none" />
    </div>
  );
}