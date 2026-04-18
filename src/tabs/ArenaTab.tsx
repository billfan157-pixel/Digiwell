import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, Trophy, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { QuestCard } from "@/components/QuestComponents";
import type { QuestType, ConditionType, UserQuest } from "../config/questConfig";

interface QuestData {
  userQuestId: string;
  questId: string;
  title: string;
  description: string;
  questType: "daily" | "weekly" | "level";
  conditionType: string;
  conditionValue: number;
  currentValue: number;
  rewardExp: number;
  rewardCoins: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  isCompleted: boolean;
  claimedAt: string | null;
}

interface ArenaTabProps {
  userId: string;
  streak: number;
  onRewardClaimed: (exp: number, wp: number) => void;
}

const rarityPriority = {
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

const titleFixMap: Record<string, string> = {
  "Nguoi moi bat dau": "Người mới bắt đầu",
  "Tich luy dau tien": "Tích lũy đầu tiên",
  "Chien binh nuoc": "Chiến binh nước",
  "Hanh trinh dai": "Hành trình dài",
  "Huyen thoai": "Huyền thoại",
  "Khoi dong": "Khởi động",
  "Nua chang": "Nửa chặng",
  "Ve dich": "Về đích",
};

export const ArenaTab = ({
  userId,
  streak,
  onRewardClaimed,
}: ArenaTabProps) => {
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // ───────────────── FETCH QUESTS ─────────────────
  const fetchQuests = useCallback(
    async (silent = false) => {
      if (!userId) return;

      if (!silent) {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from("user_quests")
          .select(`
            id,
            progress,
            status,
            claimed_at,
            quest:quests (
              id,
              title,
              description,
              type,
              condition_type,
              condition_value,
              reward_exp,
              reward_coins
            )
          `)
          .eq("user_id", userId);

        if (error) throw error;

        const mapped: QuestData[] =
          data?.map((row: any) => ({
            userQuestId: row.id,
            questId: row.quest?.id,
            title: titleFixMap[row.quest?.title] || row.quest?.title || "",
            description: row.quest?.description || "",
            questType: row.quest?.type || "daily",
            conditionType: row.quest?.condition_type || "",
            conditionValue: row.quest?.condition_value || 0,
            currentValue: row.progress || 0,
            rewardExp: row.quest?.reward_exp || 0,
            rewardCoins: row.quest?.reward_coins || 0,
            rarity: "common", // Default since not in table
            isCompleted: row.status === 'completed' || row.status === 'claimed',
            claimedAt: row.claimed_at,
          })) || [];

        const uniqueQuests = mapped.filter(
          (quest, index, self) =>
            index === self.findIndex((q) => q.questId === quest.questId)
        );

        setQuests(uniqueQuests);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải nhiệm vụ");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // ───────────────── REALTIME ─────────────────
  useEffect(() => {
    fetchQuests();

    const channel = supabase
      .channel("arena_quest_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_quests",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchQuests(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchQuests]);

  // ───────────────── CLAIM REWARD ─────────────────
  const handleClaimReward = async (userQuestId: string) => {
    const quest = quests.find((q) => q.userQuestId === userQuestId);

    if (!quest) return;
    if (quest.claimedAt) return;
    if (claimingId) return;

    setClaimingId(userQuestId);

    try {
      const claimedTime = new Date().toISOString();

      const { error } = await supabase
        .from("user_quests")
        .update({
          status: 'claimed',
          claimed_at: claimedTime,
        })
        .eq("id", userQuestId);

      if (error) throw error;

      onRewardClaimed(quest.rewardExp, quest.rewardCoins);

      setQuests((prev) =>
        prev.map((item) =>
          item.userQuestId === userQuestId
            ? { ...item, claimedAt: claimedTime }
            : item
        )
      );

      toast.success(
        `🏆 +${quest.rewardExp} EXP • +${quest.rewardCoins} WP`
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể nhận thưởng");
    } finally {
      setClaimingId(null);
    }
  };

  // ───────────────── SORT ─────────────────
  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      const aReady = a.isCompleted && !a.claimedAt;
      const bReady = b.isCompleted && !b.claimedAt;

      if (aReady && !bReady) return -1;
      if (!aReady && bReady) return 1;

      if (!a.claimedAt && b.claimedAt) return -1;
      if (a.claimedAt && !b.claimedAt) return 1;

      return rarityPriority[a.rarity] - rarityPriority[b.rarity];
    });
  }, [quests]);

  // ───────────────── STATS ─────────────────
  const readyCount = sortedQuests.filter(
    (q) => q.isCompleted && !q.claimedAt
  ).length;

  const claimedCount = sortedQuests.filter(
    (q) => q.claimedAt
  ).length;

  // ───────────────── RENDER ─────────────────
  return (
    <div className="h-full overflow-y-auto px-5 pt-10 pb-28">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-slate-800/70 px-6 py-3 rounded-2xl mb-4">
          <Sparkles className="text-cyan-400" />
          <h1 className="text-white font-black text-xl">
            SẢNH NHIỆM VỤ
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-xl">
          <Flame className="text-orange-500" />
          <span className="text-white text-sm font-bold">
            {streak} ngày liên tiếp
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox label="Sẵn sàng" value={readyCount} />
        <StatBox label="Đã nhận" value={claimedCount} />
        <StatBox label="Tổng" value={sortedQuests.length} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : sortedQuests.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-5">
            {sortedQuests.map((quest) => {
              const userQuest: UserQuest = {
                id: quest.userQuestId,
                quest_id: quest.questId,
                status: quest.claimedAt
                  ? "claimed"
                  : quest.isCompleted
                  ? "completed"
                  : "active",
                progress: quest.currentValue,
                reset_date: null,
                completed_at: null,
                claimed_at: quest.claimedAt,
                quest: {
                  id: quest.questId,
                  type: quest.questType as QuestType,
                  title: quest.title,
                  description: quest.description,
                  condition_type: quest.conditionType as ConditionType,
                  condition_value: quest.conditionValue,
                  reward_exp: quest.rewardExp,
                  reward_coins: quest.rewardCoins,
                  rarity: quest.rarity,
                  reward_badge_id: null,
                  min_level: 1,
                },
              };

              return (
                <motion.div
                  key={quest.userQuestId}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <QuestCard
                    userQuest={userQuest}
                    onClaim={handleClaimReward}
                    isClaiming={claimingId === userQuest.id}
                  />
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ───────────────── SMALL COMPONENTS ─────────────────

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 text-center">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 text-slate-500">
      <Trophy className="mx-auto mb-4" size={36} />
      Chưa có nhiệm vụ hôm nay
    </div>
  );
}