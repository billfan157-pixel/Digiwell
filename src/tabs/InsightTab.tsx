import { useMemo, useState } from 'react';
import { 
  BarChart2, Cpu, RefreshCw, ArrowUpRight, 
  Target, Flame, ChevronRight, Droplets,
  TrendingUp, Calendar, Zap, FileText, Crown
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { HealthReport } from '../lib/aiReports';
import WaterBreakdown from '../components/WaterBreakdown';
import WeeklyReportCard from '../components/ui/WeeklyReportCard';
import { Skeleton } from '../components/Skeleton';

interface InsightTabProps {
  profile?: any;
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  waterGoal: number;
  weeklyChartData: { d: string; ml: number; isToday: boolean; }[];
  progress: number;
  streak: number;
  isAiLoading: boolean;
  aiAdvice: string;
  fetchAIAdvice: () => void;
  setShowAiChat: (show: boolean) => void;
  weeklyReport: HealthReport | null;
  isWeeklyReportLoading: boolean;
  generateWeeklyReport: () => void;
  hydrationResult?: any;
}

const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl";

export default function InsightTab({
  profile, isPremium, setShowPremiumModal, isExportingPDF, handleExportPDF,
  waterGoal, weeklyChartData, progress, streak, isAiLoading, aiAdvice, fetchAIAdvice, setShowAiChat,
  weeklyReport, isWeeklyReportLoading, generateWeeklyReport, hydrationResult
}: InsightTabProps) {
  
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);

  // --- THUẬT TOÁN TRUE CALENDAR: Tự động tạo lưới lịch chuẩn theo Tháng hiện tại ---
  const { calendarCells, currentMonthName } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    
    // Tìm số ngày trong tháng (tự động 28, 29, 30, 31)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Tìm thứ của ngày mùng 1 (0 = CN, 1 = T2...). Đổi sang T2 là đầu tuần (0 = T2... 6 = CN)
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; 

    const cells = [];
    
    // 1. Lấp đầy các ô trống ở đầu tháng
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, ml: 0, isFuture: false, isToday: false, isEmptySlot: true });
    }

    // Lấy data tuần ngược lại để map vào các ngày gần đây
    const weeklyDataReversed = [...weeklyChartData].reverse();

    // 2. Điền các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      const isFuture = i > todayDate;
      const isToday = i === todayDate;
      let ml = 0;

      // Map data từ weeklyChartData vào đúng ngày (chỉ mô phỏng cho 7 ngày gần nhất)
      const daysAgo = todayDate - i;
      if (daysAgo >= 0 && daysAgo < weeklyDataReversed.length) {
        ml = weeklyDataReversed[daysAgo]?.ml || 0;
      }

      cells.push({ dayNum: i, ml, isFuture, isToday, isEmptySlot: false });
    }

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    return { 
      calendarCells: cells, 
      currentMonthName: `${monthNames[month]} / ${year}` 
    };
  }, [weeklyChartData]);

  const stats = useMemo(() => {
    if (weeklyChartData.length === 0) return { avg: 0, completed: 0 };
    const total = weeklyChartData.reduce((acc, curr) => acc + curr.ml, 0);
    const avg = total / weeklyChartData.length;
    const completed = weeklyChartData.filter(day => day.ml >= waterGoal).length;
    return { avg: Math.round(avg), completed };
  }, [weeklyChartData, waterGoal]);

  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  const breakdownData = hydrationResult?.breakdown ?? null;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* --- PHẦN TIÊU ĐỀ --- */}
      <div className="flex justify-between items-start pt-6 pb-4 px-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">PHÂN TÍCH CHUYÊN SÂU</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Insight</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={isPremium ? handleExportPDF : () => setShowPremiumModal(true)}
            className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800 border border-white/10 text-white active:scale-95 transition-all duration-200 ease-out hover:bg-cyan-500/20"
          >
            {isExportingPDF ? <RefreshCw size={22} className="text-cyan-400 animate-spin" /> : <FileText size={22} className="text-cyan-400" />}
            {!isPremium && <Crown size={14} className="absolute -top-1.5 -right-1.5 text-amber-400 drop-shadow-md" />}
          </button>
        </div>
      </div>

      {/* --- BIỂU ĐỒ TRUNG TÂM --- */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <TrendingUp size={150} className="text-cyan-500" />
        </div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="relative flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
            {(['week', 'month'] as const).map((t) => {
              const isActive = timeRange === t;
              return (
                <button 
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`relative px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${isActive ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="insightTabIndicator"
                      className="absolute inset-0 bg-cyan-400 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                  {t === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              );
            })}
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Mục tiêu</p>
            <p className="text-white font-black text-lg font-mono-tech">{waterGoal.toLocaleString('vi-VN')} ml</p>
          </div>
        </div>
        
        {timeRange === 'week' ? (
          /* BIỂU ĐỒ CỘT CHO TUẦN */
          <div className="relative h-44 w-full mt-4 z-10">
            <div className="absolute top-[20%] left-0 w-full flex items-center gap-2 z-0 opacity-50">
              <div className="w-full border-t border-dashed border-cyan-500/30"></div>
              <span className="text-[8px] font-mono text-cyan-500 font-bold">100%</span>
            </div>
            
            <div className="absolute bottom-6 left-0 w-full border-t border-slate-700/50 z-0"></div>

            <div className="flex items-end justify-between w-full h-full gap-2 pb-6 relative z-10 px-1">
              {weeklyChartData.map((day, index) => {
                const isOver100 = day.ml >= waterGoal;
                const heightPct = Math.min((day.ml / (waterGoal || 1)) * 80, 100);

                return (
                  <div key={index} className="flex flex-col items-center justify-end flex-1 h-full relative group">
                    <div className="w-full h-full relative flex items-end justify-center">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
                        className={`w-full max-w-[20px] rounded-t-md transition-colors duration-300 ${
                          day.isToday 
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                            : isOver100 
                              ? 'bg-cyan-800' 
                              : 'bg-slate-700/60 group-hover:bg-slate-600'
                        }`}
                      />
                      <div className="absolute bottom-[calc(100%+5px)] left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 border border-white/10 text-[10px] text-white font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                        {day.ml.toLocaleString('vi-VN')} ml
                      </div>
                    </div>
                    <div className="absolute -bottom-6 mt-2 flex items-center justify-center">
                      <span className={`text-[10px] font-mono tracking-tighter whitespace-nowrap ${day.isToday ? 'text-cyan-400 font-black' : 'text-slate-500 font-semibold'}`}>
                        {day.d}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MA TRẬN TRUE CALENDAR (CÓ SỐ NGÀY, TỰ CHỈNH 28-31 NGÀY) */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 relative z-10 w-full"
          >
            {/* Header Lịch & Chú thích */}
            <div className="flex justify-between items-end mb-4">
              <p className="text-xs text-cyan-400 font-black uppercase tracking-wider">{currentMonthName}</p>
              <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500 uppercase">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px] bg-cyan-900/50"></div> Thiếu</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px] bg-cyan-400 shadow-[0_0_5px_cyan]"></div> Đạt</div>
              </div>
            </div>

            {/* Khung Ngày Trong Tuần (T2 -> CN) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                <div key={d} className="text-center text-[10px] text-slate-500 font-bold">{d}</div>
              ))}
            </div>

            {/* Grid 35-42 ô của lịch */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarCells.map((cell, index) => {
                // Ô đầu tháng rỗng để khớp thứ
                if (cell.isEmptySlot) {
                  return (
                    <motion.div 
                      key={`empty-${index}`} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.015 }}
                      className="aspect-square bg-transparent" 
                    />
                  );
                }

                const pct = (cell.ml / (waterGoal || 1)) * 100;
                
                // Logic màu sắc cực mượt
                let cellClass = "bg-slate-800/30 border border-slate-700/30"; // Quá khứ trống
                
                if (cell.isFuture) {
                  cellClass = "bg-white/5 border border-white/5 opacity-30"; // Tương lai chưa tới
                } else if (pct >= 100) {
                  cellClass = "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]";
                } else if (pct >= 50) {
                  cellClass = "bg-cyan-700 border border-cyan-500/30";
                } else if (pct > 0) {
                  cellClass = "bg-cyan-950 border border-cyan-900/50";
                }

                return (
                  <motion.div 
                    key={`day-${cell.dayNum}`} 
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.015, type: 'spring', bounce: 0.5 }}
                    className={`aspect-square rounded-[6px] sm:rounded-lg flex flex-col items-center justify-center transition-all duration-300 relative group ${cellClass} ${!cell.isFuture ? 'hover:scale-110 cursor-pointer' : ''}`}
                  >
                     {/* ĐÂY LÀ CHỖ HIỂN THỊ SỐ NGÀY: 1, 2, 3... 31 */}
                     <span className={`absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-mono leading-none ${cell.isToday ? 'text-cyan-100 font-black' : 'text-slate-400/80 font-semibold'}`}>
                       {cell.dayNum}
                     </span>

                     {/* Icon thả giọt nước nếu hoàn thành 100% */}
                     {!cell.isFuture && pct >= 100 && (
                       <Droplets size={10} className="text-cyan-950 opacity-90 mt-2 sm:mt-3" />
                     )}
                     
                     {/* Tooltip báo cáo ML khi chạm vào */}
                     {!cell.isFuture && (
                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-[10px] text-white font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all transform translate-y-1 group-hover:translate-y-0 border border-white/10 shadow-xl">
                         Ngày {cell.dayNum}: {cell.ml.toLocaleString('vi-VN')} ml
                       </div>
                     )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Water Breakdown */}
      {breakdownData && (
        <div className="mt-8">
          <WaterBreakdown breakdown={breakdownData} />
        </div>
      )}

      {/* --- CÁC THÀNH PHẦN BÊN DƯỚI GIỮ NGUYÊN (STATS, WORKOUT, AI COACH) --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${glassCard} p-6 flex flex-col justify-between h-44 group hover:border-cyan-500/30 transition-colors`}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Zap size={18} className="text-cyan-400" />
            </div>
            <ArrowUpRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div>
            <p className="text-3xl font-black text-white tracking-tighter font-mono-tech">{stats.avg.toLocaleString('vi-VN')}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Trung bình ML</p>
            <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min((stats.avg / waterGoal) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className={`${glassCard} p-6 flex flex-col justify-between h-44 group hover:border-emerald-500/30 transition-colors`}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Target size={18} className="text-emerald-400" />
            </div>
            <Calendar size={14} className="text-slate-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-white tracking-tighter font-mono-tech">{stats.completed}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Ngày đạt chuẩn</p>
            <p className="text-[9px] text-emerald-500 font-black mt-2 font-mono-tech">+{completionRate}% hiệu suất</p>
          </div>
        </div>

        <div 
          onClick={() => setIsStreakModalOpen(true)}
          className={`${glassCard} col-span-2 p-6 flex items-center justify-between group hover:bg-slate-800/80 cursor-pointer active:scale-[0.98] transition-all duration-200 ease-out`}
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20 animate-pulse" />
              <div className="w-14 h-14 rounded-[1.25rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center relative z-10">
                <Flame size={28} className="text-amber-500" />
              </div>
            </div>
            <div>
              <p className="text-white font-black text-2xl tracking-tight">Chuỗi <span className="font-mono-tech">{streak}</span> ngày</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Tiếp tục duy trì phong độ</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-white transition-all">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900/80 to-orange-950/30 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Flame size={100} className="text-orange-500" />
        </div>
        <h3 className="text-orange-500 font-black text-lg mb-4 flex items-center gap-2 relative z-10">
          🔥 CHẾ ĐỘ TẬP NẶNG
        </h3>
        <div className="flex flex-wrap gap-2 relative z-10">
          {['🏋️‍♂️ Push/Pull/Legs', '🚴‍♂️ Đạp xe (MTB)', '🏃‍♂️ Cardio/HIIT'].map(workout => (
            <button
              key={workout}
              onClick={() => setActiveWorkout(workout === activeWorkout ? null : workout)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-out border ${
                activeWorkout === workout
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-105'
                  : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {workout}
            </button>
          ))}
        </div>

        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 relative z-10"
          >
            <p className="text-amber-400 text-sm leading-relaxed font-medium">
              <span className="font-bold">⚡ Cảnh báo:</span> AI khuyến nghị cộng thêm 800ml vào mục tiêu. Vui lòng bổ sung Điện giải (Electrolytes) hoặc nước khoáng để tránh mất muối!
            </p>
          </motion.div>
        )}
      </div>

      <WeeklyReportCard
        isPremium={isPremium}
        report={weeklyReport}
        isLoading={isWeeklyReportLoading}
        onGenerate={generateWeeklyReport}
        onUpgrade={() => setShowPremiumModal(true)}
      />

      <div 
        onClick={() => isPremium ? setShowAiChat(true) : setShowPremiumModal(true)}
        className="relative group cursor-pointer active:scale-[0.98] transition-all duration-200 ease-out"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-blue-500/30 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-1000"></div>
        <div className={`${glassCard} p-8 bg-slate-900/80 border-white/10 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20 animate-[scan_3s_linear_infinite]" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Cpu size={22} className={`text-indigo-400 ${isAiLoading ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Neural Insight</span>
                <p className="text-[8px] text-indigo-400 font-bold uppercase mt-0.5">Core Active</p>
              </div>
            </div>
            {!isPremium ? (
              <span className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_#f59e0b]">PRO</span>
            ) : (
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-30" />
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 rounded-xl p-5 border border-white/5 backdrop-blur-sm mt-4">
            {isAiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                "{aiAdvice || 'Chạm để nhận phân tích chi tiết về trạng thái hydrat hóa của bạn.'}"
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Last Sync: Today, 12:04 AM</p>
             <button 
                onClick={(e: React.MouseEvent) => { 
                  e.stopPropagation(); 
                  isPremium ? fetchAIAdvice() : setShowPremiumModal(true); 
                }}
               className="p-2 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition-all duration-200 ease-out z-10"
             >
               <RefreshCw size={14} className={`text-slate-500 hover:text-cyan-400 ${isAiLoading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      </div>

      {isStreakModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsStreakModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative border border-amber-500/20">
              <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse rounded-full" />
              <Flame size={40} className="text-amber-500 relative z-10" />
            </div>
            <h3 className="text-white font-black text-2xl mb-2">Tuyệt vời, {profile?.nickname || 'bạn'}!</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Đệ đã duy trì chuỗi uống nước <span className="text-amber-400 font-bold">{streak} ngày</span> liên tiếp. Cố gắng đạt mốc 7 ngày để mở khóa huy hiệu mới nhé!
            </p>
            <button 
              onClick={() => setIsStreakModalOpen(false)} 
              className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold active:scale-95 transition-all hover:bg-white/10 border border-white/10"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}