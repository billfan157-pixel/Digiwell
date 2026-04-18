import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Target, Watch, CloudSun, Calendar, Lock
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  LocalNotifications,
  type ActionPerformed
} from '@capacitor/local-notifications';
import {
  parseHydrationNotificationAction,
  registerHydrationReminderActions,
  scheduleHydrationSnooze,
  supportsNativeHydrationReminders,
} from '@/lib/hydrationReminders';
import { scanDrinkFromImage, isAiConfigured } from '@/lib/ai';
import type { HealthReport } from '@/lib/aiReports';
import { generateWeeklyReport, getLatestHealthReport } from '@/lib/aiReports';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { runQuestEngine, runChallengeEngine, type QuestEngineContext } from '@/lib/questEngine';
// @ts-ignore
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'framer-motion';
import QuestPage from './QuestPage';

import WelcomeScreen from '@/WelcomeScreen';
import LoginScreen from '@/LoginScreen';
import RegisterScreen from '@/components/RegisterScreen';
import BottomNav, { type TabType } from '@/components/layout/BottomNav';
import HomeTab, { type DrinkPreset } from '@/tabs/HomeTab';
import FeedTab from '@/tabs/FeedTab';
import ProfileTab from '@/tabs/ProfileTab';
import InsightTab from '@/tabs/InsightTab';
import LeagueTab from '@/tabs/LeagueTab';
import { ArenaTab } from '@/tabs/ArenaTab'; // Import ArenaTab

import GlobalModalManager from '@/components/modals/GlobalModalManager';
import SettingsModal from '@/components/modals/SettingsModal';
import { useAppSystem } from '@/hooks/useAppSystem';
import { useWaterData } from '@/hooks/useWaterData';
import { useGeminiAI } from '@/hooks/useGroqAI';
import { useBiometric } from '@/hooks/useBiometric';
import { useSocialData } from '@/hooks/useSocialData';
import { useStreak } from '@/hooks/useStreak';
import { useFeed } from '@/hooks/useFeed';
import { useUIStore } from '@/store/useUIStore';
import { useReminderStore, getReminderPreview, type HydrationReminderSettings } from '@/store/useReminderStore';
import { useDrinkPresetStore } from '@/store/useDrinkPresetStore';
import { calculateWP, getRankInfo } from '@/utils/healthMath';
import { playSuccessSound } from '@/lib/audio';
import type { Friend, SearchResult } from '@/models';
import { ThemeProvider, useTheme } from '@/context/ThemeProvider';
import { calculateWeatherAdjustment } from '@/lib/weatherEngine';
import { calculateWaterIntake, type ActivityLevel, type Gender, type Climate } from '@/lib/HydrationEngine';
import OnboardingModal from '@/components/OnboardingModal';
import LevelUpModal from '@/components/clubs/LevelUpModal';
import ShopModal from '@/components/modals/ShopModal';

// ============================================================================
// COMPONENT: MÀN HÌNH KHÓA SINH TRẮC HỌC
// ============================================================================
function LockedScreen({ profile, onUnlock, onLogout }: any) {
  const { authenticateBiometric, isAuthenticating } = useBiometric();
  
  useEffect(() => { handleUnlock(); }, []); // Tự động bật popup sinh trắc học khi mount

  const handleUnlock = async () => {
    if (!profile?.id) return;
    const success = await authenticateBiometric(profile.id);
    if (success) onUnlock();
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 text-white p-6 font-sans">
      <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30">
        <Lock size={32} className="text-cyan-400" />
      </div>
      <h2 className="text-2xl font-black mb-2">Đã khóa ứng dụng</h2>
      <p className="text-slate-400 mb-8 text-center text-sm">
        DigiWell được bảo vệ bằng Sinh trắc học.<br/>Vui lòng xác thực để tiếp tục.
      </p>
      <button onClick={handleUnlock} disabled={isAuthenticating} className="w-full max-w-xs py-4 rounded-2xl bg-cyan-500 text-black font-bold mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 active:scale-95 transition-all">
        {isAuthenticating ? 'Đang xác thực...' : 'Mở khóa bằng Sinh trắc học'}
      </button>
      <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
        Đăng nhập bằng tài khoản khác
      </button>
    </div>
  );
}

// ============================================================================
// DIGIWELL SMART WELLNESS - PREMIUM DARK UI (V7 FIXED)
// FIX #1: handleRegister upsert profiles sau signUp
// FIX #2: waterGoal tự động theo Calendar/Watch thay vì currentActivity thủ công
// ============================================================================

