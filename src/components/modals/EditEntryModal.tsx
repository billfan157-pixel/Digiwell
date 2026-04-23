import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Minus, Plus } from 'lucide-react';

interface EditEntryModalProps {
  editingEntry: { id: string } | null;
  setEditingEntry: (entry: { id: string } | null) => void;
  editAmount: string | number;
  setEditAmount: (amount: string) => void;
  handleEditEntry: (id: string, newAmount: number) => Promise<void>;
}

export default function EditEntryModal({
  editingEntry,
  setEditingEntry,
  editAmount,
  setEditAmount,
  handleEditEntry
}: EditEntryModalProps) {
  const handleAdjust = (delta: number) => {
    const current = Number(editAmount) || 0;
    const next = Math.max(0, current + delta);
    setEditAmount(String(next));
  };

  return (
    <AnimatePresence>
      {editingEntry && (
        <div key="edit-entry-modal-wrapper" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => { setEditingEntry(null); setEditAmount(''); }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden"
          >
            {/* Glowing Background */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-inner">
                  <Droplet size={24} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">Chỉnh sửa</p>
                  <h3 className="text-xl font-black text-white">Lượng nước</h3>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button onClick={() => handleAdjust(-50)} className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all flex-shrink-0">
                    <Minus size={20} />
                  </button>
                  
                  <div className="relative flex-1">
                    <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl py-4 text-center text-white text-3xl font-black outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600" autoFocus />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">ml</div>
                  </div>

                  <button onClick={() => handleAdjust(50)} className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all flex-shrink-0">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setEditingEntry(null); setEditAmount(''); }} className="flex-1 py-4 rounded-2xl text-slate-300 font-bold text-sm border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all">Huỷ</button>
                <button onClick={() => handleEditEntry(editingEntry.id, Number(editAmount))} className="flex-1 py-4 rounded-2xl font-black text-slate-950 text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>Cập nhật</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}