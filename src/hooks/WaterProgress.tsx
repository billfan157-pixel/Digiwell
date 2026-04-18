import { motion } from 'framer-motion';

interface WaterProgressProps {
  waterIntake: number;
  waterGoal: number;
  progress: number;
  completionPercent: number;
}

const STROKE_WIDTH = 14;
const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WaterProgress({ waterIntake, waterGoal, progress, completionPercent }: WaterProgressProps) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="relative flex items-center justify-center my-4">
      <svg width="240" height="240" viewBox="0 0 220 220" className="-rotate-90">
        <circle
          cx="110" cy="110" r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="stroke-slate-800/80"
          fill="none"
        />
        <motion.circle
          cx="110" cy="110" r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="stroke-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "circOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-6xl font-black text-white tracking-tighter">{completionPercent}<span className="text-3xl text-slate-400">%</span></p>
        <p className="text-sm font-bold text-slate-400 mt-1">{waterIntake.toLocaleString()} / {waterGoal.toLocaleString()} ml</p>
      </div>
    </div>
  );
}