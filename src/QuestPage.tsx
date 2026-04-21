import React, { useState, useMemo } from 'react';
import { Swords, Calendar, Trophy, Gift, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSuccessSound } from '@/lib/audio';
import { QuestCard, QuestCardSkeleton } from '@/components/QuestCard';
import { useQuests } from '@/hooks/useQuests';
import type { UserQuest } from '@/config/questConfig';
import { toast } from 'sonner';

interface QuestPageProps {
  userId: string;
  onRewardClaimed: (exp: number, wp: number) => void;
}

const tabConfig = {
  daily: { icon: Calendar, label: 'Hàng ngày', color: 'cyan' },
  weekly: { icon: Target, label: 'Hàng tuần', color: 'purple' },
  level: { icon: Trophy, label: 'Thành tựu', color: 'amber' }, // Map achievement to level
};

const QuestPage = ({ userId, onRewardClaimed }: QuestPageProps) => {
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'level'>('daily');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Use the new useQuests hook
  const { quests, loading, claimQuest, refetch } = useQuests(userId, 1); // userLevel = 1 as default

  const handleClaimReward = async (userQuestId: string) => {
    if (claimingId) return;

    const userQuest = quests.find(q => q.id === userQuestId);
    if (!userQuest) {
      toast.error("Không tìm thấy nhiệm vụ này!");
      return;
    }

    // Validate user ID exists
    if (!userId || userId === 'undefined') {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    setClaimingId(userQuestId); // Use user_quest_id for claiming

    const toastId = toast.loading('Đang nhận thưởng...');

    try {
      const result = await claimQuest(userQuestId);
      if (result) {
        console.log('[QuestPage] Claim successful, updating UI');
        toast.success(
          `🎁 +${userQuest.quest.reward_exp} EXP | 💰 +${userQuest.quest.reward_coins} Coins!`,
          {
            id: toastId,
            icon: '🎉',
          }
        );

        playSuccessSound();
        onRewardClaimed(userQuest.quest.reward_exp, userQuest.quest.reward_coins);
      } else {
        throw new Error('Claim failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi nhận thưởng', { id: toastId });
    } finally {
      setClaimingId(null);
    }
  };

  const filteredQuests = useMemo(() => {
    const filtered = quests.filter(q => (q.quest as any)?.type === filter);
    
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

  const stats = useMemo(() => {
    const total = filteredQuests.length;
    const completed = filteredQuests.filter(q => q.status === 'completed').length;
    const claimed = filteredQuests.filter(q => q.status === 'claimed').length;

    return { total, completed, claimed };
  }, [filteredQuests]);

  const currentTab = tabConfig[filter];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="px-6 pt-6">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Quest System
        </p>

        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Nhiệm vụ
          <Swords size={28} className="text-cyan-400" />
        </h1>

        {/* mini stats */}
        <div className="mt-3 flex gap-4 text-xs text-slate-400">
          <span>📦 {stats.total}</span>
          <span>⚔️ {stats.completed}</span>
          <span>🎁 {stats.claimed}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="mx-4 p-1 rounded-xl bg-slate-900/80 border border-slate-800 flex">
        {Object.entries(tabConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const active = filter === key;

          return (
            <button
              key={key}
              onClick={() => setFilter(key as 'daily' | 'weekly' | 'level')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all
                ${
                  active
                    ? key === 'daily'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : key === 'weekly'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              <Icon size={14} />
              {cfg.label}
            </button>
          );
        })}
      </div>



      {/* BODY */}
      {loading ? (
        <div className="px-4 space-y-3">
          <QuestCardSkeleton />
          <QuestCardSkeleton />
          <QuestCardSkeleton />
        </div>
      ) : (
        <motion.div layout className="px-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredQuests.length > 0 ? (
              filteredQuests.map((userQuest) => (
                <motion.div
                  key={userQuest.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuestCard
                    userQuest={userQuest}
                    onClaim={handleClaimReward}
                    isClaiming={claimingId === userQuest.id}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-6 bg-slate-900/40 border border-dashed border-slate-700 rounded-3xl"
              >
                <Trophy size={40} className="mx-auto mb-3 text-slate-600" />
                <h4 className="text-white font-bold">No quests here</h4>
                <p className="text-sm text-slate-400 mt-1">
                  You cleared everything in this section.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default QuestPage;