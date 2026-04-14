import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Trophy, Target, Watch, RefreshCw,
  CloudSun, Calendar,
  Users, UserPlus, Search, Share2, Edit2, ImagePlus, UserMinus, Plus
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { LocalNotifications, type ActionPerformed } from '@capacitor/local-notifications';
import {
  DEFAULT_HYDRATION_REMINDER_SETTINGS,
  checkHydrationReminderPermission,
  getHydrationReminderPreview,
  parseHydrationNotificationAction,
  registerHydrationReminderActions,
  requestHydrationReminderPermission,
  scheduleHydrationReminders,
  scheduleHydrationSnooze,
  supportsNativeHydrationReminders,
  validateHydrationReminderSettings,
  type HydrationReminderSettings,
} from './lib/hydrationReminders';
import {
  buildProgressShareText,
  DEFAULT_SOCIAL_COMPOSER,
  DEFAULT_SOCIAL_PROFILE_STATS,
  isMissingSocialSchemaError,
  type SocialComposerState,
  type SocialDiscoverProfile,
  type SocialFeedPost,
  type SocialProfileStats,
} from './lib/social';
import { scanDrinkFromImage, isAiConfigured } from './lib/ai';

import WelcomeScreen from './WelcomeScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import AiChatModal from './components/modals/AiChatModal';
import BottomNav, { type TabType } from './components/layout/BottomNav';
import HomeTab, { type DrinkPreset } from './tabs/HomeTab';
import FeedTab from './tabs/FeedTab';
import ProfileTab from './tabs/ProfileTab';
import InsightTab from './tabs/InsightTab';
import LeagueTab from './tabs/LeagueTab';
import HistoryModal from './components/modals/HistoryModal';
import EditEntryModal from './components/modals/EditEntryModal';
import SmartHubModal from './components/modals/SmartHubModal';
import CustomDrinkModal from './components/modals/CustomDrinkModal';
import PremiumModal from './components/modals/PremiumModal';
import PresetManagerModal from './components/modals/PresetManagerModal';
import OnboardingModal from './components/modals/OnboardingModal';
import AddFriendModal from './components/modals/AddFriendModal';
import ProfileSettingsModal from './components/modals/ProfileSettingsModal';
import EditProfileModal from './components/modals/EditProfileModal';
import { useWaterData } from './hooks/useWaterData';
import { useWeatherSync } from './hooks/useWeatherSync';
import { useCalendarSync } from './hooks/useCalendarSync';
import { useAppleHealth } from './hooks/useAppleHealth';
import { useGeminiAI } from './hooks/useGeminiAI';

