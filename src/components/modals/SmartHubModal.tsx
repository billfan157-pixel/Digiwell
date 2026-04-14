import React from 'react';
import { Bell, CloudSun, RefreshCw, Calendar, Watch, Bluetooth, Eye, ShieldCheck, Coffee, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AutoActivityCard from '../AutoActivityCard';
import type { HydrationReminderSettings } from '../../lib/hydrationReminders';

interface SmartHubModalProps {
  showSmartHub: boolean;
  setShowSmartHub: (show: boolean) => void;
  reminderSettings: HydrationReminderSettings;
  isReminderPermissionGranted: boolean;
  updateReminderSetting: (key: keyof HydrationReminderSettings, value: any) => void;
  reminderPreview: string;
  handleApplyReminderSettings: () => void;
  isApplyingReminderSettings: boolean;
  isWeatherSynced: boolean;
  weatherData: { temp: number; location: string; status: string };
  syncWeather: () => void;
  isCalendarSynced: boolean;
  calendarEvents: any[];
  isWatchConnected: boolean;
  setIsWatchConnected: (connected: boolean) => void;
  watchData: { heartRate: number; steps: number };
  currentActivity: 'chill' | 'light' | 'hard';
  setCurrentActivity: (activity: 'chill' | 'light' | 'hard') => void;
  isFastingMode: boolean;
  toggleFastingMode: () => void;
  fastingHours: number;
  fastingMinutes: number;
  fastingSeconds: number;
  fastingRemaining: number;
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

export default function SmartHubModal({
  showSmartHub, setShowSmartHub, reminderSettings, isReminderPermissionGranted, updateReminderSetting,
  reminderPreview, handleApplyReminderSettings, isApplyingReminderSettings, isWeatherSynced,
  weatherData, syncWeather, isCalendarSynced, calendarEvents, isWatchConnected, setIsWatchConnected,
  watchData, currentActivity, setCurrentActivity, isFastingMode, toggleFastingMode, fastingHours,
  fastingMinutes, fastingSeconds, fastingRemaining, isPremium, setShowPremiumModal
}: SmartHubModalProps) {
  if (!showSmartHub) return null;
  
  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowSmartHub(false)}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-black text-white">Tiện ích</h3>
          </div>
          <button onClick={() => setShowSmartHub(false)} className="text-slate-400 text-xs bg-slate-700 px-3 py-1.5 rounded-lg font-bold">Đóng</button>
        </div>

        <div className="space-y-4">
          {/* Widget Nhắc uống nước */}
          <div className={`${card} p-5 border-l-4 ${reminderSettings.enabled ? 'border-l-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.1)]' : 'border-l-slate-700'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${reminderSettings.enabled ? 'bg-cyan-500/15 border-cyan-500/30' : 'bg-slate-800 border-slate-700'}`}>
                <Bell size={20} className={reminderSettings.enabled ? 'text-cyan-400' : 'text-slate-500'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-base font-bold">Nhắc uống nước</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${reminderSettings.enabled ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' : 'text-slate-500 border-slate-700 bg-slate-800'}`}>
                    {reminderSettings.enabled ? 'Đang bật' : 'Đang tắt'}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${isReminderPermissionGranted ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                    {isReminderPermissionGranted ? 'Có quyền thông báo' : 'Chưa cấp quyền'}
                  </span>
                </div>
              </div>
              <button onClick={() => updateReminderSetting('enabled', !reminderSettings.enabled)} className={`w-10 h-6 rounded-full p-1 transition-colors ${reminderSettings.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${reminderSettings.enabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Bắt đầu</label>
                <input type="time" value={reminderSettings.startTime} onChange={e => updateReminderSetting('startTime', e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Kết thúc</label>
                <input type="time" value={reminderSettings.endTime} onChange={e => updateReminderSetting('endTime', e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Tần suất nhắc</label>
              <select value={reminderSettings.intervalMinutes} onChange={e => updateReminderSetting('intervalMinutes', Number(e.target.value))} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500">
                <option value={45}>Mỗi 45 phút</option><option value={60}>Mỗi 60 phút</option><option value={90}>Mỗi 90 phút</option><option value={120}>Mỗi 2 giờ</option><option value={180}>Mỗi 3 giờ</option>
              </select>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Preview</p>
              <p className="text-sm text-slate-300">{reminderPreview}</p>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleApplyReminderSettings} disabled={isApplyingReminderSettings} className="flex-1 py-3 rounded-xl font-bold text-slate-900 text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                {isApplyingReminderSettings ? 'Đang cập nhật...' : reminderSettings.enabled ? 'Lưu & kích hoạt' : 'Lưu & tắt nhắc'}
              </button>
            </div>
          </div>

          {/* Widget Thời tiết */}
          {isWeatherSynced && (
            <div className={`${card} p-4 flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}><CloudSun size={18} className="text-white" /></div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">{weatherData.location} · {weatherData.temp}°C</p>
                <p className="text-slate-400 text-xs">{weatherData.status} · +500ml mục tiêu để bù nhiệt</p>
              </div>
              <button onClick={syncWeather}><RefreshCw size={14} className="text-slate-500" /></button>
            </div>
          )}

          {/* Widget Lịch trình */}
          {isCalendarSynced && (
            <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Bell size={18} className="text-white flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-bold">{calendarEvents[0]?.title || 'Không có sự kiện'}</p>
                <p className="text-indigo-200 text-xs">{calendarEvents[0]?.time || '--:--'} · Nhớ uống nước trước khi bắt đầu nhé!</p>
              </div>
            </div>
          )}

          {/* Widget Apple Watch */}
          {isWatchConnected && (
            <div className={`${card} p-4 flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><Watch size={18} className="text-blue-400" /></div>
              <div className="flex gap-6">
                <div><p className="text-slate-400 text-[10px] uppercase tracking-wider">Nhịp tim Live</p><p className="text-white font-bold text-lg">{watchData.heartRate} <span className="text-slate-500 text-xs font-normal">BPM</span></p></div>
                <div><p className="text-slate-400 text-[10px] uppercase tracking-wider">Bước đi Live</p><p className="text-white font-bold text-lg">{watchData.steps} <span className="text-slate-500 text-xs font-normal">steps</span></p></div>
              </div>
              <Bluetooth size={14} className="text-blue-400 ml-auto animate-pulse" />
            </div>
          )}

          {/* AUTO-DETECT ACTIVITY CARD */}
          <AutoActivityCard isWatchConnected={isWatchConnected} isCalendarSynced={isCalendarSynced} watchData={watchData} calendarEvents={calendarEvents} currentActivity={currentActivity} setCurrentActivity={setCurrentActivity} />

          {/* Eye rest */}
          <button onClick={() => toast.success("Đã bật chế độ bảo vệ mắt. Hệ thống sẽ nhắc bạn nhìn xa 6 mét trong 20 giây mỗi 20 phút.")} className={`${card} w-full p-5 flex items-center gap-4 active:scale-95 transition-all text-left border-l-4 border-l-violet-500`}>
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0"><Eye size={20} className="text-violet-400" /></div>
            <div className="flex-1"><p className="text-white text-base font-bold">Chế độ 20-20-20</p></div>
            <ShieldCheck size={20} className="text-slate-600" />
          </button>

          {/* Fasting Mode (Premium) */}
          <div className={`${card} w-full p-5 flex flex-col gap-4 border-l-4 ${isFastingMode ? 'border-l-amber-500 bg-amber-500/10' : 'border-l-amber-500/30'}`}>
            <div className="flex items-center gap-4 cursor-pointer" onClick={toggleFastingMode}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isFastingMode ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-slate-800 border border-slate-700'}`}><Coffee size={20} className={isFastingMode ? "text-amber-400" : "text-slate-500"} /></div>
              <div className="flex-1"><div className="flex items-center gap-2"><p className={`text-base font-bold ${isFastingMode ? 'text-amber-400' : 'text-white'}`}>Fasting Tracker</p>{!isPremium && <Lock size={12} className="text-amber-500" />}</div><p className="text-slate-400 text-[10px] mt-1">Chế độ 16:8</p></div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isFastingMode ? 'bg-amber-500' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFastingMode ? 'translate-x-4' : ''}`} /></div>
            </div>
            {isFastingMode && (
              <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <div><p className="text-amber-200/70 text-[10px] uppercase tracking-widest font-bold">Thời gian còn lại</p><p className="text-amber-400 text-xl font-black font-mono mt-1">{String(fastingHours).padStart(2, '0')}:{String(fastingMinutes).padStart(2, '0')}:{String(fastingSeconds).padStart(2, '0')}</p></div>
                <div className="text-right"><p className="text-amber-200/70 text-[10px] uppercase tracking-widest font-bold">Trạng thái</p><p className="text-amber-300 text-sm font-bold mt-1">{fastingRemaining === 0 ? "Hoàn thành!" : "Đang đốt mỡ"}</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}