import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiParticlesProps {
  trigger: boolean;
}

export const ConfettiParticles: React.FC<ConfettiParticlesProps> = ({ trigger }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    // Khi prop `trigger` chuyển sang true, kích hoạt tạo hạt pháo
    if (trigger) {
      const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: Date.now() + i,
        // Random góc bắn ra xung quanh (tỏa ra 4 phía)
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 1) * 400 - 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      
      setParticles(newParticles);
      
      // Tự động dọn dẹp particles sau 3 giây để tối ưu bộ nhớ
      const timer = setTimeout(() => setParticles([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-50">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ 
              x: p.x, 
              y: p.y + 300, // Rơi xuống theo chiều dọc
              scale: [0, 1.5, 1],
              rotate: [0, Math.random() * 360, Math.random() * 720], // Xoay vòng trong không gian
              opacity: [1, 1, 0] // Mờ dần khi rơi 
            }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: p.color }}
            className="absolute w-3 h-3 rounded-sm shadow-sm"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConfettiParticles;