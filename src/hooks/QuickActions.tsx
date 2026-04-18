import type { DrinkPreset } from '@/store/useDrinkPresetStore';
import { Plus, ScanLine, Settings, Loader2, Droplet, Coffee, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  primaryDrinkPreset: DrinkPreset;
  secondaryDrinkPresets: DrinkPreset[];
  handleAddWater: (amount: number, factor?: number, name?: string) => Promise<void>;
  handleScan: () => void;
  isScanning: boolean;
  setShowCustomDrink: (show: boolean) => void;
  setShowPresetManager: (show: boolean) => void;
}

const getPresetIcon = (name: string) => {
  if (name.toLowerCase().includes('cà phê') || name.toLowerCase().includes('coffee')) return <Coffee size={16} />;
  if (name.toLowerCase().includes('bia') || name.toLowerCase().includes('rượu')) return <Zap size={16} />;
  return <Droplet size={16} />;
};

const glassCard = "backdrop-blur-xl border rounded-2xl shadow-xl bg-slate-200/50 dark:bg-slate-900/60 border-slate-300 dark:border-white/5";

export function QuickActions({
  primaryDrinkPreset, secondaryDrinkPresets, handleAddWater, handleScan, isScanning,
  setShowCustomDrink, setShowPresetManager
}: QuickActionsProps) {

  const onPrimaryClick = () => {
    if (primaryDrinkPreset) {
      handleAddWater(primaryDrinkPreset.amount, primaryDrinkPreset.factor, primaryDrinkPreset.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Action */}
      <motion.button
        onClick={onPrimaryClick}
        whileTap={{ scale: 0.98 }}
        className={`relative w-full overflow-hidden ${glassCard} p-6 text-center group`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Droplet size={24} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
            +{primaryDrinkPreset?.amount || 250}
            <span className="text-lg text-cyan-500 dark:text-cyan-400 ml-1">ml</span>
          </div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {primaryDrinkPreset?.name || 'Nước lọc'}
          </div>
          {primaryDrinkPreset?.factor !== 1 && (
            <div className="text-xs text-amber-500 dark:text-amber-400 mt-2 font-bold">
              ×{primaryDrinkPreset?.factor?.toFixed(1)} EXP
            </div>
          )}
        </div>
      </motion.button>

      {/* Secondary Actions Grid */}
      <div className="grid grid-cols-3 gap-4">
        {secondaryDrinkPresets.slice(0, 3).map((preset, index) => (
          <motion.button
            key={preset.id}
            onClick={() => handleAddWater(preset.amount, preset.factor, preset.name)}
            whileTap={{ scale: 0.95 }}
            className={`${glassCard} p-4 flex flex-col items-center justify-center text-center group hover:scale-105 transition-all duration-300`}
          >
            <div className="w-8 h-8 mb-2 rounded-lg bg-slate-800/20 dark:bg-slate-700/30 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-cyan-400 transition-colors">
              {getPresetIcon(preset.name)}
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {preset.amount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full">
              {preset.name}
            </div>
          </motion.button>
        ))}

        {/* Custom Drink Button */}
        <motion.button
          onClick={() => setShowCustomDrink(true)}
          whileTap={{ scale: 0.95 }}
          className={`${glassCard} p-4 flex flex-col items-center justify-center text-center group hover:scale-105 transition-all duration-300 border-dashed border-2 border-slate-400 dark:border-slate-500`}
        >
          <div className="w-8 h-8 mb-2 rounded-lg bg-slate-400/20 dark:bg-slate-500/20 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Plus size={16} />
          </div>
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Tùy chỉnh
          </div>
        </motion.button>
      </div>

      {/* Utility Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={handleScan}
          disabled={isScanning}
          whileTap={{ scale: 0.98 }}
          className={`${glassCard} p-4 flex items-center justify-center gap-3 group disabled:opacity-50`}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              AI Scan
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Nhận diện đồ uống
            </div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowPresetManager(true)}
          whileTap={{ scale: 0.98 }}
          className={`${glassCard} p-4 flex items-center justify-center gap-3 group`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center text-slate-400">
            <Settings size={16} />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Cài đặt
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý presets
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}