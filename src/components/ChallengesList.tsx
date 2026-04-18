import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Target, Lock, CheckCircle2, Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  stake_wp: number;
  reward_wp: number;
  duration_days: number;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  status: string;
  progress_days: number;
  joined_at: string;
}

interface ChallengesListProps {
  userId: string;
  userPoints: number;
  onChallengeJoined: (stakedWp: number) => void;
}

export default function ChallengesList({ userId, userPoints, onChallengeJoined }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchData = async () => {
    if (!userId || userId === 'undefined') return;
    setLoading(true);
    try {
      const [challengesRes, userChallengesRes] = await Promise.all([
        supabase.from('challenges').select('*').order('stake_wp', { ascending: true }),
        supabase.from('user_challenges').select('*').eq('user_id', userId).eq('status', 'active')
      ]);
      
      if (challengesRes.error) throw challengesRes.error;
      if (userChallengesRes.error) throw userChallengesRes.error;

      setChallenges(challengesRes.data || []);
      setUserChallenges(userChallengesRes.data || []);
    } catch (error: any) {
      console.error("Error fetching challenges:", error);
      toast.error("Không thể tải danh sách thử thách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleJoin = async (challenge: Challenge) => {
    if (userPoints < challenge.stake_wp) {
      toast.error("Không đủ WP để tham gia thử thách này!");
      return;
    }

    setJoiningId(challenge.id);
    const toastId = toast.loading("Đang đăng ký tham gia...");

    try {
      const { error } = await supabase.rpc('join_challenge', {
        p_user_id: userId,
        p_challenge_id: challenge.id,
        p_stake_wp: challenge.stake_wp
      });

      if (error) throw error;

      toast.success(`Đã tham gia: ${challenge.title}`, { id: toastId });

      // Notify the parent component that the challenge was joined and pass the staked amount.
      onChallengeJoined(challenge.stake_wp);
      
      // Improvement: Only refetch user challenges instead of all data.
      const { data: updatedUserChallenges, error: refetchError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (refetchError) throw refetchError;
      setUserChallenges(updatedUserChallenges || []);

    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error("Lỗi khi tham gia thử thách. Vui lòng thử lại.", { id: toastId });
    } finally {
      setJoiningId(null);
    }
  };
  
  const categories = useMemo(() => ['all', ...Array.from(new Set(challenges.map(c => c.category).filter(Boolean)))], [challenges]);
  const filteredChallenges = useMemo(() => challenges.filter(c => activeCategory === 'all' || c.category === activeCategory), [challenges, activeCategory]);

  const ChallengeSkeleton = () => (
    <div className="relative overflow-hidden p-5 rounded-[2rem] border border-slate-800 bg-slate-900/40 animate-pulse">
      <div className="flex justify-between items-start mb-3"><div className="pr-3 space-y-2"><div className="h-5 w-48 bg-slate-700/50 rounded"></div><div className="h-3 w-64 bg-slate-700/50 rounded"></div></div><div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50"><div className="h-2 w-16 bg-slate-700/50 rounded mb-1"></div><div className="h-5 w-12 bg-slate-700/50 rounded"></div></div></div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50"><div className="flex items-center gap-2"><div className="h-8 w-20 bg-slate-800/80 rounded-lg"></div><div className="h-8 w-24 bg-slate-800/80 rounded-lg"></div></div><div className="h-10 w-24 bg-slate-800/80 rounded-xl"></div></div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 animate-pulse"><div className="h-6 w-40 bg-slate-700/50 rounded"></div><div className="h-6 w-48 bg-slate-800 rounded-lg"></div></div>
        <div className="grid grid-cols-1 gap-3">
          <ChallengeSkeleton />
          <ChallengeSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
          <Target size={20} className="text-cyan-400" />
          Thử thách
        </h2>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">Cược WP để nhận thưởng</span>
      </div>

      {categories.length > 2 && (
        <div className="flex gap-2 p-1 bg-slate-900/80 rounded-full border border-slate-700/50">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors capitalize ${activeCategory === category ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              {category === 'all' ? 'Tất cả' : category}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filteredChallenges.map(challenge => {
          const activeEntry = userChallenges.find(uc => uc.challenge_id === challenge.id);
          const isActive = !!activeEntry;
          const canAfford = userPoints >= challenge.stake_wp;
          const isJoining = joiningId === challenge.id;

          return (
            <div 
              key={challenge.id}
              className={`relative overflow-hidden p-5 rounded-[2rem] border transition-all duration-300 ${
                isActive 
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="pr-3">
                  <h3 className="font-bold text-white text-lg tracking-tight leading-tight">{challenge.title}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{challenge.description}</p>
                </div>
                {isActive ? (
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 whitespace-nowrap shadow-inner flex-shrink-0">
                    <CheckCircle2 size={12} /> Đang chạy
                  </div>
                ) : (
                  <div className="text-right whitespace-nowrap flex-shrink-0 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Phần thưởng</div>
                    <div className="text-yellow-400 font-black text-sm flex items-center gap-1">
                      <Trophy size={14} className="drop-shadow-md" /> +{challenge.reward_wp}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <Flame size={12} className="text-orange-400" />
                    {challenge.duration_days} ngày
                  </div>
                  {!isActive && (
                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${canAfford ? 'text-slate-300 bg-slate-800/80 border-slate-700' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                      Cược: {challenge.stake_wp} WP
                    </div>
                  )}
                </div>

                {!isActive && (
                  <button
                    onClick={() => handleJoin(challenge)}
                    disabled={!canAfford || isJoining}
                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 min-w-[100px] ${
                      canAfford 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isJoining ? <Loader2 size={14} className="animate-spin" /> : canAfford ? 'Tham gia' : <><Lock size={12} /> Thiếu WP</>}
                  </button>
                )}
                
                {isActive && activeEntry && (
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    Tiến độ thực hiện: {activeEntry.progress_days} / {challenge.duration_days} ngày
                  </div>
                )}
              </div>

              {/* Thanh tiến độ siêu mỏng ở đáy Card */}
              {isActive && activeEntry && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20">
                  <div 
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min((activeEntry.progress_days / challenge.duration_days) * 100, 100)}%` }} 
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {filteredChallenges.length === 0 && !loading && (
          <div className="text-center p-8 border border-dashed border-slate-700 rounded-[2rem] text-slate-500 text-sm">
            Đang cập nhật thêm thử thách mới. Bạn quay lại sau nhé!
          </div>
        )}
      </div>
    </div>
  );
}