// ==========================================================================
// HOLO PET - MECHANICAL PHOENIX COMPONENT
// ==========================================================================
const MechanicalPhoenix = ({ progress }: { progress: number }) => {
  const safeProgress = Math.round(progress);
  const isLow = safeProgress < 30;
  const isHigh = safeProgress >= 70;

  const coreColor = isLow ? '#ef4444' : isHigh ? '#0ea5e9' : '#f59e0b';
  const wingColor = isLow ? '#7f1d1d' : isHigh ? '#0284c7' : '#b45309';
  const auraColor = isLow ? 'rgba(239, 68, 68, 0.4)' : isHigh ? 'rgba(14, 165, 233, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      {/* Glowing Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-lg ${isLow ? 'animate-pulse' : 'animate-[pulse_2s_ease-in-out_infinite]'}`} 
        style={{ backgroundColor: auraColor, transform: 'scale(0.8)' }}
      ></div>
      
      <svg viewBox="0 0 100 100" className={`w-full h-full relative z-10 drop-shadow-2xl ${isHigh ? 'animate-[bounce_3s_infinite]' : 'animate-[bounce_2s_infinite]'}`}>
        <defs>
          <linearGradient id={`wingGrad-${safeProgress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wingColor} />
            <stop offset="100%" stopColor={coreColor} />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <path d="M45,70 L50,95 L55,70 Z" fill={`url(#wingGrad-${safeProgress})`} className="animate-pulse" filter="url(#neonGlow)"/>
        <path d="M40,50 L5,20 L20,55 L0,60 L35,65 Z" fill="none" stroke={coreColor} strokeWidth="2.5" strokeLinejoin="round" filter="url(#neonGlow)"/>
        <path d="M40,50 L15,35 L25,50 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <path d="M60,50 L95,20 L80,55 L100,60 L65,65 Z" fill="none" stroke={coreColor} strokeWidth="2.5" strokeLinejoin="round" filter="url(#neonGlow)"/>
        <path d="M60,50 L85,35 L75,50 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <polygon points="50,35 62,50 50,68 38,50" fill={`url(#wingGrad-${safeProgress})`} stroke="#fff" strokeWidth="1" filter="url(#neonGlow)"/>
        <path d="M42,35 L50,10 L58,35 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <path d="M48,25 L50,5 L52,25 Z" fill="#fff" className="animate-pulse"/>
        <circle cx="50" cy="28" r="2.5" fill="#fff" className="animate-ping" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" filter="url(#neonGlow)" className="animate-pulse" />
      </svg>
    </div>
  );
};

// ============================================================================
// DIGIWELL SMART WELLNESS - PREMIUM DARK UI (V7 FIXED)
// FIX #1: handleRegister upsert profiles sau signUp
// FIX #2: waterGoal tự động theo Calendar/Watch thay vì currentActivity thủ công
// ============================================================================
// TYPES
// ==========================================================================
interface Profile {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  climate: string;
  goal: string;
  wakeUp?: string;
  bedTime?: string;
}

interface Friend {
  id: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

interface SearchResult {
  id: string;
  nickname: string;
}

// ============================================================================

function AppContent() {

  // FIX BUG: Ref để thay thế useEffectEvent bị lỗi không tồn tại trong React 18
  const handleHydrationNotificationActionRef = useRef<((action: ActionPerformed) => Promise<void>) | null>(null);

  // Lắng nghe Deep Link để đóng In-App Browser và truyền Token cho Supabase
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const sub = CapacitorApp.addListener('appUrlOpen', async (event) => {
        if (event.url.includes('login-callback') || event.url.includes('access_token') || event.url.includes('code=')) {
          Browser.close().catch(() => {});
          // Trích xuất chuỗi token từ URL Scheme và đẩy vào window.location để Supabase tự bắt
          const urlStr = event.url;
          if (urlStr.includes('#') || urlStr.includes('?')) {
            const fragment = urlStr.substring(urlStr.indexOf(urlStr.includes('?') ? '?' : '#'));
            window.location.href = `${window.location.origin}${window.location.pathname}${fragment}`;
            
            setTimeout(async () => {
              const { data } = await supabase!.auth.getSession();
              if (data?.session) {
                setView('app');
              }
            }, 500);
          }
        }
      });
      return () => { sub.then(s => s.remove()); };
    }
  }, []);

  // ==========================================================================
  // [1] QUẢN LÝ TRẠNG THÁI (STATES)
  // ==========================================================================
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'app'>('welcome');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { isWeatherSynced, setIsWeatherSynced, weatherData, syncWeather } = useWeatherSync();
  const { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar } = useCalendarSync();
  const { isWatchConnected, setIsWatchConnected, watchData } = useAppleHealth();
  
  const [now, setNow] = useState(() => new Date());
   const [profile, setProfile] = useState<Profile | null>(null);
  
  const [loginPrefill, setLoginPrefill] = useState('');
  
  // Giữ lại để demo thuật toán thủ công khi chưa kết nối thiết bị
  const [currentActivity, setCurrentActivity] = useState<'chill' | 'light' | 'hard'>('chill');
  
  const [streak] = useState(3); // Giữ lại state để sẵn sàng cho logic tự động tăng chuỗi sau này

  const [weeklyHistory, setWeeklyHistory] = useState<{d: string, ml: number, isToday: boolean}[]>([]);
  // Lịch sử từng lần uống (lưu localStorage theo ngày)
  type PendingHydrationAction = { amount: number; name: string; timestamp: number };
  const PENDING_HYDRATION_ACTIONS_KEY = 'digiwell_pending_hydration_actions';
  const [showHistory, setShowHistory] = useState(false);

  // State cho tính năng Scan AI
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSmartHub, setShowSmartHub] = useState(false);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<HydrationReminderSettings>({
    ...DEFAULT_HYDRATION_REMINDER_SETTINGS,
  });
  const [isReminderPermissionGranted, setIsReminderPermissionGranted] = useState(false);
  const [isApplyingReminderSettings, setIsApplyingReminderSettings] = useState(false);

  const [showCustomDrink, setShowCustomDrink] = useState(false);
  const [customDrinkForm, setCustomDrinkForm] = useState({ name: 'Trà đào', amount: 300 as number | string, factor: 1.0 });

  // State cho Menu đồ uống mặc định
  const [drinkPresets, setDrinkPresets] = useState<DrinkPreset[]>(() => {
    const saved = localStorage.getItem('digiwell_presets');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Nước lọc', amount: 250, factor: 1.0, icon: 'Droplet', color: 'cyan' },
      { id: '2', name: 'Cà phê', amount: 200, factor: 0.8, icon: 'Coffee', color: 'orange' },
      { id: '3', name: 'Bù khoáng', amount: 300, factor: 1.1, icon: 'Activity', color: 'emerald' },
      { id: '4', name: 'Bia/Rượu', amount: 330, factor: -0.5, icon: 'Zap', color: 'red' }
    ];
  });
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [editingPresets, setEditingPresets] = useState<DrinkPreset[]>(drinkPresets);

  // State cho Onboarding (Hướng dẫn tân thủ)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // State cho Chat AI Premium
  const [showAiChat, setShowAiChat] = useState(false);

  // ==========================================================================
  // [NEW] PREMIUM FEATURES STATES
  // ==========================================================================
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [leagueMode, setLeagueMode] = useState<'public' | 'friends'>('public');
  const [isFastingMode, setIsFastingMode] = useState(() => !!localStorage.getItem('digiwell_fasting_start'));
  const [fastingStartTime, setFastingStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('digiwell_fasting_start');
    return saved ? parseInt(saved, 10) : null;
  });
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Social & Friends
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
   const [friendsList, setFriendsList] = useState<Friend[]>([]);
   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [showDiscoverPeople, setShowDiscoverPeople] = useState(false);
  const [showSocialProfile, setShowSocialProfile] = useState(false);
  const [socialComposer, setSocialComposer] = useState<SocialComposerState>({ ...DEFAULT_SOCIAL_COMPOSER });
  const [socialPosts, setSocialPosts] = useState<SocialFeedPost[]>([]);
  const [socialStories, setSocialStories] = useState<SocialFeedPost[]>([]);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialSearchResults, setSocialSearchResults] = useState<SocialDiscoverProfile[]>([]);
  const [socialFollowingIds, setSocialFollowingIds] = useState<string[]>([]);
  const [socialProfileStats, setSocialProfileStats] = useState<SocialProfileStats>(DEFAULT_SOCIAL_PROFILE_STATS);
  const [socialError, setSocialError] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isPublishingSocialPost, setIsPublishingSocialPost] = useState(false);
  const [isSocialSearching, setIsSocialSearching] = useState(false);
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [socialImagePreview, setSocialImagePreview] = useState('');
  const socialImageInputRef = useRef<HTMLInputElement>(null);

  // ==========================================================================
  // [NEW] CẬP NHẬT HỒ SƠ STATES
  // ==========================================================================
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    nickname: '', gender: 'Nam', age: 20, height: 172, weight: 82, activity: 'active', climate: 'Nhiệt đới (Nóng)', goal: 'Giảm mỡ & Tăng cơ'
  });

  // ==========================================================================
  // [2] LOGIC SUPABASE CLOUD SYNC
  // ==========================================================================
  
  const loadProfileForCurrentUser = async () => {
    try {
      const { data: sessionRes, error: sessionErr } = await supabase!.auth.getSession();
      if (sessionErr || !sessionRes.session?.user.id) return null;
      const userId = sessionRes.session.user.id;
      
      const { data: p, error: pErr } = await supabase!.from('profiles').select('*').eq('id', userId).single();
      if (pErr || !p) return null;
      
      return {
        id: p.id, nickname: p.nickname, password: '', gender: p.gender,
        age: p.age, height: p.height, weight: p.weight, activity: p.activity,
        climate: p.climate, goal: p.goal, wakeUp: p.wake_up, bedTime: p.bed_time
      };
    } catch { return null; }
  };

  // Tải danh sách bạn bè thật từ Supabase
  const fetchFriendsData = async () => {
    if (!profile?.id) return;
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
      const todayStr = new Date().toISOString().split('T')[0];
      
      const { data: pData } = await supabase!.from('profiles').select('id, nickname').in('id', friendIds);
      const { data: wData } = await supabase!.from('water_logs').select('user_id, intake_ml').eq('day', todayStr).in('user_id', friendIds);

      if (pData) {
        const formattedFriends = pData.map((p: { id: string; nickname: string }) => {
          const waterLog = wData?.find((w: { user_id: string; intake_ml: number }) => w.user_id === p.id);
          const intake = waterLog ? waterLog.intake_ml : 0;
          return { 
            id: p.id, 
            name: p.nickname || 'Người dùng', 
            dept: 'Bạn bè', 
            wp: intake + 200, // Tạm cộng 200 WP (streak mặc định)
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

  // Lưu preset vào localStorage
  useEffect(() => {
    localStorage.setItem('digiwell_presets', JSON.stringify(drinkPresets));
  }, [drinkPresets]);

  // ==========================================================================
  // [3] VÒNG ĐỜI HỆ THỐNG (EFFECTS)
  // ==========================================================================
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const { data: sub } = supabase!.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted) return;
      try {
        if (session) {
          // Lưu lại Provider Token của Google để dùng cho Calendar API
          if (session.provider_token) {
            localStorage.setItem('google_provider_token', session.provider_token);
          }

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
              let p = await loadProfileForCurrentUser();
              
              // Tự động tạo Profile nếu người dùng mới đăng nhập Google chưa có
              if (!p && session.user) {
                const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
                await supabase!.from('profiles').upsert([{
                  id: session.user.id, nickname: defaultName, gender: 'Nam', age: 20, height: 170, weight: 60,
                  activity: 'active', climate: 'Nhiệt đới (Nóng)', goal: 'Sức khỏe tổng quát'
                }], { onConflict: 'id' });
                p = await loadProfileForCurrentUser();
              }

              if (p && isMounted) { 
                setProfile(p); 
                setView('app'); 
              }
            }, 500);
          }
        } else if (event === 'SIGNED_OUT' || !session) { 
          setProfile(null); 
          setChatMessages([]); // Dọn dẹp tin nhắn AI khi đăng xuất
          localStorage.removeItem('google_provider_token'); // Xóa token Google khi đăng xuất
          setView('welcome'); 
        }
          } catch (error) {
            console.error(error);
      }
    });
    
    return () => { 
      isMounted = false; 
      if (timeoutId) clearTimeout(timeoutId); 
      sub?.subscription.unsubscribe(); 
    };
  }, []);

  // Tự động tải dữ liệu Bạn bè khi chuyển sang Tab Bạn Bè
  useEffect(() => {
    if (leagueMode === 'friends' && activeTab === 'league') {
      fetchFriendsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueMode, activeTab, profile?.id]);

  // ==========================================================================
  // [NEW] WATER DATA HOOK
  // ==========================================================================
  const { waterIntake, waterEntries, handleAddWater, handleDeleteEntry, handleEditEntry, editingEntry, setEditingEntry, editAmount, setEditAmount, hasPendingCloudSync, waterIntakeRef, waterEntriesRef } = useWaterData(profile);

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

        if (!profile?.id) {
            const emptyHistory = dateList.map((d, index) => ({
                d: index === 6 ? 'HN' : dayLabels[d.date.getDay()],
                ml: 0,
                isToday: index === 6,
            }));
            setWeeklyHistory(emptyHistory);
            return;
        }

        const dateStrings = dateList.map(d => d.dayStr);

        try {
            const { data: cloudData, error } = await supabase!
                .from('water_logs')
                .select('day, intake_ml')
                .eq('user_id', profile.id)
                .in('day', dateStrings);

            if (error) throw error;

            const dataMap = new Map(cloudData?.map(d => [d.day, d.intake_ml]));

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
  // [3.1] PERSIST CÀI ĐẶT ĐỒNG BỘ THEO USER
  // ==========================================================================
  useEffect(() => {
    if (profile?.id) {
      const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profile.id}`) || '{}');
      const savedReminderSettings = JSON.parse(localStorage.getItem(`digiwell_reminders_${profile.id}`) || 'null');
      setIsWatchConnected(!!prefs.watch);
      setIsWeatherSynced(!!prefs.weather);
      setIsCalendarSynced(!!prefs.calendar);
      setReminderSettings(savedReminderSettings
        ? { ...DEFAULT_HYDRATION_REMINDER_SETTINGS, ...savedReminderSettings }
        : { ...DEFAULT_HYDRATION_REMINDER_SETTINGS });
      setIsPrefsLoaded(true);
    } else {
      setIsPrefsLoaded(false);
      setIsWatchConnected(false);
      setIsWeatherSynced(false);
      setIsCalendarSynced(false);
      setReminderSettings({ ...DEFAULT_HYDRATION_REMINDER_SETTINGS });
      setIsReminderPermissionGranted(false);
      setShowOnboarding(false);
      setShowSocialComposer(false);
      setShowDiscoverPeople(false);
      setShowSocialProfile(false);
      setShowProfileSettings(false);
      setSocialPosts([]);
      setSocialStories([]);
      setSocialSearchResults([]);
      setSocialFollowingIds([]);
      setSocialProfileStats(DEFAULT_SOCIAL_PROFILE_STATS);
      setSocialError('');
      resetSocialComposer();
    }
    
    if (profile?.id && !localStorage.getItem(`digiwell_onboarded_${profile.id}`)) {
      setShowOnboarding(true);
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.id && isPrefsLoaded) {
      localStorage.setItem(`digiwell_prefs_${profile.id}`, JSON.stringify({ watch: isWatchConnected, weather: isWeatherSynced, calendar: isCalendarSynced }));
    }
  }, [isWatchConnected, isWeatherSynced, isCalendarSynced, profile?.id, isPrefsLoaded]);

  useEffect(() => {
    if (profile?.id) {
      localStorage.setItem(`digiwell_reminders_${profile.id}`, JSON.stringify(reminderSettings));
    }
  }, [profile?.id, reminderSettings]);

  useEffect(() => {
    let ignore = false;

    const restoreHydrationReminders = async () => {
      if (supportsNativeHydrationReminders()) {
        await registerHydrationReminderActions().catch(error => {
          console.warn('Không thể đăng ký action cho hydration notifications:', error);
        });
      }

      const granted = await checkHydrationReminderPermission();
      if (ignore) return;

      setIsReminderPermissionGranted(granted);

      if (!profile?.id || !isPrefsLoaded || !granted) return;

      try {
        await scheduleHydrationReminders(reminderSettings, {
          dailyGoal: waterGoal,
          nickname: profile.nickname,
        });
      } catch (error) {
        console.error('Không thể khôi phục lịch nhắc uống nước:', error);
      }
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
    if (!profile?.id || view !== 'app') return;

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

  useEffect(() => {
    if (activeTab === 'feed' && profile?.id) {
      void refreshSocialFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile?.id]);

  useEffect(() => {
    if (showDiscoverPeople && profile?.id) {
      void loadSocialDirectory(socialSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscoverPeople, profile?.id]);

  useEffect(() => () => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
  }, [socialImagePreview]);

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

  const calculateWP = (intake: number, goal: number, currentStreak: number) => {
    return Math.min(intake, goal) + (currentStreak * 200);
  };

  const getRankInfo = (wp: number) => {
    if (wp >= 4500) return { name: 'Thách Đấu', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
    if (wp >= 3500) return { name: 'Kim Cương', color: 'text-cyan-300', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' };
    if (wp >= 2500) return { name: 'Bạch Kim', color: 'text-teal-300', bg: 'bg-teal-500/20', border: 'border-teal-500/30' };
    if (wp >= 1500) return { name: 'Vàng', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    if (wp >= 800) return { name: 'Bạc', color: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
    return { name: 'Đồng', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
  };

  const handleUpdatePreset = (index: number, field: string, value: any) => {
    const newPresets = [...editingPresets];
    newPresets[index] = { ...newPresets[index], [field]: value };
    setEditingPresets(newPresets);
  };

  const savePresets = () => {
    setDrinkPresets(editingPresets);
    setShowPresetManager(false);
    toast.success("Đã lưu cấu hình đồ uống mặc định!");
  };

  // ✅ FIX #2: Auto-detect từ Calendar → Watch → Thủ công (theo thứ tự ưu tiên)
  const waterGoal = useMemo(() => {
    if (!profile) return 2000;
    let base = profile.weight * 35;

    const gymKeywords = ['gym', 'tập', 'chạy', 'yoga', 'bơi', 'thể dục', 'boxing', 'cycling', 'football', 'bóng'];

    if (isCalendarSynced) {
      // Ưu tiên 1: Calendar — tìm event có tên liên quan vận động mạnh
      const hasGymEvent = calendarEvents.some(e =>
        gymKeywords.some(kw => e.title.toLowerCase().includes(kw))
      );
      if (hasGymEvent) base += 800;
      // Không có event gym thì giữ nguyên base (ít vận động)
    } else if (isWatchConnected && watchData.steps > 0) {
      // Ưu tiên 2: Watch data thực tế
      if (watchData.steps >= 8000 || watchData.heartRate >= 100) base += 800;
      else if (watchData.steps >= 4000 || watchData.heartRate >= 85) base += 400;
    } else {
      // Ưu tiên 3: Thủ công (dùng để demo khi chưa kết nối thiết bị)
      if (currentActivity === 'light') base += 400;
      if (currentActivity === 'hard') base += 800;
    }

    // Cộng thêm theo thời tiết
    if (isWeatherSynced && weatherData.temp > 30) base += 500;
    else if (profile.climate?.includes('Nóng')) base += 200;

    return base;
  }, [profile, currentActivity, isCalendarSynced, isWatchConnected, watchData, calendarEvents, isWeatherSynced, weatherData.temp]);

  // Fasting Math
  const fastingElapsed = isFastingMode && fastingStartTime ? now.getTime() - fastingStartTime : 0;
  const fastingTotalMs = 16 * 60 * 60 * 1000; // 16 hours
  const fastingRemaining = Math.max(fastingTotalMs - fastingElapsed, 0);
  const fastingHours = Math.floor(fastingRemaining / (1000 * 60 * 60));
  const fastingMinutes = Math.floor((fastingRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const fastingSeconds = Math.floor((fastingRemaining % (1000 * 60)) / 1000);

  const progress = Math.min((waterIntake / waterGoal) * 100, 100);
  const reminderPreview = useMemo(() => getHydrationReminderPreview(reminderSettings), [reminderSettings]);

  const nowText = useMemo(() => ({
    date: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(now),
    time: new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
  }), [now]);

  const getSocialErrorMessage = (message?: string) => {
    if (!message) return 'Không thể tải tính năng cộng đồng lúc này.';
    if (isMissingSocialSchemaError(message)) {
      return 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.';
    }
    return message;
  };

  const resetSocialComposer = () => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
    setSocialComposer({ ...DEFAULT_SOCIAL_COMPOSER });
    setSocialImageFile(null);
    setSocialImagePreview('');
  };

  const closeSocialComposer = () => {
    resetSocialComposer();
    setShowSocialComposer(false);
  };

  const openSocialComposer = (kind: SocialComposerState['postKind'] = 'status') => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng bài.');
      return;
    }

    const content = kind === 'progress'
      ? buildProgressShareText({
        nickname: profile.nickname,
        waterIntake,
        waterGoal,
        streak,
      })
      : '';

    resetSocialComposer();
    setSocialComposer({
      content,
      imageUrl: '',
      postKind: kind,
      visibility: kind === 'story' ? 'followers' : 'public',
    });
    setActiveTab('feed');
    setShowSocialComposer(true);
  };

  const uploadSocialImage = async (file: File) => {
    if (!profile?.id) throw new Error('Vui lòng đăng nhập lại.');

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg';
    const safeExtension = extension || 'jpg';
    const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
    const { error } = await supabase!.storage.from('social-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return supabase!.storage.from('social-media').getPublicUrl(filePath).data.publicUrl;
  };

  const loadSocialDirectory = async (query: string) => {
    if (!profile?.id) return;

    setIsSocialSearching(true);
    try {
      const keyword = query.trim();
      let request = supabase!
        .from('profiles')
        .select('id, nickname')
        .neq('id', profile.id);

      request = keyword.length >= 2
        ? request.ilike('nickname', `%${keyword}%`)
        : request.order('nickname', { ascending: true });

      const { data, error } = await request.limit(8);
      if (error) throw error;

      setSocialError('');
      setSocialSearchResults((data || []).map((user: any) => ({
        id: user.id,
        nickname: user.nickname || 'Người dùng DigiWell',
        isFollowing: socialFollowingIds.includes(user.id),
      })));
    } catch (err: any) {
      const friendlyMessage = getSocialErrorMessage(err.message);
      setSocialError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsSocialSearching(false);
    }
  };

  const refreshSocialFeed = async (options?: { silent?: boolean }) => {
    if (!profile?.id) return;

    if (!options?.silent) {
      setIsSocialLoading(true);
    }

    try {
      const [
        followingRes,
        followersCountRes,
        followingCountRes,
        postsCountRes,
      ] = await Promise.all([
        supabase!.from('social_follows').select('following_id').eq('follower_id', profile.id),
        supabase!.from('social_follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase!.from('social_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase!.from('social_posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
      ]);

      if (followingRes.error) throw followingRes.error;
      if (followersCountRes.error) throw followersCountRes.error;
      if (followingCountRes.error) throw followingCountRes.error;
      if (postsCountRes.error) throw postsCountRes.error;

      const followingIds = (followingRes.data || []).map((row: any) => row.following_id);
      setSocialFollowingIds(followingIds);
      setSocialProfileStats({
        followers: followersCountRes.count || 0,
        following: followingCountRes.count || 0,
        posts: postsCountRes.count || 0,
      });

      const feedAuthorIds = Array.from(new Set([profile.id, ...followingIds]));
      const { data: postRows, error: postsError } = await supabase!
        .from('social_posts')
        .select('id, author_id, content, image_url, post_kind, visibility, hydration_ml, streak_snapshot, like_count, created_at, expires_at')
        .in('author_id', feedAuthorIds)
        .order('created_at', { ascending: false })
        .limit(40);

      if (postsError) throw postsError;

      const validRows = (postRows || []).filter((row: any) => {
        if (row.post_kind !== 'story') return true;
        if (!row.expires_at) return false;
        return new Date(row.expires_at).getTime() > Date.now();
      });

      const authorIds = Array.from(new Set(validRows.map((row: any) => row.author_id)));
      const postIds = validRows.map((row: any) => row.id);

      const [profilesRes, likesRes] = await Promise.all([
        authorIds.length > 0
          ? supabase!.from('profiles').select('id, nickname').in('id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase!.from('social_post_likes').select('post_id').eq('user_id', profile.id).in('post_id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (likesRes.error) throw likesRes.error;

      const profileMap = new Map((profilesRes.data || []).map((row: any) => [row.id, {
        id: row.id,
        nickname: row.nickname || 'Người dùng DigiWell',
      }]));
      const likedPostIds = new Set((likesRes.data || []).map((row: any) => row.post_id));

      const mappedPosts: SocialFeedPost[] = validRows.map((row: any) => ({
        ...row,
        author: profileMap.get(row.author_id) || {
          id: row.author_id,
          nickname: row.author_id === profile.id ? (profile.nickname || 'Bạn') : 'Người dùng DigiWell',
        },
        likedByMe: likedPostIds.has(row.id),
      }));

      const storyMap = new Map<string, SocialFeedPost>();
      const latestStories = mappedPosts
        .filter(post => post.post_kind === 'story')
        .reduce<SocialFeedPost[]>((acc, post) => {
          if (storyMap.has(post.author_id)) return acc;
          storyMap.set(post.author_id, post);
          acc.push(post);
          return acc;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


      setSocialStories(latestStories);
      setSocialPosts(mappedPosts.filter(post => post.post_kind !== 'story'));
      setSocialError('');
    } catch (err: any) {
      const friendlyMessage = getSocialErrorMessage(err.message);
      setSocialError(friendlyMessage);
      setSocialPosts([]);
      setSocialStories([]);
      if (!options?.silent) {
        toast.error(friendlyMessage);
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

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

    if (!profile?.id) {
      queuePendingHydrationAction({
        amount: intent.amount,
        name: intent.name,
        timestamp: Date.now(),
      });
      return;
    }

    await handleAddWater(intent.amount, 1, intent.name);
  };

  const updateReminderSetting = <K extends keyof HydrationReminderSettings>(
    key: K,
    value: HydrationReminderSettings[K],
  ) => {
    setReminderSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyReminderSettings = async () => {
    const validationError = validateHydrationReminderSettings(reminderSettings);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsApplyingReminderSettings(true);

    try {
      if (!supportsNativeHydrationReminders()) {
        toast.success('Đã lưu lịch nhắc. Hãy chạy bản Android/iOS để nhận thông báo nền.');
        return;
      }

      let granted = await checkHydrationReminderPermission();
      if (!granted && reminderSettings.enabled) {
        granted = await requestHydrationReminderPermission();
      }

      setIsReminderPermissionGranted(granted);

      if (reminderSettings.enabled && !granted) {
        throw new Error('Bạn cần cấp quyền thông báo để DigiWell nhắc uống nước.');
      }

      const result = await scheduleHydrationReminders(reminderSettings, {
        dailyGoal: waterGoal,
        nickname: profile?.nickname,
      });

      toast.success(
        result.scheduled
          ? `Đã lên lịch ${result.count} lời nhắc uống nước mỗi ngày!`
          : 'Đã tắt lịch nhắc uống nước định kỳ.',
      );
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật lịch nhắc uống nước.');
    } finally {
      setIsApplyingReminderSettings(false);
    }
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

  const handleSocialImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB để upload nhanh hơn.');
      event.target.value = '';
      return;
    }

    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSocialImageFile(file);
    setSocialImagePreview(previewUrl);
    setSocialComposer(prev => ({ ...prev, imageUrl: '' }));
    event.target.value = '';
  };

  const handleSearchSocialUsers = async (query: string) => {
    setSocialSearchQuery(query);
    await loadSocialDirectory(query);
  };

  const handleFollowUser = async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;

    const toastId = toast.loading(`Đang theo dõi ${nickname}...`);
    try {
      const { error } = await supabase!
        .from('social_follows')
        .insert({ follower_id: profile.id, following_id: targetUserId });
      if (error) throw error;

      setSocialFollowingIds(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
      setSocialSearchResults(prev => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: true } : user));
      setSocialProfileStats(prev => ({ ...prev, following: prev.following + 1 }));
      toast.success(`Đã theo dõi ${nickname}.`, { id: toastId });
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    }
  };

  const handleUnfollowUser = async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;

    const toastId = toast.loading(`Đang bỏ theo dõi ${nickname}...`);
    try {
      const { error } = await supabase!
        .from('social_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', targetUserId);
      if (error) throw error;

      setSocialFollowingIds(prev => prev.filter(id => id !== targetUserId));
      setSocialSearchResults(prev => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: false } : user));
      setSocialProfileStats(prev => ({ ...prev, following: Math.max(prev.following - 1, 0) }));
      toast.success(`Đã bỏ theo dõi ${nickname}.`, { id: toastId });
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    }
  };

  const handleToggleLikePost = async (post: SocialFeedPost) => {
    if (!profile?.id) return;

    const nextLiked = !post.likedByMe;
    const likeDelta = nextLiked ? 1 : -1;
    setSocialPosts(prev => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));
    setSocialStories(prev => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));

    try {
      if (nextLiked) {
        const { error } = await supabase!.from('social_post_likes').insert({
          post_id: post.id,
          user_id: profile.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.from('social_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', profile.id);
        if (error) throw error;
      }

      const { error: countError } = await supabase!.from('social_posts')
        .update({ like_count: Math.max((post.like_count || 0) + likeDelta, 0) })
        .eq('id', post.id);
      if (countError) throw countError;
    } catch (err: any) {
      setSocialPosts(prev => prev.map(item => item.id === post.id ? post : item));
      setSocialStories(prev => prev.map(item => item.id === post.id ? post : item));
      toast.error(getSocialErrorMessage(err.message));
    }
  };

  const handlePublishSocialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const trimmedContent = socialComposer.content.trim();
    const trimmedImageUrl = socialComposer.imageUrl.trim();

    if (!trimmedContent && !trimmedImageUrl && !socialImageFile) {
      toast.error('Viết gì đó hoặc thêm ảnh trước khi đăng.');
      return;
    }

    setIsPublishingSocialPost(true);
    const toastId = toast.loading(socialComposer.postKind === 'story' ? 'Đang đăng story...' : 'Đang đăng bài...');

    try {
      let imageUrl = trimmedImageUrl || null;
      if (socialImageFile) {
        imageUrl = await uploadSocialImage(socialImageFile);
      }

      const expiresAt = socialComposer.postKind === 'story'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: trimmedContent,
        image_url: imageUrl,
        post_kind: socialComposer.postKind,
        visibility: socialComposer.visibility,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      });
      if (error) throw error;

      toast.success(
        socialComposer.postKind === 'story' ? 'Story đã lên sóng 24 giờ.' : 'Bài đăng đã xuất hiện trên feed.',
        { id: toastId },
      );
      closeSocialComposer();
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    } finally {
      setIsPublishingSocialPost(false);
    }
  };

  const handleExportPDF = async () => {
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
      
      // Tạo template HTML ẩn để in
      const reportDiv = document.createElement('div');
      reportDiv.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; color: #333; background: white;">
          <h1 style="color: #0ea5e9; text-align: center; margin-bottom: 5px;">BÁO CÁO SỨC KHỎE DIGIWELL</h1>
          <p style="text-align: center; color: #666; font-size: 14px;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} - Thu thập bởi DigiCoach AI</p>
          <hr style="margin: 20px 0; border: 1px solid #eee;" />
          <h2 style="color: #0f172a; font-size: 18px;">1. Thông tin cá nhân</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Họ và tên:</strong> ${profile?.nickname || 'Khách'}</li>
            <li><strong>Thể trạng:</strong> ${profile?.age || '--'} tuổi, ${profile?.height || '--'} cm, ${profile?.weight || '--'} kg</li>
            <li><strong>Mục tiêu sức khỏe:</strong> ${profile?.goal || '--'}</li>
          </ul>
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">2. Thống kê nước (Hôm nay)</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Đã uống:</strong> ${waterIntake} ml / ${waterGoal} ml (Hoàn thành ${Math.round(progress)}%)</li>
            <li><strong>Chuỗi hiện tại:</strong> ${streak} ngày liên tiếp</li>
          </ul>
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 30px;">3. Nhịp sinh học & Hoạt động</h2>
          <ul style="line-height: 1.8;">
            <li><strong>Mức độ vận động:</strong> ${profile?.activity || '--'}</li>
            <li><strong>Nhịp tim gần nhất:</strong> ${isWatchConnected ? watchData.heartRate + ' BPM' : 'Chưa đồng bộ'}</li>
            <li><strong>Số bước chân:</strong> ${isWatchConnected ? watchData.steps : 'Chưa đồng bộ'}</li>
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
  };

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
    if (!profile?.id) return;
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
      setProfile({ ...profile, ...editProfileData }); // Cập nhật lại state frontend
      toast.success("Cập nhật hồ sơ thành công! ✅", { id: toastId });
      setShowEditProfile(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật hồ sơ!", { id: toastId });
    } finally { setIsUpdatingProfile(false); }
  };

  const handleLogout = async () => {
    if (confirm("Xác nhận đăng xuất an toàn?")) {
      await supabase!.auth.signOut();
    }
  };

  const handleScan = () => {
    if (!isAiConfigured()) return toast.error("Vui lòng cấu hình VITE_GEMINI_API_KEY!");
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
    const myData = { name: profile?.nickname || 'Bạn', dept: 'Người dùng hệ thống', wp: calculateWP(waterIntake, waterGoal, streak), streak: streak, isMe: true };
    if (leagueMode === 'public') return [
      { name: 'Thầy Hùng', dept: 'Khoa Công nghệ thông tin', wp: 4600, streak: 7, isMe: false },
      { name: 'Tuấn Anh', dept: 'Ban Phong trào VLU', wp: 3400, streak: 4, isMe: false },
      myData,
      { name: 'Lan Phương', dept: 'Khoa Ngoại ngữ', wp: 1200, streak: 1, isMe: false }
    ];
    return [ ...friendsList, myData ];
  };

  const {
    aiAdvice,
    isAiLoading,
    chatMessages,
    setChatMessages,
    isChatLoading,
    chatInput,
    setChatInput,
    fetchAIAdvice,
    handleSendChatMessage
  } = useGeminiAI({
    profile, waterIntake, waterGoal, weatherData, watchData, isWeatherSynced, isWatchConnected,
    waterEntriesRef, waterIntakeRef, handleAddWater, handleDeleteEntry,
    setActiveTab, setShowAiChat, handleExportPDF, toggleFastingMode, setShowHistory
  });

  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";
  const cardGlow = "bg-slate-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.08)]";
  const currentRank = getRankInfo(calculateWP(waterIntake, waterGoal, streak));
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
    { icon: CloudSun, label: 'Trạm thời tiết', sub: 'Đồng bộ tự động qua GPS', active: isWeatherSynced, action: syncWeather, activeColor: '#f97316', activeBg: 'rgba(249,115,22,0.2)', activeBorder: 'rgba(249,115,22,0.4)' },
    { icon: Calendar, label: 'Lịch trình thông minh', sub: 'Nhắc nhở theo agenda và giờ học', active: isCalendarSynced, action: syncCalendar, activeColor: '#818cf8', activeBg: 'rgba(99,102,241,0.2)', activeBorder: 'rgba(99,102,241,0.4)' },
    { icon: Watch, label: 'Watch / HealthKit', sub: 'Nhịp tim và bước chân thời gian thực', active: isWatchConnected, action: () => setIsWatchConnected(!isWatchConnected), activeColor: '#22d3ee', activeBg: 'rgba(6,182,212,0.2)', activeBorder: 'rgba(6,182,212,0.4)' },
  ];
  const connectedSystemsCount = connectedSystems.filter(item => item.active).length;
  const assistantFace = progress < 30 ? '(;-;)' : progress < 70 ? '(o_o)' : '(^o^)';
  const assistantStatus = progress < 30 ? 'Hydration thấp' : progress < 70 ? 'Đang ổn định' : 'Đang rất tốt';
  const assistantTone = progress < 30 ? 'text-red-400' : progress < 70 ? 'text-cyan-400' : 'text-emerald-400';
  const visibleDrinkPresets = drinkPresets.slice(0, 6);
  const primaryDrinkPreset = visibleDrinkPresets.find(preset => preset.name.toLowerCase().includes('nước')) || visibleDrinkPresets[0];
  const secondaryDrinkPresets = visibleDrinkPresets.filter(preset => preset.id !== primaryDrinkPreset?.id).slice(0, 4);

  // ==========================================================================
  // [GIAO DIỆN 1] WELCOME SCREEN
  // ==========================================================================
  if (view === 'welcome') return <WelcomeScreen onNavigate={(v) => setView(v)} />;

  // ==========================================================================
  // [GIAO DIỆN 2] LOGIN SCREEN
  // ==========================================================================
  if (view === 'login') return <LoginScreen onBack={() => setView('welcome')} initialEmail={loginPrefill} />;

  // ==========================================================================
  // [GIAO DIỆN 3] REGISTER SCREEN
  // ==========================================================================
  if (view === 'register') return <RegisterScreen onBack={() => setView('welcome')} onSuccess={(email) => { setLoginPrefill(email); setView('login'); }} />;

  // ==========================================================================
  // [GIAO DIỆN 4] MAIN DASHBOARD
  // ==========================================================================
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative font-sans overflow-hidden pb-24 pt-12 px-4" style={{ background: '#0f172a' }}>
      <Toaster position="top-center" theme="dark" richColors closeButton />
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={processImageScan} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">

        {/* ==================== HOME TAB ==================== */}
        {activeTab === 'home' && (
          <HomeTab
            profile={profile}
            nowText={nowText}
            hasPendingCloudSync={hasPendingCloudSync}
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
            handleLogout={handleLogout}
            setShowSmartHub={setShowSmartHub}
            setShowHistory={setShowHistory}
            openSocialComposer={openSocialComposer}
            setShowPresetManager={setShowPresetManager}
            setShowCustomDrink={setShowCustomDrink}
            customDrinkForm={customDrinkForm}
            setCustomDrinkForm={setCustomDrinkForm}
            setEditingPresets={setEditingPresets}
          />
        )}

        {/* ==================== INSIGHT TAB ==================== */}
        {activeTab === 'insight' && (
          <InsightTab
            isPremium={isPremium}
            setShowPremiumModal={setShowPremiumModal}
            isExportingPDF={isExportingPDF}
            handleExportPDF={handleExportPDF}
            waterGoal={waterGoal}
            weeklyChartData={weeklyHistory}
            progress={progress}
            streak={streak}
            isAiLoading={isAiLoading}
            aiAdvice={aiAdvice}
            fetchAIAdvice={fetchAIAdvice}
            setShowAiChat={setShowAiChat}
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
            socialStories={socialStories}
            socialPosts={socialPosts}
            socialError={socialError}
            isSocialLoading={isSocialLoading}
            socialFollowingIds={socialFollowingIds}
            openSocialComposer={openSocialComposer}
            setShowSocialProfile={setShowSocialProfile}
            setShowDiscoverPeople={setShowDiscoverPeople}
            handleToggleLikePost={handleToggleLikePost}
          />
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            isPremium={isPremium}
            streak={streak}
            socialProfileStats={socialProfileStats}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            weeklyHistory={weeklyHistory}
            completionPercent={completionPercent}
            remainingWater={remainingWater}
            currentRank={currentRank}
            wp={calculateWP(waterIntake, waterGoal, streak)}
            setShowPremiumModal={setShowPremiumModal}
            setShowAddFriend={setShowAddFriend}
            setShowProfileSettings={setShowProfileSettings}
            setActiveTab={setActiveTab}
            handleLogout={handleLogout}
          />
        )}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ===== HISTORY MODAL ===== */}
      <HistoryModal
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        waterEntries={waterEntries}
        waterIntake={waterIntake}
        setEditingEntry={setEditingEntry}
        setEditAmount={setEditAmount}
        handleDeleteEntry={handleDeleteEntry}
      />

      {/* ===== EDIT MODAL ===== */}
      <EditEntryModal
        editingEntry={editingEntry}
        setEditingEntry={setEditingEntry}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        handleEditEntry={handleEditEntry}
      />

      {/* ===== SMART HUB MODAL (Gom các tính năng phụ) ===== */}
      <SmartHubModal
        showSmartHub={showSmartHub}
        setShowSmartHub={setShowSmartHub}
        reminderSettings={reminderSettings}
        isReminderPermissionGranted={isReminderPermissionGranted}
        updateReminderSetting={updateReminderSetting}
        reminderPreview={reminderPreview}
        handleApplyReminderSettings={handleApplyReminderSettings}
        isApplyingReminderSettings={isApplyingReminderSettings}
        isWeatherSynced={isWeatherSynced}
        weatherData={weatherData}
        syncWeather={syncWeather}
        isCalendarSynced={isCalendarSynced}
        calendarEvents={calendarEvents}
        isWatchConnected={isWatchConnected}
        setIsWatchConnected={setIsWatchConnected}
        watchData={watchData}
        currentActivity={currentActivity}
        setCurrentActivity={setCurrentActivity}
        isFastingMode={isFastingMode}
        toggleFastingMode={toggleFastingMode}
        fastingHours={fastingHours}
        fastingMinutes={fastingMinutes}
        fastingSeconds={fastingSeconds}
        fastingRemaining={fastingRemaining}
        isPremium={isPremium}
        setShowPremiumModal={setShowPremiumModal}
      />

      {/* ===== CUSTOM DRINK MODAL ===== */}
      <CustomDrinkModal
        showCustomDrink={showCustomDrink}
        setShowCustomDrink={setShowCustomDrink}
        customDrinkForm={customDrinkForm}
        setCustomDrinkForm={setCustomDrinkForm}
        handleAddWater={handleAddWater}
      />

      {/* ===== PRESET MANAGER MODAL ===== */}
      <PresetManagerModal
        showPresetManager={showPresetManager}
        setShowPresetManager={setShowPresetManager}
        editingPresets={editingPresets}
        setEditingPresets={setEditingPresets}
        handleUpdatePreset={handleUpdatePreset}
        savePresets={savePresets}
      />

      {/* ===== ONBOARDING MODAL (HƯỚNG DẪN TÂN THỦ) ===== */}
      <OnboardingModal
        showOnboarding={showOnboarding}
        setShowOnboarding={setShowOnboarding}
        onboardingStep={onboardingStep}
        setOnboardingStep={setOnboardingStep}
        profileId={profile?.id}
        phoenixNode={<MechanicalPhoenix progress={100} />}
      />

      {/* ===== SOCIAL PROFILE PAGE ===== */}
      {showSocialProfile && (
        <div className="fixed inset-0 z-[80] flex justify-center" style={{ background: '#0f172a' }}>
          <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Feed</p>
                <h3 className="text-2xl font-black text-white mt-1">Hồ sơ mạng xã hội</h3>
              </div>
              <button onClick={() => setShowSocialProfile(false)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
                Đóng
              </button>
            </div>

            <div className="px-5 pt-5 pb-10">
            <div className={`${cardGlow} overflow-hidden`}>
              <div className="relative p-6">
                <div className="absolute -top-10 -right-8 w-28 h-28 rounded-full blur-3xl bg-cyan-500/15 pointer-events-none" />
                <div className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full blur-3xl bg-indigo-500/10 pointer-events-none" />
                <div className="relative flex items-start gap-4">
                  <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                    <span className="text-4xl font-black text-slate-900">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-2xl font-black text-white truncate">{profile?.nickname || 'Khách'}</h3>
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${currentRank.bg} ${currentRank.border}`}
                        title={currentRank.name}
                      >
                        <Trophy size={14} className={currentRank.color} />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-4">
                      <div className="px-3 py-2 rounded-xl bg-slate-950/35 border border-white/10 text-cyan-200 text-[11px] font-bold">
                        {waterIntake}/{waterGoal}ml hôm nay
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-slate-950/35 border border-white/10 text-orange-200 text-[11px] font-bold">
                        Streak {streak} ngày
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {socialError ? (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">Thiết lập</p>
                <p className="text-slate-200 text-sm leading-relaxed">{socialError}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Follower', value: socialProfileStats.followers, color: 'text-cyan-300' },
                    { label: 'Đang follow', value: socialProfileStats.following, color: 'text-emerald-300' },
                    { label: 'Bài viết', value: socialProfileStats.posts, color: 'text-amber-300' },
                  ].map(item => (
                    <div key={item.label} className={`${card} p-4`}>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{item.label}</p>
                      <p className={`mt-2 text-xl font-black ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowSocialProfile(false);
                      openSocialComposer('progress');
                    }}
                    className="py-3 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Share2 size={14} /> Share progress
                  </button>
                  <button
                    onClick={() => {
                      setShowSocialProfile(false);
                      openSocialComposer('status');
                    }}
                    className="py-3 rounded-xl bg-cyan-500/12 border border-cyan-500/25 text-cyan-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Edit2 size={14} /> Tạo bài
                  </button>
                  <button
                    onClick={() => {
                      setShowSocialProfile(false);
                      setShowDiscoverPeople(true);
                    }}
                    className="py-3 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Users size={14} /> Khám phá
                  </button>
                  <button
                    onClick={() => {
                      setShowSocialProfile(false);
                      openSocialComposer('story');
                    }}
                    className="py-3 rounded-xl bg-fuchsia-500/12 border border-fuchsia-500/25 text-fuchsia-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Đăng story
                  </button>
                </div>

                <div className={`${card} p-5 mt-4`}>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tổng quan</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tiến độ hôm nay</p>
                      <p className="mt-2 text-xl font-black text-cyan-300">{completionPercent}%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Còn thiếu</p>
                      <p className="mt-2 text-xl font-black text-orange-300">{remainingWater} ml</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SOCIAL DISCOVER MODAL ===== */}
      {showDiscoverPeople && (
        <div className="fixed inset-0 z-[90] flex justify-center" style={{ background: '#0f172a' }}>
          <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Feed</p>
                <h3 className="text-2xl font-black text-white mt-1">Khám phá</h3>
              </div>
              <button onClick={() => setShowDiscoverPeople(false)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
                Đóng
              </button>
            </div>

            <div className="px-5 pt-5 pb-10">
            <div className="relative mb-5">
              <input
                type="text"
                value={socialSearchQuery}
                onChange={e => void handleSearchSocialUsers(e.target.value)}
                placeholder="Tìm theo nickname..."
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            {isSocialSearching ? (
              <div className={`${card} p-8 text-center`}>
                <RefreshCw size={26} className="text-emerald-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-semibold">Đang tìm profile...</p>
              </div>
            ) : socialSearchResults.length > 0 ? (
              <div className="space-y-3">
                {socialSearchResults.map(user => (
                  <div key={user.id} className="rounded-[1.5rem] border border-slate-700 bg-slate-800/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-inner" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                          {(user.nickname || 'D').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-bold truncate">{user.nickname}</p>
                          <p className="text-slate-500 text-[11px] mt-1">Người dùng DigiWell</p>
                        </div>
                      </div>

                      {user.isFollowing ? (
                        <button onClick={() => void handleUnfollowUser(user.id, user.nickname)} className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                          <UserMinus size={14} /> Bỏ follow
                        </button>
                      ) : (
                        <button onClick={() => void handleFollowUser(user.id, user.nickname)} className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                          <UserPlus size={14} /> Follow
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${card} p-8 text-center`}>
                <Users size={34} className="text-slate-600 mx-auto mb-3" />
                <p className="text-white text-sm font-semibold mb-1">Chưa có kết quả phù hợp</p>
                <p className="text-slate-400 text-xs">
                  {socialSearchQuery.trim().length >= 2
                    ? 'Thử nickname ngắn hơn hoặc gần giống hơn.'
                    : 'Nhập nickname để follow và xây network của riêng bạn.'}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SOCIAL COMPOSER MODAL ===== */}
      {showSocialComposer && (
        <div className="fixed inset-0 z-[95] flex justify-center" style={{ background: '#0f172a' }}>
          <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
            <form onSubmit={handlePublishSocialPost}>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
                <button type="button" onClick={closeSocialComposer} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
                  Hủy
                </button>
                <div className="text-center min-w-0">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Composer</p>
                  <h3 className="text-xl font-black text-white truncate mt-1">{socialComposer.postKind === 'story' ? 'Đăng story' : 'Tạo bài viết'}</h3>
                </div>
                <button type="submit" disabled={isPublishingSocialPost} className="px-4 py-2 rounded-xl text-slate-950 text-xs font-black disabled:opacity-60 active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #22d3ee, #06b6d4)' }}>
                  {isPublishingSocialPost ? 'Đang đăng' : 'Đăng'}
                </button>
              </div>

              <div className="px-5 pt-5 pb-10 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Bài viết', value: 'status' as const },
                  { label: 'Tiến độ', value: 'progress' as const },
                  { label: 'Story', value: 'story' as const },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSocialComposer(prev => ({ ...prev, postKind: option.value, visibility: option.value === 'story' ? 'followers' : prev.visibility }))}
                    className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${socialComposer.postKind === option.value ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className={`${card} p-4`}>
                <textarea
                  value={socialComposer.content}
                  onChange={e => setSocialComposer(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  placeholder={socialComposer.postKind === 'story' ? 'Viết caption ngắn cho story 24h...' : 'Hôm nay bạn muốn chia sẻ gì với community?'}
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm p-4 outline-none focus:border-cyan-500 resize-none"
                />

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button type="button" onClick={() => setSocialComposer(prev => ({ ...prev, content: buildProgressShareText({ nickname: profile?.nickname, waterIntake, waterGoal, streak }), postKind: 'progress' }))} className="py-3 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-300 text-xs font-bold active:scale-95 transition-all">
                    Dùng progress card
                  </button>
                  <select
                    value={socialComposer.visibility}
                    onChange={e => setSocialComposer(prev => ({ ...prev, visibility: e.target.value as SocialComposerState['visibility'] }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white text-xs px-3 outline-none focus:border-cyan-500"
                  >
                    <option value="public">Công khai</option>
                    <option value="followers">Chỉ follower</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex gap-3">
                  <button type="button" onClick={() => socialImageInputRef.current?.click()} className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <ImagePlus size={14} /> Upload ảnh
                  </button>
                  <button type="button" onClick={() => { setSocialImageFile(null); if (socialImagePreview.startsWith('blob:')) URL.revokeObjectURL(socialImagePreview); setSocialImagePreview(''); setSocialComposer(prev => ({ ...prev, imageUrl: '' })); }} className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold active:scale-95 transition-all">
                    Xóa ảnh
                  </button>
                </div>

                <input
                  ref={socialImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSocialImagePicked}
                  className="hidden"
                />

                <input
                  type="url"
                  value={socialComposer.imageUrl}
                  onChange={e => setSocialComposer(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Hoặc dán link ảnh công khai..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white text-xs px-3 py-3 outline-none focus:border-cyan-500"
                />

                {(socialImagePreview || socialComposer.imageUrl.trim()) && (
                  <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                    <img src={socialImagePreview || socialComposer.imageUrl.trim()} alt="Xem trước ảnh bài viết" className="w-full h-48 object-cover" />
                  </div>
                )}

                {socialImageFile && (
                  <p className="text-slate-400 text-[11px]">File đã chọn: {socialImageFile.name}</p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-cyan-500/15 bg-cyan-500/5 p-4">
                <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest mb-2">Snapshot khi đăng</p>
                <div className="flex gap-2 flex-wrap">
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-cyan-300 font-semibold">{waterIntake}/{waterGoal}ml</div>
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-orange-300 font-semibold">Streak {streak} ngày</div>
                </div>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD FRIEND MODAL ===== */}
      <AddFriendModal
        showAddFriend={showAddFriend}
        setShowAddFriend={setShowAddFriend}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        isSearching={isSearching}
        handleSearchUser={handleSearchUser}
        handleAddFriend={handleAddFriend}
      />

      {/* ===== PROFILE SETTINGS PAGE ===== */}
      <ProfileSettingsModal
        showProfileSettings={showProfileSettings}
        setShowProfileSettings={setShowProfileSettings}
        profile={profile}
        waterGoal={waterGoal}
        activityLabel={activityLabel}
        connectedSystemsCount={connectedSystemsCount}
        connectedSystems={connectedSystems}
        openEditProfile={openEditProfile}
      />

      {/* ===== EDIT PROFILE MODAL ===== */}
      <EditProfileModal
        showEditProfile={showEditProfile}
        setShowEditProfile={setShowEditProfile}
        editProfileData={editProfileData}
        setEditProfileData={setEditProfileData}
        handleSaveProfile={handleSaveProfile}
        isUpdatingProfile={isUpdatingProfile}
      />

      {/* ===== PREMIUM PAYWALL MODAL ===== */}
      <PremiumModal
        showPremiumModal={showPremiumModal}
        setShowPremiumModal={setShowPremiumModal}
        setIsPremium={setIsPremium}
      />

      <AiChatModal
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        messages={chatMessages}
        isLoading={isChatLoading}
        input={chatInput}
        onInputChange={setChatInput}
        onSubmit={handleSendChatMessage}
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
      <div className="min-h-screen max-w-md mx-auto p-8 font-sans flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="w-full p-8 rounded-[2rem] border border-slate-700 bg-slate-800/80">
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
  return <AppContent />;
}
