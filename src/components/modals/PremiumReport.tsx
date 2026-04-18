import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Legend, CartesianGrid } from 'recharts';
import { Sparkles, TrendingUp, DollarSign, BrainCircuit } from 'lucide-react';

interface PremiumReportProps {
  reportData?: any[];
  savingsVND?: number;
}

const mockData = [
  { day: 'T2', water: 2100, heartRate: 72 },
  { day: 'T3', water: 2500, heartRate: 75 },
  { day: 'T4', water: 1800, heartRate: 80 },
  { day: 'T5', water: 3000, heartRate: 68 },
  { day: 'T6', water: 2800, heartRate: 70 },
  { day: 'T7', water: 3200, heartRate: 65 },
  { day: 'CN', water: 2600, heartRate: 71 },
];

const MOCK_SAVINGS = 850000; // Tiết kiệm từ việc bỏ trà sữa/nước ngọt
const FUND_PRICE = 25000; // Ước tính giá CCQ

export default function PremiumReport({ reportData = mockData, savingsVND = MOCK_SAVINGS }: PremiumReportProps) {
  const fundUnits = (savingsVND / FUND_PRICE).toFixed(2);
  const cardClass = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl p-6";

  return (
    <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-6 pb-20">
      <div className="flex items-center gap-3 px-6">
        <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
          <Sparkles size={24} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Báo Cáo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Chuyên Sâu</span></h2>
      </div>

      {/* Chart Section */}
      <div className={`mx-4 ${cardClass}`}>
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-cyan-400"/> Tương quan Hydration & Nhịp tim</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            <ComposedChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="left" hide />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Bar yAxisId="left" dataKey="water" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className={`mx-4 ${cardClass} relative overflow-hidden`}>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-400"/> Tích Lũy Sức Khỏe & Tài Chính</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đã Tiết Kiệm</p>
            <p className="text-xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] mt-1">
              {savingsVND.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-cyan-500/20">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quy đổi CCQ (VESAF)</p>
            <p className="text-xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] mt-1">
              ~ {fundUnits} ccq
            </p>
          </div>
        </div>
      </div>

      {/* AI Mentor */}
      <div className={`mx-4 ${cardClass} border-indigo-500/20`}>
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BrainCircuit size={18} className="text-indigo-400"/> DigiCoach Phân Tích</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-1.5 bg-indigo-500 rounded-full" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Nhịp tim tĩnh của bạn có dấu hiệu ổn định (giảm trung bình 3 BPM) vào những ngày lượng nước nạp vào trên 2500ml.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-1.5 bg-emerald-500 rounded-full" />
            <p className="text-sm text-slate-300 leading-relaxed">
              Thói quen từ chối nước ngọt đã giúp bạn tiết kiệm đủ để mua đều đặn CCQ hằng tháng. Khuyến nghị thiết lập lệnh đầu tư tự động (SIP).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}