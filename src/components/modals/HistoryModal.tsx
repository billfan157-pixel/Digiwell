import React from 'react';
import { Droplet, X, Edit2, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type HistoryEntry = {
  id?: string | null;
  timestamp?: number | string | null;
  created_at?: string | null;
  amount?: number | null;
  amount?: number | null;
  name?: string | null;
};

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  waterEntries: HistoryEntry[];
  waterIntake: number;
  setEditingEntry: (entry: HistoryEntry) => void;
  setEditAmount: (amount: string) => void;
  handleDeleteEntry: (id: string, amount: number) => void;
}

const formatEntryTime = (entry: HistoryEntry) => {
  const rawTime = entry.timestamp ?? entry.created_at;

  if (!rawTime) return '--:--';

  const parsed = new Date(rawTime);

  if (Number.isNaN(parsed.getTime())) return '--:--';

  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function HistoryModal({
  showHistory,
  setShowHistory,
  waterEntries,
  waterIntake,
  setEditingEntry,
  setEditAmount,
  handleDeleteEntry
}: HistoryModalProps) {

  if (!showHistory) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={() => setShowHistory(false)}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md rounded-t-[2.5rem] p-6 pb-12 bg-slate-900 border-t border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Nhật ký
            </p>
            <h3 className="text-2xl font-black text-white">
              Lịch sử uống
            </h3>
          </div>
          <button
            onClick={() => setShowHistory(false)}
            className="p-2 rounded-full bg-slate-800 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* EMPTY */}
        {waterEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet size={30} className="text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">
              Hôm nay đệ chưa uống giọt nào...
            </p>
          </div>
        ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
              {[...waterEntries].reverse().map((entry, index) => {
              const timeStr = formatEntryTime(entry);

              // ✅ AMOUNT SAFE (fix bug ||)
              const amount =
                entry.amount ?? entry.amount ?? 0;

              // ✅ KEY SIÊU AN TOÀN (KHÔNG BAO GIỜ TRÙNG)
              const key = `${entry.id ?? 'temp'}-${entry.created_at ?? index}-${index}`;

              return (
                <div
                  key={key}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  {/* ICON */}
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Droplet size={18} className="text-cyan-400" />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <p className="font-black text-white text-lg">
                      {amount}
                      <span className="text-xs text-slate-500 ml-1">ml</span>
                    </p>

                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <Clock size={10} />
                      {timeStr} • {entry.name ?? 'Nước lọc'}
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingEntry(entry);
                        setEditAmount(String(amount));
                        setShowHistory(false);
                      }}
                      className="p-2 rounded-lg bg-slate-800 text-cyan-400"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => {
                        if (!entry.id) return;
                        handleDeleteEntry(entry.id, amount);
                      }}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              Tổng nạp hôm nay
            </p>
            <p className="text-3xl font-black text-white">
              {waterIntake}
              <span className="text-sm text-cyan-500 ml-1">ml</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {waterEntries.length} lần uống
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
