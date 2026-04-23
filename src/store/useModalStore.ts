import { create } from 'zustand';

interface ModalState {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showSmartHub: boolean;
  setShowSmartHub: (show: boolean) => void;
  showAiChat: boolean;
  setShowAiChat: (show: boolean) => void;
  showSocialComposer: boolean;
  setShowSocialComposer: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  showHistory: false,
  setShowHistory: (show) => set({ showHistory: show }),
  showSmartHub: false,
  setShowSmartHub: (show) => set({ showSmartHub: show }),
  showAiChat: false,
  setShowAiChat: (show) => set({ showAiChat: show }),
  showSocialComposer: false,
  setShowSocialComposer: (show) => set({ showSocialComposer: show }),
  showPremiumModal: false,
  setShowPremiumModal: (show) => set({ showPremiumModal: show }),
}));