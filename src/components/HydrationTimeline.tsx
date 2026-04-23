import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { HydrationSchedule } from '../lib/HydrationEngine';

interface HydrationTimelineProps {
  schedule: HydrationSchedule[];
}

export default function HydrationTimeline({ schedule }: HydrationTimelineProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    updateTime();
    // Cập nhật lại thời gian mỗi phút để UI timeline thay đổi tự động
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!schedule || schedule.length === 0) return null;

  let nextIndexFound = false;

  return (
    <div>
      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Lịch trình đề xuất</h4>
      <div className="relative pl-5 border-l-[3px] border-slate-800 space-y-6 ml-2">
        {schedule.map((item, index) => {
          // So sánh giờ dạng chuỗi "06:30" < "14:00"
          const isPast = item.time < currentTime;
          
          // Mốc thời gian tiếp theo gần nhất
          let isNext = false;
          if (!isPast && !nextIndexFound) {
            isNext = true;
            nextIndexFound = true;
          }
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col gap-1.5 ${
                isPast ? 'opacity-50' : isNext ? 'opacity-100 scale-105 origin-left' : 'opacity-70'
              } transition-all duration-300`}
            >
              {/* Dấu chấm trên trục thời gian */}
              <div
                className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-[3px] bg-slate-900 transition-colors duration-300 ${
                  isPast ? 'border-emerald-500 bg-emerald-500' : isNext ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse' : 'border-slate-600'
                }`}
              />

              {/* Nội dung Node */}
              <div className="flex items-center justify-between">
                <span className={`font-black tracking-wider ${isNext ? 'text-cyan-400' : isPast ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {item.time}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${isNext ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : isPast ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/80 text-slate-500'}`}>
                  {item.amount} ml
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isNext ? 'text-slate-300' : 'text-slate-500'}`}>
                {item.note}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}