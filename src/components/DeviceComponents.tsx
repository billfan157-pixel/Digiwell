import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, RefreshCw, LogOut, Droplet, GlassWater, Zap, Lock, ChevronRight } from 'lucide-react';
import { getBatteryIcon, CAPACITY } from './constants';

// ============================================================================
// METRIC MINI COMPONENT
// ============================================================================
export function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-black">{label}</p>
      <p className="text-sm font-black text-white mt-1">{value}</p>
    </div>
  );
}

// ============================================================================
// REALISTIC WATER SURFACE
// ============================================================================
function RealisticWaterSurface({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div className="absolute top-0 left-0 right-0 h-8 overflow-visible">
      {/* Main water surface with elliptical perspective */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-6 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(34, 211, 238, 0.6) 30%, rgba(59, 130, 246, 0.8) 100%)',
          transform: 'perspective(400px) rotateX(75deg)',
          transformOrigin: 'center center',
        }}
        animate={{
          scaleX: [1, 1.02, 1],
          scaleY: [1, 0.98, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Secondary ripple */}
      <motion.div
        className="absolute top-1 left-[10%] right-[10%] h-4 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, rgba(34, 211, 238, 0.4) 50%, transparent 100%)',
          transform: 'perspective(400px) rotateX(75deg)',
        }}
        animate={{
          scaleX: [1, 0.98, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5
        }}
      />
    </div>
  );
}

