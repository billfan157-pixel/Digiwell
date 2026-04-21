// ============================================================
// DigiWell — QuestCard & ChallengeCard Components
// ============================================================

import { QUEST_TYPE_LABEL, conditionLabel, RANKS, levelProgress, totalExpForLevel, expRequiredForLevel } from '../config/questConfig';
import type { UserQuest, UserChallenge, RankTier, Challenge, ChallengeMilestone } from '../config/questConfig';

// ── QuestCard ──────────────────────────────────────────────

interface QuestCardProps {
  userQuest:  UserQuest;
  onClaim:    (id: string) => void | Promise<void>;
  isClaiming?: boolean;
}

export function QuestCard({ userQuest: uq, onClaim, isClaiming = false }: QuestCardProps) {
  const q           = uq.quest;
  const progress    = uq.progress;
  const target      = q.condition_value;
  const pct         = Math.min(100, Math.round((progress / target) * 100));
  const isCompleted = uq.status === 'completed';
  const isClaimed   = uq.status === 'claimed';

  // Quest type styling with better icons
  const questStyles = {
    daily: {
      icon: '🌅',
      bg: 'bg-blue-500/10 border-blue-500/20',
      accent: 'text-blue-500',
      glow: 'shadow-blue-500/20'
    },
    weekly: {
      icon: '📈',
      bg: 'bg-amber-500/10 border-amber-500/20',
      accent: 'text-amber-500',
      glow: 'shadow-amber-500/20'
    },
    level: {
      icon: '⭐',
      bg: 'bg-purple-500/10 border-purple-500/20',
      accent: 'text-purple-500',
      glow: 'shadow-purple-500/20'
    }
  };

  const style = questStyles[q.type] || questStyles.daily;

  // Get condition-specific icon
  const getConditionIcon = (conditionType: string) => {
    switch (conditionType) {
      case 'drink_today': return '💧';
      case 'drink_streak': return '🔥';
      case 'goal_percent': return '🎯';
      case 'log_count': return '📝';
      case 'drink_total': return '🏆';
      case 'drink_weekly_days': return '📅';
      default: return '❓';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
      isClaimed ? 'opacity-60' : 'opacity-100 hover:shadow-xl'
    } ${isCompleted ? `${style.bg} border-green-500/30 shadow-green-500/20` : `${style.bg} border-slate-200/50`} bg-white dark:bg-slate-900/50 backdrop-blur-sm`}>

      {/* Background glow */}
      <div className={`absolute inset-0 ${style.bg} opacity-50 blur-xl -z-10`} />

      {/* Quest type badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl ${style.bg} flex items-center justify-center text-lg shadow-lg ${style.glow}`}>
          {getConditionIcon(q.condition_type)}
        </div>
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${style.accent}`}>
            {QUEST_TYPE_LABEL[q.type]}
          </span>
          {isCompleted && (
            <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              ✅ Hoàn thành
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
        {q.title}
      </h3>

      {/* Condition */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        🎯 {conditionLabel(q)}
      </p>

      {/* Progress section */}
      {!isClaimed && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {progress.toLocaleString('vi-VN')} / {target.toLocaleString('vi-VN')}
            </span>
            <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : style.accent}`}>
              {pct}%
            </span>
          </div>

          <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' : `bg-gradient-to-r from-${style.accent.split('-')[1]}-400 to-${style.accent.split('-')[1]}-600`
              }`}
              style={{ width: `${pct}%` }}
            />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <span className="text-indigo-600 dark:text-indigo-400">⚡</span>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">+{q.reward_exp}</span>
          </div>
          {q.reward_coins > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-amber-600 dark:text-amber-400">💰</span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">+{q.reward_coins}</span>
            </div>
          )}
        </div>

        {q.reward_badge_id && (
          <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
            <span className="text-purple-600 dark:text-purple-400">🏆</span>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Badge</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isCompleted && !isClaimed && (
        <button
          disabled={isClaiming}
          onClick={() => onClaim(uq.id)}
          className={`w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm hover:from-green-400 hover:to-green-500 active:scale-95 transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isClaiming ? '⏳ Đang nhận...' : '🎁 Nhận thưởng ngay'}
        </button>
      )}

      {isClaimed && (
        <div className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">✅ Đã nhận thưởng</span>
        </div>
      )}
    </div>
  );
}

// ── ChallengeCard (available, chưa join) ───────────────────

interface ChallengeCardProps {
  challenge:  Challenge;
  onJoin:     (id: string) => void;
  userRank:   RankTier;
}

