import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { toast } from 'sonner';

export function useDeviceHealth() {
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [watchData, setWatchData] = useState<{ steps: number; heartRate: number }>({ steps: 0, heartRate: 0 });

  useEffect(() => {
    if (!isWatchConnected) return;

    const syncHealthData = async () => {
      if (!Capacitor.isNativePlatform()) {
        toast.info("Tính năng đồng bộ sức khỏe chỉ hoạt động trên thiết bị thật (iOS/Android).");
        setIsWatchConnected(false);
        return;
      }

      try {
        // 1. Yêu cầu quyền truy cập (cho cả HealthKit và Health Connect)
        await Health.requestAuthorization({
          read: ['steps', 'heartRate']
        });

        // 2. Query dữ liệu của ngày hôm nay
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();

        const stepsRes = await Health.readSamples({
          dataType: 'steps',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const hrRes = await Health.readSamples({
          dataType: 'heartRate',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1, // Chỉ lấy nhịp tim gần nhất
        });

        const totalSteps = stepsRes.samples.reduce((sum: number, entry: any) => sum + entry.value, 0);
        const latestHr = hrRes.samples.length > 0 ? hrRes.samples[0].value : 0;

        setWatchData({ steps: totalSteps, heartRate: latestHr });
      } catch (error: any) {
        console.error('Lỗi đồng bộ dữ liệu sức khỏe:', error);
        toast.error("Không thể lấy dữ liệu từ Apple Health / Health Connect.");
        setIsWatchConnected(false);
      }
    };

    syncHealthData();
  }, [isWatchConnected]);

  return { isWatchConnected, setIsWatchConnected, watchData };
}