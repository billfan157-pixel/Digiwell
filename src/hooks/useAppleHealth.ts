import { useState } from 'react';

export function useAppleHealth() {
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [watchData, setWatchData] = useState({ steps: 0, heartRate: 0 });

  // Trong thực tế mày sẽ dùng @capacitor-community/apple-health ở đây
  const connectWatch = () => {
    setIsWatchConnected((prev: boolean) => !prev);
    if (!isWatchConnected) {
      setWatchData({ steps: 4500, heartRate: 82 });
    }
  };

  return { 
    isWatchConnected, 
    setIsWatchConnected, 
    watchData,
    connectWatch 
  };
}