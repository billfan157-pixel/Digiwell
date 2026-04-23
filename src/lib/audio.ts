// src/lib/audio.ts

// Helper để tái sử dụng AudioContext
const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

// Hàm phát âm thanh ăn mừng bằng Web Audio API
export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + 0.5);
    };

    // Chơi một hợp âm trưởng rải (Arpeggio) vui tai
    playNote(523.25, 0);    // C5
    playNote(659.25, 0.1);  // E5
    playNote(783.99, 0.2);  // G5
    playNote(1046.50, 0.3); // C6
  } catch (e) {
    console.warn("Audio không thể phát:", e);
  }
};

// Hàm phát âm thanh giọt nước
export const playWaterDropSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.02); // Attack rất nhanh
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Decay

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now); // Bắt đầu cao
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15); // Giảm nhanh

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn("Audio không thể phát:", e);
  }
};

// =========================================================================
// CÁC HIỆU ỨNG TỔNG HỢP MỚI CHO GAMIFICATION (QUEST, LEVEL UP, HOVER)
// =========================================================================

// Hiệu ứng "Póp" siêu nhẹ khi lướt chuột qua (Hover)
export const playHoverSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05); // Tụtt pitch siêu nhanh
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01); // Volume rất nhỏ (0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {}
};

// Hiệu ứng "Ting Ting" sáng và đã tai khi nhận thưởng (Claim)
export const playClaimSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const playNote = (freq: number, startDelay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Sóng tam giác cho âm thanh giống chuông (bell)
      
      const startTime = ctx.currentTime + startDelay;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    };

    playNote(880, 0);        // A5
    playNote(1108.73, 0.1);  // C#6
    playNote(1318.51, 0.2);  // E6 (Tạo thành hợp âm A Major sáng chói)
  } catch(e) {}
};

// Hiệu ứng "Siêu năng lượng" (Power-up) khi nhận thưởng Hyper (Critical Hit)
export const playHyperSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square'; // Sóng vuông tạo cảm giác điện tử 8-bit (Retro)
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2); // Vuốt lên cao (Charge up)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.6); // Rơi xuống (Release)
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch(e) {}
};

// Cổng điều hướng đa năng (Dành cho QuestCard và các module khác gọi)
export const playSound = (name: string, volume: number = 0.5) => {
  switch(name) {
    case 'success': case 'levelup': playSuccessSound(); break;
    case 'drop': case 'click': playWaterDropSound(); break;
    case 'hover': playHoverSound(); break;
    case 'claim': playClaimSound(); break;
    case 'hyper': playHyperSound(); break;
  }
};