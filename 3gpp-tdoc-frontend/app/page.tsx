import Link from "next/link";
import { 
  FileText, 
  Mic, 
  Database, 
  ArrowRight, 
  Cpu, 
  PlusCircle,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* 顶部微光：模拟 Vercel/Linear 的网格背光感 */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(45%_40%_at_50%_0%,rgba(56,189,248,0.08)_0%,rgba(255,255,255,0)_100%)]" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20">
        
        {/* --- Hero Section: 极致纯净的排版 --- */}
        <section className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-8 animate-fade-in">
            <Sparkles size={14} className="text-blue-500" />
            <span className="text-[12px] font-semibold text-slate-500 tracking-wide">3GPP AI Full-Stack Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-[ -0.04em] text-slate-950 mb-8">
            重新定义文稿分析。
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-500 leading-relaxed font-normal">
            将复杂的 3GPP 协议文稿转化为结构化洞察。
            <br className="hidden md:block" /> 
            集成 AI Agent 工作流与智能会议复盘系统。
          </p>
        </section>

        {/* --- 核心业务区：双柱大卡片 --- */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          
          {/* AI Agent - 采用深邃的“黑洞”风格 */}
          <Link href="/chat" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#000] p-10 transition-all duration-500 hover:shadow-[0_0_80px_-15px_rgba(0,0,0,0.1)]">
            <div className="relative z-10">
              <div className="mb-10 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <Cpu size={24} className="text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-semibold text-white tracking-tight">AI Agent 文稿分析</h2>
              <p className="mt-4 text-slate-400 text-base leading-relaxed">
                自然语言驱动的自动化专家。支持跨文稿对比、Agenda 自动匹配与技术报告批量生成。
              </p>
            </div>

            <div className="relative z-10 mt-16 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-widest">
              进入工作台 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
            
            {/* 渐变装饰 */}
            <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-blue-600/20 blur-[100px] transition-opacity group-hover:opacity-100 opacity-50" />
          </Link>

          {/* AI 会议纪要 - 采用纯净的“苹果”风格 */}
          <Link href="/meetings" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-200 p-10 transition-all duration-500 hover:border-slate-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div>
              <div className="mb-10 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                <Mic size={24} className="text-slate-900" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-semibold text-slate-950 tracking-tight">AI 会议纪要</h2>
              <p className="mt-4 text-slate-500 text-base leading-relaxed">
                秒级生成会议转写与摘要。自动提取技术待办事项，深度解析 3GPP 会议背景与决策逻辑。
              </p>
            </div>

            <div className="mt-16 flex items-center gap-2 text-sm font-bold text-slate-950 uppercase tracking-widest">
              会议中心 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* --- 次级入口：低调而精致的横向布局 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <Link href="/documents" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 transition-colors group-hover:text-blue-600">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">文稿库</h3>
                <p className="text-xs text-slate-400 mt-0.5">浏览与检索系统全量 TDoc 文稿</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link href="/import" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 transition-colors group-hover:text-emerald-600">
                <PlusCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">导入清单</h3>
                <p className="text-xs text-slate-400 mt-0.5">从 Excel 建立 TDoc 索引索引库</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
          </Link>

        </div>

        {/* --- Footer --- */}
        <footer className="mt-32 pt-8 border-t border-slate-100 flex justify-between items-center text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
          <div>System v3.0.4</div>
          <div>© 2026 3GPP Intelligence Platform</div>
        </footer>
      </div>
    </main>
  );
}