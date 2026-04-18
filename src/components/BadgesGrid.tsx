import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Medal, Droplet, Target, Anchor, Beer, Moon, Trophy, CircleDashed, Star, Award, Flame, Zap } from 'lucide-react';
import { toast } from 'sonner';
// @ts-ignore
import confetti from 'canvas-confetti';

interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  description: string;
}

const iconMap: Record<string, React.ElementType> = {
  'droplet': Droplet,
  'ferris-wheel': Target, // Map ferris-wheel sang Target
  'target': Target,
  'anchor': Anchor,
  'beer': Beer,
  'moon': Moon,
  'trophy': Trophy,
  'circle-dashed': CircleDashed,
  'star': Star,
  'award': Award,
  'flame': Flame,
  'zap': Zap
};

export default function BadgesGrid({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId || userId === 'undefined') return;
      setLoading(true);
      try {
        const [badgesRes, userBadgesRes] = await Promise.all([
          supabase.from('badges').select('*').order('rarity', { ascending: false }),
          supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        ]);

        if (badgesRes.error) throw badgesRes.error;
        if (userBadgesRes.error) throw userBadgesRes.error;

        setBadges(badgesRes.data || []);
        setUnlockedBadgeIds(new Set((userBadgesRes.data || []).map((ub: any) => ub.badge_id)));
      } catch (error: any) {
        console.error("Error fetching badges:", error);
        toast.error("Không thể tải danh sách huy hiệu");
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    // Lắng nghe Realtime từ Supabase khi có huy hiệu mới được chèn vào
    const channel = supabase
      .channel('badges_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_badges', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const newBadgeId = payload.new.badge_id;
          
          // Tự động cập nhật UI: Chuyển huy hiệu sang trạng thái mở khóa
          setUnlockedBadgeIds(prev => new Set(prev).add(newBadgeId));
          
          // Kích hoạt hiệu ứng Confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            zIndex: 9999,
            colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7'] // Cyan, Amber, Emerald, Purple
          });

          toast.success("Tuyệt vời! Bạn vừa mở khóa một Huy hiệu mới!", { icon: '🎉' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return null;
  if (badges.length === 0) return null;

  // Phân bổ màu sắc dựa trên Rarity
  const getRarityStyles = (rarity: string, isUnlocked: boolean) => {
    if (!isUnlocked) return 'bg-slate-900/60 backdrop-blur-sm border-slate-800 text-slate-500 grayscale opacity-50';

    const r = rarity.toLowerCase();
    if (r === 'legendary') return 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
    if (r === 'epic') return 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
    if (r === 'rare') return 'bg-slate-300/20 border-slate-400/40 text-slate-300';
    if (r === 'animated') return 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)]';
    return 'bg-orange-500/20 border-orange-500/40 text-orange-400'; // common
  };

  // Chỉ hiển thị 3 badges đầu tiên ban đầu
  const displayedBadges = showAllBadges ? badges : badges.slice(0, 3);
  const hasMoreBadges = badges.length > 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center px-2">
        <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
          <Medal size={20} className="text-yellow-400" />
          Bộ sưu tập Huy hiệu
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {displayedBadges.map((badge, index) => {
          const isUnlocked = unlockedBadgeIds.has(badge.id);
          const rarityStyles = getRarityStyles(badge.rarity, isUnlocked);
          const Icon = badge.icon && iconMap[badge.icon.toLowerCase()] ? iconMap[badge.icon.toLowerCase()] : Trophy;
          // Kiểm tra xem icon có phải là một đường dẫn ảnh URL (từ Supabase Storage) hay không
          const isImageUrl = badge.icon && (badge.icon.startsWith('http') || badge.icon.startsWith('/'));

          return (
            <div key={badge.id} className={`flex flex-col items-center p-4 rounded-3xl border text-center transition-all duration-500 ${rarityStyles}`}>
              <div className="mb-3 drop-shadow-lg transform hover:scale-110 transition-transform">
                {isImageUrl ? (
                  <img
                    src={badge.icon}
                    alt={badge.name}
                    className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-[floating_3s_ease-in-out_infinite]"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                ) : (
                  <Icon size={32} />
                )}
              </div>
              <p className="font-black text-[10px] uppercase tracking-wider mb-1.5 w-full leading-tight">{badge.name}</p>
              <p className="text-[9px] opacity-80 line-clamp-2 leading-tight font-medium">{badge.description}</p>
            </div>
          );
        })}
      </div>

      {/* Text "Tất cả" mờ ở góc nếu có nhiều hơn 3 badges */}
      {hasMoreBadges && (
        <div className="flex justify-end mt-2 px-2">
          <button
            onClick={() => setShowAllBadges(!showAllBadges)}
            className="text-slate-400 hover:text-slate-300 text-xs font-medium opacity-60 hover:opacity-100 transition-all duration-200 active:scale-95"
          >
            {showAllBadges ? 'Ẩn bớt' : `Tất cả`}
          </button>
        </div>
      )}
    </div>
  );
}