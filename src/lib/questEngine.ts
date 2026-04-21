// ============================================================
// DigiWell — Quest Engine
// Chạy sau mỗi handleAddWater() / handleDeleteEntry()
// Tự động check tất cả điều kiện và cập nhật tiến độ
// ============================================================

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { UserQuest, UserChallenge, ConditionType } from '../config/questConfig';

// ── Context truyền vào engine ──────────────────────────────

export interface QuestEngineContext {
  userId:        string;
  waterToday:    number;   // ml uống hôm nay
  waterGoal:     number;   // ml mục tiêu hôm nay
  streak:        number;   // streak hiện tại (ngày)
  totalWater:    number;   // tổng ml tích lũy toàn thời gian
  logCountToday: number;   // số lần log hôm nay
  weeklyDays:    number;   // số ngày đạt mục tiêu trong tuần này
}

// ── Check một điều kiện ────────────────────────────────────

function checkCondition(
  conditionType: ConditionType,
  conditionValue: number,
  ctx: QuestEngineContext,
): { progress: number; completed: boolean } {
  let current = 0;

  switch (conditionType) {
    case 'drink_today':
      current = ctx.waterToday;
      console.log(`[QuestEngine] drink_today: current=${current}, conditionValue=${conditionValue}`);
      break;
    case 'goal_percent':
      current = ctx.waterGoal > 0
        ? Math.floor((ctx.waterToday / ctx.waterGoal) * 100)
        : 0;
      break;
    case 'log_count':
      current = ctx.logCountToday;
      break;
    case 'drink_streak':
      current = ctx.streak;
      break;
    case 'drink_total':
      current = ctx.totalWater;
      break;
    case 'drink_weekly_days':
      current = ctx.weeklyDays;
      break;
  }

  const result = {
    progress:  Math.min(current, conditionValue),
    completed: current >= conditionValue,
  };
  console.log(`[QuestEngine] condition=${conditionType}, current=${current}, value=${conditionValue}, progress=${result.progress}, completed=${result.completed}`);
  return result;
}

// ── Main engine: chạy sau mỗi water event ─────────────────

export async function runQuestEngine(ctx: QuestEngineContext): Promise<void> {
  if (!ctx.userId) return;

  console.log('[QuestEngine] Running with ctx:', ctx);

  try {
    // Lấy tất cả quest đang active của user
    const { data: userQuests, error } = await supabase
      .from('user_quests')
      .select(`
        id, quest_id, status, progress,
        quest:quests (
          id, type, title, condition_type, condition_value,
          reward_exp, reward_coins, reward_badge_id, min_level
        )
      `)
      .eq('user_id', ctx.userId)
      .eq('status', 'active');

    if (error || !userQuests) return;

    const updates: Array<{
      id: string;
      progress: number;
      status: 'active' | 'completed';
      completed_at: string | null;
    }> = [];

    const newlyCompleted: UserQuest[] = [];

    for (const uq of userQuests as unknown as UserQuest[]) {
      const { progress, completed } = checkCondition(
        uq.quest.condition_type,
        uq.quest.condition_value,
        ctx,
      );

      // Chỉ update nếu có thay đổi
      if (progress !== uq.progress || (completed && uq.status === 'active')) {
        updates.push({
          id:           uq.id,
          progress,
          status:       completed ? 'completed' : 'active',
          completed_at: completed ? new Date().toISOString() : null,
        });

        if (completed && uq.status === 'active') {
          newlyCompleted.push(uq);
        }
      }
    }

    // Batch update
    if (updates.length > 0) {
      await Promise.allSettled(
        updates.map(u =>
          supabase
            .from('user_quests')
            .update({
              progress:     u.progress,
              status:       u.status,
              completed_at: u.completed_at,
            })
            .eq('id', u.id),
        ),
      );
    }

    // Notify user khi có quest hoàn thành
    for (const uq of newlyCompleted) {
      toast.success(`🎯 Hoàn thành: ${uq.quest.title} · ⚡ +${uq.quest.reward_exp} EXP!`, {
        duration: 4000,
        action: {
          label: '🎁 Nhận thưởng',
          onClick: () => claimQuestReward(ctx.userId, uq.id),
        },
      });
    }
  } catch (err) {
    console.error('[QuestEngine]', err);
  }
}

