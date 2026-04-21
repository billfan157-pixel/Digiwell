import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health, type HealthDataType } from '@capgo/capacitor-health';
import { toast } from 'sonner';

export function useDeviceHealth(profileId?: string) {
  const [isWatchConnected, setIsWatchConnected] = useState(() => {
    if (profileId && profileId !== 'undefined') {
      const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profileId}`) || '{}');
      return !!prefs.watch;
    }
    return false;
  });
  const [watchData, setWatchData] = useState<{ steps: number; heartRate: number }>({ steps: 0, heartRate: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if health data is available on this device
  const checkHealthAvailability = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const result = await Health.isAvailable();
      return result.available;
    } catch {
      return false;
    }
  }, []);

  // Request permissions and check authorization status
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      toast.info("Tính năng đồng bộ sức khỏe chỉ hoạt động trên thiết bị thật (iOS/Android).");
      return false;
    }

    setIsLoading(true);
    try {
      const available = await checkHealthAvailability();
      if (!available) {
        toast.error("Thiết bị của bạn không hỗ trợ đồng bộ dữ liệu sức khỏe.");
        return false;
      }

      // Request authorization for health data
      await Health.requestAuthorization({
        read: ['steps' as HealthDataType, 'heartRate' as HealthDataType]
      });

      toast.success("Đã cấp quyền truy cập dữ liệu sức khỏe!");
      return true;
    } catch (error: any) {
      console.error('Lỗi khi yêu cầu quyền:', error);
      if (error.message?.includes('denied')) {
        toast.error("Quyền truy cập dữ liệu sức khỏe bị từ chối. Vui lòng cấp quyền trong cài đặt thiết bị.");
      } else {
        toast.error("Không thể kết nối với Apple Health / Health Connect.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkHealthAvailability]);

  // Sync health data from today
  const syncHealthData = useCallback(async () => {
    if (!isWatchConnected || !Capacitor.isNativePlatform()) return;

    try {
      // Get data from start of today
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();

      // Fetch steps data
      const stepsRes = await Health.readSamples({
        dataType: 'steps' as HealthDataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Fetch heart rate data (latest reading)
      const hrRes = await Health.readSamples({
        dataType: 'heartRate' as HealthDataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1,
      });

      const totalSteps = stepsRes.samples.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const latestHr = hrRes.samples.length > 0 ? hrRes.samples[0].value : 0;

      setWatchData({ steps: Math.round(totalSteps), heartRate: Math.round(latestHr) });
    } catch (error: any) {
      console.error('Lỗi đồng bộ dữ liệu sức khỏe:', error);
      // Don't disconnect on sync errors, just log them
    }
  }, [isWatchConnected]);

  // Connect to health services
  const connectHealth = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (hasPermission) {
      setIsWatchConnected(true);
      toast.success("Đã kết nối với Apple Health / Health Connect!");
    }
  }, [requestPermissions]);

  // Disconnect from health services
  const disconnectHealth = useCallback(() => {
    setIsWatchConnected(false);
    setWatchData({ steps: 0, heartRate: 0 });
    toast.info("Đã ngắt kết nối với Apple Health / Health Connect.");
  }, []);

  // Toggle connection
  const toggleHealthConnection = useCallback(async () => {
    if (isWatchConnected) {
      disconnectHealth();
    } else {
      await connectHealth();
    }
  }, [isWatchConnected, connectHealth, disconnectHealth]);

  // Sync data when connected
  useEffect(() => {
    if (isWatchConnected) {
      // Initial sync
      syncHealthData();

      // Set up periodic sync every 5 minutes
      intervalRef.current = setInterval(syncHealthData, 5 * 60 * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isWatchConnected, syncHealthData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isWatchConnected,
    watchData,
    isLoading,
    connectHealth,
    disconnectHealth,
    toggleHealthConnection,
    syncHealthData
  };
}