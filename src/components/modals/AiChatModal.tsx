import React from 'react';
import { X } from 'lucide-react';
import { useModalStore } from '../../store/useModalStore';
import TypingIndicator from '../TypingIndicator';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

interface AiChatModalProps {
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
}

const QUICK_PROMPTS = [
  "Tôi vừa uống 1 ly cà phê ☕",
  "Hôm nay trời nóng quá 🥵",
  "Tôi chuẩn bị đi tập Gym 💪",
  "Nên uống bao nhiêu nước lúc này? 🤔"
];

export default function AiChatModal({ chatMessages, isChatLoading, chatInput, setChatInput, handleSendChatMessage }: AiChatModalProps) {
  const { showAiChat, setShowAiChat } = useModalStore();

  return (
    <AnimatePresence>
      {showAiChat && (
        <motion.div 
          key="ai-chat-modal"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.y > 150 || velocity.y > 500) setShowAiChat(false);
          }}
          className="fixed inset-0 z-[110] bg-slate-950 flex flex-col"
        >
          {/* Thanh kéo mờ (Pull handle) báo hiệu vuốt */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 shrink-0" />
          
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
          {chatMessages.map((msg, index) => (
            <div key={`global-chat-msg-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>{msg.content}</div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
              <TypingIndicator />
            </div>
          )}
        </div>
        <form onSubmit={handleSendChatMessage} className="p-6 bg-slate-900 border-t border-white/5">
          {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 w-full pb-1 -mx-2 px-2">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatInput(prompt)}
                className="whitespace-nowrap px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 active:scale-95 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Hỏi AI về sức khỏe của đệ..." className="w-full py-4 pl-6 pr-14 bg-slate-800 rounded-2xl text-white text-sm outline-none focus:ring-2 ring-cyan-500/50 transition-all" />
            <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-500 text-slate-950 rounded-xl font-bold hover:bg-cyan-400 transition-colors">Gửi</button>
          </div>
        </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}