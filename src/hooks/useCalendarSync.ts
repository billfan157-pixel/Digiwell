import { useState } from 'react';
import { toast } from 'sonner';

export function useCalendarSync() {
  const [isCalendarSynced, setIsCalendarSynced] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const syncCalendar = async () => {
    const tid = toast.loading("Đang quét lịch trình Google Calendar...");
    try {
      // Logic gọi Google Calendar API (Cần Google Provider Token)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockEvents = [
        { title: 'Tập Gym - Buổi sáng', start: '08:00', end: '10:00' }
      ];
      
      setCalendarEvents(mockEvents);
      setIsCalendarSynced(true);
      toast.success("Đã tìm thấy 1 sự kiện vận động mạnh!", { id: tid });
    } catch (err) {
      toast.error("Lỗi đồng bộ lịch trình!", { id: tid });
    }
  };

  return { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar };
}