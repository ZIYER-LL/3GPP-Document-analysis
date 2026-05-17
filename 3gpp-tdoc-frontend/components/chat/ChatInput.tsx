"use client";
import { KeyboardEvent, useState } from "react";
import { SendHorizontal } from "lucide-react";

export default function ChatInput({ onSubmit, disabled = false, placeholder = "输入 3GPP 分析任务..." }) {
  const [value, setValue] = useState("");

  const handleSend = async () => {
    if (!value.trim() || disabled) return;
    await onSubmit(value.trim());
    setValue("");
  };

  return (
    <div className="relative group transition-all">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
      <div className="relative flex flex-col rounded-[20px] border border-slate-200 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none disabled:bg-slate-50"
        />

        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {disabled ? "Agent is thinking..." : "Shift + Enter for new line"}
          </span>
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-950 text-white text-[12px] font-bold transition hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            {disabled ? "处理中" : <><SendHorizontal size={14} /> 发送</>}
          </button>
        </div>
      </div>
    </div>
  );
}