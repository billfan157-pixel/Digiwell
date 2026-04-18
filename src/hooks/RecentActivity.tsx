import type { WaterLog } from '@/hooks/useWaterData';
import { History, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface RecentActivityProps {
  waterEntries: WaterLog[];
  handleDeleteEntry: (id: unknown) => Promise<void>;
  isSyncing: boolean;
  setShowHistory: (show: boolean) => void;
  hasPendingCloudSync: boolean;
}

export function RecentActivity({ waterEntries, handleDeleteEntry, isSyncing, setShowHistory, hasPendingCloudSync }: RecentActivityProps) {
  console.log('[RecentActivity] waterEntries:', waterEntries?.length || 0, waterEntries);
  const recentEntries = waterEntries?.slice(0, 3) || [];

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
              <p className="text-sm text-slate-300">{entry.name} <span className="font-bold text-white">{entry.amount}ml</span></p>
              <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
              <button onClick={() => handleDeleteEntry(entry.id)} className="text-slate-600 hover:text-red-500 p-1"><X size={16} /></button>
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