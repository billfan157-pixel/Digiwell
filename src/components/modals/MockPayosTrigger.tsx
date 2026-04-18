import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface MockPayosTriggerProps {
  userId: string;
}

export default function MockPayosTrigger({ userId }: MockPayosTriggerProps) {
  const [isFiring, setIsFiring] = useState(false);

  if (!import.meta.env.DEV) return null;

  const triggerMockPayment = async () => {
    if (!userId) return toast.error('Missing User ID');
    setIsFiring(true);
    const shortId = userId.substring(0, 8).toUpperCase();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payos-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            amount: 399000,
            description: `CHUYEN KHOAN DIGIWELL ${shortId}`,
            orderCode: Date.now()
          }
        })
      });
      const resData = await response.json();
      if (response.ok) toast.success(`Mock Payment Success! Expires: ${resData.new_end}`);
      else toast.error(`Mock Error: ${resData.error}`);
    } catch (err: any) {
      toast.error(`Fetch failed: ${err.message}`);
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <button onClick={triggerMockPayment} disabled={isFiring} className="fixed bottom-24 right-4 z-[999] bg-fuchsia-600 text-white p-3 rounded-full shadow-[0_0_15px_rgba(192,38,211,0.6)] active:scale-95 transition-all flex items-center justify-center">
      <Terminal size={20} className={isFiring ? 'animate-bounce' : ''} />
    </button>
  );
}