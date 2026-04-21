// ============================================================
// DigiWell — Quest & Rank Config
// Nguồn sự thật duy nhất cho rank, EXP curve, và type definitions
// ============================================================

// ── Rank definitions ───────────────────────────────────────

export type RankTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RankInfo {
  tier:       RankTier;
  name:       string;
  minExp:     number;
  maxExp:     number;
  minLevel:   number;
  maxLevel:   number;
  color:      string;  // tailwind-compatible hex for badge
  perks:      string[];
}

export const RANKS: Record<RankTier, RankInfo> = {
  1: {
    tier: 1, name: 'Dusty Drop',
    minExp: 0, maxExp: 2499, minLevel: 1, maxLevel: 5,
    color: '#888780',
    perks: ['Daily quests', 'Weather sync'],
  },
  2: {
    tier: 2, name: 'Trickle',
    minExp: 2500, maxExp: 9499, minLevel: 6, maxLevel: 12,
    color: '#378ADD',
    perks: ['Weekly quests', 'Image scan', 'Club join'],
  },
  3: {
    tier: 3, name: 'Streamborn',
    minExp: 9500, maxExp: 25499, minLevel: 13, maxLevel: 20,
    color: '#1D9E75',
    perks: ['Challenges unlocked', 'Club create', 'Streak calendar'],
  },
  4: {
    tier: 4, name: 'Torrent',
    minExp: 25500, maxExp: 55999, minLevel: 21, maxLevel: 30,
    color: '#BA7517',
    perks: ['AI weekly report', 'Leaderboard', 'Custom reminders'],
  },
  5: {
    tier: 5, name: 'Cascade',
    minExp: 56000, maxExp: 115999, minLevel: 31, maxLevel: 40,
    color: '#993C1D',
    perks: ['Premium themes', 'Custom water goal', 'Smartwatch sync'],
  },
  6: {
    tier: 6, name: 'Abyssal',
    minExp: 116000, maxExp: 219999, minLevel: 41, maxLevel: 48,
    color: '#534AB7',
    perks: ['Exclusive challenges', 'Animated badge frame', 'Special titles'],
  },
  7: {
    tier: 7, name: 'Hydra Eternal',
    minExp: 220000, maxExp: 300000, minLevel: 49, maxLevel: 50,
    color: '#A32D2D',
    perks: ['Hall of Fame', 'Animated badge', 'All features unlocked'],
  },
};

// ── EXP per level thresholds ───────────────────────────────

// Trả về EXP cần để lên từ level hiện tại → level tiếp theo
// Công thức: 150 × (1.15^(level-1)) × (1 + floor((level-1)/10) × 0.5)
// Làm tròn lên bội số 50 để đẹp số
export function expRequiredForLevel(level: number): number {
  if (level <= 1) return 150; // Level 1 không cần exp

  const base = 150;
  const growthRate = 1.15;
  const bonusMultiplier = 1 + Math.floor((level - 1) / 10) * 0.5;

  const rawExp = base * Math.pow(growthRate, level - 1) * bonusMultiplier;

  // Làm tròn lên bội số 50
  return Math.ceil(rawExp / 50) * 50;
}

// Tổng EXP để đạt đúng level đó (tính từ 0)
export function totalExpForLevel(level: number): number {
  let total = 0;
  for (let lv = 1; lv < level; lv++) {
    total += expRequiredForLevel(lv);
  }
  return total;
}

// Tính level từ tổng EXP (dùng phía client, server dùng SQL)
export function levelFromExp(totalExp: number): number {
  let level = 1;
  while (level < 50 && totalExp >= totalExpForLevel(level + 1)) {
    level++;
  }
  return level;
}

// Tính rank từ tổng EXP (DRY - sử dụng RANKS object)
export function rankFromExp(totalExp: number): RankTier {
  // Lọc qua object RANKS, lấy các value, xếp theo minExp giảm dần (từ Rank 7 -> 1)
  const sortedRanks = Object.values(RANKS).sort((a, b) => b.minExp - a.minExp);

  // Tìm rank đầu tiên mà tổng EXP của user lớn hơn hoặc bằng minExp của Rank đó
  for (const rank of sortedRanks) {
    if (totalExp >= rank.minExp) {
      return rank.tier;
    }
  }
  return 1; // Fallback an toàn
}

// Progress trong level hiện tại (0–1)
export function levelProgress(totalExp: number): number {
  const level     = levelFromExp(totalExp);
  if (level >= 50) return 1;
  const levelStart = totalExpForLevel(level);
  const levelEnd   = totalExpForLevel(level + 1);
  return (totalExp - levelStart) / (levelEnd - levelStart);
}

// ── Quest types ────────────────────────────────────────────

export type QuestType      = 'daily' | 'weekly' | 'level';
export type QuestStatus    = 'active' | 'completed' | 'claimed';
export type ConditionType  =
  | 'drink_today'
  | 'drink_streak'
  | 'drink_total'
  | 'goal_percent'
  | 'log_count'
  | 'drink_weekly_days';

export interface Quest {
  id:              string;
  type:            QuestType;
  title:           string;
  description:     string;
  condition_type:  ConditionType;
  condition_value: number;
  reward_exp:      number;
  reward_coins:    number;
  reward_badge_id: string | null;
  min_level:       number;
  rarity:          'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserQuest {
  id:           string;
  quest_id:     string;
  status:       QuestStatus;
  progress:     number;
  reset_date:   string | null;
  completed_at: string | null;
  claimed_at:   string | null;
  quest:        Quest;
}

// ── Challenge types ────────────────────────────────────────

export type ChallengeType   = 'time_limited' | 'milestone';
export type ChallengeStatus = 'joined' | 'completed' | 'failed' | 'abandoned';

export interface ChallengeMilestone {
  at:       number;   // value tại mốc (ml hoặc ngày)
  exp:      number;
  coins:    number;
  label:    string;
  badge_id?: string;
}

export interface Challenge {
  id:              string;
  type:            ChallengeType;
  slug:            string;
  title:           string;
  description:     string;
  flavor_text:     string | null;
  duration_days:   number | null;
  target_percent:  number | null;
  grace_days:      number | null;
  target_value:    number | null;
  milestones:      ChallengeMilestone[] | null;
  reward_exp:      number;
  reward_coins:    number;
  reward_badge_id: string | null;
  reward_title:    string | null;
  min_rank:        RankTier;
}

export interface UserChallenge {
  id:                 string;
  challenge_id:       string;
  status:             ChallengeStatus;
  current_value:      number;
  milestones_reached: number[];
  days_completed:     number;
  days_failed:        number;
  joined_at:          string;
  completed_at:       string | null;
  challenge:          Challenge;
}

// ── Quest condition labels (hiển thị UI) ──────────────────

export function conditionLabel(quest: Quest): string {
  const v = quest.condition_value;
  switch (quest.condition_type) {
    case 'drink_today':       return `Uống ${v.toLocaleString('vi-VN')}ml hôm nay`;
    case 'goal_percent':      return `Đạt ${v}% mục tiêu`;
    case 'log_count':         return `Ghi nhận ${v} lần`;
    case 'drink_streak':      return `Streak ${v} ngày`;
    case 'drink_total':       return `Tổng ${(v / 1000).toFixed(0)}L tích lũy`;
    case 'drink_weekly_days': return `${v}/7 ngày trong tuần`;
    default:                  return '';
  }
}

// EXP reward display helpers
export const QUEST_TYPE_LABEL: Record<QuestType, string> = {
  daily:  'Hằng ngày',
  weekly: 'Hằng tuần',
  level:  'Theo cấp độ',
};