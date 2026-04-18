import React from 'react';
import {
  Droplets,
  Sun,
  Dumbbell,
  Utensils,
  HeartPulse,
  Coffee
} from 'lucide-react';

interface BreakdownData {
  base: number;
  weatherExtra?: number;
  workoutExtra?: number;
  fastingExtra?: number;
  healthExtra?: number;
  dietExtra?: number;
  total: number;
  weatherText?: string;
}

interface WaterBreakdownProps {
  breakdown: BreakdownData;
}

export default function WaterBreakdown({ breakdown }: WaterBreakdownProps) {
  const rows = [
    {
      key: 'base',
      label: 'Nhu cầu cơ bản',
      value: breakdown.base,
      icon: <Droplets size={16} />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      note: 'Theo cân nặng, tuổi và giới tính'
    },
    breakdown.weatherExtra && breakdown.weatherExtra > 0
      ? {
          key: 'weather',
          label: 'Thời tiết',
          value: breakdown.weatherExtra,
          icon: <Sun size={16} />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          note: breakdown.weatherText || 'Nhiệt độ môi trường'
        }
      : null,
    breakdown.workoutExtra && breakdown.workoutExtra > 0
      ? {
          key: 'workout',
          label: 'Vận động',
          value: breakdown.workoutExtra,
          icon: <Dumbbell size={16} />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          note: 'Hoạt động thể chất trong ngày'
        }
      : null,
    breakdown.fastingExtra && breakdown.fastingExtra > 0
      ? {
          key: 'fasting',
          label: 'Ăn uống',
          value: breakdown.fastingExtra,
          icon: <Utensils size={16} />,
          color: 'text-violet-400',
          bg: 'bg-violet-500/10',
          note: 'Ảnh hưởng từ chế độ ăn'
        }
      : null,
    breakdown.healthExtra && breakdown.healthExtra > 0
      ? {
          key: 'health',
          label: 'Sức khỏe',
          value: breakdown.healthExtra,
          icon: <HeartPulse size={16} />,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          note: 'Tình trạng cơ thể hiện tại'
        }
      : null,
    breakdown.dietExtra && breakdown.dietExtra > 0
      ? {
          key: 'diet',
          label: 'Cafe / muối',
          value: breakdown.dietExtra,
          icon: <Coffee size={16} />,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          note: 'Thức uống lợi tiểu hoặc ăn mặn'
        }
      : null
  ].filter(Boolean);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-lg">
          Vì sao hôm nay cần uống
        </h3>
        <span className="text-cyan-400 font-black text-xl">
          {breakdown.total} ml
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((item: any) => (
          <div
            key={item.key}
            className="rounded-2xl border border-white/5 bg-white/5 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}
                >
                  {item.icon}
                </div>

                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.label}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {item.note}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-white font-bold">
                  +{item.value} ml
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-slate-400 text-sm font-medium">
          Tổng mục tiêu hôm nay
        </span>
        <span className="text-cyan-400 text-2xl font-black">
          {breakdown.total} ml
        </span>
      </div>
    </div>
  );
}