export function ChallengeCard({ challenge: ch, onJoin, userRank }: ChallengeCardProps) {
  const locked     = userRank < ch.min_rank;
  const rankName   = RANKS[ch.min_rank as RankTier]?.name ?? '';
  const typeLabel  = ch.type === 'time_limited'
    ? `${ch.duration_days} ngày`
    : 'Tích lũy';

  return (
    <div className={`rounded-xl border p-4 ${locked ? 'opacity-60' : 'bg-white border-gray-200'}`}>

      {/* Type + locked badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          ch.type === 'time_limited'
            ? 'bg-teal-50 text-teal-800'
            : 'bg-purple-50 text-purple-800'
        }`}>
          {typeLabel}
        </span>
        {locked && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Mở khóa ở {rankName}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-gray-900">{ch.title}</p>

      {ch.flavor_text && (
        <p className="text-[11px] text-gray-400 italic mt-0.5">"{ch.flavor_text}"</p>
      )}

      <p className="text-xs text-gray-500 mt-1">{ch.description}</p>

      {/* Milestones preview */}
      {ch.milestones && ch.milestones.length > 0 && (
        <div className="flex gap-1 mt-2">
          {ch.milestones.map((m: ChallengeMilestone, i: number) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full bg-purple-200`}
              title={m.label}
            />
          ))}
        </div>
      )}

      {/* Reward */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2 text-xs">
          <span className="text-indigo-600 font-medium">+{ch.reward_exp} EXP</span>
          {ch.reward_coins > 0 && (
            <span className="text-amber-600">+{ch.reward_coins} xu</span>
          )}
          {ch.reward_badge_id && (
            <span className="text-gray-500">+ Badge</span>
          )}
        </div>

        <button
          disabled={locked}
          onClick={() => !locked && onJoin(ch.id)}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-all
                     disabled:cursor-not-allowed disabled:opacity-40
                     bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
        >
          Tham gia
        </button>
      </div>
    </div>
  );
}

// ── ActiveChallengeCard (đang tham gia) ────────────────────

interface ActiveChallengeCardProps {
  userChallenge: UserChallenge;
  onClaim:       (id: string) => void;
  onAbandon:     (id: string) => void;
}

export function ActiveChallengeCard({ userChallenge: uc, onClaim, onAbandon }: ActiveChallengeCardProps) {
  const ch          = uc.challenge;
  const isCompleted = uc.status === 'completed';

  // Progress % tùy loại
  let pct = 0;
  let progressLabel = '';

  if (ch.type === 'milestone' && ch.target_value) {
    pct = Math.min(100, Math.round((uc.current_value / ch.target_value) * 100));
    progressLabel = `${(uc.current_value / 1000).toFixed(1)}L / ${(ch.target_value / 1000).toFixed(0)}L`;
  } else if (ch.type === 'time_limited' && ch.duration_days) {
    pct = Math.min(100, Math.round((uc.days_completed / ch.duration_days) * 100));
    progressLabel = `${uc.days_completed} / ${ch.duration_days} ngày`;
  }

  // Milestones đã đạt
  const milestones     = ch.milestones ?? [];
  const reachedSet     = new Set(uc.milestones_reached ?? []);

  return (
    <div className={`rounded-xl border p-4 ${
      isCompleted ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-white'
    }`}>

      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-gray-900">{ch.title}</p>
        {isCompleted && (
          <span className="text-[10px] font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
            Hoàn thành
          </span>
        )}
      </div>

      {ch.flavor_text && (
        <p className="text-[11px] text-gray-400 italic mb-2">"{ch.flavor_text}"</p>
      )}

      {/* Progress bar */}
      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>{progressLabel}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isCompleted ? 'bg-green-500' : 'bg-teal-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestone dots */}
      {milestones.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                reachedSet.has(i) ? 'bg-purple-500' : 'bg-purple-100'
              }`}
              title={m.label}
            />
          ))}
        </div>
      )}

      {/* Grace days indicator for time_limited */}
      {ch.type === 'time_limited' && ch.grace_days != null && ch.grace_days > 0 && (
        <p className="text-[10px] text-gray-400 mt-1">
          Ngày thất bại: {uc.days_failed}/{ch.grace_days} cho phép
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {isCompleted ? (
          <button
            onClick={() => onClaim(uc.id)}
            className="flex-1 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium
                       hover:bg-green-600 active:scale-95 transition-all"
          >
            Nhận thưởng
          </button>
        ) : (
          <button
            onClick={() => onAbandon(uc.id)}
            className="py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500
                       text-xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            Bỏ cuộc
          </button>
        )}
      </div>
    </div>
  );
}

// ── RankBadge component ────────────────────────────────────

interface RankBadgeProps {
  tier:  RankTier;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ tier, size = 'md' }: RankBadgeProps) {
  const rank = RANKS[tier];
  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass}`}
      style={{ backgroundColor: rank.color + '20', color: rank.color }}
    >
      {rank.name}
    </span>
  );
}

// ── LevelProgressBar ───────────────────────────────────────

interface LevelProgressBarProps {
  totalExp:  number;
  level:     number;
  rankTier:  RankTier;
}

export function LevelProgressBar({ totalExp, level, rankTier }: LevelProgressBarProps) {
  const pct        = Math.round(levelProgress(totalExp) * 100);
  const levelStart = totalExpForLevel(level);
  const needed     = expRequiredForLevel(level);
  const current    = totalExp - levelStart;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-gray-900">Lv {level}</span>
          <RankBadge tier={rankTier} size="sm" />
        </div>
        <span className="text-xs text-gray-400">
          {current.toLocaleString('vi-VN')} / {needed.toLocaleString('vi-VN')} EXP
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[10px] text-gray-400 text-right">
        Tổng: {totalExp.toLocaleString('vi-VN')} EXP
      </p>
    </div>
  );
}