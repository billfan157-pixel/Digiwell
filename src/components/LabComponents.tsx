import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BatteryFull, Gauge, Thermometer, Wifi, Cpu, Waves, Heart, Sparkles, Zap, Lock, FlaskConical, Download, Bug, Activity } from 'lucide-react';
import type { LedPattern, RuleTrigger, RuleAction, AutomationRule } from './types';
import { ledColors, ruleTriggerLabel, ruleActionLabel, buildRuleDescription } from './constants';

export function MetricCard({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: string; hint: string; accent: 'cyan' | 'violet' | 'amber' | 'emerald'; }) {
  const accentClass = accent === 'cyan' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20' : accent === 'violet' ? 'text-violet-300 bg-violet-500/10 border-violet-400/20' : accent === 'amber' ? 'text-amber-300 bg-amber-500/10 border-amber-400/20' : 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20';
  return (
    <div className={`min-w-[10.75rem] snap-start rounded-[1.35rem] border p-4 ${accentClass}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="w-10 h-10 rounded-2xl border border-white/10 bg-slate-950/35 flex items-center justify-center">{icon}</div>
        <Sparkles size={14} className="text-white/35" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-black">{label}</p>
      <p className="text-2xl font-black text-white mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-2">{hint}</p>
    </div>
  );
}

export function SensorWaveChart({ series, isConnected }: { series: number[]; isConnected: boolean }) {
  const width = 640; const height = 180;
  const points = series.map((value, index) => `${(index / Math.max(series.length - 1, 1)) * width},${height - (value / 100) * (height - 18) - 9}`).join(' ');
  return (
    <div className="rounded-[1.35rem] overflow-hidden border border-white/5 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs><linearGradient id="sensor-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
        {Array.from({ length: 4 }).map((_, index) => (<line key={`grid-${index}`} x1="0" x2={width} y1={(height / 4) * (index + 1)} y2={(height / 4) * (index + 1)} stroke="rgba(148,163,184,0.14)" strokeDasharray="6 8" />))}
        <polyline fill="none" stroke="url(#sensor-line)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={points} />
      </svg>
      <div className="flex flex-col gap-2 px-4 py-3 border-t border-white/5 text-xs">
        <div className="flex items-center gap-2 text-slate-300"><Activity size={14} className={isConnected ? 'text-cyan-300' : 'text-slate-500'} /><span>{isConnected ? 'Sensor stream live' : 'Waiting for bottle motion'}</span></div>
      </div>
    </div>
  );
}

interface DiagnosticsPanelProps {
  isConnected: boolean;
  batteryLevel: number;
  batteryHealth: number;
  batteryCycleCount: number;
  latencyMs: number;
  rawSensorSeries: number[];
  temperature: number;
  signalStrength: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function DiagnosticsPanel({ isConnected, batteryLevel, batteryHealth, batteryCycleCount, latencyMs, rawSensorSeries, temperature, signalStrength, isOpen, onToggle }: DiagnosticsPanelProps) {
  return (
    <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70 font-black">Diagnostics</p><h3 className="text-lg font-black text-white mt-1">Thiết bị & cảm biến</h3></div>
        <div className="flex items-center gap-2 shrink-0"><div className={`px-3 py-2 rounded-full text-[11px] font-black border ${isConnected ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{isConnected ? 'Live' : 'Offline'}</div><motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.div></div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-4 snap-x snap-mandatory scrollbar-hide">
                <MetricCard icon={<BatteryFull size={18} />} label="Health" value={`${batteryHealth}%`} hint={`Cycles ${batteryCycleCount}`} accent="cyan" />
                <MetricCard icon={<Gauge size={18} />} label="Latency" value={latencyMs > 0 ? `${latencyMs}ms` : '--'} hint="BLE round-trip" accent="violet" />
                <MetricCard icon={<Thermometer size={18} />} label="Temp" value={`${temperature}°C`} hint="Sensor board" accent="amber" />
                <MetricCard icon={<Wifi size={18} />} label="Signal" value={`${signalStrength}%`} hint={`Pin ${batteryLevel}%`} accent="emerald" />
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                <div className="flex flex-col gap-1 mb-3"><div className="flex items-center gap-2"><Cpu size={16} className="text-cyan-300" /><span className="text-sm font-black text-white">Raw Sensor</span></div></div>
                <SensorWaveChart series={rawSensorSeries} isConnected={isConnected} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LedPatternStudioProps {
  ledColor: string;
  setLedColor: React.Dispatch<React.SetStateAction<string>>;
  ledPattern: LedPattern;
  setLedPattern: React.Dispatch<React.SetStateAction<LedPattern>>;
  heartRate: number;
  isWatchConnected: boolean;
  isConnected: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function LedPatternStudio({ ledColor, setLedColor, ledPattern, setLedPattern, heartRate, isWatchConnected, isConnected, isOpen, onToggle }: LedPatternStudioProps) {
  const previewDuration = ledPattern === 'heart-sync' && heartRate > 0 ? Math.max(0.35, 60 / heartRate) : ledPattern === 'strobe' ? 0.5 : ledPattern === 'wave' ? 1.8 : 2.4;
  const patterns: { id: LedPattern; name: string; hint: string }[] = [ { id: 'breathe', name: 'Breathe', hint: 'Glow mềm theo nhịp thở' }, { id: 'wave', name: 'Wave', hint: 'Sóng sáng chạy quanh thân bình' }, { id: 'strobe', name: 'Strobe', hint: 'Nháy gắt để kéo sự chú ý' }, { id: 'heart-sync', name: 'Heart Sync', hint: 'Đập theo nhịp tim từ Apple Watch' } ];
  return (
    <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.28em] text-fuchsia-300/70 font-black">LED Studio</p><h3 className="text-lg font-black text-white mt-1">Bottle Aura</h3></div>
        <div className="flex items-center gap-2 shrink-0"><div className="px-3 py-2 rounded-full text-[11px] font-black border bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-300">{isConnected ? 'Ready' : 'Preview'}</div><motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.div></div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-4 snap-x snap-mandatory scrollbar-hide">
                {patterns.map(p => ( <button key={p.id} disabled={p.id === 'heart-sync' && !isWatchConnected} onClick={() => setLedPattern(p.id)} className={`min-w-[12rem] snap-start rounded-[1.5rem] p-4 border text-left transition-all ${ledPattern === p.id ? 'border-fuchsia-400/40 bg-fuchsia-500/10' : 'border-white/10 bg-slate-950/30'}`}><div className="flex justify-between mb-3"><Waves size={18} className="text-fuchsia-300" /></div><p className="text-sm font-black text-white">{p.name}</p></button> ))}
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 mb-4">
                <p className="text-sm font-black text-white mb-3">Color Bank</p>
                <div className="flex gap-2 overflow-x-auto pb-1"><div className="flex gap-2">{ledColors.map(c => (<button key={c.value} onClick={() => setLedColor(c.value)} className="shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/10 bg-white/5"><span className="w-5 h-5 rounded-full" style={{ backgroundColor: c.value }}/></button>))}</div></div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                <motion.div animate={{ boxShadow: [`0 0 0px ${ledColor}`, `0 0 35px ${ledColor}`, `0 0 0px ${ledColor}`] }} transition={{ repeat: Infinity, duration: previewDuration }} className="h-36 rounded-[2rem] border border-white/10 bg-slate-900 flex items-center justify-center relative"><motion.div className="w-28 h-28 rounded-full border border-white/10 bg-slate-950/40 flex items-center justify-center"><Sparkles size={30} style={{ color: ledColor }} /></motion.div></motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AutomationCenterProps {
  ruleTrigger: RuleTrigger;
  setRuleTrigger: React.Dispatch<React.SetStateAction<RuleTrigger>>;
  ruleAction: RuleAction;
  setRuleAction: React.Dispatch<React.SetStateAction<RuleAction>>;
  ruleTime: string;
  setRuleTime: React.Dispatch<React.SetStateAction<string>>;
  ruleThreshold: number;
  setRuleThreshold: React.Dispatch<React.SetStateAction<number>>;
  addAutomationRule: () => void;
  rules: Array<AutomationRule & { status?: string }>;
  setRules: React.Dispatch<React.SetStateAction<AutomationRule[]>>;
  weatherData?: any;
  isWeatherSynced: boolean;
  fillPercentage: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function AutomationCenter({
  ruleTrigger, setRuleTrigger, ruleAction, setRuleAction, ruleTime, setRuleTime, ruleThreshold, setRuleThreshold, addAutomationRule, rules, setRules, weatherData, isWeatherSynced, fillPercentage, isOpen, onToggle
}: AutomationCenterProps) {
  return (
    <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/70 font-black">Automation</p>
          <h3 className="text-lg font-black text-white mt-1">Smart Rules</h3>
          <p className="text-sm text-slate-400 mt-1 truncate">Tự động hóa thiết bị theo điều kiện</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-full text-[11px] font-black border bg-amber-500/10 border-amber-400/20 text-amber-300">
            {rules.filter(rule => rule.status === 'Triggered').length} firing
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-slate-400" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 mb-4">
                <p className="text-sm font-black text-white mb-4">Rule Composer</p>
                <div className="space-y-3 mb-3">
                  <label className="space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-black">Kích hoạt khi</span>
                    <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value as RuleTrigger)} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/35">
                      <option value="goal_time">Qua mốc giờ mà chưa đạt mục tiêu</option>
                      <option value="weather_temp">Nhiệt độ ngoài trời quá cao</option>
                      <option value="low_battery">Pin xuống thấp</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-black">Hành động</span>
                    <select value={ruleAction} onChange={(e) => setRuleAction(e.target.value as RuleAction)} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/35">
                      <option value="red_strobe">Nháy đỏ liên tục</option>
                      <option value="boost_reminders">Nhắc mỗi 30 phút</option>
                      <option value="cyan_wave">Chạy sóng cyan</option>
                      <option value="power_save">Bật chế độ tiết kiệm</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-3 mb-4">
                  <label className="space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-black">
                      {ruleTrigger === 'goal_time' ? 'Mốc giờ' : 'Ngưỡng'}
                    </span>
                    {ruleTrigger === 'goal_time' ? (
                      <input value={ruleTime} onChange={(e) => setRuleTime(e.target.value)} type="time" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/35" />
                    ) : (
                      <input value={ruleThreshold} onChange={(e) => setRuleThreshold(Number(e.target.value))} type="number" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/35" />
                    )}
                  </label>
                  <label className="space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-black">
                      {ruleTrigger === 'goal_time' ? 'Mục tiêu cần đạt %' : ruleTrigger === 'weather_temp' ? 'Ngưỡng nhiệt độ °C' : 'Ngưỡng pin %'}
                    </span>
                    <input value={ruleThreshold} onChange={(e) => setRuleThreshold(Number(e.target.value))} type="number" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/35" />
                  </label>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/15 px-4 py-3 text-sm text-cyan-100">
                  <span className="font-black uppercase tracking-[0.24em] text-[11px] text-cyan-300">Preview</span>
                  <p className="mt-2">{buildRuleDescription(ruleTrigger, ruleAction, ruleTime, ruleThreshold)}</p>
                </div>
                <button onClick={addAutomationRule} className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black active:scale-95 transition-all shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                  Thêm luật vào Automation Engine
                </button>
              </div>
              <div className="grid gap-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-300" />
                          <p className="text-sm font-black text-white">{ruleTriggerLabel[rule.trigger]}</p>
                        </div>
                        <p className="text-sm text-slate-300 mt-2">{rule.description}</p>
                      </div>
                      <button onClick={() => setRules((prev: AutomationRule[]) => prev.map(item => item.id === rule.id ? { ...item, active: !item.active } : item))} className={`self-start px-3 py-2 rounded-full text-[11px] font-black border ${rule.status === 'Triggered' ? 'bg-rose-500/10 border-rose-400/20 text-rose-300' : rule.active ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {rule.status}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
                      <span>Realtime: {rule.trigger === 'weather_temp' ? isWeatherSynced ? `${weatherData?.temp ?? '--'}°C ngoài trời` : 'Chưa sync weather' : `Hydration tank ${Math.round(fillPercentage)}%`}</span>
                      <span>{ruleActionLabel[rule.action]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DeveloperModePanelProps {
  isUnlocked: boolean;
  syncLogs: any[];
  onCalibration: () => void;
  onExportLogs: () => void;
  firmwareVersion: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function DeveloperModePanel({ isUnlocked, syncLogs, onCalibration, onExportLogs, firmwareVersion, isOpen, onToggle }: DeveloperModePanelProps) {
  return (
    <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.28em] text-emerald-300/70 font-black">Developer</p><h3 className="text-lg font-black text-white mt-1">Dev Toolkit</h3></div>
        <div className="flex items-center gap-2 shrink-0"><motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.div></div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              {!isUnlocked ? (
                <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/35 p-5 text-center"><Lock size={28} className="text-slate-500 mx-auto mb-3" /><p className="text-white font-black">Firmware {firmwareVersion}</p></div>
              ) : (
                <div className="space-y-3">
                  <button onClick={onCalibration} className="w-full rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4 text-left active:scale-95"><p className="text-base font-black text-white">Zero Calibration</p></button>
                  <button onClick={onExportLogs} className="w-full rounded-[1.5rem] border border-cyan-400/20 bg-cyan-500/10 p-4 text-left active:scale-95"><p className="text-base font-black text-white">Export Log</p></button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DeviceConsoleProps {
  syncLogs: any[];
  isOpen: boolean;
  onToggle: () => void;
}

export function DeviceConsole({ syncLogs, isOpen, onToggle }: DeviceConsoleProps) {
  return (
    <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-black">Console</p><h3 className="text-lg font-black text-white mt-1">Event Logs</h3></div>
        <div className="flex items-center gap-2 shrink-0"><motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.div></div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="space-y-3">
                {[...syncLogs].reverse().slice(0, 5).map((log: any) => (
                  <div key={log.id} className="rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-4 flex flex-col gap-2">
                    <p className="text-sm font-black text-white">{log.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}