function AppContent() {

  // FIX BUG: Ref để thay thế useEffectEvent bị lỗi không tồn tại trong React 18
  const handleHydrationNotificationActionRef = useRef<((action: ActionPerformed) => Promise<void>) | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  // ==========================================================================
  // [1] QUẢN LÝ TRẠNG THÁI (STATES)
  // ==========================================================================
  const {
    view = 'welcome', setView = () => {}, profile = null, setProfile = () => {}, loginPrefill = '', setLoginPrefill = () => {}, handleLogout = async () => {},
    isWeatherSynced = false, setIsWeatherSynced = () => {}, weatherData, syncWeather = async () => {},
    isCalendarSynced = false, setIsCalendarSynced = () => {}, calendarEvents = [], syncCalendar = async () => {},
    isWatchConnected = false, setIsWatchConnected = () => {}, watchData
  } = useAppSystem() || {};

  // State cho demo thuật toán thủ công khi chưa kết nối thiết bị
  const [currentActivity, setCurrentActivity] = useState<'chill' | 'light' | 'hard'>('chill');

  // [NEW] PREMIUM FEATURES STATES (moved up for useMemo dependency)
  const [isFastingMode, setIsFastingMode] = useState(() => !!localStorage.getItem('digiwell_fasting_start'));
  const [fastingStartTime, setFastingStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('digiwell_fasting_start');
    return saved ? parseInt(saved, 10) : null;
  });

  // Force clear invalid cache on app start
  useEffect(() => {
    const cached = localStorage.getItem('cached_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.id || parsed.id === 'undefined' || parsed.id.length !== 36) {
          console.warn('[App] Clearing invalid cached profile:', parsed.id);
          localStorage.removeItem('cached_profile');
        }
      } catch (e) {
        console.warn('[App] Clearing malformed cached profile');
        localStorage.removeItem('cached_profile');
      }
    }
  }, []);

  // ✅ FIX: Auto-detect waterGoal từ Calendar → Watch → Thủ công (theo thứ tự ưu tiên)
  // Đặt waterGoal ở đây để đảm bảo nó được khai báo sau khi profile và các dependencies khác từ useAppSystem đã có.
  const hydrationResult = useMemo(() => {
    if (!profile) return null;

    // Type mapping fallbacks
    const genderMap: Record<string, Gender> = { 'Nam': 'male', 'Nữ': 'female' };
    const mappedGender = genderMap[profile.gender] || 'other';

    // Map activity from Vietnamese DB format to English literal types
    const mappedActivity = (profile.activity === 'sedentary' || profile.activity === 'light' || profile.activity === 'moderate' || profile.activity === 'high' || profile.activity === 'athlete') ? profile.activity : 'moderate';

    return calculateWaterIntake({
      weightKg: profile.weight || 60,
      heightCm: profile.height || 170,
      ageYears: profile.age || 20,
      gender: mappedGender,
      activityLevel: mappedActivity as ActivityLevel,
      climate: 'temperate', // Defaulting for now, as currentTempC will override it anyway
      healthCondition: 'none',
      dietFactors: [],
      currentTempC: isWeatherSynced ? weatherData?.temp : undefined,
      // FIX: watchData only has `steps`. Estimate minutes from steps (e.g., 100 steps/min).
      exerciseMinutes: isWatchConnected ? Math.round((watchData?.steps || 0) / 100) : 0,
      isFasting: isFastingMode // Using the existing fasting state!
    });
  }, [profile, weatherData, isWeatherSynced, watchData, isWatchConnected, isFastingMode]);

  const waterGoal = hydrationResult?.goalMl || 2000;

  const {
    activeTab, setActiveTab, showHistory, setShowHistory, showSmartHub, setShowSmartHub,
    showCustomDrink, setShowCustomDrink, showPresetManager, setShowPresetManager,
    showOnboarding, setShowOnboarding, showAiChat, setShowAiChat,
    showPremiumModal, setShowPremiumModal, showProfileSettings, setShowProfileSettings,
    showAddFriend, setShowAddFriend, showEditProfile, setShowEditProfile
  } = useUIStore();

  const [now, setNow] = useState(() => new Date());
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const [weeklyHistory, setWeeklyHistory] = useState<{d: string, ml: number, isToday: boolean}[]>([]);
  // Lịch sử từng lần uống (lưu localStorage theo ngày)
  type PendingHydrationAction = { amount: number; name: string; timestamp: number };
  const PENDING_HYDRATION_ACTIONS_KEY = 'digiwell_pending_hydration_actions';
  
  // State cho tính năng Scan AI
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const { reminderSettings, isReminderPermissionGranted, isApplyingReminderSettings, updateReminderSetting, handleApplyReminderSettings, loadReminderSettings } = useReminderStore();
  const { drinkPresets, editingPresets, customDrinkForm, setCustomDrinkForm, loadDrinkPresets, saveDrinkPresets, handleUpdatePreset, setEditingPresets } = useDrinkPresetStore();

  // Hàm bọc hỗ trợ SetStateAction để truyền xuống HomeTab mà không bị lỗi Type
  const handleSetCustomDrinkForm = useCallback((val: React.SetStateAction<{ name: string; amount: number | string; factor: number }>) => {
    setCustomDrinkForm(typeof val === 'function' ? val(customDrinkForm) : val);
  }, [customDrinkForm]);

  // State cho Onboarding (Hướng dẫn tân thủ)
  const [onboardingStep, setOnboardingStep] = useState(1);

  // State cho Chat AI Premium
  const [showShopModal, setShowShopModal] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<HealthReport | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState({ from: 0, to: 0 });
  const [isWeeklyReportLoading, setIsWeeklyReportLoading] = useState(false);

  // ==========================================================================
  // [NEW] PREMIUM FEATURES STATES
  // ==========================================================================
  /**
   * The user's total Wellness Points (WP) should be a state variable,
   * initialized from the profile data fetched from the database.
   * This allows it to be updated when points are staked on challenges.
   */
  const [wp, setWp] = useState(0);

  useEffect(() => {
    // Assuming `profile.wp` holds the total points from your database.
    if (profile?.wp !== undefined) {
      setWp(profile.wp);
    }
  }, [profile?.wp]);
  const [isPremium, setIsPremium] = useState(false);
  const [leagueMode, setLeagueMode] = useState<'public' | 'friends' | 'clubs'>('public');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Social & Friends
  const [searchQuery, setSearchQuery] = useState('');
   const [friendsList, setFriendsList] = useState<Friend[]>([]);
   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [publicLeaderboard, setPublicLeaderboard] = useState<Friend[]>([]);

  // ==========================================================================
  // [NEW] CẬP NHẬT HỒ SƠ STATES
  // ==========================================================================
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    nickname: '', gender: 'Nam', age: 20, height: 172, weight: 82, activity: 'active', climate: 'Nhiệt đới (Nóng)', goal: 'Giảm mỡ & Tăng cơ'
  });

  // ==========================================================================
  // [2] LOGIC SUPABASE CLOUD SYNC
  // ==========================================================================
  
  // Tải danh sách bạn bè thật từ Supabase
  const fetchFriendsData = async () => {
    if (!profile?.id || profile.id === 'undefined') return;
    try {
      // 1. Lấy danh sách ID bạn bè
      const { data: fData, error: fErr } = await supabase!
        .from('friends')
        .select('friend_id')
        .eq('user_id', profile.id);
      if (fErr || !fData) return;
      
      const friendIds = fData.map((f: { friend_id: string }) => f.friend_id);
      if (friendIds.length === 0) {
        setFriendsList([]);
        return;
      }

      // 2. Lấy thông tin Profile và lượng nước hôm nay
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      
      const { data: pData } = await supabase!.from('profiles').select('id, nickname').in('id', friendIds);
      const { data: wData } = await supabase!.from('water_logs').select('user_id, amount').gte('created_at', startOfDay).lte('created_at', endOfDay).in('user_id', friendIds);

      if (pData) {
        const formattedFriends = pData.map((p: { id: string; nickname: string }) => {
          const waterLog = wData?.find((w: { user_id: string; amount: number }) => w.user_id === p.id);
          const intake = waterLog ? waterLog.amount : 0;
          return { 
            id: p.id, 
            name: p.nickname || 'Người dùng', 
            dept: 'Bạn bè', 
              wp: calculateWP(intake, 2000, 1), // Sử dụng hàm chuẩn từ healthMath, giả định streak = 1
            streak: 1, 
            isMe: false 
          };
        });
        setFriendsList(formattedFriends);
      }
    } catch (err) {
      console.error("Lỗi tải bạn bè:", err);
    }
  };

  // Tải bảng xếp hạng công khai từ Supabase
  const fetchPublicLeaderboard = async () => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('id, nickname, wp')
        .order('wp', { ascending: false })
        .limit(50); // Lấy 50 người dùng hàng đầu

      if (error) throw error;

      if (data) {
        const formattedLeaderboard = data.map((p: { id: string; nickname: string; wp: number }) => ({
          id: p.id,
          name: p.nickname || 'Người dùng',
          dept: 'Cộng đồng DigiWell',
          wp: p.wp || 0,
          streak: 0, // Dữ liệu streak không có trong query này
          isMe: p.id === profile?.id,
        }));
        setPublicLeaderboard(formattedLeaderboard);
      }
    } catch (err) {
      console.error("Lỗi tải bảng xếp hạng công khai:", err);
    }
  };

  // Tìm kiếm User thật theo Nickname
  const handleSearchUser = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const { data, error } = await supabase!
      .from('profiles')
      .select('id, nickname')
      .ilike('nickname', `%${query}%`)
      .neq('id', profile?.id)
      .limit(5);
    if (!error && data) setSearchResults(data.map((u: SearchResult) => ({ ...u, nickname: u.nickname || 'Người dùng' })));
    setIsSearching(false);
  };

  // Thêm vào bảng friends
  const handleAddFriend = async (friendId: string, friendName: string) => {
    const toastId = toast.loading("Đang gửi lời mời...");
    const { error } = await supabase!
      .from('friends')
      .insert({ user_id: profile?.id, friend_id: friendId });
      
    if (error) {
      if (error.code === '23505') toast.error(`Bạn và ${friendName} đã là bạn bè!`, { id: toastId });
      else toast.error("Lỗi: " + error.message, { id: toastId });
    } else {
      toast.success(`Đã thêm ${friendName} vào danh sách theo dõi!`, { id: toastId });
      setShowAddFriend(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchFriendsData(); // Cập nhật lại Bảng xếp hạng
    }
  };

  // ==========================================================================
  // [3] VÒNG ĐỜI HỆ THỐNG (EFFECTS)
  // ==========================================================================
  
  // Tự động tải dữ liệu Bạn bè khi chuyển sang Tab Bạn Bè
  useEffect(() => {
    if (activeTab === 'league') {
      if (leagueMode === 'friends') {
        fetchFriendsData();
      } else if (leagueMode === 'public') {
        fetchPublicLeaderboard();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueMode, activeTab, profile?.id]);

  // ==========================================================================
  // [NEW] WATER DATA HOOK
  // ==========================================================================
  const refetchProfile = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined' || !isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (error) {
        console.error("Error refetching profile:", error);
        return;
      }

      if (data) {
        localStorage.setItem('cached_profile', JSON.stringify(data));
        setProfile({
          id: data.id, nickname: data.nickname, password: '', gender: data.gender,
          age: data.age, height: data.height, weight: data.weight, activity: data.activity,
          climate: data.climate, goal: data.goal, wakeUp: data.wake_up, bedTime: data.bed_time,

          water_goal: data.water_goal, wp: data.wp, coins: data.coins, total_exp: data.total_exp, level: data.level,
          water_today: data.water_today, total_water: data.total_water,
          onboarding_completed: data.onboarding_completed
        });
      }
    } catch (err) {
      console.error("Error refetching profile:", err);
      const cached = localStorage.getItem('cached_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Validate cached profile ID
        if (parsed.id && parsed.id !== 'undefined' && parsed.id.length === 36) {
          setProfile({
            id: parsed.id, nickname: parsed.nickname, password: '', gender: parsed.gender,
            age: parsed.age, height: parsed.height, weight: parsed.weight, activity: parsed.activity,
            climate: parsed.climate, goal: parsed.goal, wakeUp: parsed.wake_up, bedTime: parsed.bed_time,
            water_goal: parsed.water_goal, wp: parsed.wp, coins: parsed.coins, total_exp: parsed.total_exp, level: parsed.level,
            water_today: parsed.water_today, total_water: parsed.total_water,
            onboarding_completed: parsed.onboarding_completed
          });
        } else {
          // Invalid cached profile, remove it
          localStorage.removeItem('cached_profile');
          console.warn('[App] Removed invalid cached profile with ID:', parsed.id);
        }
      }
    }
  }, [profile?.id, setProfile]);

  // Force refetch profile after fixes
  useEffect(() => {
    if (profile?.id && profile.id !== 'undefined') {
      console.log('[App] Force refetching profile to sync EXP display');
      refetchProfile();
    }
  }, [profile?.id, refetchProfile]); 

  // [NEW] Optimistic UI Update Wrapper cho thao tác Uống Nước
  const handleWaterSync = useCallback(async (optimisticAmount?: number, optimisticExp?: number) => {
    if (optimisticAmount !== undefined && optimisticExp !== undefined) {
      // Optimistic update for UI responsiveness
      setProfile((prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          water_today: (prev.water_today || 0) + optimisticAmount,
          total_water: (prev.total_water || 0) + optimisticAmount,
          total_exp: (prev.total_exp || 0) + optimisticExp
        };
        updated.level = Math.floor(updated.total_exp / 500) + 1; // Tính dự kiến Level
        if (updated.id && updated.id !== 'undefined') {
          localStorage.setItem('cached_profile', JSON.stringify(updated));
        }
        return updated;
      });

        // Manual update DB after state update
        const currentProfile = profile;
        if (currentProfile && currentProfile.id !== 'undefined') {
          const newExp = (currentProfile.total_exp || 0) + optimisticExp;
          const newLevel = Math.floor(newExp / 500) + 1;
          const { error } = await supabase.from('profiles').update({
            total_exp: newExp,
            level: newLevel,
            water_today: (currentProfile.water_today || 0) + optimisticAmount,
            total_water: (currentProfile.total_water || 0) + optimisticAmount
          }).eq('id', currentProfile.id);
          if (error) {
            console.error('Profile update failed:', error);
            toast.error('Cập nhật profile thất bại');
          } else {
            // Run quest engine after successful profile update
            const questCtx: QuestEngineContext = {
              userId: currentProfile.id,
              waterToday: (currentProfile.water_today || 0) + optimisticAmount,
              waterGoal: currentProfile.water_goal || 2000,
              streak: 0, // We'll calculate this properly later
              totalWater: (currentProfile.total_water || 0) + optimisticAmount,
              logCountToday: 1, // Approximate
              weeklyDays: 1, // Approximate
            };
            runQuestEngine(questCtx);
          }
        }
    } else {
      // Database triggers will automatically recalculate total_exp
      // Just refetch definitive state from database
      await refetchProfile();
    }
  }, [profile, setProfile, refetchProfile]);

  // Hàm trừ tiền vàng dùng trong Shop
  const handleSpendCoins = async (amount: number) => {
    if (!profile?.id || profile.id === 'undefined') return false;
    const newCoins = (profile.coins || 0) - amount;
    if (newCoins < 0) return false;
    
    setProfile((prev: any) => ({ ...prev, coins: newCoins })); // UI Update nhanh
    const { error } = await supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
    
    if (error) {
      toast.error("Lỗi đồng bộ tiền vàng!");
      setProfile((prev: any) => ({ ...prev, coins: prev.coins + amount })); // Lỗi thì trả lại
      return false;
    }
    return true;
  };

  const {
    waterIntake = 0, waterEntries = [], handleAddWater = async () => {}, handleDeleteEntry = async () => {},
    handleEditEntry = async () => {}, editingEntry = null, setEditingEntry = () => {}, editAmount = 0,
    setEditAmount = () => {}, hasPendingCloudSync = false, isSyncing = false
  } = useWaterData(profile, handleWaterSync) || {};

  // GAMIFICATION: Level Up Effect
  useEffect(() => {
    if (profile?.level && previousLevelRef.current !== null && profile.level > previousLevelRef.current) {
        setLevelUpInfo({ from: previousLevelRef.current, to: profile.level });
        setShowLevelUp(true);
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, zIndex: 9999 });
        playSuccessSound();
    }
    // Update ref after checking
    previousLevelRef.current = profile?.level || null;
  }, [profile?.level, setShowLevelUp]);

  // Tải dữ liệu nước trong tuần (REAL DATA)
  useEffect(() => {
    const fetchWeeklyHistory = async () => {
        const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const today = new Date();
        const dateList: { date: Date, dayStr: string }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
              // FIX TIMEZONE BUG: Dùng Local format thay vì toISOString (UTC) để không bị lùi ngày
              const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              dateList.push({ date: d, dayStr: localDateStr });
        }

        if (!profile?.id || profile.id === 'undefined') {
            const emptyHistory = dateList.map((d, index) => ({
                d: index === 6 ? 'HN' : dayLabels[d.date.getDay()],
                ml: 0,
                isToday: index === 6,
            }));
            setWeeklyHistory(emptyHistory);
            return;
        }

        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 0, 0, 0).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        try {
            const { data: cloudData, error } = await supabase!
                .from('water_logs')
                .select('created_at, amount')
                .eq('user_id', profile.id)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (error) throw error;

            const dataMap = new Map<string, number>();
            cloudData?.forEach((d: any) => {
                if (!d.created_at) return;
                const dObj = new Date(d.created_at);
                const dayKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
                dataMap.set(dayKey, (dataMap.get(dayKey) || 0) + (d.amount || 0));
            });

            const history = dateList.map((d, index) => ({
                d: index === 6 ? 'HN' : dayLabels[d.date.getDay()],
                ml: index === 6 ? waterIntake : (dataMap.get(d.dayStr) || 0),
                isToday: index === 6,
            }));
            setWeeklyHistory(history);
        } catch (err) { console.error("Lỗi tải lịch sử tuần:", err); }
    };
    fetchWeeklyHistory();
  }, [profile?.id, waterIntake]);

  // ==========================================================================
  // [NEW] GAMIFICATION: AUTO-AWARD 100% BADGE (PHASE 3A)
  // ==========================================================================
  useEffect(() => {
    const awardFirst100PercentBadge = async () => {
      if (!profile?.id || profile.id === 'undefined' || waterIntake < waterGoal || waterGoal === 0) return;
      
      const storageKey = `awarded_100pct_badge_${profile.id}`;
      if (localStorage.getItem(storageKey)) return;

      try {
        const { data: badgeData } = await supabase!.from('badges').select('id').eq('name', 'Giọt Nước Nhỏ').single();
        if (!badgeData) return;

        const { data: userBadge } = await supabase!.from('user_badges').select('id').eq('user_id', profile.id).eq('badge_id', badgeData.id).single();

        if (!userBadge) {
          const { error } = await supabase!.from('user_badges').insert({
            user_id: profile.id,
            badge_id: badgeData.id
          });
          if (!error) {
            toast.success('🎉 Bạn đã nhận được Huy hiệu: Giọt Nước Nhỏ!');
            localStorage.setItem(storageKey, 'true');
          }
        } else {
          localStorage.setItem(storageKey, 'true');
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra và trao huy hiệu:', err);
      }
    };
    awardFirst100PercentBadge();
  }, [waterIntake, waterGoal, profile?.id]);

  // ==========================================================================
  // [NEW] GAMIFICATION: TỰ ĐỘNG GÁN NHIỆM VỤ HÀNG NGÀY BẰNG RPC
  // ==========================================================================
  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined') return;

    const assignQuestsIfNeeded = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastCheckKey = `daily_quest_check_${profile.id}`;
      const lastCheckDate = localStorage.getItem(lastCheckKey);

      if (lastCheckDate !== todayStr) {
        try {
          await supabase.rpc('assign_daily_quests', { p_user_id: profile.id });
          localStorage.setItem(lastCheckKey, todayStr);
        } catch (err) {
          console.error('Lỗi khi gán nhiệm vụ hàng ngày:', err);
        }
      }
    };
    assignQuestsIfNeeded();
  }, [profile?.id]);

  // ==========================================================================
  // [NEW] HIỆU ỨNG ÂM THANH & RUNG KHI ĐẠT 100% MỤC TIÊU NGÀY
  // ==========================================================================
  useEffect(() => {
    if (!profile?.id || waterGoal === 0 || waterIntake < waterGoal) return;

    // Lấy ngày hiện tại để khóa (chỉ phát 1 lần mỗi ngày)
    const todayStr = new Date().toISOString().split('T')[0];
    const soundKey = `digiwell_100pct_sound_${profile.id}_${todayStr}`;

    if (!localStorage.getItem(soundKey)) {
      playSuccessSound();
      
      // Kích hoạt rung điện thoại (Tit-Tit-Títtttt)
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      
      // Kích hoạt pháo giấy Confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        zIndex: 9999,
        colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7'] // Xanh Cyan, Cam, Xanh lá, Tím
      });

      localStorage.setItem(soundKey, 'true');
    }
  }, [waterIntake, waterGoal, profile?.id]);

  // ==========================================================================
  // [3.1] PERSIST CÀI ĐẶT ĐỒNG BỘ THEO USER
  // ==========================================================================
  useEffect(() => {
    if (profile?.id && profile.id !== 'undefined') {
      const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profile.id}`) || '{}');
      setIsWatchConnected(!!prefs.watch);
      setIsWeatherSynced(!!prefs.weather);
      setIsCalendarSynced(!!prefs.calendar);
      loadReminderSettings(profile.id);
      loadDrinkPresets();
      setIsPrefsLoaded(true);
    } else {
      setIsPrefsLoaded(false);
      setShowOnboarding(false);
      setShowProfileSettings(false);
    }
    
    if (profile?.id && profile.id !== 'undefined') {
      if (!profile.onboarding_completed) {
        // Tự động sửa lỗi (Auto-fix) cho người dùng cũ đã có dữ liệu nhưng thiếu cờ onboarding
        if (profile.weight && profile.water_goal) {
          supabase.from('profiles').update({ onboarding_completed: true }).eq('id', profile.id).then();
          setProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
        } else {
          setShowOnboarding(true);
        }
      }
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.id && profile.id !== 'undefined' && isPrefsLoaded) {
      localStorage.setItem(`digiwell_prefs_${profile.id}`, JSON.stringify({ watch: isWatchConnected, weather: isWeatherSynced, calendar: isCalendarSynced }));
    }
  }, [profile?.id, reminderSettings]);

  const syncPremiumStatus = async (options?: { poll?: boolean }) => {
    if (!profile?.id || profile.id === 'undefined') {
      setIsPremium(false);
      return false;
    }

    const attempts = options?.poll ? 5 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { data, error } = await supabase!
        .from('profiles')
        .select('subscription_tier, subscription_end')
        .eq('id', profile.id)
        .single();

      if (!error && data) {
        const endDate = data.subscription_end ? new Date(data.subscription_end) : null;
        const premiumActive = data.subscription_tier === 'premium' && (!endDate || endDate > new Date());

        setIsPremium(premiumActive);

        if (premiumActive || !options?.poll) {
          return premiumActive;
        }
      }

      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsPremium(false);
    return false;
  };

  useEffect(() => {
    void syncPremiumStatus();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || !isPremium) {
      setWeeklyReport(null);
      return;
    }

    let ignore = false;

    const loadLatestWeeklyReport = async () => {
      setIsWeeklyReportLoading(true);

      try {
        const latestReport = await getLatestHealthReport(profile.id, 'weekly');
        if (!ignore) setWeeklyReport(latestReport);
      } finally {
        if (!ignore) setIsWeeklyReportLoading(false);
      }
    };

    void loadLatestWeeklyReport();

    return () => {
      ignore = true;
    };
  }, [profile?.id, isPremium]);

  useEffect(() => {
    let ignore = false;

    const restoreHydrationReminders = async () => {
      if (supportsNativeHydrationReminders()) {
        await registerHydrationReminderActions().catch(error => {
          console.warn('Không thể đăng ký action cho hydration notifications:', error);
        });
      }

      if (ignore) return;

      // Logic khôi phục lịch nhắc đã được chuyển vào useReminderStore
      // và sẽ được kích hoạt khi cần thiết, ví dụ sau khi load settings.
      // Việc gọi scheduleHydrationReminders trực tiếp ở đây có thể gây ra
      // các hành vi không mong muốn nếu state chưa được đồng bộ hoàn toàn.
      // Tạm thời vô hiệu hóa để tránh xung đột.
      // Sẽ có một giải pháp tốt hơn là tạo một action `restoreReminders` trong store.
    };

    void restoreHydrationReminders();

    return () => {
      ignore = true;
    };
  }, [profile?.id, isPrefsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supportsNativeHydrationReminders()) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const setupNotificationActions = async () => {
      await registerHydrationReminderActions().catch(() => undefined);
      listenerHandle = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        notificationAction => {
          if (handleHydrationNotificationActionRef.current) {
            void handleHydrationNotificationActionRef.current(notificationAction);
          }
        },
      );
    };

    void setupNotificationActions();

    return () => {
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || view !== 'app') return;

    const pendingActions = readPendingHydrationActions();
    if (pendingActions.length === 0) return;

    clearPendingHydrationActions();

    void (async () => {
      for (const action of pendingActions) {
        await handleAddWater(action.amount, 1, action.name);
      }
      toast.success(`Đã ghi nhận ${pendingActions.length} lần uống nước từ notification.`);
    })();
  }, [profile?.id, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastDayRef = useRef(new Date().getDate());

  useEffect(() => {
    let timer: number | undefined;

    // Hàm kiểm tra ép Reset nếu phát hiện lệch ngày
    const checkMidnight = (currDate: Date) => {
      if (currDate.getDate() !== lastDayRef.current) {
        lastDayRef.current = currDate.getDate();
        window.location.reload(); // Quét sạch state cũ và nạp lại ngày mới
      }
    };

    const start = () => { 
      if (timer) return; 
      timer = window.setInterval(() => {
        setNow(() => {
          const curr = new Date();
          checkMidnight(curr); // Quét mỗi giây khi app đang bật
          return curr;
        });
      }, 1000); 
    };
    const stop = () => { if (!timer) return; window.clearInterval(timer); timer = undefined; };
    const onVis = () => { 
      if (document.visibilityState === 'visible') { 
        const curr = new Date();
        checkMidnight(curr); // KIỂM TRA NGAY LẬP TỨC khi app vừa được đánh thức từ Background!
        setNow(curr); 
        start(); 
      } else {
        stop(); 
      }
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // ==========================================================================
  // [4] THUẬT TOÁN TÍNH TOÁN (ALGORITHMS)
  // ==========================================================================

  const { streak, streakFreezes, needsFreeze, useStreakFreeze } = useStreak(profile?.id, waterGoal, waterIntake, isPremium);

  const socialProps = useSocialData({ profile, waterIntake, waterGoal, streak, activeTab, setActiveTab }) || {};
  const { openSocialComposer = () => {} } = socialProps;
  const { posts } = useFeed(profile?.id);

  // Fasting Math
  const fastingElapsed = isFastingMode && fastingStartTime ? now.getTime() - fastingStartTime : 0;
  const fastingTotalMs = 16 * 60 * 60 * 1000; // 16 hours
  const fastingRemaining = Math.max(fastingTotalMs - fastingElapsed, 0);
  const fastingHours = Math.floor(fastingRemaining / (1000 * 60 * 60));
  const fastingMinutes = Math.floor((fastingRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const fastingSeconds = Math.floor((fastingRemaining % (1000 * 60)) / 1000);

  const progress = Math.min((waterIntake / waterGoal) * 100, 100);
  const reminderPreview = useMemo(() => getReminderPreview(reminderSettings), [reminderSettings]);

  const nowText = useMemo(() => ({
    date: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(now),
    time: new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
  }), [now]);

  // ==========================================================================
  // [5] CÁC HÀM XỬ LÝ (CONTROLLERS)
  // ==========================================================================

  handleHydrationNotificationActionRef.current = async (notificationAction: ActionPerformed) => {
    const intent = parseHydrationNotificationAction(notificationAction);
    if (!intent) return;

    if (intent.kind === 'snooze') {
      await scheduleHydrationSnooze({
        minutes: intent.minutes,
        dailyGoal: waterGoal,
        nickname: profile?.nickname,
      });
      toast.info(`Đã nhắc lại sau ${intent.minutes} phút.`);
      return;
    }

    if (!profile?.id || profile.id === 'undefined') {
      queuePendingHydrationAction({
        amount: intent.amount,
        name: intent.name,
        timestamp: Date.now(),
      });
      return;
    }

    await handleAddWater(intent.amount, 1, intent.name);
  };

  const readPendingHydrationActions = (): PendingHydrationAction[] => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_HYDRATION_ACTIONS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const queuePendingHydrationAction = (action: PendingHydrationAction) => {
    const pending = readPendingHydrationActions();
    pending.push(action);
    localStorage.setItem(PENDING_HYDRATION_ACTIONS_KEY, JSON.stringify(pending.slice(-10)));
  };

  const clearPendingHydrationActions = () => {
    localStorage.removeItem(PENDING_HYDRATION_ACTIONS_KEY);
  };

  const handleExportPDF = useCallback(async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setIsExportingPDF(true);
    const tid = toast.loading("Đang tạo báo cáo Y khoa PDF...");
    
    try {
      // Load html2pdf dynamically
      const loadHtml2Pdf = async () => {
        if ((window as any).html2pdf) return (window as any).html2pdf;
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => resolve((window as any).html2pdf);
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      const html2pdf = await loadHtml2Pdf() as any;
      
      // Sanitize function to prevent XSS
      const escapeHtml = (text: string) => {
        return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
      };

      // Tạo template HTML ẩn để in (sanitized)
      const reportDiv = document.createElement('div');
      reportDiv.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; color: #333; background: white;">
          <h1 style="color: #0ea5e9; text-align: center; margin-bottom: 5px;">BÁO CÁO SỨC KHỎE DIGIWELL</h1>
          <p style="text-align: center; color: #666; font-size: 14px;">Ngày xuất: ${escapeHtml(new Date().toLocaleDateString('vi-VN'))} - Thu thập bởi DigiCoach AI</p>
          <hr style="margin: 20px 0; border: 1px solid #eee;" />
          <h2 style="color: #0f172a; font-size: 18px;">1. Thông tin cá nhân</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Họ và tên:</strong> ${escapeHtml(profile?.nickname || 'Khách')}</li>
            <li><strong>Thể trạng:</strong> ${escapeHtml(profile?.age?.toString() || '--')} tuổi, ${escapeHtml(profile?.height?.toString() || '--')} cm, ${escapeHtml(profile?.weight?.toString() || '--')} kg</li>
            <li><strong>Mục tiêu sức khỏe:</strong> ${escapeHtml(profile?.goal || '--')}</li>
          </ul>
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">2. Thống kê nước (Hôm nay)</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Đã uống:</strong> ${escapeHtml(waterIntake.toString())} ml / ${escapeHtml(waterGoal.toString())} ml (Hoàn thành ${escapeHtml(Math.round(progress).toString())}%)</li>
            <li><strong>Chuỗi hiện tại:</strong> ${escapeHtml(streak.toString())} ngày liên tiếp</li>
          </ul>
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">3. Nhịp sinh học & Hoạt động</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Mức độ vận động:</strong> ${escapeHtml(profile?.activity || '--')}</li>
            <li><strong>Nhịp tim gần nhất:</strong> ${escapeHtml(isWatchConnected ? (watchData?.heartRate?.toString() ?? '--') + ' BPM' : 'Chưa đồng bộ')}</li>
            <li><strong>Số bước chân:</strong> ${escapeHtml(isWatchConnected ? (watchData?.steps?.toString() ?? '--') : 'Chưa đồng bộ')}</li>
          </ul>
          <p style="margin-top: 50px; text-align: center; font-style: italic; color: #999; font-size: 12px;">
            Tài liệu này được tạo tự động. Không dùng để thay thế chẩn đoán y tế chuyên sâu.
          </p>
        </div>
      `;

      // FIX BUG: Xóa lỗi cú pháp backslash (\`) cản trở biên dịch JS
      const opt = { margin: 1, filename: 'DigiWell_Report_' + new Date().toISOString().slice(0,10) + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
      await html2pdf().set(opt).from(reportDiv).save();
      
      toast.success("Đã tải xuống báo cáo PDF thành công!", { id: tid });
    } catch {
      toast.error("Có lỗi xảy ra khi tạo PDF!", { id: tid });
    } finally {
      setIsExportingPDF(false);
    }
  }, [profile?.id, isPremium]);

  const toggleFastingMode = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (isFastingMode) {
      setIsFastingMode(false);
      setFastingStartTime(null);
      localStorage.removeItem('digiwell_fasting_start');
      toast.info("Đã tắt chế độ Nhịn ăn gián đoạn.");
    } else {
      setIsFastingMode(true);
      const t = Date.now();
      setFastingStartTime(t);
      localStorage.setItem('digiwell_fasting_start', t.toString());
      toast.success("Bật Fasting 16:8. Bắt đầu đếm giờ!");
    }
  };

  const openEditProfile = () => {
    if (profile) {
      setEditProfileData({
        nickname: profile.nickname || '', gender: profile.gender || 'Nam',
        age: profile.age || 20, height: profile.height || 170, weight: profile.weight || 60,
        activity: profile.activity || 'active', climate: profile.climate || 'Nhiệt đới (Nóng)', goal: profile.goal || 'Sức khỏe tổng quát'
      });
      setShowEditProfile(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || profile.id === 'undefined') return;
    setIsUpdatingProfile(true);
    const toastId = toast.loading("Đang cập nhật hồ sơ...");
    try {
      const { error } = await supabase!.from('profiles').update({
        nickname: editProfileData.nickname, gender: editProfileData.gender,
        age: editProfileData.age, height: editProfileData.height,
        weight: editProfileData.weight, activity: editProfileData.activity,
        climate: editProfileData.climate, goal: editProfileData.goal,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);
      if (error) throw error;
      setProfile((prev: any) => ({ ...prev, ...editProfileData })); // Cập nhật lại state frontend
      toast.success("Cập nhật hồ sơ thành công! ✅", { id: toastId });
      setShowEditProfile(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật hồ sơ!", { id: toastId });
    } finally { setIsUpdatingProfile(false); }
  };

  const handleScan = () => {
    if (!isAiConfigured()) return toast.error("Vui lòng cấu hình VITE_GROQ_API_KEY!");
    fileInputRef.current?.click();
  };

  const processImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    const tid = toast.loading("AI đang phân tích hình ảnh...");
    
    try {
      const result = await scanDrinkFromImage(file);
      await handleAddWater(result.amount, result.factor, `${result.name} (AI Scan)`);
      toast.success(`AI nhận diện: ${result.name} (${result.amount}ml)`, { id: tid });
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setIsScanning(false);
    }
    e.target.value = '';
  };

  // Lấy dữ liệu bảng xếp hạng tùy theo Mode
  const getLeagueData = () => {
    const myData = {
      id: profile?.id,
      name: profile?.nickname || 'Bạn',
      dept: 'Người dùng hệ thống',
      wp: wp,
      streak: streak,
      isMe: true
    };

    if (leagueMode === 'public') {
      // Đảm bảo người dùng hiện tại luôn có trong danh sách nếu họ không nằm trong top 50
      const currentUserInList = publicLeaderboard.some(u => u.isMe);
      if (!currentUserInList && profile) {
        return [...publicLeaderboard, myData];
      }
      return publicLeaderboard;
    }

    // Chế độ Bạn bè (friends mode)
    return [...friendsList, myData];
  };

  const geminiProps = useGeminiAI({
    profile, waterIntake, waterGoal, weatherData, watchData, isWeatherSynced, isWatchConnected,
    handleAddWater, setShowAiChat, handleExportPDF, toggleFastingMode, setShowHistory
  }) || {};


  const currentRank = getRankInfo(wp);
  const completionPercent = Math.round(progress);
  const remainingWater = Math.max(waterGoal - waterIntake, 0);
  const activityLabelMap: Record<string, string> = {
    sedentary: 'Ít vận động',
    light: 'Vận động nhẹ',
    moderate: 'Vận động vừa',
    active: 'Năng động',
    hard: 'Cường độ cao',
    athlete: 'Vận động viên',
  };
  const activityLabel = activityLabelMap[profile?.activity || ''] || profile?.activity || '--';
  const connectedSystems = [
    { icon: CloudSun, label: 'Trạm thời tiết', sub: 'Đồng bộ tự động qua GPS', active: isWeatherSynced, action: () => syncWeather(profile?.city), activeColor: '#f97316', activeBg: 'rgba(249,115,22,0.2)', activeBorder: 'rgba(249,115,22,0.4)' },
    { icon: Calendar, label: 'Lịch trình thông minh', sub: 'Nhắc nhở theo agenda và giờ học', active: isCalendarSynced, action: syncCalendar, activeColor: '#818cf8', activeBg: 'rgba(99,102,241,0.2)', activeBorder: 'rgba(99,102,241,0.4)' },
    { icon: Watch, label: 'Watch / HealthKit', sub: 'Nhịp tim và bước chân thời gian thực', active: isWatchConnected, action: () => setIsWatchConnected(!isWatchConnected), activeColor: '#22d3ee', activeBg: 'rgba(6,182,212,0.2)', activeBorder: 'rgba(6,182,212,0.4)' },
  ];
  const connectedSystemsCount = connectedSystems.filter((item: any) => item.active).length;
  const assistantFace = progress < 30 ? '(;-;)' : progress < 70 ? '(o_o)' : '(^o^)';
  const assistantStatus = progress < 30 ? 'Hydration thấp' : progress < 70 ? 'Đang ổn định' : 'Đang rất tốt';
  const assistantTone = progress < 30 ? 'text-red-400' : progress < 70 ? 'text-cyan-400' : 'text-emerald-400';
  const visibleDrinkPresets = drinkPresets.slice(0, 6);
  const primaryDrinkPreset = visibleDrinkPresets.find((preset: DrinkPreset) => preset.name.toLowerCase().includes('nước')) || visibleDrinkPresets[0];
  const secondaryDrinkPresets = visibleDrinkPresets.filter((preset: DrinkPreset) => preset.id !== primaryDrinkPreset?.id).slice(0, 4);

  const handleGenerateWeeklyReport = async () => {
    if (!profile?.id || profile.id === 'undefined') return;
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsWeeklyReportLoading(true);
    const toastId = toast.loading('AI đang tạo báo cáo tuần...');

    try {
      const report = await generateWeeklyReport(profile.id, {
        nickname: profile.nickname,
        goal: profile.goal,
        activity: profile.activity,
        avgHeartRate: watchData?.heartRate,
      });

      setWeeklyReport(report);
      toast.success('Đã tạo báo cáo tuần thành công.', { id: toastId });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Không thể tạo báo cáo tuần lúc này.';
      toast.error(message, { id: toastId });
    } finally {
      setIsWeeklyReportLoading(false);
    }
  };

  const handleQuestRewardClaimed = async (exp: number, wpPoints: number) => {
    await refetchProfile(); // Tải lại thông số đã được Trigger cập nhật ở Database
    toast.success(`Đã nhận ${exp} EXP và ${wpPoints} WP!`);
  };

  // ==========================================================================
  // [GIAO DIỆN 1] WELCOME SCREEN
  // ==========================================================================
  if (view === 'welcome') return <WelcomeScreen onNavigate={(v: 'login' | 'register') => setView(v)} />;

  // ==========================================================================
  // [GIAO DIỆN 2] LOGIN SCREEN
  // ==========================================================================
  if (view === 'login') return <LoginScreen onBack={() => setView('welcome')} initialEmail={loginPrefill} />;

  // ==========================================================================
  // [GIAO DIỆN 3] REGISTER SCREEN
  // ==========================================================================
  if (view === 'register') return <RegisterScreen onBack={() => setView('welcome')} onSuccess={(email: string) => { setLoginPrefill(email); setView('login'); }} />;

  // ==========================================================================
  // [GIAO DIỆN 3.5] BIOMETRIC APP LOCK
  // ==========================================================================
  if (view === 'locked') {
    return <LockedScreen profile={profile} onUnlock={() => setView('app')} onLogout={handleLogout} />;
  }

  // ==========================================================================
  // [GIAO DIỆN 4] MAIN DASHBOARD
  // ==========================================================================



  const modalProps = {
    showHistory, setShowHistory, waterEntries, waterIntake, setEditingEntry, setEditAmount, handleDeleteEntry,
    editingEntry, editAmount, handleEditEntry,
    showSmartHub, setShowSmartHub, reminderSettings, isReminderPermissionGranted, updateReminderSetting: (key: keyof HydrationReminderSettings, value: any) => updateReminderSetting(key, value),
    reminderPreview, handleApplyReminderSettings: () => handleApplyReminderSettings(profile?.id, waterGoal, profile?.nickname), isApplyingReminderSettings, isWeatherSynced,
    weatherData, syncWeather, isCalendarSynced, calendarEvents, isWatchConnected, setIsWatchConnected,
    watchData, currentActivity, setCurrentActivity, isFastingMode, toggleFastingMode, fastingHours,
    fastingMinutes, fastingSeconds, fastingRemaining, isPremium, setShowPremiumModal,
    showCustomDrink, setShowCustomDrink, customDrinkForm, setCustomDrinkForm: handleSetCustomDrinkForm, handleAddWater,
    showPresetManager, setShowPresetManager, editingPresets, setEditingPresets, handleUpdatePreset: (index: number, field: keyof DrinkPreset, value: any) => handleUpdatePreset(index, field, value), savePresets: saveDrinkPresets,
    showOnboarding, setShowOnboarding, onboardingStep, setOnboardingStep, profileId: profile?.id,
    ...socialProps, profile, currentRank, waterGoal, streak, streakFreezes, needsFreeze, useStreakFreeze, completionPercent, remainingWater,
    showAddFriend, setShowAddFriend, searchQuery, setSearchQuery, searchResults, setSearchResults,
    isSearching, handleSearchUser, handleAddFriend,
    showProfileSettings, setShowProfileSettings, activityLabel, connectedSystemsCount, connectedSystems, openEditProfile,
    showEditProfile, setShowEditProfile, editProfileData, setEditProfileData, handleSaveProfile, isUpdatingProfile,
    setIsPremium, showAiChat, setShowAiChat, ...geminiProps
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden font-sans scanline-overlay bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[50%] bg-cyan-500/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[40%] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={processImageScan} />

      {/* Only show onboarding for users who haven't completed it yet */}
      {profile && !profile.onboarding_completed && (
        <OnboardingModal
          profile={profile}
          onComplete={async (weight: number, waterGoal: number, name: string) => {
            setProfile((prev: any) => ({ ...prev, weight, water_goal: waterGoal, nickname: name, onboarding_completed: true }));
            // Mark onboarding as completed in database
            await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', profile.id);
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">

        {/* ==================== HOME TAB ==================== */}
        {activeTab === 'home' && (
          <HomeTab
            profile={profile}
            nowText={nowText}
            hasPendingCloudSync={hasPendingCloudSync}
            waterEntries={waterEntries}
            handleDeleteEntry={handleDeleteEntry}
            isSyncing={isSyncing}
            setActiveTab={setActiveTab}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            remainingWater={remainingWater}
            progress={progress}
            completionPercent={completionPercent}
            streak={streak}
            assistantFace={assistantFace}
            assistantStatus={assistantStatus}
            assistantTone={assistantTone}
            primaryDrinkPreset={primaryDrinkPreset}
            secondaryDrinkPresets={secondaryDrinkPresets}
            drinkPresets={drinkPresets}
            isScanning={isScanning}
             handleAddWater={handleAddWater}
             handleScan={handleScan}
             setShowShopModal={setShowShopModal}

             handleLogout={handleLogout}
            setShowSmartHub={setShowSmartHub as any}
            setShowHistory={setShowHistory as any}
            openSocialComposer={openSocialComposer}
            setShowPresetManager={setShowPresetManager as any}
            setShowCustomDrink={setShowCustomDrink as any}
            customDrinkForm={customDrinkForm}
            setCustomDrinkForm={handleSetCustomDrinkForm}
            setEditingPresets={setEditingPresets}
            weatherData={weatherData}
            watchData={watchData}
            weeklyHistory={weeklyHistory}
          />
        )}

        {/* ==================== INSIGHT TAB ==================== */}
        {activeTab === 'insight' && (
          <InsightTab
            profile={profile}
            isPremium={isPremium}
            setShowPremiumModal={setShowPremiumModal}
            isExportingPDF={isExportingPDF}
            handleExportPDF={handleExportPDF}
            waterGoal={waterGoal}
            weeklyChartData={weeklyHistory}
            progress={progress}
            streak={streak}
            isAiLoading={geminiProps.isAiLoading || false}
            aiAdvice={geminiProps.aiAdvice || ''}
            fetchAIAdvice={geminiProps.fetchAIAdvice || (() => {})}
            setShowAiChat={setShowAiChat}
            weeklyReport={weeklyReport}
            isWeeklyReportLoading={isWeeklyReportLoading}
            generateWeeklyReport={handleGenerateWeeklyReport}
            hydrationResult={hydrationResult}
          />
        )}

        {/* ==================== QUEST TAB ==================== */}
        {activeTab === 'arena' && profile?.id && profile.id !== 'undefined' && (
          <QuestPage
            userId={profile.id}
            onRewardClaimed={(exp, coins) => {
              // Update profile with rewards
              setProfile((prev: any) => ({
                ...prev,
                total_exp: (prev?.total_exp || 0) + exp,
                coins: (prev?.coins || 0) + coins,
                level: Math.floor(((prev?.total_exp || 0) + exp) / 500) + 1
              }));
              toast.success(`+${exp} EXP, +${coins} Coins!`);
            }}
          />
        )}
        {/* ==================== LEAGUE TAB ==================== */}
        {activeTab === 'league' && (
          <LeagueTab
            leagueMode={leagueMode}
            setLeagueMode={setLeagueMode}
            setShowAddFriend={setShowAddFriend}
            getLeagueData={getLeagueData}
            getRankInfo={getRankInfo}
          />
        )}

        {/* ==================== FEED TAB ==================== */}
        {activeTab === 'feed' && (
          <FeedTab
            profile={profile}
            socialStories={socialProps.socialStories || []}
            socialError={socialProps.socialError || ''}
            isSocialLoading={socialProps.isSocialLoading || false}
            socialFollowingIds={socialProps.socialFollowingIds || []}
            openSocialComposer={openSocialComposer as any}
            setShowSocialProfile={socialProps.setShowSocialProfile || (() => {})}
            setShowDiscoverPeople={socialProps.setShowDiscoverPeople || (() => {})}
            handleToggleLikePost={socialProps.handleToggleLikePost || (() => {})}
          />
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            isPremium={isPremium}
            streak={streak}
            streakFreezes={streakFreezes}
            needsFreeze={needsFreeze}
            useStreakFreeze={useStreakFreeze}
            socialProfileStats={socialProps.socialProfileStats || { followers: 0, following: 0, posts: 0 }}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            weeklyHistory={weeklyHistory}
            completionPercent={completionPercent}
            remainingWater={remainingWater}
            currentRank={currentRank}
            wp={wp}
            setShowPremiumModal={setShowPremiumModal}
            setShowAddFriend={setShowAddFriend}
            setShowProfileSettings={setShowProfileSettings}
            setActiveTab={setActiveTab}
            setShowShopModal={setShowShopModal}
            handleLogout={handleLogout}
            posts={posts}
            handleToggleLikePost={socialProps.handleToggleLikePost}
          />
        )}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav activeTab={activeTab as TabType} setActiveTab={setActiveTab as any} />

      {/* ===== TẤT CẢ MODALS ===== */}
      <GlobalModalManager {...modalProps} />
      <UpgradeModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

      <AnimatePresence>
        {showLevelUp && (
            <LevelUpModal 
                fromLevel={levelUpInfo.from} 
                toLevel={levelUpInfo.to} 
                onClose={() => setShowLevelUp(false)} />
        )}
      </AnimatePresence>
      
      <ShopModal 
        isOpen={showShopModal} 
        onClose={() => setShowShopModal(false)} 
        profile={profile} 
        onSpendCoins={handleSpendCoins} 
      />
      
      <SettingsModal 
        isOpen={showProfileSettings} 
        onClose={() => setShowProfileSettings(false)} 
        profile={profile} 
        setProfile={setProfile} 
        handleLogout={handleLogout} 
      />
    </div>
  );
}

// ==========================================================================
// ROOT WRAPPER
// ==========================================================================
export default function App() {
  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen p-8 font-sans flex items-center justify-center bg-slate-950 text-white relative shadow-2xl sm:border-x sm:border-slate-800 overflow-x-hidden">
        <div className="w-full p-8 rounded-[2rem] border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30">
            <Target size={28} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Thiếu cấu hình</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Không tìm thấy kết nối Cloud. Tạo file <span className="text-cyan-400 font-mono bg-slate-900 px-2 py-1 rounded-md">.env</span> tại thư mục gốc:
          </p>
          <div className="bg-slate-950 rounded-2xl p-5 text-xs font-mono text-cyan-400 whitespace-pre-wrap border border-slate-900">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
          </div>
          <p className="text-xs text-slate-500 mt-6 border-t border-slate-700 pt-5 font-bold uppercase tracking-widest">
            Restart: npm run dev
          </p>
        </div>
      </div>
    );
  }
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}

const AppWithTheme = () => {
  const { theme } = useTheme();
  return (
    <div className="bg-[#0a0a0a] min-h-screen w-full flex justify-center items-start overflow-hidden">
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative shadow-[0_0_60px_rgba(6,182,212,0.15)] sm:border-x sm:border-slate-300 dark:sm:border-slate-800 overflow-x-hidden transform translate-x-0">
        <Toaster
          position="top-center"
          theme={theme as 'light' | 'dark'}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: theme === 'dark' ? '#0f172a' : '#ffffff',
              border: '1px solid',
              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            },



          }}
        />
        <AppContent />
      </div>
    </div>
  );
};
