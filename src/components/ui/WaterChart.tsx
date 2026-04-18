import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid,
  LabelList
} from 'recharts';

interface WaterChartProps {
  data: { d: string; ml: number; isToday: boolean }[];
  waterGoal: number;
}

interface TooltipPayloadItem {
  value?: number | string;
}

// ==================== TOOLTIP ====================
const CustomTooltip = ({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-cyan-400 font-black text-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          {payload?.[0]?.value?.toLocaleString?.() ?? 0} ml
        </p>
      </div>
    );
  }
  return null;
};

export default function WaterChart({ data, waterGoal }: WaterChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartData = data;
  const isMonthView = chartData.length > 7;

  const maxY = useMemo(() => {
    const maxIntake = Math.max(...chartData.map((d) => d.ml), 0);
    return Math.max(maxIntake, waterGoal) + 500;
  }, [chartData, waterGoal]);

  if (chartData.length === 0) return null;

  // ==================== MONTH VIEW ====================
  if (isMonthView) {
    return (
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="d" 
              interval={Math.floor(chartData.length / 5)}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
              dy={10}
            />
            <YAxis hide domain={[0, maxY]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={waterGoal} stroke="#10b981" strokeDasharray="6 6" opacity={0.8} />

            <Area
              type="monotone"
              dataKey="ml"
              stroke="#0ea5e9"
              fill="url(#grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ==================== WEEK VIEW ====================
  return (
    <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <BarChart data={chartData}>
          <XAxis 
            dataKey="d" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} 
            dy={10}
          />
          <YAxis hide domain={[0, maxY]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <ReferenceLine y={waterGoal} stroke="#10b981" strokeDasharray="6 6" opacity={0.3} />

          <Bar
            dataKey="ml"
            onClick={(_, index) => {
              setActiveIndex(index === activeIndex ? null : index);
            }}
            radius={[12, 12, 4, 4]}
            maxBarSize={38}
            animationDuration={1200}
          >
            {chartData.map((entry, index) => {
              const isSelected = activeIndex === index;
              const isToday = entry.isToday;
              const isGoalMet = entry.ml >= waterGoal;

              return (
                <Cell
                  key={`cell-${entry.d}-${index}`} // ✅ FIX KEY
                  fill={
                    isToday
                      ? '#38bdf8'
                      : isGoalMet
                      ? '#10b981'
                      : '#1e293b'
                  }
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  fillOpacity={activeIndex === null || isSelected ? 1 : 0.4}
                  style={{ 
                    filter: isSelected ? 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.6))' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              );
            })}

            <LabelList
              dataKey="ml"
              position="top"
              fill="#94a3b8"
              fontSize={11}
              fontWeight={800}
               formatter={(value) => {
                 if (value == null || typeof value === 'boolean') return '';
                 return Number(value) > 0 ? `${value}ml` : '';
               }}
              />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
