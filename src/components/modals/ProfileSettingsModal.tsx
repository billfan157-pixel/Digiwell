import React from 'react';
import { Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectedSystem {
  icon: React.ElementType;
  label: string;
  sub: string;
  active: boolean;
  action: () => void;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}

interface ProfileSettingsModalProps {
  showProfileSettings: boolean;
  setShowProfileSettings: (show: boolean) => void;
  profile: any;
  waterGoal: number;
  activityLabel: string;
  connectedSystemsCount: number;
  connectedSystems: ConnectedSystem[];
  openEditProfile: () => void;
  triggerHaptic?: () => void; // Thêm hàm rung vào Props
}

export default function ProfileSettingsModal({
  showProfileSettings, setShowProfileSettings, profile, waterGoal, activityLabel, connectedSystemsCount, connectedSystems, openEditProfile, triggerHaptic = () => {}
}: ProfileSettingsModalProps) {
  
  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

  return (
    <AnimatePresence mode="wait">
      {showProfileSettings && (
        <motion.div 
          key="profile-settings-overlay"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex justify-center bg-slate-950/80 backdrop-blur-sm" // Đổi nền mờ
        >
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md min-h-screen px-5 pt-12 pb-10 overflow-y-auto scrollbar-hide bg-slate-900" // Form nền chính
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Profile</p>
                <h3 className="text-2xl font-black text-white mt-1">Cài đặt</h3>
              </div>
              <button 
                onClick={() => { triggerHaptic(); setShowProfileSettings(false); }} 
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>

            {/* User Card */}
            <div className="rounded-[2rem] border border-slate-700/70 bg-slate-800/40 p-5 shadow-xl mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tài khoản</p>
                  <h4 className="text-white text-xl font-black mt-2">{profile?.nickname || 'Khách'}</h4>
                  <p className="text-slate-400 text-sm mt-1">{profile?.goal?.split('&')[0]?.trim() || 'Sức khỏe tổng quát'}</p>
                </div>
                <button 
                  onClick={() => { triggerHaptic(); setShowProfileSettings(false); openEditProfile(); }} 
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-2 active:scale-95 transition-all hover:bg-cyan-500/20"
                >
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              </div>
            </div>

            {/* Stats Sections */}
            <div className="space-y-4">
              <div className={`${card} p-5`}>
                <h4 className="text-white text-lg font-black mb-4">Thông tin cá nhân</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Giới tính', value: profile?.gender || '--' }, { label: 'Tuổi', value: profile?.age ? `${profile.age}` : '--' }, { label: 'Chiều cao', value: profile?.height ? `${profile.height} cm` : '--' }, { label: 'Cân nặng', value: profile?.weight ? `${profile.weight} kg` : '--' }].map((item, index) => (
                    <div key={item.label && item.label !== '' ? item.label : `fallback-info-${index}`} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{item.label}</p>
                      <p className="text-white text-sm font-bold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${card} p-5`}>
                <h4 className="text-white text-lg font-black mb-4">Thiết lập nước</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Mục tiêu nước', value: `${waterGoal} ml`, tone: 'text-cyan-300' }, { label: 'Mức vận động', value: activityLabel, tone: 'text-emerald-300' }, { label: 'Khí hậu', value: profile?.climate || '--', tone: 'text-slate-100' }, { label: 'Lộ trình', value: profile?.goal?.split('&')[0]?.trim() || '--', tone: 'text-amber-300' }].map((item, index) => (
                    <div key={item.label && item.label !== '' ? item.label : `fallback-water-${index}`} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{item.label}</p>
                      <p className={`text-sm font-bold mt-1 ${item.tone}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white text-lg font-black">Kết nối</h4>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-300 text-[11px] font-bold">
                    {connectedSystemsCount}/3 đang bật
                  </div>
                </div>
                <div className="space-y-3">
                  {connectedSystems.map(({ icon: Icon, label, sub, active, action, activeColor, activeBg, activeBorder }, index) => (
                    <div key={label && label !== '' ? label : `fallback-conn-${index}`} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: active ? activeBg : '#1e293b', border: `1px solid ${active ? activeBorder : '#334155'}` }}>
                          <Icon size={20} style={{ color: active ? activeColor : '#64748b' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-bold truncate">{label}</p>
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{sub}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { triggerHaptic(); action(); }} 
                        className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex-shrink-0" // Đã thêm active:scale-95
                        style={active ? { background: activeBg, color: activeColor, border: `1px solid ${activeBorder}` } : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}
                      >
                        {active ? 'Đã bật' : 'Kết nối'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}