// src/utils/healthMath.ts

/**
 * 1. Tính mục tiêu nước dựa trên cân nặng
 */
export const calculateWaterGoal = (weightKg: number): number => {
  return weightKg ? Math.round(weightKg * 35) : 2000;
};

/**
 * 2. Tính Water Points (WP)
 * Đã fix để nhận đủ 3 tham số như App.tsx đang gọi
 */
export const calculateWP = (intake: number = 0, goal: number = 2000, currentStreak: number = 0): number => {
  // Công thức: Lượng nước thực tế + (Chuỗi ngày * 200 điểm thưởng)
  const basePoints = Math.min(intake, goal);
  const streakBonus = currentStreak * 200;
  return basePoints + streakBonus;
};

/**
 * 3. Lấy thông tin hạng (Rank)
 * Đã nâng mức điểm để Lan Phương (1200) về đúng hạng BẠC, Thầy Hùng (4600) là KIM CƯƠNG
 */
export const getRankInfo = (points: number) => {
  // Check từ cao xuống thấp để không bị nhảy sai hạng
  if (points >= 4000) {
    return { 
      name: 'KIM CƯƠNG', 
      color: 'text-cyan-300', 
      bg: 'bg-cyan-500/20', 
      border: 'border-cyan-500/30' 
    };
  }
  if (points >= 2500) {
    return { 
      name: 'VÀNG', 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/20', 
      border: 'border-yellow-500/30' 
    };
  }
  if (points >= 1000) {
    return { 
      name: 'BẠC', 
      color: 'text-slate-300', 
      bg: 'bg-slate-500/20', 
      border: 'border-slate-500/30' 
    };
  }
  return { 
    name: 'ĐỒNG', 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20', 
    border: 'border-orange-500/30' 
  };
};

/**
 * 4. Tính phần trăm hoàn thành
 */
export const calculateProgress = (current: number, goal: number): number => {
  if (!goal || goal === 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
};

/**
 * 5. Format dung tích (ml -> L)
 */
export const formatVolume = (ml: number): string => {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
};