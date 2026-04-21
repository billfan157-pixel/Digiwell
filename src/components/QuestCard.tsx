import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Gift, Zap, CheckCircle2, Loader2, Sparkles, Flame, Star, Info, Volume2, Award } from 'lucide-react';

import type { UserQuest } from '../config/questConfig';

interface QuestCardProps {
  userQuest: UserQuest;
  onClaim: (id: string) => void | Promise<void>;
  isClaiming?: boolean;
  streak?: number;
}

const rarityStyle: Record<string, { border: string; bg: string; shadow: string }> = {
  common: {
    border: 'border-slate-700',
    bg: 'bg-slate-900/80',
    shadow: '',
  },
  rare: {
    border: 'border-cyan-500/60',
    bg: 'bg-slate-900/80',
    shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
  },
  epic: {
    border: 'border-purple-500/60',
    bg: 'bg-slate-900/80',
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  legendary: {
    border: 'border-yellow-400/80',
    bg: 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-transparent',
    shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
  },
};

// 💥 BURST VARIANTS
const burstVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: [0, 1.5, 1.2, 0],
    opacity: [0, 1, 0.8, 0],
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export const QuestCard: React.FC<QuestCardProps> = ({ userQuest, onClaim, isClaiming = false, streak = 0 }) => {
  const [showBurst, setShowBurst] = useState(false);
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isClaimed = Boolean(userQuest.claimed_at);

  // 🧠 DATA ENGINE
  const baseExp = userQuest.quest.reward_exp;
  const finalExp = baseExp;
  const baseWp = userQuest.quest.reward_coins;
  const finalWp = baseWp;

  const rarity = userQuest.quest.rarity || 'common';

  const style = rarityStyle[rarity];

  // ⚡ COMBO MULTIPLIER & EVOLUTION STATE
  const multiplier = baseExp > 0 ? (finalExp / baseExp).toFixed(1) : "1.0";
  const numMultiplier = parseFloat(multiplier);
  
  let evoState = 'normal';
  if (numMultiplier >= 3.0) evoState = 'hyper';
  else if (numMultiplier >= 1.5) evoState = 'boosted';

  const progress = useMemo(() => {
    if (!userQuest.quest.condition_value) return 0;
    return Math.min((userQuest.progress / userQuest.quest.condition_value) * 100, 100);
  }, [userQuest.progress, userQuest.quest.condition_value]);

  const canClaim = userQuest.status === 'completed' && !isClaimed && !isClaiming;

  // 🎧 SOUND HOOK SYSTEM
  const playSound = (type: 'hover' | 'click' | 'claim' | 'hyper') => {
    // Để cắm sound thật: const audio = new Audio(`/sounds/${type}.mp3`); audio.play();
    // Tạm thời comment lại để sếp tự ghép file audio sau
  };

  const handleClaim = () => {
    playSound(evoState === 'hyper' ? 'hyper' : 'claim');
    setShowBurst(true);
    setFloatingText(`+${finalExp} EXP`);

    setTimeout(() => setFloatingText(null), 1000);
    setTimeout(() => setShowBurst(false), 900);

    onClaim(userQuest.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isClaimed ? { scale: 1.02 } : undefined}
      whileTap={!isClaimed ? { scale: 0.99 } : undefined}
      onMouseEnter={() => !isClaimed && playSound('hover')}
      className={`relative overflow-hidden p-5 rounded-3xl border transition-all duration-300 backdrop-blur-sm ${
        isClaimed
          ? 'bg-slate-800/40 border-slate-700/40 opacity-60 grayscale-[40%]'
          : userQuest.status === 'completed'
            ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-transparent border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
            : `${style.bg} ${style.border} ${style.shadow}`
      }`}
    >
      {/* 🧬 EVOLUTION AURA (HYPER STATE) */}
      {evoState === 'hyper' && !isClaimed && (
        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-[spin_60s_linear_infinite]" />
      )}

      {/* 🌟 LEGENDARY SHIMMER */}
      {rarity === 'legendary' && !isClaimed && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.15),transparent_60%)] animate-pulse" />
      )}

      {/* 💥 BURST FX */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            variants={burstVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className={`w-32 h-32 rounded-full blur-2xl opacity-80 ${evoState === 'hyper' ? 'bg-red-500' : 'bg-yellow-400'}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎁 FLOATING REWARD DAMAGE */}
      <AnimatePresence>
        {floatingText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-3xl pointer-events-none z-30 
              ${evoState === 'hyper' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]'}
            `}
          >
            {floatingText}
            {evoState === 'hyper' && <span className="block text-[10px] text-center text-white mt-1 uppercase tracking-widest">CRITICAL HIT!</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex justify-between items-start gap-4 relative z-10">
        <div className="pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-base ${isClaimed ? 'text-slate-400' : 'text-white'}`}>
              {userQuest.quest.title}
            </h3>
            {(userQuest.quest as any).type === 'weekly' && (
              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-400 uppercase tracking-widest border border-purple-500/30">Tuần</span>
            )}
            {(userQuest.quest as any).type === 'daily' && (
              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-400 uppercase tracking-widest border border-cyan-500/30">Ngày</span>
            )}
            {(userQuest.quest as any).type === 'level' && (
              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-500/20 text-amber-400 uppercase tracking-widest border border-amber-500/30">Vĩnh viễn</span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {userQuest.quest.description}
          </p>

          {/* ⚡ COMBO / STREAK UI */}
          {streak > 0 && !isClaimed && (
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/10 px-2.5 py-1 rounded-md border border-orange-500/30 mt-3 shadow-inner">
              <Flame size={14} className="text-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-400 tracking-wide">
                STREAK {streak} <span className="text-red-400">🔥</span>
              </span>
            </div>
          )}
        </div>

        {/* 🏆 REWARD ZONE + BREAKDOWN TOOLTIP */}
        <div 
          className="text-right shrink-0 relative cursor-help"
          onMouseEnter={() => { setShowBreakdown(true); playSound('hover'); }}
          onMouseLeave={() => setShowBreakdown(false)}
        >
          {/* Main Reward Display */}
          <div className="flex flex-col items-end gap-0.5">
            {evoState !== 'normal' && !isClaimed && (
              <span className="text-[10px] text-slate-500 line-through font-mono">
                {baseExp} EXP
              </span>
            )}
            <div className={`flex items-center justify-end gap-1 font-black text-sm transition-colors
              ${isClaimed ? 'text-slate-500' : evoState === 'hyper' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : evoState === 'boosted' ? 'text-amber-400' : 'text-yellow-400'}
            `}>
              {evoState !== 'normal' && !isClaimed ? <Star size={14} className="fill-current" /> : <Gift size={14} />} 
              +{finalExp} EXP
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 mt-1">
             {evoState !== 'normal' && !isClaimed && (
              <span className="text-[9px] text-slate-500 line-through font-mono">
                {baseWp} WP
              </span>
            )}
            <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isClaimed ? 'text-slate-600' : 'text-cyan-400'}`}>
              <Zap size={12} /> +{finalWp} WP
            </div>
          </div>
          {(userQuest.quest as any).reward_badge_id && (
            <div className={`flex items-center justify-end gap-1 text-[10px] font-bold mt-1 ${isClaimed ? 'text-slate-600' : 'text-fuchsia-400'}`}>
              <Award size={12} /> +Huy hiệu
            </div>
          )}

          {/* 🔍 THE BREAKDOWN PREVIEW (Tooltip) */}
          <AnimatePresence>
            {showBreakdown && !isClaimed && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-48 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 pointer-events-none"
              >
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
                  <Info size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Chi tiết lợi nhuận</span>
                </div>
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Base EXP</span>
                    <span>{baseExp}</span>
                  </div>
                  {rarity !== 'common' && (
                    <div className="flex justify-between text-purple-400">
                      <span>Rarity Bonus</span>
                      <span>x{rarity === 'epic' ? '2.5' : rarity === 'legendary' ? '5.0' : '1.5'}</span>
                    </div>
                  )}
                  {streak > 0 && (
                    <div className="flex justify-between text-orange-400">
                      <span>Streak Buff</span>
                      <span>+{Math.min(streak * 5, 50)}%</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">HỆ SỐ TỔNG</span>
                  <span className="text-xs font-black text-amber-400">x{numMultiplier}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RARITY BADGE */}
      {!isClaimed && (
        <div className="absolute top-3 right-3 text-[9px] px-2 py-1 rounded-full bg-black/60 border border-white/10 uppercase tracking-widest text-slate-300 font-bold z-10 flex items-center gap-1">
          {rarity}
          {evoState === 'hyper' && <span className="text-red-500 animate-pulse">✦</span>}
        </div>
      )}

      {/* PROGRESS */}
      <div className="mt-5 space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-slate-500 uppercase font-bold tracking-wider">Tiến độ</span>
          <span className={userQuest.status === 'completed' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
            {userQuest.progress.toLocaleString()} / {userQuest.quest.condition_value.toLocaleString()}
          </span>
        </div>

        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full absolute left-0 top-0 ${
              userQuest.status === 'completed'
                ? evoState === 'hyper' 
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-purple-600' // Thanh máu Hyper
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500'
                : 'bg-cyan-500'
            }`}
          >
            {userQuest.status === 'completed' && <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] -skew-x-12" />}
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 pt-4 border-t border-white/10 flex justify-end relative z-10">
        {isClaimed ? (
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <CheckCircle2 size={18} />
            Đã nhận thưởng
          </div>
        ) : (
          <motion.button
            whileHover={canClaim ? { scale: 1.04 } : undefined}
            whileTap={canClaim ? { scale: 0.96 } : undefined}
            onClick={handleClaim}
            onMouseEnter={() => canClaim && playSound('hover')}
            disabled={!canClaim || isClaiming}
            className={`px-6 py-2.5 text-xs font-black rounded-xl min-w-[130px]
              flex items-center justify-center gap-2 transition-all relative overflow-hidden group
              ${
                canClaim
                  ? evoState === 'hyper'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/50' // Nút đỏ rực cho Hyper
                    : 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }
            `}
          >
            {/* Shimmer Light on Hover */}
            {canClaim && !isClaiming && (
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            )}
            
            {isClaiming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang nén khí...
              </>
            ) : canClaim ? (
              <>
                {evoState === 'hyper' ? <Volume2 size={14} className="animate-pulse" /> : <Sparkles size={14} />}
                {evoState === 'hyper' ? 'NHẬN SIÊU BUFF' : 'Nhận Thưởng'}
              </>
            ) : (
              'Chưa Đạt'
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export const QuestCardSkeleton = () => (
  <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/70 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-5 w-40 bg-slate-700 rounded"></div>
        <div className="h-3 w-52 bg-slate-700/50 rounded"></div>
      </div>
      <div className="space-y-2 items-end flex flex-col">
        <div className="h-4 w-20 bg-slate-700 rounded"></div>
        <div className="h-3 w-16 bg-slate-700/50 rounded"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-2 w-full bg-slate-700/50 rounded-full"></div>
    </div>
    <div className="flex justify-end pt-4 border-t border-white/10">
      <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
    </div>
  </div>
);