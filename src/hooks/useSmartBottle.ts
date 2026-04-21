import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface BottleMetrics {
  currentVolume: number;
  batteryLevel: number;
  signalStrength: number;
  temperature: number;
}

interface SyncLog {
  id: string;
  timestamp: Date;
  action: 'drink' | 'refill' | 'sync';
  amountChange?: number;
}

interface EquippedBottleSkin {
  id: string;
  name?: string;
  description?: string;
  rarity?: string;
  meta_value?: string | null;
  image_url?: string | null;
}

interface ProfileBottleState {
  equipped_bottle_id: string | null;
  last_bottle_volume: number | null;
}

interface HydrationRpcResponse {
  added_exp?: number;
  new_total_exp?: number;
  new_coins?: number;
}

const HYDRATION_EVENT_NAME = 'hydrationEvent';
const BOTTLE_EQUIPPED_EVENT_NAME = 'bottleEquipped';

const clampVolume = (volume: number, capacity: number) =>
  Math.min(capacity, Math.max(0, volume));

export const useSmartBottle = (userId: string | undefined, deviceId: string, capacity: number = 750) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [equippedBottle, setEquippedBottle] = useState<EquippedBottleSkin | null>(null);
  const [metrics, setMetrics] = useState<BottleMetrics>({
    currentVolume: capacity,
    batteryLevel: 100,
    signalStrength: 100,
    temperature: 24,
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const metricsRef = useRef(metrics);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const fetchEquippedBottle = useCallback(async (equippedBottleId?: string | null) => {
    if (!equippedBottleId) {
      setEquippedBottle(null);
      return;
    }

    const { data, error } = await supabase
      .from('shop_items')
      .select('id, name, description, rarity, meta_value, image_url')
      .eq('id', equippedBottleId)
      .maybeSingle();

    if (error) throw error;

    setEquippedBottle(data);
  }, []);

  useEffect(() => {
    if (!userId) {
      setEquippedBottle(null);
      setMetrics(prev => ({ ...prev, currentVolume: capacity }));
      return;
    }

    const fetchInitialState = async () => {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('equipped_bottle_id, last_bottle_volume')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const profileData = data as ProfileBottleState | null;

        const nextVolume =
          profileData?.last_bottle_volume === null || profileData?.last_bottle_volume === undefined
            ? capacity
            : clampVolume(profileData.last_bottle_volume, capacity);

        setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));
        await fetchEquippedBottle(profileData?.equipped_bottle_id);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu khởi tạo bình:', err);
      }
    };

    void fetchInitialState();
  }, [capacity, fetchEquippedBottle, userId]);

  useEffect(() => {
    const handleBottleEquipped = (event: Event) => {
      const customEvent = event as CustomEvent<{ equipped_bottle_id?: string | null }>;
      void fetchEquippedBottle(customEvent.detail?.equipped_bottle_id ?? null);
    };

    window.addEventListener(BOTTLE_EQUIPPED_EVENT_NAME, handleBottleEquipped);

    return () => {
      window.removeEventListener(BOTTLE_EQUIPPED_EVENT_NAME, handleBottleEquipped);
    };
  }, [fetchEquippedBottle]);

  const connectDevice = useCallback(async () => {
    setIsSyncing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      setMetrics(prev => ({ ...prev, batteryLevel: 85, signalStrength: 92, temperature: 20 }));
      toast.success(`Đã kết nối ${deviceId}`);
    } finally {
      setIsSyncing(false);
    }
  }, [deviceId]);

  const disconnectDevice = useCallback(() => {
    setIsConnected(false);
    toast.info('Đã ngắt kết nối bình nước');
  }, []);

  const handleDrinkEvent = useCallback(async (amount: number) => {
    if (!isConnected || !userId) {
      toast.error('Bình chưa được kết nối!');
      return;
    }

    setIsSyncing(true);

    try {
      const { data, error } = await supabase.rpc('process_hydration_event', {
        user_id: userId,
        amount_ml: amount,
      });

      if (error) throw error;

      const rpcData = (data ?? {}) as HydrationRpcResponse;
      const nextVolume = clampVolume(metricsRef.current.currentVolume - amount, capacity);

      setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ last_bottle_volume: nextVolume })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Lỗi lưu last_bottle_volume:', profileUpdateError);
      }

      setSyncLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date(), action: 'drink', amountChange: amount },
        ...prev,
      ]);

      window.dispatchEvent(new CustomEvent(HYDRATION_EVENT_NAME, {
        detail: {
          source: 'smart_bottle',
          amount_ml: amount,
          current_volume: nextVolume,
          added_exp: rpcData.added_exp ?? 0,
          new_total_exp: rpcData.new_total_exp ?? 0,
          new_coins: rpcData.new_coins ?? 0,
          refresh_profile: true,
          refresh_water: true,
          occurred_at: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Lỗi xử lý uống nước từ RPC:', error);
      toast.error('Không thể đồng bộ DigiBottle. Kiểm tra mạng rồi thử lại.');
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, isConnected, userId]);

  const refillBottle = useCallback(async () => {
    if (!isConnected || !userId) return;

    setIsSyncing(true);

    try {
      setMetrics(prev => ({ ...prev, currentVolume: capacity }));
      await supabase.from('profiles').update({ last_bottle_volume: capacity }).eq('id', userId);
      setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'refill' }, ...prev]);
      toast.success('Đã đổ đầy bình nước!');
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái đổ đầy.');
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, isConnected, userId]);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);

    setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'sync' }, ...prev]);

    setTimeout(() => setIsSyncing(false), 1000);
  }, []);

  return {
    isConnected,
    isSyncing,
    metrics,
    syncLogs,
    connectDevice,
    disconnectDevice,
    handleDrinkEvent,
    refillBottle,
    forceSync,
    equippedBottle,
  };
};
