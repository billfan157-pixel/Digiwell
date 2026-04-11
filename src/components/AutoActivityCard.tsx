
interface AutoActivityCardProps {
  isWatchConnected: boolean;
  isCalendarSynced: boolean;
  watchData: { heartRate: number; steps: number };
  calendarEvents: any[];
  currentActivity: 'chill' | 'light' | 'hard';
  setCurrentActivity: (activity: 'chill' | 'light' | 'hard') => void;
}

const AutoActivityCard = (_props: AutoActivityCardProps) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-bold">Trạng thái vận động</p>
          <p className="text-slate-400 text-xs mt-1">Đang theo dõi tự động...</p>
        </div>
      </div>
    </div>
  );
};

export default AutoActivityCard;