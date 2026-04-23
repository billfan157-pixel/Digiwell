import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Coins, Zap, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
// @ts-ignore
import confetti from 'canvas-confetti';

// --- CẤU HÌNH TỈ LỆ RƠI ĐỒ (DROP RATE) ---
// Weight càng cao, tỉ lệ trúng càng lớn.
const PRIZES = [
  { id: 'c1', name: 'Chúc bạn may mắn lần sau', type: 'nothing', value: 0, rarity: 'common', weight: 400 },
  { id: 'c2', name: '100 WP', type: 'wp', value: 100, rarity: 'common', weight: 300 },
  { id: 'r1', name: 'Hoàn 300 Vàng', type: 'coin', value: 300, rarity: 'rare', weight: 150 },
  { id: 'r2', name: '500 WP', type: 'wp', value: 500, rarity: 'rare', weight: 100 },
  { id: 'e1', name: 'Hoàn 1500 Vàng', type: 'coin', value: 1500, rarity: 'epic', weight: 40 },
  { id: 'e2', name: '2000 WP', type: 'wp', value: 2000, rarity: 'epic', weight: 9 },
  { id: 'l1', name: 'JACKPOT: 10,000 VÀNG!', type: 'coin', value: 10000, rarity: 'legendary', weight: 1 },
];

interface GachaMachineProps {
  profile: any;
  onSpendCoins: (amount: number) => Promise<boolean>;
}

export default function GachaMachine({ profile, onSpendCoins }: GachaMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);

  const handleSpin = async () => {
    if (!profile || profile.coins < 500) {
      toast.error('Sếp không đủ 500 Vàng để quay!');
      return;
    }

    // 1. Trừ tiền trên UI (Hàm onSpendCoins từ App.tsx đã xử lý)
    const success = await onSpendCoins(500);
    if (!success) return;

    setResult(null);
    setIsSpinning(true);

    // 2. Thuật toán Vòng quay nhân phẩm (Weighted Random)
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedPrize = PRIZES[0];
    
    for (const p of PRIZES) {
      if (randomNum < p.weight) {
        selectedPrize = p;
        break;
      }
      randomNum -= p.weight;
    }

    // Kích hoạt rung Haptics liên tục khi đang quay
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    const vibrateInterval = setInterval(() => {
      if (navigator.vibrate) navigator.vibrate(30);
    }, 300);

    // 3. Giả lập thời gian quay (Tạo hồi hộp)
    setTimeout(async () => {
      clearInterval(vibrateInterval);
      if (navigator.vibrate) navigator.vibrate([100, 50, 300]); // Rung mạnh khi mở quà
      setIsSpinning(false);
      setResult(selectedPrize);

      // 4. Lưu phần thưởng vào Database
      const updates: any = {};
      // Vì hàm onSpendCoins đã trừ UI, ta lấy coins hiện tại trừ 500 để lưu DB
      const baseCoinsAfterDeduct = profile.coins - 500;

      if (selectedPrize.type === 'coin' && selectedPrize.value > 0) {
        updates.coins = baseCoinsAfterDeduct + selectedPrize.value;
      } else {
        updates.coins = baseCoinsAfterDeduct;
      }

      if (selectedPrize.type === 'wp' && selectedPrize.value > 0) {
        updates.wp = (profile.wp || 0) + selectedPrize.value;
      }

      await supabase.from('profiles').update(updates).eq('id', profile.id);

      // 5. Hiệu ứng nổ hũ cho các món đồ hiếm
      if (selectedPrize.rarity === 'legendary') {
        confetti({ particleCount: 500, spread: 160, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
        toast.success(`🎉 JACKPOT BÙNG NỔ! Trúng ${selectedPrize.name}`, { duration: 8000 });
      } else if (selectedPrize.rarity === 'epic') {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#a855f7', '#c084fc'] });
        toast.success(`✨ Tuyệt vời! Bạn vừa trúng ${selectedPrize.name}`);
      } else if (selectedPrize.value > 0) {
        toast.success(`Nhận được ${selectedPrize.name}`);
      } else {
        toast.error('Xui quá! Chúc sếp may mắn lần sau 😭');
      }

      // Gửi event để App.tsx refetch lại profile hiển thị UI chuẩn xác
      window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));

    }, 2500); // Quay trong 2.5 giây
  };

  return (
    <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-5 relative overflow-hidden mt-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" size={24} /> Gacha May Mắn
          </h3>
          <p className="text-xs text-slate-400 mt-1">Cơ hội trúng JACKPOT 10,000 Vàng!</p>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
          <Coins size={14} className="text-amber-400" />
          <span className="font-bold text-white text-sm">500</span>
        </div>
      </div>

      {/* Hộp quà Bí ẩn */}
      <div className="h-40 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center relative mb-4">
        <AnimatePresence mode="wait">
          {!isSpinning && !result && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex flex-col items-center">
              <HelpCircle size={48} className="text-slate-600 mb-2 drop-shadow-lg" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sẵn sàng quay</p>
            </motion.div>
          )}
          
          {isSpinning && (
            <motion.div 
              key="spinning" 
              animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 0.4 }} 
              className="flex flex-col items-center text-purple-500 relative z-10"
            >
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-ping" />
              <Gift size={56} className="mb-2 drop-shadow-[0_0_25px_rgba(168,85,247,0.8)] relative z-10" />
            </motion.div>
          )}

          {!isSpinning && result && (
            <motion.div 
              key="result" 
              initial={{ opacity: 0, scale: 0.2, rotate: -180 }} 
              animate={{ opacity: 1, scale: 1, rotate: 0 }} 
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className="flex flex-col items-center text-center px-4 relative z-10"
            >
              {/* Hiệu ứng chớp sáng trắng (Flash) */}
              <motion.div 
                initial={{ opacity: 1, scale: 1 }} 
                animate={{ opacity: 0, scale: 3 }} 
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white rounded-full pointer-events-none z-0"
              />
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 
                ${result.rarity === 'legendary' ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-amber-500/50' : 
                  result.rarity === 'epic' ? 'bg-purple-500/20 border-purple-400 text-purple-400 shadow-purple-500/50' : 
                  result.rarity === 'rare' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-cyan-500/50' : 
                  'bg-slate-800 border-slate-600 text-slate-400'}`}>
                {result.type === 'coin' ? <Coins size={28} /> : result.type === 'wp' ? <Zap size={28} /> : <Gift size={28} />}
              </div>
              <p className={`font-black text-lg ${result.rarity === 'legendary' ? 'text-amber-400' : result.rarity === 'epic' ? 'text-purple-400' : 'text-white'}`}>
                {result.name}
              </p>
              {result.value === 0 && <p className="text-xs text-slate-500 mt-1">Chúc bạn may mắn lần sau!</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nút Quay */}
      <button 
        onClick={handleSpin}
        disabled={isSpinning || profile?.coins < 500}
        className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSpinning ? 'ĐANG CẦU NGUYỆN...' : (
          <>MỞ HỘP QUÀ <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs flex items-center gap-1"><Coins size={12}/> 500</span></>
        )}
      </button>
    </div>
  );
}