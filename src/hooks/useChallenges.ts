import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Challenge {
  id: string;
  type: 'time_limited' | 'milestone';
  slug: string;
  title: string;
  description: string;
  duration_days: number | null;
  target_value: number | null;
  reward_exp: number;
  reward_coins: number;
  min_rank: number;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'elite' | 'mythic';
  premium_only: boolean;
}

export interface UserChallenge {
  id: string;
  challenge_id: string;
  status: string;
  current_value: number;
  days_completed: number;
  days_failed: number;
  joined_at: string;
}

export function useChallenges(userId: string) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!userId || userId === 'undefined') return;
    setLoading(true);
    try {
      const [challengesRes, userChallengesRes] = await Promise.all([
        supabase.from('challenges').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('user_challenges').select('*').eq('user_id', userId).eq('status', 'joined')
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
  }, [userId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleJoinChallenge = async (challenge: Challenge) => {
    setJoiningId(challenge.id);
    const toastId = toast.loading("Đang đăng ký tham gia...");

    try {
      const { error } = await supabase.from('user_challenges').insert({
        user_id: userId,
        challenge_id: challenge.id,
        status: 'joined',
        current_value: 0,
        days_completed: 0,
        days_failed: 0,
        milestones_reached: []
      });

      if (error) throw error;

      toast.success(`Đã tham gia: ${challenge.title}`, { id: toastId });
      
      const { data: updatedUserChallenges, error: refetchError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'joined');

      if (refetchError) throw refetchError;
      setUserChallenges(updatedUserChallenges || []);

    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error("Lỗi khi tham gia thử thách. Vui lòng thử lại.", { id: toastId });
    } finally {
      setJoiningId(null);
    }
  };

  return { challenges, userChallenges, loading, joiningId, handleJoinChallenge };
}