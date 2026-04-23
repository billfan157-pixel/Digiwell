import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Droplet } from 'lucide-react';
import WaterBreakdown from '../WaterBreakdown';
import HydrationTimeline from '../HydrationTimeline';

interface HydrationGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  waterIntake: number;
  hydrationResult: any; // From HydrationEngine
}

export default function HydrationGoalModal({ isOpen, onClose, waterIntake, hydrationResult }: HydrationGoalModalProps) {
  const { goalMl, progress, remaining, breakdownData, scheduleData } = useMemo(() => {
    const goal = hydrationResult?.goalMl || 0;
    const prog = goal > 0 ? (waterIntake / goal) * 100 : 0;
    const rem = Math.max(0, goal - waterIntake);

    return { 
      goalMl: goal, 
      progress: prog, 
      remaining: rem, 
      breakdownData: hydrationResult?.breakdown || null,
      scheduleData: hydrationResult?.schedule || null
    };
  }, [hydrationResult, waterIntake]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="hydration-goal-overlay" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-7 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="absolute -top-1/4 left-0 w-full h-1/2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-white font-black text-xl flex items-center gap-2">
                    <Target size={20} />
                    {hydrationResult && goalMl > 0 ? `Mục tiêu: ${goalMl.toLocaleString('vi-VN')}ml` : 'Chi tiết Mục tiêu'}
                  </h2>
                  <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {!breakdownData ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">Đang tính toán mục tiêu của bạn...</p>
                    <p className="text-slate-500 text-xs mt-2">Vui lòng đảm bảo đã cập nhật thông tin cá nhân.</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Đã uống hôm nay</span>
                      <span className="text-cyan-400 font-bold">{waterIntake.toLocaleString('vi-VN')} / {goalMl.toLocaleString('vi-VN')} ml</span>
                    </div>
                    <div className="relative h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      />
                    </div>
                    <p className="text-center text-amber-400 text-xs font-semibold pt-2">
                      Cần uống thêm {remaining.toLocaleString('vi-VN')} ml để hoàn thành!
                    </p>
                  </div>
                )}
              </div>

              {breakdownData && (
                <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 -mr-2 space-y-8 pb-4 border-t border-white/5 pt-4">
                  <WaterBreakdown breakdown={breakdownData} />
                  {scheduleData && <HydrationTimeline schedule={scheduleData} />}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}