import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../hooks/useSettings';

export default function ThemeEngine({ profile }: { profile: any }) {
  const { settings } = useSettings(profile);
  const [themeColor, setThemeColor] = useState(settings?.themeColor || '#06b6d4');

  // 1. Đồng bộ khi state gốc thay đổi
  useEffect(() => {
    if (settings?.themeColor) setThemeColor(settings.themeColor);
  }, [settings?.themeColor]);

  // 2. Lắng nghe thay đổi từ LocalStorage (Không dùng setInterval nữa!)
  useEffect(() => {
    if (!profile?.id) return;

    // Window 'storage' event tự động kích hoạt khi localStorage thay đổi từ tab khác
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `digiwell_prefs_${profile.id}`) {
        try {
          const prefs = JSON.parse(e.newValue || '{}');
          if (prefs.themeColor && prefs.themeColor !== themeColor) {
            setThemeColor(prefs.themeColor);
          }
        } catch (error) {
          console.error('ThemeEngine Parse Error:', error);
        }
      }
    };

    // Lắng nghe sự kiện custom khi update theme trong cùng một tab
    const handleLocalThemeChange = (e: any) => {
      if (e.detail?.themeColor) {
        setThemeColor(e.detail.themeColor);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeUpdated', handleLocalThemeChange);
    return () => { 
      window.removeEventListener('storage', handleStorageChange); 
      window.removeEventListener('themeUpdated', handleLocalThemeChange); 
    };
  }, [profile?.id, themeColor]);

  // 3. Tối ưu hóa việc tính toán RGB bằng useMemo (Chỉ tính lại khi đổi màu)
  const themeRgb = useMemo(() => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(themeColor);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
      : '6, 182, 212';
  }, [themeColor]);

  // 4. Động cơ Override: Tự động ghi đè toàn bộ Class Cyan của Tailwind
  const themeCss = useMemo(() => {
    let css = `
      :root { 
        --color-primary-rgb: ${themeRgb}; 
        --color-primary-hex: ${themeColor};
        --neon-cyan: ${themeColor};
        --glow-cyan: 0 0 15px rgba(${themeRgb}, 0.3);
      }
    `;
    
    // Nếu không phải màu mặc định thì tiến hành đè class
    if (themeColor.toLowerCase() !== '#06b6d4') {
      css += `
        .text-cyan-300, .text-cyan-400, .text-cyan-500, .text-cyan-600 { color: rgb(${themeRgb}) !important; }
        .bg-cyan-300, .bg-cyan-400, .bg-cyan-500, .bg-cyan-600 { background-color: rgb(${themeRgb}) !important; }
        .border-cyan-300, .border-cyan-400, .border-cyan-500, .border-cyan-600 { border-color: rgb(${themeRgb}) !important; }
        .ring-cyan-400, .ring-cyan-500 { --tw-ring-color: rgb(${themeRgb}) !important; }
        .stroke-cyan-300, .stroke-cyan-400, .stroke-cyan-500 { stroke: rgb(${themeRgb}) !important; }
        .fill-cyan-300, .fill-cyan-400, .fill-cyan-500 { fill: rgb(${themeRgb}) !important; }
        .from-cyan-400, .from-cyan-500, .from-cyan-600 { --tw-gradient-from: rgb(${themeRgb}) var(--tw-gradient-from-position) !important; }
        .to-cyan-400, .to-cyan-500, .to-cyan-600 { --tw-gradient-to: rgb(${themeRgb}) var(--tw-gradient-to-position) !important; }
        .via-cyan-400, .via-cyan-500, .via-cyan-600 { --tw-gradient-to: rgb(${themeRgb}) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), rgb(${themeRgb}) var(--tw-gradient-via-position), var(--tw-gradient-to) !important; }
      `;
      
      // Đè luôn các class chứa opacity (ví dụ: bg-cyan-500/20)
      const opacities = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90];
      opacities.forEach(o => {
        const alpha = o / 100;
        css += `
          .bg-cyan-400\\/${o}, .bg-cyan-500\\/${o}, .bg-cyan-600\\/${o} { background-color: rgba(${themeRgb}, ${alpha}) !important; }
          .border-cyan-400\\/${o}, .border-cyan-500\\/${o}, .border-cyan-600\\/${o} { border-color: rgba(${themeRgb}, ${alpha}) !important; }
          .text-cyan-400\\/${o}, .text-cyan-500\\/${o}, .text-cyan-600\\/${o} { color: rgba(${themeRgb}, ${alpha}) !important; }
        `;
      });
    }
    return css;
  }, [themeColor, themeRgb]);

  return (
    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
  );
}