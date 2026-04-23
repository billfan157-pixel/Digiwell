import React, { useState, useEffect, useCallback } from 'react';
import { X, Swords, Coins, Shield, UserPlus, Flame, Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Profile, Battle } from '../../models';

interface BattleArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSpendCoins: (amount: number) => Promise<boolean>;
}

export default function BattleArenaModal({ isOpen, onClose, profile, onSpendCoins }: BattleArenaModalProps) {
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Battle[]>([]);
  const [opponents, setOpponents] = useState<Partial<Profile>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(100);

  const loadArenaData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    
    try {
      // 1. Lấy các trận đấu liên quan đến User
      const { data: battles, error } = await supabase
        .from('hydration_battles')
        .select(`
          *,
          challenger:profiles!challenger_id(id, nickname, avatar_url, water_today, water_goal),
          opponent:profiles!opponent_id(id, nickname, avatar_url, water_today, water_goal)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      // Lọc trận đấu Đang diễn ra
      let currentActive = battles?.find((b: Battle) => b.status === 'active');
      
      // --- THUẬT TOÁN TRỌNG TÀI (LAZY RESOLVE) ---
      // Nếu có trận đang active nhưng tạo từ hôm qua -> Kết thúc ngay lập tức và trao thưởng
      if (currentActive) {
        const battleDay = new Date(currentActive.created_at).toISOString().split('T')[0];
        if (battleDay < today) {
          
          // Gọi hàm bảo mật chạy trên Backend để xử lý tính toán & trao thưởng
          const { data: result, error } = await supabase.rpc('resolve_stale_battle', {
            battle_id: currentActive.id
          });

          if (!error && result) {
            if (result.status === 'won') {
              toast.success(`🎉 Trận hôm qua đã kết thúc. Bạn THẮNG và ẵm trọn ${result.reward} Vàng!`, { duration: 8000 });
            } else if (result.status === 'draw') {
              toast.info(`Trận đấu hôm qua HÒA. Đã hoàn trả ${result.reward} Vàng.`);
            } else if (result.status === 'lost') {
              toast.error(`Thua cuộc! Đối thủ đã uống nhiều hơn bạn vào hôm qua.`);
            }
          } else {
            console.error('Lỗi khi chốt kết quả trận đấu:', error);
          }
          
          currentActive = null; // Trận đấu đã kết thúc, clear khỏi UI
        }
      }

      setActiveBattle(currentActive);
      
      // Lọc danh sách Lời mời đến
      setPendingInvites(battles?.filter((b: Battle) => b.status === 'pending' && b.opponent_id === profile.id) || []);

      // 2. Tải danh sách người dùng để thách đấu (Gợi ý ngẫu nhiên)
      if (!currentActive) {
        const { data: users } = await supabase.from('profiles').select('id, nickname, level, avatar_url').neq('id', profile.id).limit(10);
        setOpponents(users || []);
      }

    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu Đấu trường');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) loadArenaData();
  }, [isOpen, loadArenaData]);

  // --- GỬI LỜI MỜI THÁCH ĐẤU ---
  const handleChallenge = async (opponentId: string) => {
    if (!profile) return;
    if (profile.coins < stakeAmount) return toast.error('Không đủ Vàng để cược!');
    const success = await onSpendCoins(stakeAmount);
    if (!success) return;

    const tid = toast.loading('Đang rải chiến thư...');
    try {
      await supabase.from('hydration_battles').insert({
        challenger_id: profile?.id, opponent_id: opponentId, stake_coins: stakeAmount, status: 'pending'
      });
      toast.success('Đã gửi chiến thư!', { id: tid });
      loadArenaData();
    } catch (err) {
      toast.error('Lỗi gửi thách đấu', { id: tid });
    }
  };

  // --- CHẤP NHẬN LỜI MỜI ---
  const handleAccept = async (battle: Battle) => {
    if (!profile) return;
    if (profile.coins < battle.stake_coins) return toast.error('Sếp không đủ Vàng để theo cược!');
    const success = await onSpendCoins(battle.stake_coins);
    if (!success) return;

    const tid = toast.loading('Đang lên đài...');
    try {
      // Cập nhật trạng thái trận đấu
      await supabase.from('hydration_battles').update({ status: 'active' }).eq('id', battle.id);
      
      // Hủy bỏ các lời mời khác (Chỉ được đánh 1 trận 1 lúc)
      const otherPending = pendingInvites.filter((b: Battle) => b.id !== battle.id);
      for (const p of otherPending) {
        await supabase.from('hydration_battles').update({ status: 'declined' }).eq('id', p.id);
      }

      toast.success('🔥 Bắt đầu cuộc đua!', { id: tid });
      loadArenaData();
    } catch (err) {
      toast.error('Lỗi vào trận', { id: tid });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(225,29,72,0.15)] relative overflow-hidden"
      >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Swords className="text-rose-500" /> Đấu Trường
            </h2>
            <p className="text-xs text-slate-400 mt-1">Uống nước đua Top - Cướp vàng bạn bè</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-rose-500" size={32} /></div>
        ) : (
          <div className="relative z-10">
            {/* 1. TRẠNG THÁI ĐANG TRONG TRẬN ĐẤU */}
            {activeBattle ? (
              <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 mb-4 relative overflow-hidden">
                <div className="text-center mb-4">
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Đang tranh tài • Cược {activeBattle.stake_coins} 💰
                  </span>
                </div>

                <div className="flex justify-between items-end h-48 mt-8 px-2 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"><Swords size={60} className="text-amber-500" /></div>
                  
                  {/* Cột người chơi 1 (Challenger) */}
                  <div className="flex flex-col items-center gap-3 w-1/3 relative">
                    {((activeBattle.challenger?.water_today || 0) >= (activeBattle.opponent?.water_today || 0)) && (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute -top-6">
                        <Flame className={`${activeBattle.challenger_id === profile?.id ? 'text-cyan-400' : 'text-rose-400'} drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]`} size={20} />
                      </motion.div>
                    )}
                    <div className="text-xs font-bold text-slate-400">{Math.round(((activeBattle.challenger?.water_today || 0) / (activeBattle.challenger?.water_goal || 1)) * 100)}%</div>
                    <div className="w-10 h-32 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700 shadow-inner">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${Math.min(((activeBattle.challenger?.water_today || 0) / (activeBattle.challenger?.water_goal || 1)) * 100, 100)}%` }} 
                        className={`absolute bottom-0 w-full ${activeBattle.challenger_id === profile?.id ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]'}`} 
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm truncate w-20">{activeBattle.challenger?.nickname}</p>
                      <p className="text-xs text-slate-500">{activeBattle.challenger?.water_today}ml</p>
                    </div>
                  </div>

                  {/* Cột người chơi 2 (Opponent) */}
                  <div className="flex flex-col items-center gap-3 w-1/3 relative">
                    {((activeBattle.opponent?.water_today || 0) > (activeBattle.challenger?.water_today || 0)) && (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute -top-6">
                        <Flame className={`${activeBattle.opponent_id === profile?.id ? 'text-cyan-400' : 'text-rose-400'} drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]`} size={20} />
                      </motion.div>
                    )}
                    <div className="text-xs font-bold text-slate-400">{Math.round(((activeBattle.opponent?.water_today || 0) / (activeBattle.opponent?.water_goal || 1)) * 100)}%</div>
                    <div className="w-10 h-32 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700 shadow-inner">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${Math.min(((activeBattle.opponent?.water_today || 0) / (activeBattle.opponent?.water_goal || 1)) * 100, 100)}%` }} 
                        className={`absolute bottom-0 w-full ${activeBattle.opponent_id === profile?.id ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]'}`} 
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm truncate w-20">{activeBattle.opponent?.nickname}</p>
                      <p className="text-xs text-slate-500">{activeBattle.opponent?.water_today}ml</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Trận đấu sẽ phân định thắng thua vào cuối ngày.</p>
              </div>
            ) : (
              <>
                {/* 2. HIỂN THỊ LỜI MỜI (NẾU CÓ) */}
                {pendingInvites.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-3 flex items-center gap-2"><Shield size={12}/> Thư khiêu chiến</p>
                    <div className="space-y-2">
                      {pendingInvites.map(invite => (
                        <div key={invite.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-white"><span className="text-amber-400">{invite.challenger?.nickname}</span> muốn so tài!</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Coins size={10} className="text-amber-400"/> Cược: {invite.stake_coins} Vàng</p>
                          </div>
                          <button onClick={() => handleAccept(invite)} className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-lg active:scale-95 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            Nhận kèo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. TÌM ĐỐI THỦ THÁCH ĐẤU */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><UserPlus size={12}/> Tìm đối thủ</p>
                    
                    {/* Nơi chọn mức cược */}
                    <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-500 px-2">Cược:</span>
                      {[50, 100, 500].map(amt => (
                        <button 
                          key={amt} 
                          onClick={() => setStakeAmount(amt)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${stakeAmount === amt ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {opponents.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-4">Chưa tìm thấy ai trên hệ thống.</p>
                    ) : (
                      opponents.map(user => (
                        <div key={user.id} className="bg-slate-800/40 border border-slate-700/50 hover:border-rose-500/30 transition-colors rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-black text-slate-400">{user.nickname?.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold text-white">{user.nickname}</p>
                              <p className="text-xs text-slate-500">Lv {user.level || 1} • Sẵn sàng</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => user.id && handleChallenge(user.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-95 transition-all"
                          >
                            <Swords size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}