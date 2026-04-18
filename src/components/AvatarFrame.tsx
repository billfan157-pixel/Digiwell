import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AvatarFrameProps {
  level: number;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export function getRankTitle(level: number): string {
  if (level >= 100) return "Thủy Thần";
  if (level >= 70) return "Huyền Thoại";
  if (level >= 50) return "Tinh Anh";
  if (level >= 30) return "Chiến Binh";
  if (level >= 15) return "Người Kiên Trì";
  return "Tân Binh";
}

// Hàm lấy Cấu hình Hiệu ứng dựa trên Level
export const getFrameEffects = (level: number) => {
  const safeLevel = Math.max(level, 1);

  // Mặc định: Tân Binh (< 15) - Chỉ border mờ
  let config = {
    title: "TÂN BINH",
    textColor: "text-slate-400",
    badgeColor: "bg-slate-700",
    frameClasses: "border-slate-700 shadow-none",
    effects: <></>,
  };

  // Cấp 15-29: Người Kiên Trì - Border sáng nhẹ
  if (safeLevel >= 15) {
    config = {
      title: "KIÊN TRÌ",
      textColor: "text-blue-400",
      badgeColor: "bg-blue-900",
      frameClasses: "border-blue-700/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
      effects: <></>,
    };
  }

  // Cấp 30-49: Chiến Binh - Border xanh đậm, shadow tỏa nhiệt
  if (safeLevel >= 30) {
    config = {
      title: "CHIẾN BINH",
      textColor: "text-blue-200",
      badgeColor: "bg-gradient-to-br from-blue-700 to-indigo-800",
      frameClasses: "border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]",
      effects: <></>,
    };
  }

  // Cấp 50-69: Tinh Anh (Lửa Tím)
  if (safeLevel >= 50) {
    config = {
      title: "TINH ANH",
      textColor: "text-purple-300",
      badgeColor: "bg-gradient-to-r from-purple-700 to-pink-700",
      frameClasses: "border-purple-600/50",
      effects: (
        // Hiệu ứng hào quang tím tỏa ra
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute -inset-1 rounded-full bg-purple-500/20 blur-lg"
        />
      ),
    };
  }

  // Cấp 70-99: Huyền Thoại (Hào Quang Vàng)
  if (safeLevel >= 70) {
    config = {
      title: "HUYỀN THOẠI",
      textColor: "text-yellow-100",
      badgeColor: "bg-gradient-to-r from-yellow-500 via-amber-600 to-red-600",
      frameClasses: "border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.7)]",
      effects: (
        // Hiệu ứng "tia sét" vàng chạy quanh
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-300/60 blur-[1px]"
        />
      ),
    };
  }

  // Cấp 100+: Thủy Thần (Hiệu ứng Dòng chảy Cyan)
  if (safeLevel >= 100) {
    config = {
      title: "THỦY THẦN",
      textColor: "text-cyan-100",
      badgeColor: "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600",
      frameClasses: "border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.9)]",
      effects: (
        // Hiệu ứng "dòng nước" xoáy quanh Avatar
        <>
          <motion.div
            animate={{ rotate: [0, -360] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute -inset-3 rounded-full border-2 border-cyan-400/60 blur-[2px]"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -inset-2 rounded-full border border-blue-500/80 blur-[3px]"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-xl"
          />
        </>
      ),
    };
  }

  return config;
};

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const imageSizeClasses = {
  sm: "w-full h-full",
  md: "w-full h-full",
  lg: "w-full h-full",
  xl: "w-full h-full",
};

// Component chính
export default function AvatarFrame({ level, avatarUrl, size = 'md', showBadge = true }: AvatarFrameProps) {
  const { frameClasses, badgeColor, textColor, effects } = getFrameEffects(level);
  const currentSize = sizeClasses[size];
  const imageSize = imageSizeClasses[size];

  return (
    <div className={`relative ${currentSize} flex items-center justify-center`}>
      {/* 1. Hiệu ứng động bọc ngoài cùng (Chỉ có ở Rank cao) */}
      <AnimatePresence>
        {effects}
      </AnimatePresence>

      {/* 2. Khung chính chứa Avatar */}
      <div className={`relative w-full h-full rounded-full p-[3px] bg-slate-950 z-10 ${frameClasses} transition-all`}>
        <img 
          src={avatarUrl || "/default-avatar.png"} 
          alt="avatar" 
          className={`rounded-full object-cover ${imageSize}`} 
        />
        
        {/* 3. Badge hiển thị số Level và Danh hiệu */}
        {showBadge && (
          <motion.div 
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`absolute -bottom-1 -right-1 ${badgeColor} rounded-full px-2 py-0.5 border border-white/20 z-20 shadow-md flex items-center gap-1`}
          >
            {level >= 70 && <Sparkles size={10} className="text-white animate-pulse" />}
            <span className="text-white font-black text-[10px] tracking-tighter">
              {level}
            </span >
            {level >= 30 && (
                <span className={`${textColor} text-[9px] font-bold`}>|</span>
            )}
             {level >= 30 && (
                 <span className={`${textColor} text-[9px] font-bold uppercase`}>{getRankTitle(level)}</span>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
}