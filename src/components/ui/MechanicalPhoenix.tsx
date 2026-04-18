import React from 'react';

const MechanicalPhoenix = ({ progress }: { progress: number }) => {
  const safeProgress = Math.round(progress);
  const isLow = safeProgress < 30;
  const isHigh = safeProgress >= 70;

  const coreColor = isLow ? '#ef4444' : isHigh ? '#0ea5e9' : '#f59e0b';
  const wingColor = isLow ? '#7f1d1d' : isHigh ? '#0284c7' : '#b45309';
  const auraColor = isLow ? 'rgba(239, 68, 68, 0.4)' : isHigh ? 'rgba(14, 165, 233, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      {/* Glowing Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-lg ${isLow ? 'animate-pulse' : 'animate-[pulse_2s_ease-in-out_infinite]'}`} 
        style={{ backgroundColor: auraColor, transform: 'scale(0.8)' }}
      ></div>
      
      <svg viewBox="0 0 100 100" className={`w-full h-full relative z-10 drop-shadow-2xl ${isHigh ? 'animate-[bounce_3s_infinite]' : 'animate-[bounce_2s_infinite]'}`}>
        <defs>
          <linearGradient id={`wingGrad-${safeProgress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wingColor} />
            <stop offset="100%" stopColor={coreColor} />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <path d="M45,70 L50,95 L55,70 Z" fill={`url(#wingGrad-${safeProgress})`} className="animate-pulse" filter="url(#neonGlow)"/>
        <path d="M40,50 L5,20 L20,55 L0,60 L35,65 Z" fill="none" stroke={coreColor} strokeWidth="2.5" strokeLinejoin="round" filter="url(#neonGlow)"/>
        <path d="M40,50 L15,35 L25,50 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <path d="M60,50 L95,20 L80,55 L100,60 L65,65 Z" fill="none" stroke={coreColor} strokeWidth="2.5" strokeLinejoin="round" filter="url(#neonGlow)"/>
        <path d="M60,50 L85,35 L75,50 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <polygon points="50,35 62,50 50,68 38,50" fill={`url(#wingGrad-${safeProgress})`} stroke="#fff" strokeWidth="1" filter="url(#neonGlow)"/>
        <path d="M42,35 L50,10 L58,35 Z" fill={`url(#wingGrad-${safeProgress})`} />
        <path d="M48,25 L50,5 L52,25 Z" fill="#fff" className="animate-pulse"/>
        <circle cx="50" cy="28" r="2.5" fill="#fff" className="animate-ping" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" filter="url(#neonGlow)" className="animate-pulse" />
      </svg>
    </div>
  );
};

export default MechanicalPhoenix;