// ── Claim reward cho quest ─────────────────────────────────

export async function claimQuestReward(
  userId: string,
  userQuestId: string,
): Promise<{ leveledUp: boolean; rankedUp: boolean; newLevel: number; newRank: number } | null> {
  // Validate inputs
  if (!userId || userId === 'undefined' || !userQuestId || userQuestId === 'undefined') {
    console.error('[QuestEngine] Invalid parameters:', { userId, userQuestId });
    toast.error('Thông tin user không hợp lệ');
    return null;
  }

  console.log('[QuestEngine] Claiming quest:', { userId, userQuestId });

  const { data, error } = await supabase.rpc('claim_quest_reward', {
    p_user_id:       userId,
    p_user_quest_id: userQuestId,
  });

  if (error) {
    console.error('[QuestEngine] claimQuestReward error:', error);
    toast.error('Không thể nhận thưởng lúc này');
    return null;
  }

  if (data?.leveled_up) {
    toast.success(`⬆️ Level Up! Bạn đạt Level ${data.new_level}! 🎊`, { duration: 5000 });
  }
  if (data?.ranked_up) {
    toast.success(`⭐ Rank mới: ${data.new_rank}! 🏅`, { duration: 5000 });
  }

  return {
    leveledUp: data?.leveled_up  ?? false,
    rankedUp:  data?.ranked_up   ?? false,
    newLevel:  data?.new_level   ?? 1,
    newRank:   data?.new_rank    ?? 1,
  };
}

// ── Challenge engine: cập nhật tiến độ challenge ──────────

export async function runChallengeEngine(ctx: QuestEngineContext): Promise<void> {
  if (!ctx.userId) return;

  try {
    const { data: userChallenges, error } = await supabase
      .from('user_challenges')
      .select(`
        id, challenge_id, status, current_value, milestones_reached,
        days_completed, days_failed,
        challenge:challenges (
          id, type, slug, title, duration_days, target_percent,
          grace_days, target_value, milestones,
          reward_exp, reward_coins, reward_badge_id
        )
      `)
      .eq('user_id', ctx.userId)
      .eq('status', 'joined');

    if (error || !userChallenges) return;

    for (const uc of userChallenges as unknown as UserChallenge[]) {
      const ch = uc.challenge;

      if (ch.type === 'milestone') {
        await updateMilestoneChallenge(ctx, uc);
      } else if (ch.type === 'time_limited') {
        await updateTimeLimitedChallenge(ctx, uc);
      }
    }
  } catch (err) {
    console.error('[ChallengeEngine]', err);
  }
}