// ============================================================================
// REALISTIC 3D BOTTLE
// ============================================================================
function RealisticBottle3D({ 
  fillPercentage, 
  isConnected 
}: { 
  fillPercentage: number; 
  isConnected: boolean;
}) {
  return (
    <div 
      className="relative w-full h-full"
      style={{
        perspective: '1000px',
        perspectiveOrigin: 'center center'
      }}
    >
      {/* Bottle container with 3D transform */}
      <div
        className="relative w-full h-full"
        style={{
          transform: 'rotateY(-8deg) rotateX(2deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Bottle cap - realistic sport bottle style */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-14 z-20">
          {/* Cap top */}
          <div className="absolute top-0 left-0 right-0 h-10 rounded-t-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900" />
            {/* Cap threading texture */}
            <div className="absolute inset-x-2 top-2 bottom-2 space-y-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-0.5 bg-slate-600/50 rounded" />
              ))}
            </div>
            {/* Cap highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            <div className="absolute left-2 top-2 bottom-2 w-1 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
          </div>
          
          {/* Cap neck/ring */}
          <div className="absolute bottom-0 left-0 right-0 h-5 rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {/* Ring grooves */}
            <div className="absolute inset-x-0 top-1 h-px bg-slate-700" />
            <div className="absolute inset-x-0 bottom-1 h-px bg-black/30" />
          </div>
        </div>

        {/* Main bottle body - realistic sport bottle proportions */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-[calc(100%-3rem)]">
          {/* Outer glass shell with realistic curvature */}
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
            {/* Base bottle material - translucent plastic/glass */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
              {/* Main body gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200/10 via-slate-300/5 to-slate-400/10" />
              
              {/* Left edge highlight - strong light source from left */}
              <div 
                className="absolute left-0 top-8 bottom-8 w-12 rounded-l-[2rem]"
                style={{
                  background: 'linear-gradient(to right, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 20%, transparent 60%)'
                }}
              />
              
              {/* Center highlight stripe */}
              <div className="absolute left-5 top-12 bottom-12 w-2 bg-gradient-to-b from-transparent via-white/40 to-transparent rounded-full blur-[1px]" />
              
              {/* Right edge shadow - depth */}
              <div 
                className="absolute right-0 top-8 bottom-8 w-16 rounded-r-[2rem]"
                style={{
                  background: 'linear-gradient(to left, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.08) 30%, transparent 70%)'
                }}
              />
              
              {/* Bottom curve shadow */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-20 rounded-b-[2rem]"
                style={{
                  background: 'radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.1) 0%, transparent 60%)'
                }}
              />
            </div>

            {/* Water fill with realistic behavior */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-b-[2rem] overflow-hidden"
              initial={false}
              animate={{ 
                height: `${isConnected ? fillPercentage : 0}%`
              }}
              transition={{ 
                duration: 1.4, 
                ease: [0.19, 1, 0.22, 1]
              }}
            >
              {/* Water body - realistic gradient */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.7) 0%, rgba(34, 211, 238, 0.8) 10%, rgba(59, 130, 246, 0.85) 50%, rgba(37, 99, 235, 0.9) 100%)'
                }}
              />
              
              {/* Water subsurface scattering effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 30% 40%, rgba(96, 165, 250, 0.4) 0%, transparent 60%)',
                  mixBlendMode: 'screen'
                }}
              />
              
              {/* Caustics effect - light patterns through water */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 3%),
                    radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.6) 0%, transparent 4%),
                    radial-gradient(circle at 45% 70%, rgba(255, 255, 255, 0.5) 0%, transparent 3%),
                    radial-gradient(circle at 75% 55%, rgba(255, 255, 255, 0.7) 0%, transparent 2%)
                  `
                }}
                animate={{
                  x: [0, 10, 0],
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              {/* Water surface */}
              <div className="absolute top-0 left-0 right-0">
                <RealisticWaterSurface isActive={isConnected} />
              </div>
              
              {/* Refraction line at water surface */}
              {isConnected && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              )}
            </motion.div>

            {/* Outer glass reflection - post water */}
            <div className="absolute inset-0 rounded-[2rem] pointer-events-none">
              {/* Strong specular highlight */}
              <div 
                className="absolute left-3 top-16 bottom-16 w-3 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.8) 20%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
              
              {/* Secondary highlight */}
              <div 
                className="absolute left-7 top-20 bottom-24 w-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.2) 70%, transparent 100%)',
                  filter: 'blur(1px)'
                }}
              />
              
              {/* Environmental reflection - subtle */}
              <motion.div
                className="absolute right-6 top-20 bottom-20 w-8 rounded-full opacity-30"
                style={{
                  background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 0%, rgba(34, 211, 238, 0.2) 50%, transparent 100%)',
                  filter: 'blur(4px)'
                }}
                animate={{
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </div>

            {/* Glass edge thickness */}
            <div 
              className="absolute inset-0 rounded-[2rem] pointer-events-none"
              style={{
                boxShadow: `
                  inset 0 0 0 1px rgba(255, 255, 255, 0.2),
                  inset 0 0 0 2px rgba(0, 0, 0, 0.05),
                  0 4px 20px rgba(0, 0, 0, 0.15),
                  0 8px 40px rgba(0, 0, 0, 0.1)
                `
              }}
            />
          </div>
        </div>

        {/* Bottle base - realistic ground contact */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8">
          <div className="absolute inset-0 rounded-b-[2rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-slate-900/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>

        {/* Floor shadow */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-3 rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)',
            filter: 'blur(3px)'
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// BOTTLE VISUALIZER (MAIN COMPONENT)
// ============================================================================
export function BottleVisualizer({
  isConnected,
  currentVolume,
  capacity,
  fillPercentage,
  equippedBottle
}: {
  isConnected: boolean;
  currentVolume: number;
  capacity: number;
  fillPercentage: number;
  equippedBottle: any;
}) {
  const skinUrl = isConnected && (equippedBottle?.image_url || (equippedBottle?.meta_value && equippedBottle.meta_value.startsWith('http'))) 
    ? (equippedBottle.image_url || equippedBottle.meta_value) 
    : null;
  const hasSkin = !!skinUrl;

  return (
    <div className="flex justify-center items-center py-4 relative h-[300px]">
      {/* Ambient light - subtle */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            key="ambient-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Soft ambient glow */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                filter: 'blur(40px)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bottle */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateY: -15 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          rotateY: 0
        }}
        transition={{ 
          duration: 1, 
          ease: [0.16, 1, 0.3, 1]
        }}
        className="relative w-44 h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {hasSkin ? (
          // Custom skin bottle
          <div className="relative w-full h-full">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                maskImage: `url(${skinUrl})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center bottom',
                WebkitMaskImage: `url(${skinUrl})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center bottom',
              }}
              initial={false}
              animate={{ 
                height: `${isConnected ? fillPercentage : 0}%`
              }}
              transition={{ 
                duration: 1.4, 
                ease: [0.19, 1, 0.22, 1]
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-300" />
            </motion.div>
            
            <img 
              src={skinUrl} 
              alt={equippedBottle.name} 
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3)) drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
              }}
            />
          </div>
        ) : (
          <RealisticBottle3D fillPercentage={fillPercentage} isConnected={isConnected} />
        )}

        {/* Volume display overlay */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {/* Volume number */}
          <motion.div
            key={currentVolume}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className="text-4xl font-black text-white tracking-tighter tabular-nums"
            style={{
              textShadow: `
                0 2px 8px rgba(0, 0, 0, 0.5),
                0 4px 16px rgba(0, 0, 0, 0.3),
                0 0 30px rgba(59, 130, 246, 0.3)
              `
            }}
          >
            {isConnected ? currentVolume : 0}
          </motion.div>
          
          {/* Capacity */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-1 text-xs font-bold text-cyan-100 tracking-wide"
            style={{
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            / {capacity} ml
          </motion.div>

          {/* Percentage badge */}
          {isConnected && fillPercentage > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring", bounce: 0.4 }}
              className="mt-3 px-3 py-1 rounded-full backdrop-blur-md"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
              }}
            >
              <span className="text-[10px] font-black text-cyan-300 tracking-wider">
                {Math.round(fillPercentage)}%
              </span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Status indicator */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, type: "spring" }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{
              boxShadow: '0 0 6px rgba(52, 211, 153, 0.8)'
            }}
          />
          <span className="text-[10px] font-black text-emerald-300 tracking-wider uppercase">
            Connected
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// DEVICE HERO COMPONENT
// ============================================================================
export function DeviceHero({
  isConnected, isSyncing, fillPercentage, currentVolume, batteryLevel, signalStrength, latencyMs, temperature, onConnect, onDisconnect, equippedBottle
}: {
  isConnected: boolean; isSyncing: boolean; fillPercentage: number; currentVolume: number; batteryLevel: number; signalStrength: number; latencyMs: number; temperature: number; onConnect: () => void; onDisconnect: () => void; equippedBottle: any;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-[1.75rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl p-4 overflow-hidden relative">
        <div className="absolute -right-10 top-0 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70 font-black">Live Link</p>
            <h2 className="text-lg font-black text-white mt-2">{isConnected ? 'Bottle Core đang online' : 'Thiết bị đang chờ ghép nối'}</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-[17rem]">{isConnected ? 'BLE tunnel ổn định, cảm biến đang stream dữ liệu.' : 'Bật Bluetooth và kết nối bình để kích hoạt.'}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${isConnected ? 'bg-cyan-500/12 border-cyan-400/30 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
            <Bluetooth size={24} className={isSyncing ? 'animate-pulse' : ''} />
          </div>
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-3">
          {!isConnected ? (
            <button onClick={onConnect} disabled={isSyncing} className="px-5 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black shadow-[0_0_25px_rgba(34,211,238,0.35)] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2">
              {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Bluetooth size={18} />}
              {isSyncing ? 'Đang bắt tay BLE...' : 'Connect Bottle'}
            </button>
          ) : (
            <button onClick={onDisconnect} className="px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-300 font-black active:scale-95 transition-all flex items-center gap-2">
              <LogOut size={18} /> Disconnect
            </button>
          )}
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 font-black">
            <span className="inline-flex items-center gap-2">
              {getBatteryIcon(batteryLevel)} Link Quality {isConnected ? `${signalStrength}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-slate-900/75 border border-white/10 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-black">Bottle Core</span>
          <span className="text-[11px] font-black text-cyan-300">{latencyMs > 0 ? `${latencyMs}ms` : '--'}</span>
        </div>
        <BottleVisualizer isConnected={isConnected} currentVolume={currentVolume} capacity={CAPACITY} fillPercentage={fillPercentage} equippedBottle={equippedBottle} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MetricMini label="Pin" value={`${batteryLevel}%`} />
          <MetricMini label="Nhiệt" value={`${temperature}°C`} />
          <MetricMini label="BLE" value={isConnected ? `${signalStrength}%` : '--'} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTROL DECK COMPONENT
