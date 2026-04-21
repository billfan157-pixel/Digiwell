import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useWeatherSync } from './useWeatherSync';
import { useCalendarSync } from './useCalendarSync';
import { useDeviceHealth } from './useDeviceHealth';

export function useAppSystem() {
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'app' | 'locked'>('welcome');
  const [profile, setProfile] = useState<any>(null);
  const [loginPrefill, setLoginPrefill] = useState('');

  const { isWeatherSynced, setIsWeatherSynced, weatherData, syncWeather } = useWeatherSync();
  const { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar } = useCalendarSync();
  const { isWatchConnected, toggleHealthConnection, watchData, isLoading: isHealthLoading } = useDeviceHealth(profile?.id);

  const loadProfileForCurrentUser = async () => {
    try {
      const { data: sessionRes, error: sessionErr } = await supabase!.auth.getSession();
      if (sessionErr || !sessionRes.session?.user.id) return null;
      const userId = sessionRes.session.user.id;
      
      const { data: p, error: pErr } = await supabase!.from('profiles').select('*').eq('id', userId).single();
      if (pErr || !p) return null;

      // Check if last_water_date is not today, reset water_today to 0
      const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      console.log('[useAppSystem] Loading profile:', { total_exp: p.total_exp, level: p.level, water_today: p.water_today, last_water_date: p.last_water_date, today });
      if (p.last_water_date !== today) {
        console.log('[useAppSystem] Resetting water_today for new day');
        await supabase!.from('profiles').update({
          water_today: 0,
          last_water_date: today
        }).eq('id', userId);
        p.water_today = 0;
        p.last_water_date = today;
      }

      return {
        id: p.id, nickname: p.nickname, password: '', gender: p.gender,
        age: p.age, height: p.height, weight: p.weight, activity: p.activity,
        climate: p.climate, goal: p.goal, wakeUp: p.wake_up, bedTime: p.bed_time,
        water_goal: p.water_goal, wp: p.wp, coins: p.coins, total_exp: p.total_exp, level: p.level,
        water_today: p.water_today, total_water: p.total_water,
        onboarding_completed: p.onboarding_completed
      };
    } catch { return null; }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const sub = CapacitorApp.addListener('appUrlOpen', async (event) => {
        if (
          event.url.includes('login-callback') ||
          event.url.includes('billing-return') ||
          event.url.includes('access_token') ||
          event.url.includes('code=')
        ) {
          Browser.close().catch(() => {});
          const urlStr = event.url;
          if (urlStr.includes('#') || urlStr.includes('?')) {
            const fragment = urlStr.substring(urlStr.indexOf(urlStr.includes('?') ? '?' : '#'));
            window.location.href = `${window.location.origin}${window.location.pathname}${fragment}`;
            
            setTimeout(async () => {
              const { data } = await supabase!.auth.getSession();
              if (data?.session) {
                setView('app');
              }
            }, 500);
          }
        }
      });
      return () => { sub.then(s => s.remove()); };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const { data: sub } = supabase!.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted) return;
      try {
        if (session) {
          if (session.provider_token) localStorage.setItem('google_provider_token', session.provider_token);
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
              let p = await loadProfileForCurrentUser();
              if (!p && session.user) {
                const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
                await supabase!.from('profiles').upsert([{ id: session.user.id, nickname: defaultName, gender: 'Nam', age: 20, height: 170, weight: 60, activity: 'active', climate: 'Nhiệt đới (Nóng)', goal: 'Sức khỏe tổng quát' }], { onConflict: 'id' });
                p = await loadProfileForCurrentUser();
              }
              if (p && isMounted) { 
                setProfile(p); 
                const isBiometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
                setView(isBiometricEnabled ? 'locked' : 'app'); 
              }
            }, 500);
          }
        } else if (event === 'SIGNED_OUT' || !session) { 
          setProfile(null); localStorage.removeItem('google_provider_token'); setView('welcome'); 
        }
      } catch (error) { console.error(error); }
    });
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); sub?.subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => { if (window.confirm("Xác nhận đăng xuất an toàn?")) { await supabase!.auth.signOut(); } };

  return { view, setView, profile, setProfile, loginPrefill, setLoginPrefill, handleLogout, isWeatherSynced, setIsWeatherSynced, weatherData, syncWeather, isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar, isWatchConnected, toggleHealthConnection, watchData, isHealthLoading };
}
