import React from 'react';
import { 
  History, Settings, Zap, UserPlus, 
  MessageSquare, Edit3, Camera, X 
} from 'lucide-react';

// Import các Modal lẻ (Nếu mày đã tách ra)
// import HistoryModal from './HistoryModal';
// import SmartHubModal from './SmartHubModal';

export default function GlobalModalManager(props: any) {
  const {
    // Props từ useWaterData
    showHistory, setShowHistory, waterEntries, handleDeleteEntry,
    // Props từ useAppSystem / Weather / Health
    showSmartHub, setShowSmartHub, weatherData, watchData, isWeatherSynced, isWatchConnected,
    // Props từ useGeminiAI
    showAiChat, setShowAiChat, chatMessages, isChatLoading, chatInput, setChatInput, handleSendChatMessage,
    // Props từ useSocialData
    showSocialComposer, setShowSocialComposer, socialComposer, setSocialComposer, handlePublishSocialPost,
    // Các UI state khác
    isPremium, setShowPremiumModal
  } = props;

  // Lớp nền mờ đặc trưng Cyberpunk
  const modalOverlay = "fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300";
  const modalContent = "w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300";

  return (
    <>
      {/* 1. MODAL LỊCH SỬ UỐNG NƯỚC */}
      {showHistory && (
        <div className={modalOverlay}>
          <div className={modalContent}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                    <History size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Nhật ký Hydration</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X /></button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                {waterEntries?.length > 0 ? waterEntries.map((entry: any, index: number) => (
                  <div key={entry.id || `global-history-item-${index}`} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <div className="text-white font-bold">{entry.name}</div>
                      <div className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleTimeString('vi-VN')}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-black">+{entry.amount}ml</span>
                      <button onClick={() => handleDeleteEntry(entry.id, entry.amount)} className="text-rose-500/50 hover:text-rose-500"><X size={18} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-500 italic">Chưa có dữ liệu hôm nay đệ ơi!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL SMART HUB (Đồng bộ thiết bị) */}
      {showSmartHub && (
        <div className={modalOverlay}>
          <div className={modalContent}>
            <div className="p-6">
               <h3 className="text-xl font-black text-white mb-6 uppercase">Trung tâm điều khiển</h3>
               <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border ${isWeatherSynced ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Trạm Thời Tiết</span>
                      <span className={isWeatherSynced ? 'text-orange-400' : 'text-slate-500'}>
                        {isWeatherSynced ? `${weatherData?.temp}°C - Online` : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isWatchConnected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Apple Watch / Health</span>
                      <span className={isWatchConnected ? 'text-cyan-400' : 'text-slate-500'}>
                        {isWatchConnected ? `${watchData?.heartRate} BPM` : 'Chưa kết nối'}
                      </span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setShowSmartHub(false)} className="w-full mt-6 py-4 bg-slate-800 text-white font-bold rounded-2xl">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL AI CHAT (Gemini Coach) */}
      {showAiChat && (
        <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">🤖</div>
                <div>
                  <h3 className="text-white font-black leading-none">DigiCoach AI</h3>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1 italic">Gemini 2.0 Engine</p>
                </div>
              </div>
              <button onClick={() => setShowAiChat(false)} className="p-2 bg-white/5 rounded-xl text-slate-400"><X /></button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg: any, index: number) => (
                <div key={`global-chat-msg-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && <div className="text-slate-500 text-xs italic animate-pulse">AI đang phân tích chuỗi dữ liệu...</div>}
           </div>

           <form onSubmit={handleSendChatMessage} className="p-6 bg-slate-900 border-t border-white/5">
              <div className="relative">
                <input 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi AI về sức khỏe của đệ..." 
                  className="w-full py-4 pl-6 pr-14 bg-slate-800 rounded-2xl text-white text-sm outline-none focus:ring-2 ring-cyan-500/50 transition-all"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-500 text-slate-950 rounded-xl font-bold hover:bg-cyan-400 transition-colors">Gửi</button>
              </div>
           </form>
        </div>
      )}

      {/* 4. MODAL SOCIAL COMPOSER (Đăng bài) */}
      {showSocialComposer && (
        <div className={modalOverlay}>
           <div className={modalContent}>
              <form onSubmit={handlePublishSocialPost} className="p-6">
                <h3 className="text-xl font-black text-white mb-4 uppercase">Trạm Phát Tin</h3>
                <textarea 
                  value={socialComposer.content}
                  onChange={(e) => setSocialComposer((prev: any) => ({ ...prev, content: e.target.value }))}
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