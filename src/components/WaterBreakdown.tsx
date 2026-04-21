import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Sun, Zap, Utensils, HeartPulse, Activity } from 'lucide-react';
import type { WaterIntakeBreakdown as RawBreakdown } from '../lib/HydrationEngine';

const BreakdownItem = ({ icon, label, value, colorClass, delay }: { icon: React.ReactNode, label: string, value: number, colorClass: string, delay: number }) => {
  if (value === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/5 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      </div>
      <span className={`text-sm font-bold ${value > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {value > 0 ? '+' : ''}{value.toLocaleString('vi-VN')}ml
      </span>
    </motion.div>
  );
};

export default function WaterBreakdown({ breakdown }: { breakdown: RawBreakdown }) {
  const items = [
    {
      icon: <Droplet size={16} />,
      label: 'Mục tiêu cơ bản',
      value: (breakdown.base || 0) + (breakdown.ageAdj || 0) + (breakdown.genderAdj || 0),
      color: 'bg-cyan-500/20 text-cyan-400',
    },
    {
      icon: <Sun size={16} />,
      label: 'Bù trừ thời tiết',
      value: breakdown.climateAdj || 0,
      color: 'bg-orange-500/20 text-orange-400',
    },
    {
      icon: <Zap size={16} />,
      label: 'Bù trừ vận động (Nền)',
      value: breakdown.activityAdj || 0,
      color: 'bg-fuchsia-500/20 text-fuchsia-400',
    },
    {
      icon: <Activity size={16} />,
      label: 'Bù trừ tập luyện (Watch)',
      value: breakdown.exerciseAdj || 0,
      color: 'bg-pink-500/20 text-pink-400',
    },
    {
      icon: <Utensils size={16} />,
      label: 'Bù trừ ăn uống',
      value: (breakdown.foodWaterAdj || 0) + (breakdown.dietAdj || 0),
      color: 'bg-lime-500/20 text-lime-400',
    },
    {
      icon: <HeartPulse size={16} />,
      label: 'Tình trạng sức khỏe',
      value: breakdown.healthAdj || 0,
      color: 'bg-rose-500/20 text-rose-400',
    },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Phân tích mục tiêu</h4>
      {items.map((item, index) => (
        <BreakdownItem key={item.label} icon={item.icon} label={item.label} value={item.value} colorClass={item.color} delay={0.1 * (index + 1)} />
      ))}
    </div>
  );
}