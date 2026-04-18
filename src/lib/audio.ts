// src/lib/audio.ts

// Hàm phát âm thanh ăn mừng bằng Web Audio API
export const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

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
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
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