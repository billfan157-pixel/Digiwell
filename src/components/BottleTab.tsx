import React, { useEffect, useMemo, useState } from 'react';
import { GlassWater } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ArenaTab from '../tabs/ArenaTab';

import type { ActiveView, LabSectionKey, LedPattern, RuleTrigger, RuleAction, AutomationRule } from './types';
import { CAPACITY, FIRMWARE_VERSION, LAB_BUILD, ledColors, createPresetRules, buildRuleDescription } from './constants';
import { DeviceHero, ControlDeck, ArenaPaywall } from './DeviceComponents';
import { DiagnosticsPanel, LedPatternStudio, AutomationCenter, DeveloperModePanel, DeviceConsole } from './LabComponents';

export default function BottleTab({
  profile,
  weatherData,
  isWeatherSynced,
  watchData,
  isWatchConnected,
  smartBottle,
}: {
  profile?: any;
  weatherData?: any;
  isWeatherSynced?: boolean;
  watchData?: any;
  isWatchConnected?: boolean;
  smartBottle: any;
}) {
  const [activeView, setActiveView] = useState<ActiveView>('lab');
  const [ledColor, setLedColor] = useState(ledColors[0].value);
  const [ledPattern, setLedPattern] = useState<LedPattern>('breathe');
  const [rules, setRules] = useState<AutomationRule[]>(createPresetRules);
  const [openSection, setOpenSection] = useState<LabSectionKey | null>('diagnostics');
  const [ruleTrigger, setRuleTrigger] = useState<RuleTrigger>('goal_time');
  const [ruleAction, setRuleAction] = useState<RuleAction>('red_strobe');
  const [ruleTime, setRuleTime] = useState('14:00');
  const [ruleThreshold, setRuleThreshold] = useState(50);
  const [firmwareTapCount, setFirmwareTapCount] = useState(0);
  const [isDeveloperUnlocked, setIsDeveloperUnlocked] = useState(false);
  const [latencyMs, setLatencyMs] = useState(12);
  const [rawSensorSeries, setRawSensorSeries] = useState<number[]>(
    Array.from({ length: 36 }, (_, index) => 48 + Math.sin(index / 3) * 9),
  );

  const {
    isConnected,
    metrics,
    syncLogs,
    connectDevice,
    disconnectDevice,
    handleDrinkEvent,
    refillBottle,
    forceSync,
    isSyncing,
    equippedBottle,
  } = smartBottle;

  const batteryLevel = metrics?.batteryLevel ?? 0;
  const signalStrength = metrics?.signalStrength ?? 0;
  const temperature = metrics?.temperature ?? weatherData?.temp ?? 24;
  const currentVolume = metrics?.currentVolume ?? CAPACITY;
  const fillPercentage = Math.min(100, Math.max(0, (currentVolume / CAPACITY) * 100));
  const heartRate = isWatchConnected ? watchData?.heartRate || 0 : 0;
  const batteryCycleCount = useMemo(() => 124 + syncLogs.filter((log: any) => log.action === 'refill').length * 2, [syncLogs]);
  const batteryHealth = useMemo(
    () => Math.max(82, 100 - Math.floor(batteryCycleCount / 16) - Math.floor((100 - batteryLevel) / 12)),
    [batteryCycleCount, batteryLevel],
  );

  const automationSummary = useMemo(() => {
    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

    return rules.map((rule) => {
      let status = 'Armed';
      if (!rule.active) status = 'Paused';
      if (rule.trigger === 'goal_time' && currentTime >= rule.time && fillPercentage < rule.threshold) status = 'Triggered';
      if (rule.trigger === 'weather_temp' && Number(weatherData?.temp || 0) > rule.threshold) status = 'Triggered';
      if (rule.trigger === 'low_battery' && batteryLevel < rule.threshold) status = 'Triggered';
      return { ...rule, status };
    });
  }, [rules, fillPercentage, weatherData?.temp, batteryLevel]);

  useEffect(() => {
    if (!isConnected) {
      setLatencyMs(0);
      setRawSensorSeries(Array.from({ length: 36 }, (_, index) => 42 + Math.cos(index / 4) * 5));
      return;
    }

    const intervalId = window.setInterval(() => {
      const phase = Date.now() / 240;
      const base = 46 + (signalStrength / 100) * 16;
      const nextPoint = Math.max(
        8,
        Math.min(
          92,
          base + Math.sin(phase) * 16 + Math.cos(phase / 2.1) * 10 + (Math.random() * 8 - 4),
        ),
      );

      setRawSensorSeries(prev => [...prev.slice(-35), Number(nextPoint.toFixed(2))]);
      setLatencyMs(Math.max(7, Math.round(8 + (100 - signalStrength) / 4 + Math.random() * 6)));
    }, 900);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isConnected, signalStrength]);

  const playPourSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2166/2166-preview.mp3');
      audio.volume = 0.6;
      audio.play();
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  const addAutomationRule = () => {
    const nextRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      trigger: ruleTrigger,
      action: ruleAction,
      active: true,
      time: ruleTime,
      threshold: ruleThreshold,
      description: buildRuleDescription(ruleTrigger, ruleAction, ruleTime, ruleThreshold),
    };

    setRules((prev: AutomationRule[]) => [nextRule, ...prev]);
    toast.success('Đã thêm luật tự động mới vào Bottle Pro.');
  };

  const handleFirmwareTap = () => {
    if (isDeveloperUnlocked) return;

    const nextCount = firmwareTapCount + 1;
    setFirmwareTapCount(nextCount);

    if (nextCount >= 7) {
      setIsDeveloperUnlocked(true);
      toast.success('Developer Mode đã mở. Calibration và Export Log đã sẵn sàng.');
      return;
    }

    toast.message(`Còn ${7 - nextCount} lần chạm để mở Developer Mode.`);
  };

  const handleExportLogs = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      firmware: FIRMWARE_VERSION,
      profile_id: profile?.id,
      metrics,
      diagnostics: {
        batteryHealth,
        batteryCycleCount,
        latencyMs,
        rawSensorSeries,
      },
      ledStudio: {
        ledColor,
        ledPattern,
      },
      automations: automationSummary,
      syncLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `digiwell-bottle-log-${Date.now()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    toast.success('Đã xuất file log cho đội dev.');
  };

  const handleCalibration = () => {
    toast.success('Zero calibration thành công. Offset cảm biến đã được reset.');
  };

  const toggleSection = (section: LabSectionKey) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300 pb-10 space-y-4">
      <div className="px-4 pt-4">
        <div className="rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))] shadow-[0_18px_50px_rgba(8,47,73,0.26)] overflow-hidden">
          <div className="p-5 border-b border-white/10 flex flex-col gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/75 font-black mb-2">Bottle Pro Lab</p>
              <h1 className="text-[1.75rem] leading-tight font-black text-white flex items-center gap-3">
                Advanced Control Center
                <GlassWater size={24} className="text-cyan-300" />
              </h1>
              <p className="text-sm text-slate-300/80 mt-3 max-w-[18rem]">
                Trung tâm điều khiển DigiBottle với telemetry, LED, automation và công cụ kỹ thuật.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={handleFirmwareTap}
                className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black tracking-[0.18em] text-slate-300 hover:border-cyan-400/40 transition-colors"
              >
                {FIRMWARE_VERSION}
              </button>
              <p className="text-[11px] text-slate-400 mt-3">{LAB_BUILD}</p>
              <p className="text-[11px] text-cyan-300/70 mt-1">
                {isDeveloperUnlocked ? 'Developer Mode Online' : firmwareTapCount > 0 ? `${7 - firmwareTapCount} taps left` : 'Hidden dev access'}
              </p>
            </div>
          </div>

          <div className="px-3 py-3 flex items-center gap-2 bg-slate-950/45">
            <button
              onClick={() => setActiveView('lab')}
              className={`flex-1 py-2.5 text-sm font-black rounded-2xl transition-all ${
                activeView === 'lab'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Phòng Lab
            </button>
            <button
              onClick={() => setActiveView('arena')}
              className={`flex-1 py-2.5 text-sm font-black rounded-2xl transition-all ${
                activeView === 'arena'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.18)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Đấu trường
            </button>
          </div>
        </div>
      </div>

      {activeView === 'lab' && (
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 px-4">
          <DeviceHero
            isConnected={isConnected}
            isSyncing={isSyncing}
            fillPercentage={fillPercentage}
            currentVolume={currentVolume}
            batteryLevel={batteryLevel}
            signalStrength={signalStrength}
            latencyMs={latencyMs}
            temperature={temperature}
            onConnect={connectDevice}
            onDisconnect={disconnectDevice}
            equippedBottle={equippedBottle}
          />

          <ControlDeck
            isConnected={isConnected}
            isSyncing={isSyncing}
            onDrink={(amount: number) => {
              if (navigator.vibrate) navigator.vibrate(50);
              playPourSound();
              void handleDrinkEvent(amount);
            }}
            onRefill={() => {
              if (navigator.vibrate) navigator.vibrate(100);
              playPourSound();
              void refillBottle();
            }}
            onForceSync={() => void forceSync()}
          />

          <DiagnosticsPanel
            isConnected={isConnected}
            batteryLevel={batteryLevel}
            batteryHealth={batteryHealth}
            batteryCycleCount={batteryCycleCount}
            latencyMs={latencyMs}
            rawSensorSeries={rawSensorSeries}
            temperature={temperature}
            signalStrength={signalStrength}
            isOpen={openSection === 'diagnostics'}
            onToggle={() => toggleSection('diagnostics')}
          />

          <LedPatternStudio
            ledColor={ledColor}
            setLedColor={setLedColor}
            ledPattern={ledPattern}
            setLedPattern={setLedPattern}
            heartRate={heartRate}
            isWatchConnected={!!isWatchConnected}
            isConnected={isConnected}
            isOpen={openSection === 'led'}
            onToggle={() => toggleSection('led')}
          />

          <AutomationCenter
            ruleTrigger={ruleTrigger}
            setRuleTrigger={setRuleTrigger}
            ruleAction={ruleAction}
            setRuleAction={setRuleAction}
            ruleTime={ruleTime}
            setRuleTime={setRuleTime}
            ruleThreshold={ruleThreshold}
            setRuleThreshold={setRuleThreshold}
            addAutomationRule={addAutomationRule}
            rules={automationSummary}
            setRules={setRules}
            weatherData={weatherData}
            isWeatherSynced={!!isWeatherSynced}
            fillPercentage={fillPercentage}
            isOpen={openSection === 'automation'}
            onToggle={() => toggleSection('automation')}
          />

          <DeveloperModePanel
            isUnlocked={isDeveloperUnlocked}
            syncLogs={syncLogs}
            onCalibration={handleCalibration}
            onExportLogs={handleExportLogs}
            firmwareVersion={FIRMWARE_VERSION}
            isOpen={openSection === 'developer'}
            onToggle={() => toggleSection('developer')}
          />

          <DeviceConsole syncLogs={syncLogs} isOpen={openSection === 'console'} onToggle={() => toggleSection('console')} />
        </motion.div>
      )}

      {activeView === 'arena' && (
        <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
          {!isConnected ? <ArenaPaywall /> : <ArenaTab profile={profile} />}
        </motion.div>
      )}
    </div>
  );
}
