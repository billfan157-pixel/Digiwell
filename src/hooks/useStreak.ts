import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { FEATURES } from '../config/premium';

export function useStreak(userId: string | undefined, waterGoal: number, todayIntake: number, isPremium: boolean = false) {
  const [pastStreak, setPastStreak] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [lastFreezeReset, setLastFreezeReset] = useState<string>('');

  // Reset streak freezes monthly for premium users
  useEffect(() => {
    if (!userId || userId === 'undefined' || !isPremium) return;

    const today = new Date().toLocaleDateString('en-CA');
    const currentMonth = today.substring(0, 7); // YYYY-MM

    if (lastFreezeReset !== currentMonth) {
      // Reset streak freezes to 2 per month
      supabase
        .from('profiles')
        .update({ streak_freezes: 2 })
        .eq('id', userId)
        .then(() => {
          setStreakFreezes(2);
          setLastFreezeReset(currentMonth);
        });
    }
  }, [userId, isPremium, lastFreezeReset]);

  useEffect(() => {
    if (!userId || userId === 'undefined' || !waterGoal) return;

    const fetchStreakData = async () => {
      // Fetch streak freezes for premium users
      if (isPremium) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_freezes')
          .eq('id', userId)
          .single();

        if (profile) {
          setStreakFreezes(profile.streak_freezes || 0);
        }
      }

      // Fetch past streak data
      const now = new Date();
      const dates: string[] = [];
      
      // Tạo mảng 30 ngày qua (bắt đầu từ hôm qua lùi về trước)
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dates.push(dateStr);
      }

      const startOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0).toISOString();
      const endOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).toISOString();

      const { data, error } = await supabase
        .from('water_logs')
        .select('created_at, amount')
        .eq('user_id', userId)
        .gte('created_at', startOfRange)
        .lte('created_at', endOfRange);

      if (error) {
        console.error("Lỗi tải dữ liệu streak:", error);
        return;
      }

      const dailyTotals = new Map<string, number>();
      (data || []).forEach((log: any) => {
        const amt = Number(log.amount ?? log.amount ?? log.ml ?? 0);
        if (!log.created_at) return;
        
        const dObj = new Date(log.created_at);
        const logDay = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        
        const current = dailyTotals.get(logDay) || 0;
        dailyTotals.set(logDay, current + (isNaN(amt) ? 0 : amt));
      });

      let currentPastStreak = 0;
      // Đếm lùi từ hôm qua (dates[0])
      for (let i = 0; i < 30; i++) {
        const d = dates[i];
        const total = dailyTotals.get(d) || 0;
        if (total >= waterGoal) currentPastStreak++;
        else break; // Đứt chuỗi ngay khi có 1 ngày không đạt
      }
      
      setPastStreak(currentPastStreak);
    };
  }, [userId, waterGoal]);

  // Tổng Streak = Chuỗi quá khứ + (1 nếu hôm nay đã đạt)
  const streak = useMemo(() => pastStreak + (todayIntake >= waterGoal ? 1 : 0), [pastStreak, todayIntake, waterGoal]);

  // Check if user needs streak freeze (yesterday didn't meet goal and has freezes available)
  const needsFreeze = useMemo(() => {
    if (!isPremium || streakFreezes <= 0) return false;

    // Check if yesterday didn't meet goal (simplified logic)
    // In real implementation, this would check yesterday's intake
    return pastStreak > 0 && todayIntake < waterGoal;
  }, [isPremium, streakFreezes, pastStreak, todayIntake, waterGoal]);

  const useStreakFreeze = async () => {
    if (!isPremium || streakFreezes <= 0 || !needsFreeze) return false;

    // Use one streak freeze
    const newFreezes = streakFreezes - 1;
    const { error } = await supabase
      .from('profiles')
      .update({ streak_freezes: newFreezes })
      .eq('id', userId);

    if (error) {
      console.error('Error using streak freeze:', error);
      return false;
    }

    setStreakFreezes(newFreezes);
    // In real implementation, this would preserve the streak
    return true;
  };

  return {
    streak,
    streakFreezes,
    needsFreeze,
    useStreakFreeze,
    isPremium
  };
}