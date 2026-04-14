/**
 * Các hàm tính toán chỉ số sức khỏe cho DigiWell
 */

// Tính mục tiêu nước dựa trên cân nặng
export const calculateWaterGoal = (weightKg: number): number => {
  return weightKg ? Math.round(weightKg * 35) : 2000;
};

// Tính phần trăm hoàn thành
export const calculateProgress = (current: number, goal: number): number => {
  if (!goal || goal === 0) return 0;
  const percentage = (current / goal) * 100;
  return Math.min(Math.round(percentage), 100);
};

// Format dung tích nước (ml -> L)
export const formatVolume = (ml: number): string => {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
};