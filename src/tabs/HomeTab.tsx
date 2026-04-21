import { Droplet, Coffee, Activity, Zap, Camera, History, Share2, LayoutGrid, Plus, LogOut, Settings, CloudSun, Heart, X, Menu, User, ChevronLeft, Edit2, ChevronRight, Clock, Coins, Bluetooth, BatteryFull, ScrollText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useUIStore } from '../store/useUIStore';
import LevelBar from '../components/LevelBar';
import LevelDetailModal from './LevelDetailModal';
import { seedSampleWaterLogs } from '../hooks/useWaterData';
import type { WaterLog } from '../hooks/useWaterData';
import { supabase } from '../lib/supabase';
import CountUp from '../components/CountUp';
import HomeHydrationHero from '../components/home/HomeHydrationHero';
import HydrationGoalModal from '../components/modals/HydrationGoalModal';
// import { WaterProgress } from '../hooks/WaterProgress';
// import { QuickActions } from '../hooks/QuickActions';

// Define the types and values that App.tsx expects
export type DrinkPreset = {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  color: string;
};

const formatWaterEntryTime = (entry: Pick<WaterLog, 'timestamp' | 'created_at'>) => {
  const rawTime = entry.timestamp ?? entry.created_at;

  if (!rawTime) return '--:--';

  const parsed = new Date(rawTime);

  if (Number.isNaN(parsed.getTime())) return '--:--';

  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const renderIcon = (iconName: string, props?: any): React.ReactNode => {
  if (iconName === 'Droplet') return <Droplet {...props} />;
  if (iconName === 'Coffee') return <Coffee {...props} />;
  if (iconName === 'Activity') return <Activity {...props} />;
  if (iconName === 'Zap') return <Zap {...props} />;
  return <Droplet {...props} />;
};

export const presetStyles: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', hover: 'hover:bg-orange-500/30' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', hover: 'hover:bg-red-500/30' }
};

