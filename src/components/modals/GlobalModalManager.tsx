import React from 'react';
import { 
  History, Settings, Zap, UserPlus, 
  MessageSquare, Edit3, Camera, X 
} from 'lucide-react';

import HistoryModal from './HistoryModal';
import SmartHubModal from './SmartHubModal';
import AiChatModal from './AiChatModal';
import { useModalStore } from '../../store/useModalStore';

import type { WaterEntry } from './HistoryModal';
import type { ChatMessage } from './AiChatModal';
import type { SocialComposerState } from '../../lib/social';

interface GlobalModalManagerProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  waterIntake: number;
  setEditingEntry: (entry: any) => void;
  setEditAmount: (amount: string) => void;
  waterEntries: WaterEntry[];
  handleDeleteEntry: (id: string, amount: number) => void;
  weatherData: { temp?: number } | null;
  watchData: { heartRate?: number } | null;
  isWeatherSynced: boolean;
  isWatchConnected: boolean;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  chatInput: string;
  setChatInput: (input: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
  socialComposer: SocialComposerState;
  setSocialComposer: React.Dispatch<React.SetStateAction<SocialComposerState>>;
  handlePublishSocialPost: (e: React.FormEvent) => void;
  isPremium: boolean;
}

export default function GlobalModalManager(props: GlobalModalManagerProps) {
  const { 
    showSocialComposer, setShowSocialComposer 
  } = useModalStore();

  const {
    showHistory, setShowHistory, waterIntake, setEditingEntry, setEditAmount,
    // Props từ useWaterData
    waterEntries, handleDeleteEntry,
    // Props từ useAppSystem / Weather / Health
    weatherData, watchData, isWeatherSynced, isWatchConnected,
    // Props từ useGeminiAI
    chatMessages, isChatLoading, chatInput, setChatInput, handleSendChatMessage,
    // Props từ useSocialData
    socialComposer, setSocialComposer, handlePublishSocialPost,
    // Các UI state khác
    isPremium
  } = props;

  // Lớp nền mờ đặc trưng Cyberpunk
  const modalOverlay = "fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300";
  const modalContent = "w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300";

  return (
    <>
      <HistoryModal 
        showHistory={showHistory} 
        setShowHistory={setShowHistory} 
        waterEntries={waterEntries} 
        waterIntake={waterIntake} 
        setEditingEntry={setEditingEntry} 
        setEditAmount={setEditAmount} 
        handleDeleteEntry={handleDeleteEntry} 
      />
      <SmartHubModal weatherData={weatherData} watchData={watchData} isWeatherSynced={isWeatherSynced} isWatchConnected={isWatchConnected} />
      <AiChatModal chatMessages={chatMessages} isChatLoading={isChatLoading} chatInput={chatInput} setChatInput={setChatInput} handleSendChatMessage={handleSendChatMessage} />

      {/* 4. MODAL SOCIAL COMPOSER (Đăng bài) */}
      {showSocialComposer && (
        <div className={modalOverlay}>
           <div className={modalContent}>
              <form onSubmit={handlePublishSocialPost} className="p-6">
                <h3 className="text-xl font-black text-white mb-4 uppercase">Trạm Phát Tin</h3>
                <textarea 
                  value={socialComposer.content}
                  onChange={(e) => setSocialComposer((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Chia sẻ thành tích uống nước hôm nay..."
                  className="w-full h-32 p-4 bg-white/5 rounded-2xl text-white text-sm resize-none outline-none border border-white/10 focus:border-cyan-500/50"
                />
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="flex-1 py-4 bg-cyan-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform">ĐĂNG NGAY</button>
                  <button type="button" onClick={() => setShowSocialComposer(false)} className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl">Hủy</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </>
  );
}