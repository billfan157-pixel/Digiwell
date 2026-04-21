import { useState, useCallback } from 'react';

interface Metrics {
  currentVolume: number;
  batteryLevel: number;
  signalStrength: number;
}

interface SyncLog {
  id: string;
  timestamp: Date;
  action: string;
  amount?: number;
}

interface UseBottleDeviceState {
  isConnected: boolean;
  metrics: Metrics;
  syncLogs: SyncLog[];
}

// BẢN FIX: Nhận tham số capacity (Mặc định 1000ml nếu không truyền)
export const useBottleDevice = (bottleCapacity: number = 1000) => {
  const [state, setState] = useState<UseBottleDeviceState>({
    isConnected: false,
    metrics: {
      currentVolume: bottleCapacity, // Lấy theo dung tích thật
      batteryLevel: 100, // %
      signalStrength: 80, // %
    },
    syncLogs: [],
  });

  const connectDevice = useCallback(async () => {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setState(prev => ({ ...prev, isConnected: true }));
  }, []);

  // BẢN FIX: Bổ sung hàm ngắt kết nối
  const disconnectDevice = useCallback(() => {
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const handleDrinkEvent = useCallback((amount: number) => {
    setState(prev => {
      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'drink',
        amount,
      };

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          currentVolume: Math.max(0, prev.metrics.currentVolume - amount),
        },
        // BẢN FIX: Đưa log mới lên đầu, và chỉ giữ tối đa 50 log gần nhất
        syncLogs: [newLog, ...prev.syncLogs].slice(0, 50),
      };
    });
  }, []);

  const refillBottle = useCallback(() => {
    setState(prev => {
      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'refill',
      };

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          currentVolume: bottleCapacity, // BẢN FIX: Đổ đầy theo đúng dung tích bình
        },
        // BẢN FIX: Đưa log mới lên đầu
        syncLogs: [newLog, ...prev.syncLogs].slice(0, 50),
      };
    });
  }, [bottleCapacity]); // Thêm dependency

  return {
    ...state,
    connectDevice,
    disconnectDevice,
    handleDrinkEvent,
    refillBottle,
  };
};