function RecentActivity(props: {
  waterEntries: WaterLog[];
  handleDeleteEntry: (id: unknown) => Promise<void>;
  handleEditEntry?: (id: string, newAmount: number) => Promise<void>;
  isSyncing: boolean;
  setShowHistory: (show: boolean) => void;
  hasPendingCloudSync: boolean;
}) {
  const { waterEntries, handleDeleteEntry, setShowHistory } = props;

  const recentEntries = useMemo(() => {
    return [...(waterEntries || [])]
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime())
      .slice(0, 2);
  }, [waterEntries]);

  if (recentEntries.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-200/40 dark:bg-slate-900/40 rounded-2xl border border-slate-300/50 dark:border-white/5">
        <Droplet size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm font-medium">Chưa có hoạt động nào hôm nay</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 dark:text-white text-base font-black flex items-center gap-2">
          <History size={16} className="text-cyan-500 dark:text-cyan-400" />
          Hoạt động gần đây
        </h3>
        <button onClick={() => setShowHistory(true)} className="text-cyan-500 dark:text-cyan-400 text-xs font-bold hover:underline">
          Xem tất cả
        </button>
      </div>
      
      <div className="space-y-2">
        {recentEntries.map((entry: any) => (
          <div key={entry.id} className="group flex items-center justify-between p-2.5 bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300 dark:border-white/10 rounded-2xl hover:border-cyan-500/30 dark:hover:border-cyan-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${presetStyles[entry.color || 'cyan']?.bg || presetStyles.cyan.bg} ${presetStyles[entry.color || 'cyan']?.border || presetStyles.cyan.border}`}>
                {renderIcon(entry.icon || 'Droplet', { size: 18, className: presetStyles[entry.color || 'cyan']?.text || presetStyles.cyan.text })}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{entry.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatWaterEntryTime(entry)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-cyan-500 dark:text-cyan-400">+{entry.amount}ml</span>
              <button onClick={() => handleDeleteEntry(entry.id)} className="w-7 h-7 rounded-lg bg-slate-300/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HomeTabProps {
  profile: any;
  nowText: { date: string; time: string };
  hasPendingCloudSync: boolean;
  waterIntake: number;
  waterGoal: number;
  remainingWater: number;
  progress: number;
  completionPercent: number;
  streak: number;
  streakFreezes?: number;
  needsFreeze?: boolean;
  useStreakFreeze?: () => Promise<boolean>;
  assistantFace: string;
  assistantStatus: string;
  assistantTone: string;
  primaryDrinkPreset: DrinkPreset;
  secondaryDrinkPresets: DrinkPreset[];
  drinkPresets: DrinkPreset[];
  isScanning: boolean;
  handleAddWater: (amount: number, factor: number, name: string) => Promise<void>;
  handleScan: () => void;
  handleLogout: () => void;
  setShowSmartHub: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  openSocialComposer: (kind: 'status' | 'progress' | 'story') => void;
  setShowPresetManager: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCustomDrink: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomDrinkForm: React.Dispatch<React.SetStateAction<{ name: string; amount: number | string; factor: number }>>;
  customDrinkForm: { name: string; amount: number | string; factor: number };
  setEditingPresets: (presets: DrinkPreset[]) => void;
  weatherData?: any;
  watchData?: any;
  weeklyHistory?: any[];
  waterEntries?: WaterLog[];
  handleDeleteEntry?: (id: unknown) => Promise<void>;
  handleEditEntry?: (id: string, newAmount: number) => Promise<void>;
  setActiveTab: (tab: any) => void;
  isSyncing?: boolean;
  setShowShopModal: (show: boolean) => void;
  setShowQuestModal: (show: boolean) => void;
  hydrationResult?: any;
  smartBottle: any;
}
const glassCard = "backdrop-blur-xl border rounded-3xl shadow-xl bg-slate-200/50 dark:bg-slate-900/60 border-slate-300 dark:border-white/5";
const HomeTab = (props: HomeTabProps) => {

  const { setShowProfileSettings } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrinkMenuOpen, setIsDrinkMenuOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customVolume, setCustomVolume] = useState(250);
  const [customFactor, setCustomFactor] = useState(1.0);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([100, 250, 500]);
  const [isEditingQuickAmounts, setIsEditingQuickAmounts] = useState(false);
  const [draftAmounts, setDraftAmounts] = useState<[number, number, number]>([100, 250, 500]);
  const [showLevelDetail, setShowLevelDetail] = useState(false);
  const [showGoalDetail, setShowGoalDetail] = useState(false);

  const { isSyncing: isConnecting, isConnected, metrics, connectDevice: connectBottle, disconnectDevice: disconnectBottle } = props.smartBottle;
  const batteryLevel = metrics?.batteryLevel || 0;
  // Lấy dữ liệu bình trực tiếp từ Hook đã đồng bộ
  const equippedBottle = props.smartBottle.equippedBottle;

  const DEFAULT_GRID_DRINKS = [
    { id: 'default-1', name: 'Nước lọc', amount: 250, factor: 1.0, icon: 'Droplet', bg: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20', color: 'text-cyan-400' },
    { id: 'default-2', name: 'Cà phê', amount: 250, factor: 0.8, icon: 'Coffee', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20', color: 'text-orange-400' },
    { id: 'default-3', name: 'Trà', amount: 250, factor: 0.9, icon: 'Coffee', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20', color: 'text-emerald-400' },
    { id: 'default-4', name: 'Nước ép', amount: 250, factor: 1.0, icon: 'Droplet', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20', color: 'text-fuchsia-400' },
    { id: 'default-5', name: 'Bia/Rượu', amount: 250, factor: -0.5, icon: 'Zap', bg: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20', color: 'text-rose-400' }
  ];

  const [drinkGridList, setDrinkGridList] = useState<{id: string, name: string, factor: number, amount: number, icon: string, bg: string, color: string}[]>(() => {
    try { 
      const saved = localStorage.getItem('digiwell_drink_grid'); 
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize: Loại bỏ các item có id rỗng hoặc null khỏi localStorage
        const valid = parsed.filter((d: any) => d && d.id && String(d.id).trim() !== '');
        if (valid.length !== parsed.length) localStorage.setItem('digiwell_drink_grid', JSON.stringify(valid));
        return valid;
      }
      const oldCustom = localStorage.getItem('digiwell_custom_drinks'); 
      if (oldCustom) {
        const parsedOld = JSON.parse(oldCustom);
        const validOld = parsedOld.filter((d: any) => d && d.id && String(d.id).trim() !== '');
        return [...DEFAULT_GRID_DRINKS, ...validOld];
      }
      return DEFAULT_GRID_DRINKS;
    } catch { return DEFAULT_GRID_DRINKS; }
  });

  useEffect(() => {
    localStorage.setItem('digiwell_drink_grid', JSON.stringify(drinkGridList));
  }, [drinkGridList]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center pt-6 pb-2 px-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">{props.nowText.date}</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Chào, <span className="text-cyan-500 dark:text-cyan-400">{props.profile?.nickname || 'bạn'}</span> 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={props.handleScan} disabled={props.isScanning} className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-300 dark:border-white/5 flex items-center justify-center text-cyan-500 dark:text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all duration-200 ease-out disabled:opacity-50">
            <Camera size={18} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-300 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Gamification Stats Bar */}
      <div className="flex items-center justify-between px-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <Zap size={14} className="text-emerald-500 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs"><CountUp value={props.profile?.wp || 0} /></span>
          </div>
          <button onClick={() => props.setShowShopModal(true)} className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95">
            <Coins size={14} className="text-amber-500 dark:text-amber-400" />
            <span className="text-amber-600 dark:text-amber-400 font-black text-xs"><CountUp value={props.profile?.coins || 0} /></span>
          </button>
        </div>
        <button onClick={() => props.setShowQuestModal(true)} className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all font-bold text-xs">
          <ScrollText size={14} /> Nhiệm vụ
        </button>
      </div>

      {/* Gamification: Level Bar */}
      {props.profile ? (
        <LevelBar
          level={props.profile.level || 1}
          exp={props.profile.total_exp || 0}
          onDetailClick={() => setShowLevelDetail(true)}
        />
      ) : (
        // Skeleton Loader
        <div className="h-[168px] bg-slate-900/60 border border-white/5 rounded-3xl p-5 mb-6 shadow-xl animate-pulse" />
      )}

      {/* CORE HYDRATION VISUALIZER */}
      <HomeHydrationHero
        isConnected={isConnected}
        isConnecting={isConnecting}
        metrics={metrics}
        equippedBottleSkin={equippedBottle}
        waterIntake={props.waterIntake}
        waterGoal={props.waterGoal}
        progress={props.progress}
        bottleCapacity={750}
        onConnectBottle={connectBottle}
        onOpenGoalDetail={() => setShowGoalDetail(true)}
      />

      {!isConnected && (
        <div className="mt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Nạp nhanh</span>
            <button
              onClick={() => {
                setDraftAmounts([quickAmounts[0] || 100, quickAmounts[1] || 250, quickAmounts[2] || 500]);
                setIsEditingQuickAmounts(true);
              }}
              className="text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors p-1"
            >
              <Settings size={14} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 w-full">
            {quickAmounts.map((amount, index) => (
              <button
                key={amount ? `qa-${amount}-${index}` : `fallback-qa-${index}`}
                onClick={() => props.handleAddWater(amount, 1, 'Nước lọc')}
                className="flex-1 bg-slate-200/50 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-300/50 dark:hover:bg-white/20 active:scale-90 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(0,0,0,0.02)] dark:shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
              >
                <Droplet size={20} className="text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-base">+{amount}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">ml</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Utilities Row - Tech Pill */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-1.5 shadow-lg mx-1 mb-6">
         <button onClick={() => { setShowProfileSettings(true); }} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group">
            <Settings size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">Cài đặt</span>
         </button>
         <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50" />
         <button onClick={() => props.setShowHistory(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group">
            <Clock size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">Nhật ký</span>
         </button>
         <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50" />
         <button onClick={() => setIsDrinkMenuOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group">
            <LayoutGrid size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">Menu</span>
         </button>
      </div>

      {/* Recent Activity */}
      <div className="px-6">
        <RecentActivity
          waterEntries={props.waterEntries || []}
          handleDeleteEntry={props.handleDeleteEntry || (async () => {})}
          handleEditEntry={props.handleEditEntry}
          isSyncing={props.isSyncing || false}
          setShowHistory={props.setShowHistory}
          hasPendingCloudSync={props.hasPendingCloudSync}
        />
      </div>
      
      {/* Telemetry Dashboard */}
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 px-2 flex items-center gap-2">
          <Activity size={12} className="text-indigo-400" /> Đo lường sinh học
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Weather Card */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-sky-500/30 transition-colors shadow-sm">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-sky-500/10 blur-2xl rounded-full" />
            <div className="flex items-center justify-between mb-4 relative z-10">
               <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                 <CloudSun size={14} className="text-sky-500 dark:text-sky-400" />
               </div>
               <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Môi trường</span>
            </div>
            <div className="relative z-10">
               <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{props.weatherData ? `${props.weatherData.temp}°C` : '--°'}</p>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 truncate">{props.weatherData ? props.weatherData.status : 'Chưa đồng bộ'}</p>
            </div>
          </div>

          {/* Watch Card */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors shadow-sm">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full" />
            <div className="flex items-center justify-between mb-4 relative z-10">
               <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                 <Heart size={14} className="text-rose-500 dark:text-rose-400" />
               </div>
               <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Sinh hiệu</span>
            </div>
            <div className="relative z-10">
               {(!props.watchData || props.watchData.heartRate === 0) ? (
                 <>
                   <p className="text-2xl font-black text-slate-400 dark:text-slate-600">--</p>
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Chưa kết nối</p>
                 </>
               ) : (
                 <>
                   <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{props.watchData.heartRate} <span className="text-sm text-slate-500 font-bold tracking-normal">BPM</span></p>
                   <p className="text-emerald-500 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-bold mt-1">Hoạt động tốt</p>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Bottle Card */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-4 flex items-center justify-between mb-6 shadow-sm hover:border-cyan-500/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isConnected ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
              <Bluetooth size={20} className={isConnecting ? 'animate-pulse' : ''} />
            </div>
            {isConnected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />}
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">DigiBottle Pro</h3>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><BatteryFull size={10} /> {batteryLevel}%</span>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-l border-slate-300 dark:border-slate-700 pl-2">Đã kết nối</span>
              </div>
            ) : (
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">{isConnecting ? 'Đang tìm thiết bị...' : 'Ngoại tuyến'}</p>
            )}
          </div>
        </div>
        <div>
          {isConnected ? (
            <button onClick={disconnectBottle} className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all flex items-center justify-center">
              <LogOut size={16} />
            </button>
          ) : (
            <button onClick={connectBottle} disabled={isConnecting} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-50">
              {isConnecting ? 'Đang quét...' : 'Kết nối'}
            </button>
          )}
        </div>
      </div>

      {/* MAIN MENU SIDEBAR */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-64 h-full bg-slate-100 dark:bg-slate-900/90 backdrop-blur-xl border-l border-slate-300 dark:border-white/5 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-300 dark:border-white/5">
                <h2 className="text-slate-900 dark:text-white font-black text-lg">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-200 dark:bg-white/5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-2 flex-1">
                <button onClick={() => { setIsMenuOpen(false); props.setActiveTab('profile'); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
                  <User size={18} className="text-cyan-500 dark:text-cyan-400" /> Hồ sơ cá nhân
                </button>
                <button onClick={() => { setIsMenuOpen(false); setShowProfileSettings(true); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
                  <Settings size={18} className="text-slate-500 dark:text-slate-400" /> Cài đặt
                </button>
                <button onClick={() => { seedSampleWaterLogs(props.profile?.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
                  <Droplet size={18} className="text-blue-500 dark:text-blue-400" /> Seed Sample Data
                </button>

              </div>
              <div className="p-4 border-t border-slate-300 dark:border-white/5">
                <button onClick={() => {
                  if (window.confirm("Đệ muốn đăng xuất thật à?")) {
                    setIsMenuOpen(false);
                    props.handleLogout();
                  }
                }} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all duration-200 ease-out font-bold">
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRINK MENU BOTTOM SHEET */}
      <AnimatePresence>
        {isDrinkMenuOpen && (
          <div key="drink-menu-modal" className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsDrinkMenuOpen(false)} />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full bg-slate-900/90 backdrop-blur-xl border-t border-white/5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-black text-xl">{isCustomMode ? 'Tạo đồ uống mới' : 'Thêm thức uống'}</h2>
                  <p className="text-slate-400 text-xs mt-1">{isCustomMode ? 'Lưu lại để sử dụng nhanh lần sau' : 'Chọn loại đồ uống bạn vừa dùng'}</p>
                </div>
                <button onClick={() => { setIsDrinkMenuOpen(false); setIsCustomMode(false); }} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white active:scale-95 transition-all"><X size={18} /></button>
              </div>
              
              <AnimatePresence mode="wait">
                {isCustomMode ? (
                  <motion.div key="custom-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4 mb-2">
                    <div className="relative">
                      <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Tên đồ uống (VD: Trà đào)" className="w-full bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500" />
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thể tích</label>
                        <span className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{customVolume}ml</span>
                      </div>
                      <input type="range" min="50" max="1000" step="10" value={customVolume} onChange={(e) => setCustomVolume(Number(e.target.value))} className="w-full accent-cyan-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hệ số Hydration</label>
                        <span className="text-lg font-black text-white">{customFactor.toFixed(1)}x</span>
                      </div>
                      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                        <button onClick={() => setCustomFactor(0.8)} className={`px-3 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all ${customFactor === 0.8 ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300'}`}>Caffeine (0.8x)</button>
                        <button onClick={() => setCustomFactor(1.0)} className={`px-3 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all ${customFactor === 1.0 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300'}`}>Pure Water (1.0x)</button>
                        <button onClick={() => setCustomFactor(1.2)} className={`px-3 py-2 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all ${customFactor === 1.2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300'}`}>Electrolytes (1.2x)</button>
                      </div>
                      <input type="range" min="-1.0" max="2.0" step="0.1" value={customFactor} onChange={(e) => setCustomFactor(Number(e.target.value))} className="w-full accent-cyan-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button onClick={() => setIsCustomMode(false)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-semibold hover:bg-white/10 active:scale-95 transition-all">Quay lại</button>
                      <button onClick={() => {
                        if(!customName.trim()) { toast.error("Vui lòng nhập tên đồ uống!"); return; }
                        const newCustomDrink = {
                          id: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                          name: customName.trim(),
                          amount: customVolume,
                          factor: customFactor,
                          icon: 'Droplet',
                          bg: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
                          color: 'text-indigo-400'
                        };
                        if (editingDrinkId) {
                          setDrinkGridList(prev => prev.map(d => d.id === editingDrinkId ? { ...d, name: customName.trim(), amount: customVolume, factor: customFactor } : d));
                          toast.success("Đã cập nhật!");
                        } else {
                          setDrinkGridList(prev => [...prev, newCustomDrink]);
                          props.handleAddWater(customVolume, customFactor, customName.trim());
                          toast.success(`Đã thêm ${customVolume}ml ${customName.trim()}`);
                        }
                        setIsCustomMode(false);
                        setIsDrinkMenuOpen(false);
                      }} className="flex-[2] py-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                        {editingDrinkId ? 'Lưu thay đổi' : 'Lưu & Thêm'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="grid-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="grid grid-cols-3 gap-3 mb-2 max-h-[50vh] overflow-y-auto scrollbar-hide pb-4 pt-2 px-1">
                    {drinkGridList.map((drink, index) => (
                      <div key={drink.id && drink.id !== '' ? drink.id : `fallback-drink-grid-${index}`} className="relative h-full group">
                        <button
                          onClick={() => {
                            props.handleAddWater(drink.amount || 250, drink.factor, drink.name);
                            setIsDrinkMenuOpen(false);
                            toast.success(`Đã thêm ${drink.amount || 250}ml ${drink.name}`);
                          }}
                          className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-2xl border ${drink.bg} active:scale-95 transition-all duration-200 ease-out`}
                        >
                          <div className="mb-2">{renderIcon(drink.icon, { size: 24, className: drink.color })}</div>
                          <span className="text-white text-xs font-bold w-full text-center truncate">{drink.name}</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 font-mono">{(drink.factor > 0 ? '+' : '') + drink.factor.toFixed(1)}x</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDrinkId(drink.id);
                            setCustomName(drink.name);
                            setCustomVolume(drink.amount || 250);
                            setCustomFactor(drink.factor);
                            setIsCustomMode(true);
                          }}
                          className="absolute -top-1.5 right-7 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all z-10 shadow-lg"
                        >
                          <Edit2 size={10} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Xóa đồ uống ${drink.name}?`)) {
                              setDrinkGridList(prev => prev.filter(c => c.id !== drink.id));
                            }
                          }}
                          className="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all z-10 shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => { setEditingDrinkId(null); setCustomName(''); setCustomVolume(250); setCustomFactor(1.0); setIsCustomMode(true); }}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/50 border border-white/5 border-dashed hover:bg-white/5 transition-all active:scale-95 h-full"
                    >
                      <Plus size={24} className="text-slate-400 mb-2" />
                      <span className="text-sm font-semibold text-slate-300">Tùy chỉnh</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditingQuickAmounts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setIsEditingQuickAmounts(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
              className="relative w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-1/4 left-0 w-full h-1/2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl opacity-50" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Settings size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl">Tùy chỉnh Nạp nhanh</h3>
                    <p className="text-slate-400 text-sm">Thiết lập 3 mức dung tích yêu thích</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[0, 1, 2].map((index) => (
                    <div key={`quick-amount-${index}`} className="group">
                      <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                          {index + 1}
                        </div>
                        Mức {index + 1}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="50"
                          max="1000"
                          value={draftAmounts[index] || ''}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 0 && value <= 2000) {
                              const newDraft = [...draftAmounts] as [number, number, number];
                              newDraft[index] = value;
                              setDraftAmounts(newDraft);
                            }
                          }}
                          className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-4 text-center text-white text-xl font-black focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-500"
                          placeholder="ml"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                          ml
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditingQuickAmounts(false)}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold transition-all hover:bg-white/10 border border-white/10"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const parsed = draftAmounts.filter(n => !isNaN(n) && n >= 50 && n <= 2000);
                      if (parsed.length === 3) {
                        setQuickAmounts(parsed);
                        setIsEditingQuickAmounts(false);
                        toast.success("✅ Đã cập nhật mức nạp nhanh!");
                      } else {
                        toast.error("⚠️ Vui lòng nhập 3 mức từ 50-2000ml");
                      }
                    }}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold transition-all hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  >
                    💾 Lưu thay đổi
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {showLevelDetail && props.profile && (
          <LevelDetailModal
            isOpen={showLevelDetail}
            onClose={() => setShowLevelDetail(false)}
            level={props.profile.level || 1}
            exp={props.profile.total_exp || 0}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGoalDetail && (
          <HydrationGoalModal
            isOpen={showGoalDetail}
            onClose={() => setShowGoalDetail(false)}
            waterIntake={props.waterIntake}
            hydrationResult={props.hydrationResult}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default HomeTab;
