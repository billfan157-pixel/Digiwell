import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, Sparkles, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSettings } from '../../hooks/useSettings';
import CountUp from '../CountUp';

const THEMES = [
  { id: 't_cyan', name: 'Hồ Thủy Tiên', color: '#06b6d4', price: 0 },
  { id: 't_purple', name: 'Màn Đêm', color: '#a855f7', price: 0 },
  { id: 't_emerald', name: 'Lục Bảo', color: '#10b981', price: 500 },
  { id: 't_rose', name: 'Hoa Hồng', color: '#f43f5e', price: 800 },
  { id: 't_orange', name: 'Hỏa Diệm', color: '#f97316', price: 1000 },
  { id: 't_gold', name: 'Hoàng Kim', color: '#eab308', price: 2000 },
];

export default function ShopModal({ isOpen, onClose, profile, onSpendCoins }: any) {
  const { settings, updateSettings } = useSettings(profile);
  const [purchased, setPurchased] = useState<string[]>(['t_cyan', 't_purple']);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`digiwell_purchased_${profile.id}`);
      if (saved) setPurchased(JSON.parse(saved));
    }
  }, [profile?.id]);

  const handleBuy = async (item: any) => {
    if (purchased.includes(item.id)) {
      updateSettings({ themeColor: item.color });
      toast.success(`Đã áp dụng theme ${item.name}!`);
      return;
    }

    if ((profile?.coins || 0) < item.price) {
      toast.error('Sếp không đủ tiền vàng để mua món này!');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await onSpendCoins(item.price);
      if (success) {
        const newPurchased = [...purchased, item.id];
        setPurchased(newPurchased);
        localStorage.setItem(`digiwell_purchased_${profile.id}`, JSON.stringify(newPurchased));
        updateSettings({ themeColor: item.color });
        toast.success(`🎉 Mua thành công theme ${item.name}!`);
      }
    } catch (err) {
      toast.error('Giao dịch thất bại!');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-0" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><ShoppingBag size={20} /></div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">Cửa Hàng</h2>
              <p className="text-amber-400 text-xs font-bold flex items-center gap-1">Ví: <CountUp value={profile?.coins || 0} /> 🪙</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paintbrush size={16}/> Giao diện (Themes)</h3>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(theme => {
              const isOwned = purchased.includes(theme.id);
              const isEquipped = settings.themeColor === theme.color;
              return (
                <div key={theme.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${isEquipped ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}`}>
                  <div className="w-12 h-12 rounded-full mb-3 shadow-inner border-2 border-slate-900" style={{ backgroundColor: theme.color }} />
                  <p className="text-white font-bold text-sm mb-1">{theme.name}</p>
                  <button disabled={isProcessing || isEquipped} onClick={() => handleBuy(theme)} className={`mt-2 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${isEquipped ? 'bg-slate-700 text-slate-400' : isOwned ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}>
                    {isEquipped ? <><Check size={14}/> Đang dùng</> : isOwned ? 'Sử dụng' : <><Sparkles size={12}/> {theme.price}</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}