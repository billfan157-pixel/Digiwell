import React from 'react';
import { useModalStore } from '../../store/useModalStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartHubModalProps {
  weatherData: { temp?: number } | null;
  watchData: { heartRate?: number } | null;
  isWeatherSynced: boolean;
  isWatchConnected: boolean;
}

export default function SmartHubModal({ weatherData, watchData, isWeatherSynced, isWatchConnected }: SmartHubModalProps) {
  const { showSmartHub, setShowSmartHub } = useModalStore();

  return (
    <AnimatePresence>
      {showSmartHub && (
        <div key="smarthub-modal-wrapper" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSmartHub(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) setShowSmartHub(false);
            }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0 sm:hidden" />
            <div className="p-6">
            <h3 className="text-xl font-black text-white mb-6 uppercase">Trung tâm điều khiển</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isWeatherSynced ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">Trạm Thời Tiết</span>
                  <span className={isWeatherSynced ? 'text-orange-400' : 'text-slate-500'}>{isWeatherSynced ? `${weatherData?.temp}°C - Online` : 'Offline'}</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isWatchConnected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">Apple Watch / Health</span>
                  <span className={isWatchConnected ? 'text-cyan-400' : 'text-slate-500'}>{isWatchConnected ? `${watchData?.heartRate} BPM` : 'Chưa kết nối'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSmartHub(false)} className="w-full mt-6 py-4 bg-slate-800 text-white font-bold rounded-2xl">Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}