async function updateMilestoneChallenge(
  ctx: QuestEngineContext,
  uc: UserChallenge,
): Promise<void> {
  const ch            = uc.challenge;
  const newValue      = ctx.totalWater;
  const milestones    = ch.milestones ?? [];
  const alreadyReached = uc.milestones_reached ?? [];

  // Tìm mốc mới vừa vượt qua
  const newMilestones = milestones
    .map((m, idx) => ({ ...m, idx }))
    .filter(m => m.at <= newValue && !alreadyReached.includes(m.idx));

  const isCompleted = ch.target_value != null && newValue >= ch.target_value;

  await supabase
    .from('user_challenges')
    .update({
      current_value:      newValue,
      milestones_reached: [...alreadyReached, ...newMilestones.map(m => m.idx)],
      status:             isCompleted ? 'completed' : 'joined',
      completed_at:       isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', uc.id);

  // Award milestone rewards
  for (const m of newMilestones) {
    await supabase.rpc('award_exp_and_rank', {
      p_user_id: ctx.userId,
      p_exp:     m.exp,
      p_coins:   m.coins,
    });

    if (m.badge_id) {
      await supabase
        .from('user_badges')
        .insert({ user_id: ctx.userId, badge_id: m.badge_id })
        .on('conflict', 'ignore');
    }

    toast.success(`🏔️ Mốc ${m.label}: ⚡ +${m.exp} EXP · 💰 +${m.coins} xu!`, { duration: 4000 });
  }

  if (isCompleted) {
    toast.success(`🎉 Hoàn thành: ${ch.title}!`, {
      duration: 5000,
      action: { label: '🎁 Nhận thưởng', onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
  }
}

async function updateTimeLimitedChallenge(
  ctx: QuestEngineContext,
  uc: UserChallenge,
): Promise<void> {
  const ch           = uc.challenge;
  const targetPct    = ch.target_percent ?? 90;
  const graceDays    = ch.grace_days     ?? 0;
  const todayPct     = ctx.waterGoal > 0
    ? Math.floor((ctx.waterToday / ctx.waterGoal) * 100)
    : 0;
  const todayPass    = todayPct >= targetPct;

  const newDaysCompleted = todayPass ? uc.days_completed + 1 : uc.days_completed;
  const newDaysFailed    = !todayPass ? uc.days_failed   + 1 : uc.days_failed;

  const isCompleted = ch.duration_days != null && newDaysCompleted >= ch.duration_days;
  const isFailed    = newDaysFailed > graceDays;

  await supabase
    .from('user_challenges')
    .update({
      days_completed: newDaysCompleted,
      days_failed:    newDaysFailed,
      status:         isCompleted ? 'completed' : isFailed ? 'failed' : 'joined',
      completed_at:   isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', uc.id);

  if (isFailed) {
    toast.error(`💔 Thất bại: ${ch.title} — Bạn có thể thử lại!`);
  }
  if (isCompleted) {
    toast.success(`🎉 Hoàn thành: ${ch.title}!`, {
      duration: 5000,
      action: { label: '🎁 Nhận thưởng', onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
  }
}

// ── Claim challenge reward ─────────────────────────────────

export async function claimChallengeReward(
  userId: string,
  userChallengeId: string,
): Promise<void> {
  const { error } = await supabase.rpc('claim_challenge_reward', {
    p_user_id:              userId,
    p_user_challenge_id:    userChallengeId,
  });

  if (error) {
    toast.error('Không thể nhận thưởng lúc này');
    return;
  }

  toast.success('🎁 Đã nhận phần thưởng thành công!');
}

// ── Provision daily/weekly quests cho user mới ────────────
// Gọi khi user đăng nhập lần đầu hoặc sau reset

interface QuestRow {
  id: string;
  type: string;
  min_level: number;
}

export async function provisionUserQuests(userId: string, userLevel: number): Promise<void> {
  const today    = new Date().toLocaleDateString('en-CA');
  const weekStart = getWeekStart();

  // Lấy tất cả quest phù hợp với level của user
  const { data: quests } = await supabase
      .from('quests')
    .select('id, type, min_level')
    .eq('is_active', true)
    .lte('min_level', userLevel);

  if (!quests) return;

  const rows = (quests as QuestRow[]).map(q => ({
    user_id:    userId,
    quest_id:   q.id,
    status:     'active',
    progress:   0,
    reset_date: q.type === 'daily'  ? today
              : q.type === 'weekly' ? weekStart
              : null,
  }));

  // upsert — tránh duplicate khi gọi nhiều lần
  await supabase
    .from('user_quests')
    .upsert(rows, { onConflict: 'user_id,quest_id,reset_date', ignoreDuplicates: true });
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // thứ 2
  d.setDate(diff);
  return d.toLocaleDateString('en-CA');
}