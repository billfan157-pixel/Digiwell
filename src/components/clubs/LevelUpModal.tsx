import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Award } from 'lucide-react';

interface LevelUpModalProps {
  fromLevel: number;
  toLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ fromLevel, toLevel, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/15 blur-[60px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/30">
            <Award size={50} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">LEVEL UP!</h2>
          <p className="text-amber-500 dark:text-amber-300 font-bold text-lg mt-1">Bạn đã đạt cấp độ mới</p>
          
          <div className="flex items-center justify-center gap-4 my-6">
            <span className="text-5xl font-black text-slate-500">{fromLevel}</span>
            <ArrowUp size={32} className="text-emerald-400" />
            <span className="text-7xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]">{toLevel}</span>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">Phần thưởng và thử thách mới đã được mở khóa. Hãy tiếp tục cố gắng nhé!</p>

          <button onClick={onClose} className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-bold active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-white/20">
            Tuyệt vời!
          </button>
        </div>
      </motion.div>
    </div>
  );
}