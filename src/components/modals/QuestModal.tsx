import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Trophy,
  Target,
  X,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { playSuccessSound } from '@/lib/audio';
import { QuestCard, QuestCardSkeleton } from '@/components/QuestCard';
import { useQuests } from '@/hooks/useQuests';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  streak: number;
  onRewardClaimed: (exp: number, wp: number) => void;
}

type QuestFilter = 'daily' | 'weekly' | 'level';

const tabConfig = {
  daily: {
    label: 'Hàng ngày',
    icon: Calendar,
  },
  weekly: {
    label: 'Hàng tuần',
    icon: Target,
  },
  level: {
    label: 'Thành tựu',
    icon: Trophy,
  },
};

export default function QuestModal({
  isOpen,
  onClose,
  userId,
  streak,
  onRewardClaimed,
}: QuestModalProps) {
  const [filter, setFilter] = useState<QuestFilter>('daily');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { quests, loading, claimQuest } = useQuests(userId, 1);

  const visibleQuests = useMemo(() => {
    const filtered = quests.filter(q => q.quest?.type === filter);
    
    // Sắp xếp ưu tiên: Hoàn thành chưa nhận thưởng > Đang thực hiện > Đã nhận thưởng
    return filtered.sort((a, b) => {
      const getPriority = (status: string) => {
        if (status === 'completed') return 0; // Ưu tiên 1: Đã xong, chờ nhận thưởng
        if (status === 'active') return 1;    // Ưu tiên 2: Đang làm
        if (status === 'claimed') return 2;   // Ưu tiên 3: Đã nhận thưởng (cuối cùng)
        return 3;
      };
      
      return getPriority(a.status) - getPriority(b.status);
    });
  }, [quests, filter]);

  const currentTabQuests = quests.filter(q => q.quest?.type === filter);
  const totalCount = currentTabQuests.length;
  const completedCount = currentTabQuests.filter(q => q.status === 'claimed').length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const pendingCount = totalCount - completedCount;

  const handleClaimReward = async (userQuestId: string) => {
    if (claimingId) return;

    const quest = quests.find(q => q.id === userQuestId);
    if (!quest) return;

    setClaimingId(userQuestId);
    const toastId = toast.loading('Đang nhận thưởng...');

    try {
      const result = await claimQuest(userQuestId);

      if (!result) {
        throw new Error('Không thể nhận thưởng');
      }

      playSuccessSound();

      onRewardClaimed(
        quest.quest.reward_exp,
        quest.quest.reward_coins
      );

      toast.success(
        `🎉 +${quest.quest.reward_exp} EXP • +${quest.quest.reward_coins} WP`,
        { id: toastId }
      );
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra', {
        id: toastId,
      });
    } finally {
      setClaimingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl p-4"
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md overflow-hidden rounded-t-[2.5rem] sm:rounded-3xl border border-white/10 bg-slate-900 shadow-2xl max-h-[88vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="relative p-6 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Mission Center
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Còn {pendingCount} nhiệm vụ mục này
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            {/* streak */}
            <div className="flex items-center gap-2 mt-4">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-bold text-white">
                {streak} ngày liên tiếp
              </span>
            </div>

            {/* progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>{completedCount}/{totalCount} hoàn thành</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>

              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="p-4 border-b border-white/5">
          <div className="relative flex rounded-2xl bg-slate-950 p-1">
            {Object.entries(tabConfig).map(([key, config]) => {
              const Icon = config.icon;
              const active = filter === key;

              return (
                <button
                  key={key}
                  onClick={() => setFilter(key as QuestFilter)}
                  className="relative flex-1 py-3 text-xs font-bold"
                >
                  {active && (
                    <motion.div
                      layoutId="activeQuestTab"
                      className="absolute inset-0 rounded-xl bg-white/5 border border-white/10"
                    />
                  )}

                  <span
                    className={`relative flex items-center justify-center gap-2 ${
                      active
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    <Icon size={14} />
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4">
              <QuestCardSkeleton />
              <QuestCardSkeleton />
              <QuestCardSkeleton />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleQuests.length > 0 ? (
                <div className="space-y-4">
                  {visibleQuests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <QuestCard
                        userQuest={quest}
                        onClaim={handleClaimReward}
                        isClaiming={claimingId === quest.id}
                        streak={streak}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-white/5"
                >
                  <Trophy
                    size={42}
                    className="mx-auto text-slate-600 mb-4"
                  />
                  <h3 className="text-white font-bold">
                    Không còn nhiệm vụ
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Bạn đã hoàn thành mục này rồi.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Tiến trình hôm nay
              </p>
              <p className="text-sm font-bold text-white">
                Giữ streak để mở nhiệm vụ hiếm
              </p>
            </div>

            <div className="text-right">
              <p className="text-cyan-400 text-xl font-black">
                {streak}
              </p>
              <p className="text-[10px] uppercase text-slate-500">
                day streak
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}