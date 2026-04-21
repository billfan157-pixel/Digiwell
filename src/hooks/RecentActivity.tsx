import type { WaterLog } from '@/hooks/useWaterData';
import { History, Loader2, X, Edit2, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface RecentActivityProps {
  waterEntries: WaterLog[];
  handleDeleteEntry: (id: unknown) => Promise<void>;
  handleEditEntry?: (id: string, newAmount: number) => Promise<void>;
  isSyncing: boolean;
  setShowHistory: (show: boolean) => void;
  hasPendingCloudSync: boolean;
}

export function RecentActivity({ waterEntries, handleDeleteEntry, handleEditEntry, isSyncing, setShowHistory, hasPendingCloudSync }: RecentActivityProps) {
  console.log('[RecentActivity] waterEntries:', waterEntries?.length || 0, waterEntries);
  const recentEntries = waterEntries?.slice(0, 3) || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  const startEditing = (entry: WaterLog) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount);
  };

  const saveEdit = async (id: string) => {
    if (handleEditEntry && editAmount > 0) {
      await handleEditEntry(id, editAmount);
    }
    setEditingId(null);
  };

  return (
    <div className="pt-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white">Hoạt động gần đây</h2>
        <button onClick={() => setShowHistory(true)} className="text-xs font-bold text-cyan-400 flex items-center gap-1">
          <History size={14} /> Xem tất cả
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {recentEntries.map(entry => (
            <motion.div key={entry.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex justify-between items-center">
              {editingId === entry.id ? (
                <div className="flex items-center gap-3 w-full">
                  <input 
                    type="number" 
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg w-20 outline-none border border-cyan-500/50 focus:border-cyan-400 text-sm"
                    autoFocus
                  />
                  <span className="text-slate-400 text-sm">ml</span>
                  <div className="flex ml-auto gap-1">
                    <button onClick={() => saveEdit(entry.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-md transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{entry.name} <span className="font-bold text-white">{entry.amount}ml</span></p>
                    <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex gap-1">
                    {handleEditEntry && (
                      <button onClick={() => startEditing(entry)} className="text-slate-500 hover:text-cyan-400 p-1.5 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-slate-600 hover:text-red-500 p-1.5 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isSyncing && <div className="text-xs text-slate-500 flex items-center gap-2 justify-center p-2"><Loader2 size={14} className="animate-spin" /> Đang đồng bộ...</div>}
        {hasPendingCloudSync && <div className="text-xs text-amber-500 text-center p-2">Có dữ liệu offline chưa đồng bộ.</div>}
        {waterEntries.length === 0 && !isSyncing && <div className="text-sm text-slate-500 text-center p-8 bg-slate-800/40 rounded-xl border border-dashed border-slate-700">Chưa có dữ liệu hôm nay.</div>}
      </div>
    </div>
  );
}