// ============================================================================
export function ControlDeck({
  isConnected, isSyncing, onDrink, onRefill, onForceSync,
}: {
  isConnected: boolean; isSyncing: boolean; onDrink: (amount: number) => void; onRefill: () => void; onForceSync: () => void;
}) {
  const controls = [
    { id: 'sip-50', label: '+50ml', sub: 'Sip', icon: <Droplet size={22} />, accent: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20', onClick: () => onDrink(50) },
    { id: 'sip-250', label: '+250ml', sub: 'Drink', icon: <GlassWater size={22} />, accent: 'text-blue-300 bg-blue-500/10 border-blue-400/20', onClick: () => onDrink(250) },
    { id: 'refill', label: 'Đổ đầy', sub: 'Refill', icon: <RefreshCw size={22} />, accent: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20', onClick: onRefill },
    { id: 'sync', label: 'Force Sync', sub: 'Sync', icon: <Zap size={22} />, accent: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-400/20', onClick: onForceSync },
  ];

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-black">Quick Controls</p>
          <h3 className="text-lg font-black text-white mt-1">Điều khiển nhanh</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-black">{isConnected ? 'Live' : 'Offline'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {controls.map(control => (
          <motion.button key={control.id} whileTap={{ scale: 0.97 }} disabled={!isConnected || isSyncing} onClick={control.onClick} className={`rounded-[1.5rem] border p-3.5 text-left transition-all disabled:opacity-45 disabled:cursor-not-allowed ${control.accent}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 bg-slate-950/35">{control.icon}</div>
              <ChevronRight size={18} className="text-white/40" />
            </div>
            <p className="text-base font-black text-white">{control.label}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-[0.18em]">{control.sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ARENA PAYWALL COMPONENT
// ============================================================================
export const ArenaPaywall = () => (
  <div className="relative h-[55vh] rounded-[2rem] overflow-hidden border border-white/5 mx-4 flex items-center justify-center mt-4">
    <div className="absolute inset-0 p-4 space-y-4 blur-[6px] opacity-40 pointer-events-none select-none flex flex-col">
      {[1, 2, 3].map((index) => (<div key={index} className="h-24 bg-slate-800 rounded-3xl border border-slate-700" />))}
    </div>
    <div className="relative z-10 flex flex-col items-center text-center p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl mx-4 w-full max-w-[320px]">
      <div className="w-20 h-20 bg-purple-500/20 rounded-[1.5rem] flex items-center justify-center mb-5 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        <Lock size={36} className="text-purple-400" />
      </div>
      <h3 className="text-2xl font-black text-white mb-3">Đấu trường bị khóa!</h3>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed">Kết nối DigiBottle để mở khóa thử thách PvP và phần thưởng.</p>
      <button onClick={() => window.open('https://digiwell.com/buy', '_blank')} className="w-full py-4 rounded-2xl font-black text-slate-950 text-sm bg-gradient-to-r from-purple-400 to-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all">
        Mua DigiBottle ngay
      </button>
    </div>
  </div>
);