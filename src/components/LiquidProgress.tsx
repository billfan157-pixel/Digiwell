import React from 'react';
import { motion } from 'framer-motion';

interface LiquidProgressProps {
  percentage: number; // 0 đến 100
}

export const LiquidProgress: React.FC<LiquidProgressProps> = ({ percentage }) => {
  // Giới hạn an toàn từ 0 - 100%
  const clamped = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className="relative w-56 h-56 rounded-full border-[6px] border-slate-800 bg-slate-900 overflow-hidden shadow-2xl shadow-cyan-900/30 mx-auto">
      {/* Vùng sóng nước sẽ dâng lên từ dưới đáy */}
      <motion.div
        className="absolute inset-0 bg-cyan-500 origin-bottom"
        initial={{ y: "100%" }}
        animate={{ y: `${100 - clamped}%` }}
        transition={{ type: 'spring', damping: 15, stiffness: 40 }}
      >
        {/* Lớp SVG sóng trước (nhanh hơn, đậm màu hơn) */}
        <motion.div
          className="absolute bottom-full left-0 w-[200%] h-12 flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <svg className="w-full h-full text-cyan-500 drop-shadow-md" viewBox="0 0 800 100" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,50 C100,0 300,100 400,50 C500,0 700,100 800,50 L800,100 L0,100 Z" />
          </svg>
        </motion.div>
        
        {/* Lớp SVG sóng sau (chậm hơn, mờ hơn để tạo chiều sâu 3D) */}
        <motion.div
          className="absolute bottom-full left-0 w-[200%] h-14 flex opacity-40 mix-blend-screen"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
        >
          <svg className="w-full h-full text-cyan-300" viewBox="0 0 800 100" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,50 C150,100 250,0 400,50 C550,100 650,0 800,50 L800,100 L0,100 Z" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LiquidProgress;