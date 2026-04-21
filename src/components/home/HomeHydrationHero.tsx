import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth } from 'lucide-react';
import CountUp from '../CountUp';
import { BottleVisualizer } from '../DeviceComponents';

interface BottleMetrics {
  currentVolume?: number;
}

interface EquippedBottleSkin {
  name?: string;
  rarity?: string;
  meta_value?: string | null;
  image_url?: string | null;
}

interface HomeHydrationHeroProps {
  isConnected: boolean;
  isConnecting?: boolean;
  metrics?: Partial<BottleMetrics>;
  equippedBottleSkin?: EquippedBottleSkin | null;
  waterIntake: number;
  waterGoal: number;
  progress: number;
  bottleCapacity: number;
  onConnectBottle: () => void | Promise<void>;
  onOpenGoalDetail?: () => void;
}


export default function HomeHydrationHero({
  isConnected,
  isConnecting,
  metrics,
  equippedBottleSkin,
  waterIntake,
  waterGoal,
  progress,
  bottleCapacity,
  onConnectBottle,
  onOpenGoalDetail,
}: HomeHydrationHeroProps) {
  const bottleFillPercentage = (metrics?.currentVolume ?? 0) / bottleCapacity * 100;

  return (
    <div className="relative flex flex-col items-center justify-center h-80 -mt-4 pb-6">
      {/* Visualizer Layer */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {isConnected ? (
          <button onClick={onOpenGoalDetail} className="w-full h-full flex items-center justify-center active:scale-95 transition-transform duration-150">
            <BottleVisualizer
              isConnected={true}
              currentVolume={metrics?.currentVolume || 0}
              capacity={bottleCapacity}
              fillPercentage={bottleFillPercentage}
              equippedBottle={equippedBottleSkin}
            />
          </button>
        ) : (
          <button onClick={onOpenGoalDetail} className="relative w-52 h-52 active:scale-95 transition-transform duration-150">
            <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle className="text-slate-200 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
              <motion.circle
                className="text-cyan-500 dark:text-cyan-400"
                strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"
                strokeDasharray="282.7"
                initial={{ strokeDashoffset: 282.7 }}
                animate={{ strokeDashoffset: 282.7 - (progress / 100) * 282.7 }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
            </svg>
          </button>
        )}
      </div>

      {/* Text Overlay Layer - Shows Daily Goal Progress ONLY when not connected */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            <CountUp value={waterIntake} />
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            / {waterGoal} ml
          </p>
          <div className="mt-2 px-3 py-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-slate-300/50 dark:border-white/10">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Action Layer (Connect Button) */}
      {!isConnected && (
        <div className="absolute bottom-4">
          <button
            onClick={onConnectBottle}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50"
          >
            <Bluetooth size={14} />
            {isConnecting ? 'Đang kết nối...' : 'Kết nối DigiBottle'}
          </button>
        </div>
      )}
    </div>
  );
}
