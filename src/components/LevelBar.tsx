import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight, Sparkles } from "lucide-react";
import { expRequiredForLevel, totalExpForLevel } from "../config/questConfig";

interface LevelBarProps {
  level: number;
  exp: number; // This is actually total_exp now
  onDetailClick?: () => void;
}

function getRankTitle(level: number) {
  if (level >= 100) return "Thủy Thần";
  if (level >= 70) return "Huyền Thoại";
  if (level >= 50) return "Tinh Anh";
  if (level >= 30) return "Chiến Binh";
  if (level >= 15) return "Người Kiên Trì";
  return "Tân Binh";
}

const LevelBar = ({
  level,
  exp,
  onDetailClick,
}: LevelBarProps) => {
  const { progress, remainingExp, nextLevelExp, rankTitle, safeLevel, progressInLevel, requiredExpForLevel } = useMemo(() => {
    const safeLevel = Math.max(level, 1);
    const expForCurrentLevelStart = totalExpForLevel(safeLevel);
    const progressInLevel = Math.max(0, exp - expForCurrentLevelStart);
    const requiredExpForLevel = expRequiredForLevel(safeLevel);
    const progress = requiredExpForLevel > 0 ? Math.min(100, (progressInLevel / requiredExpForLevel) * 100) : 0;
    const nextLevelTotalExp = totalExpForLevel(safeLevel + 1);
    const remainingExp = Math.max(0, nextLevelTotalExp - exp);
    const rankTitle = getRankTitle(safeLevel);

    return { progress, remainingExp, nextLevelExp: nextLevelTotalExp, rankTitle, safeLevel, progressInLevel, requiredExpForLevel };
  }, [level, exp]);

  return (
    <div className="relative overflow-hidden bg-slate-900/60 border border-white/5 rounded-3xl p-5 mb-6 shadow-xl">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />

      <div className="relative flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-white font-black text-xl">
                {safeLevel || 0}
              </span>
            </div>

            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
              <Star
                size={11}
                className="text-orange-500"
                fill="currentColor"
              />
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm">
              Cấp độ hiện tại
            </h4>

            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles size={11} className="text-cyan-400" />
              <span className="text-cyan-400 text-xs font-bold">
                {rankTitle}
              </span>
            </div>

            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">
              {progressInLevel.toLocaleString()} / {requiredExpForLevel.toLocaleString()} EXP (Level {safeLevel})
            </p>
          </div>
        </div>
        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold bg-cyan-400/10 hover:bg-cyan-400/15 px-3 py-1.5 rounded-xl transition-all"
          >
            CHI TIẾT <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="flex justify-between text-[11px] mb-2">
        <span className="text-slate-400">
          Tiến độ
        </span>
        <span className="text-white font-semibold">
          {progress.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-[0_0_16px_rgba(6,182,212,0.45)]"
        />
      </div>

      <div className="mt-3 flex justify-between items-center text-[11px]">
        <span className="text-slate-500">
          Level {safeLevel}
        </span>

        <span className="text-amber-400 font-semibold">
          Còn {(requiredExpForLevel - progressInLevel).toLocaleString()} EXP đến Level {safeLevel + 1}
        </span>
      </div>
    </div>
  );
};

export default React.memo(LevelBar);