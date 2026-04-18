import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface AppSettings {
  displayName: string;
  avatarUrl: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activity: string;
  climate: string;
  waterGoal: number;
  autoWaterGoal: boolean;
  syncHealth: boolean;
  smartReminders: boolean;
  reminderFrequency: '30 phút' | '1 giờ' | '2 giờ';
  quietHoursStart: string;
  quietHoursEnd: string;
  hapticsEnabled: boolean;
  unit: 'ml' | 'oz';
  themeColor: string;
  biometricEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  displayName: '',
  avatarUrl: '',
  weight: 60,
  height: 170,
  age: 20,
  gender: 'Nam',
  activity: 'Bình thường',
  climate: 'Ôn hòa',
  waterGoal: 2000,
  autoWaterGoal: true,
  syncHealth: false,
  smartReminders: true,
  reminderFrequency: '1 giờ',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  hapticsEnabled: true,
  unit: 'ml',
  themeColor: '#06b6d4', // Cyan
  biometricEnabled: false,
};

export function useSettings(profile: any) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load initial data
  useEffect(() => {
    if (!profile?.id) return;
    
    const localKey = `digiwell_settings_${profile.id}`;
    const cached = localStorage.getItem(localKey);
    
    if (cached) {
      setSettings({ 
        ...DEFAULT_SETTINGS, 
        ...JSON.parse(cached), 
        displayName: profile.nickname || profile.name || '', 
        weight: profile.weight || 60, 
        height: profile.height || 170, 
        age: profile.age || 20,
        gender: profile.gender || 'Nam',
        activity: profile.activity || 'Bình thường',
        climate: profile.climate || 'Ôn hòa',
        waterGoal: profile.water_goal || JSON.parse(cached).waterGoal || 2000, // Ưu tiên data từ Supabase
        biometricEnabled: localStorage.getItem('biometric_enabled') === 'true'
      });
    } else {
      setSettings(prev => ({
        ...prev,
        displayName: profile.nickname || profile.name || '',
        weight: profile.weight || 60,
        height: profile.height || 170,
        age: profile.age || 20,
        gender: profile.gender || 'Nam',
        activity: profile.activity || 'Bình thường',
        climate: profile.climate || 'Ôn hòa',
        biometricEnabled: localStorage.getItem('biometric_enabled') === 'true',
        waterGoal: profile.water_goal || 2000
      }));
    }
  }, [profile]);

  // Provide haptic feedback utility (Chỉ dùng cho UI gọi)
  const triggerHaptic = useCallback(() => {
    if (settings.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [settings.hapticsEnabled]);

  // Save to LocalStorage & Supabase
  const updateSettings = useCallback(async (newValues: Partial<AppSettings>) => {
    if (!profile?.id || profile.id === 'undefined') return;
    
    setIsSaving(true);
    
    const updatedSettings = { ...settings, ...newValues };
    setSettings(updatedSettings);
    
    // 1. Save to LocalStorage (Instant UI feedback)
    localStorage.setItem(`digiwell_settings_${profile.id}`, JSON.stringify(updatedSettings));

    // Apply Theme Color instantly
    if (newValues.themeColor) {
      document.documentElement.style.setProperty('--color-primary', newValues.themeColor);
    }

    // 2. Sync to Supabase in background
    try {
      // Đẩy đầy đủ các field quan trọng lên database
      const { error } = await supabase.from('profiles').update({
        nickname: updatedSettings.displayName,
        weight: updatedSettings.weight,
        height: updatedSettings.height,
        age: updatedSettings.age,
        gender: updatedSettings.gender,
        activity: updatedSettings.activity,
        climate: updatedSettings.climate,
        water_goal: updatedSettings.waterGoal, // Đã thêm water_goal để không bị mất data
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (error) throw error;
      setLastSync(new Date());
    } catch (error) {
      console.error('Lỗi đồng bộ Settings:', error);
      toast.message('Đã lưu cục bộ — sẽ đồng bộ khi có mạng', {
        description: 'Dữ liệu của bạn được an toàn.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, profile?.id]);

  return { settings, updateSettings, isSaving, lastSync, triggerHaptic };
}