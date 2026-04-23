import React from 'react';
import { History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WaterEntry {
  id: string;
  name: string;
  amount: number;
  created_at: string;
}

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  waterEntries: WaterEntry[];
  waterIntake?: number;
  setEditingEntry?: (entry: WaterEntry | null) => void;
  setEditAmount?: (amount: string) => void;
  handleDeleteEntry: (id: string, amount: number) => void;
}

export default function HistoryModal({ showHistory, setShowHistory, waterEntries, waterIntake, setEditingEntry, setEditAmount, handleDeleteEntry }: HistoryModalProps) {
  

  return (
    <AnimatePresence>
      {showHistory && (
        <div key="history-modal-wrapper" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) setShowHistory(false);
            }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0 sm:hidden" />
            <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><History size={20} /></div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Nhật ký Hydration</h3>
            </div>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X /></button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {waterEntries?.length > 0 ? waterEntries.map((entry, index) => (
              <div key={entry.id || `global-history-item-${index}`} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div><div className="text-white font-bold">{entry.name}</div><div className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleTimeString('vi-VN')}</div></div>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400 font-black">+{entry.amount}ml</span>
                  <button onClick={() => handleDeleteEntry(entry.id, entry.amount)} className="text-rose-500/50 hover:text-rose-500"><X size={18} /></button>
                </div>
              </div>
            )) : (<div className="text-center py-12 text-slate-500 italic">Chưa có dữ liệu hôm nay đệ ơi!</div>)}
          </div>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}