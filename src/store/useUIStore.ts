import { create } from 'zustand';
import type { TabType } from '@/components/layout/BottomNav';

// Định nghĩa Interface để TypeScript không bắt bẻ
interface UIState {
  isSidebarOpen: boolean;
  activeTab: TabType;
  toggleSidebar: () => void;
  setActiveTab: (tab: TabType) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showSmartHub: boolean;
  setShowSmartHub: (show: boolean) => void;
  showCustomDrink: boolean;
  setShowCustomDrink: (show: boolean) => void;
  showPresetManager: boolean;
  setShowPresetManager: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAiChat: boolean;
  setShowAiChat: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  showProfileSettings: boolean;
  setShowProfileSettings: (show: boolean) => void;
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  showEditProfile: boolean;
  setShowEditProfile: (show: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: false,                toggleSidebar: () => set((state: UIState) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activeTab: 'home',                   setActiveTab: (tab) => set({ activeTab: tab }),
  showHistory: false,                  setShowHistory: (show) => set({ showHistory: show }),
  showSmartHub: false,                 setShowSmartHub: (show) => set({ showSmartHub: show }),
  showCustomDrink: false,              setShowCustomDrink: (show) => set({ showCustomDrink: show }),
  showPresetManager: false,            setShowPresetManager: (show) => set({ showPresetManager: show }),
  showOnboarding: false,               setShowOnboarding: (show) => set({ showOnboarding: show }),
  showAiChat: false,                   setShowAiChat: (show) => set({ showAiChat: show }),
  showPremiumModal: false,             setShowPremiumModal: (show) => set({ showPremiumModal: show }),
  showProfileSettings: false,          setShowProfileSettings: (show) => set({ showProfileSettings: show }),
  showAddFriend: false,                setShowAddFriend: (show) => set({ showAddFriend: show }),
  showEditProfile: false,              setShowEditProfile: (show) => set({ showEditProfile: show }),
}));