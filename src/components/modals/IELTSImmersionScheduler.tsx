import React, { useState } from 'react';
import { Headphones, BookOpen, Mic, PenTool, Lock } from 'lucide-react';

interface SchedulerProps {
  isPremium: boolean;
  onUpgradeClick: () => void;
}

const DAILY_TASKS = [
  { id: 't1', icon: Headphones, label: 'Nghe Podcast (BBC/TED)', duration: '60 phút', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 't2', icon: BookOpen, label: 'Đọc báo (Guardian/Economist)', duration: '60 phút', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 't3', icon: Mic, label: 'Shadowing (Nhại giọng)', duration: '30 phút', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 't4', icon: PenTool, label: 'Viết Journal (Tóm tắt lại ngày)', duration: '30 phút', color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function IELTSImmersionScheduler({ isPremium, onUpgradeClick }: SchedulerProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (id: string) => {
    const next = new Set(completedTasks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedTasks(next);
  };

  const progress = (completedTasks.size / DAILY_TASKS.length) * 100;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl mx-4 mb-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-400 uppercase tracking-widest border border-cyan-500/30">Free Tool</span>
        </div>
        <h2 className="text-xl font-black text-white">IELTS 6.5+ Immersion</h2>
        <p className="text-slate-400 text-xs mt-1">Lịch trình đắm chìm ngôn ngữ 4 tháng.</p>
      </div>

      {/* Daily Checklist */}
      <div className="space-y-3 mb-6">
        {DAILY_TASKS.map((task) => {
          const isDone = completedTasks.has(task.id);
          return (
            <div 
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${isDone ? 'bg-white/10 border-white/20' : 'bg-slate-950/50 border-white/5 hover:border-white/10'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-white/20 text-white' : task.bg + ' ' + task.color}`}>
                <task.icon size={18} />
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-bold transition-colors ${isDone ? 'text-white line-through opacity-50' : 'text-slate-200'}`}>{task.label}</p>
                <p className="text-slate-500 text-[10px] uppercase font-semibold">{task.duration}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`} />
            </div>
          );
        })}
      </div>

      {/* Premium Gate: Analytics */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        {!isPremium && (
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-slate-950/60 flex flex-col items-center justify-center text-center p-4">
            <Lock size={20} className="text-indigo-400 mb-2" />
            <p className="text-white text-xs font-bold mb-3">Mở khóa Phân tích Thói quen & Báo cáo Lộ trình</p>
            <button onClick={onUpgradeClick} className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 active:scale-95 transition-transform">
              Nâng cấp PRO
            </button>
          </div>
        )}
        <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">Tiến độ hôm nay</p>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        <p className="text-white text-xl font-black mt-2">{progress}% <span className="text-slate-500 text-xs font-medium">Hoàn thành</span></p>
      </div>
    </div>
  );
}