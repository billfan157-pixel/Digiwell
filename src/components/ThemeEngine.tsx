import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

// ============================================================================
// COMPONENT: THEME ENGINE (GHI ĐÈ CSS TOÀN CỤC BẰNG THUẬT TOÁN)
// ============================================================================
export default function ThemeEngine({ profile }: { profile: any }) {
  const { settings } = useSettings(profile);
  const [themeColor, setThemeColor] = useState(settings?.themeColor || '#06b6d4');

  useEffect(() => {
    if (settings?.themeColor) {
      setThemeColor(settings.themeColor);
    }
  }, [settings?.themeColor]);

  useEffect(() => {
    if (!profile?.id) return;
    const checkColor = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profile.id}`) || '{}');
        if (prefs.themeColor && prefs.themeColor !== themeColor) {
          setThemeColor(prefs.themeColor);
        }
      } catch(e) {}
    };
    const interval = setInterval(checkColor, 300);
    return () => clearInterval(interval);
  }, [profile?.id, themeColor]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '6 182 212';
  };

  const themeRgb = hexToRgb(themeColor);

  if (themeColor === '#06b6d4') {
    return <style>{`:root { --color-primary: #06b6d4 !important; }`}</style>;
  }

  const opacities = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95];
  let opacityCss = '';
  opacities.forEach(op => {
    const alpha = op / 100;
    opacityCss += `
      .bg-cyan-500\\/${op}, .dark .dark\\:bg-cyan-500\\/${op} { background-color: rgb(${themeRgb} / ${alpha}) !important; }
      .bg-cyan-400\\/${op}, .dark .dark\\:bg-cyan-400\\/${op} { background-color: rgb(${themeRgb} / ${alpha}) !important; }
      .border-cyan-500\\/${op}, .dark .dark\\:border-cyan-500\\/${op} { border-color: rgb(${themeRgb} / ${alpha}) !important; }
      .border-cyan-400\\/${op}, .dark .dark\\:border-cyan-400\\/${op} { border-color: rgb(${themeRgb} / ${alpha}) !important; }
      .text-cyan-500\\/${op}, .dark .dark\\:text-cyan-500\\/${op} { color: rgb(${themeRgb} / ${alpha}) !important; }
      .text-cyan-400\\/${op}, .dark .dark\\:text-cyan-400\\/${op} { color: rgb(${themeRgb} / ${alpha}) !important; }
      .shadow-cyan-500\\/${op}, .dark .dark\\:shadow-cyan-500\\/${op} { --tw-shadow-color: rgb(${themeRgb} / ${alpha}) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
      .shadow-cyan-400\\/${op}, .dark .dark\\:shadow-cyan-400\\/${op} { --tw-shadow-color: rgb(${themeRgb} / ${alpha}) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
    `;
  });

  const customShadows = [
    { cls: '.shadow-\\[0_0_10px_rgba\\(6\\,182\\,212\\,0\\.15\\)\\]', val: `0 0 10px rgb(${themeRgb} / 0.15)` },
    { cls: '.shadow-\\[0_0_15px_rgba\\(6\\,182\\,212\\,0\\.15\\)\\]', val: `0 0 15px rgb(${themeRgb} / 0.15)` },
    { cls: '.shadow-\\[0_0_20px_rgba\\(6\\,182\\,212\\,0\\.15\\)\\]', val: `0 0 20px rgb(${themeRgb} / 0.15)` },
    { cls: '.shadow-\\[0_0_20px_rgba\\(6\\,182\\,212\\,0\\.4\\)\\]', val: `0 0 20px rgb(${themeRgb} / 0.4)` },
    { cls: '.shadow-\\[0_0_25px_rgba\\(6\\,182\\,212\\,0\\.6\\)\\]', val: `0 0 25px rgb(${themeRgb} / 0.6)` },
    { cls: '.shadow-\\[0_0_30px_rgba\\(6\\,182\\,212\\,0\\.15\\)\\]', val: `0 0 30px rgb(${themeRgb} / 0.15)` },
    { cls: '.shadow-\\[0_0_60px_rgba\\(6\\,182\\,212\\,0\\.15\\)\\]', val: `0 0 60px rgb(${themeRgb} / 0.15)` }
  ];
  let shadowCss = '';
  customShadows.forEach(s => {
    shadowCss += `${s.cls}, .dark ${s.cls.replace('.', '.dark\\:')} { box-shadow: ${s.val} !important; }\n`;
  });

  return (
    <style>
      {`
        :root { --color-primary: ${themeColor} !important; }
        ${opacityCss}
        ${shadowCss}
      `}
    </style>
  );
}