// ============================================================
// DigiWell — useChallenges Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { claimChallengeReward } from '@/lib/questEngine';
import type { Challenge, UserChallenge, RankTier } from '../config/questConfig';

export function useChallenges(userId: string | undefined, userRank: RankTier = 1) {
  const [available,       setAvailable]       = useState<Challenge[]>([]);
  const [userChallenges,  setUserChallenges]  = useState<UserChallenge[]>([]);
  const [loading,         setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Challenge available (rank đủ điều kiện, chưa join hoặc đã fail)
      const [availableRes, userRes] = await Promise.all([
        supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .lte('min_rank', userRank)
          .order('min_rank'),

        supabase
          .from('user_challenges')
          .select(`
            id, challenge_id, status, current_value,
            milestones_reached, days_completed, days_failed,
            joined_at, completed_at,
            challenge:challenges (*)
          `)
          .eq('user_id', userId)
          .order('joined_at', { ascending: false }),
      ]);

      setAvailable((availableRes.data ?? []) as Challenge[]);
      setUserChallenges((userRes.data ?? []) as unknown as UserChallenge[]);
    } catch (err) {
      console.error('[useChallenges] fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRank]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Join challenge
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!userId) return;

    // Check nếu đã join rồi
    const alreadyJoined = userChallenges.some(
      uc => uc.challenge_id === challengeId && uc.status === 'joined',
    );
    if (alreadyJoined) {
      toast.error('Bạn đang tham gia challenge này rồi!');
      return;
    }

    const { data, error } = await supabase
      .from('user_challenges')
      .insert({ user_id: userId, challenge_id: challengeId })
      .select(`
        id, challenge_id, status, current_value,
        milestones_reached, days_completed, days_failed,
        joined_at, completed_at,
        challenge:challenges (*)
      `)
      .single();

    if (error) {
      toast.error('Không thể tham gia lúc này');
      return;
    }

    setUserChallenges(prev => [data as unknown as UserChallenge, ...prev]);
    toast.success('Đã tham gia challenge!');
  }, [userId, userChallenges]);

  // Abandon challenge
  const abandonChallenge = useCallback(async (userChallengeId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_challenges')
      .update({ status: 'abandoned' })
      .eq('id', userChallengeId)
      .eq('user_id', userId);

    if (error) {
      toast.error('Không thể bỏ challenge lúc này');
      return;
    }

    setUserChallenges(prev =>
      prev.map(uc =>
        uc.id === userChallengeId ? { ...uc, status: 'abandoned' } : uc,
      ),
    );
    toast('Đã bỏ challenge.');
  }, [userId]);

  // Claim reward
  const claim = useCallback(async (userChallengeId: string) => {
    if (!userId) return;
    await claimChallengeReward(userId, userChallengeId);
    setUserChallenges(prev =>
      prev.map(uc =>
        uc.id === userChallengeId
          ? { ...uc, status: 'completed', completed_at: new Date().toISOString() }
          : uc,
      ),
    );
  }, [userId]);

  // Filter helpers
  const activeUserChallenges    = userChallenges.filter(uc => uc.status === 'joined');
  const completedUserChallenges = userChallenges.filter(uc => uc.status === 'completed');
  const availableToJoin         = available.filter(
    ch => !userChallenges.some(
      uc => uc.challenge_id === ch.id && ['joined', 'completed'].includes(uc.status),
    ),
  );

  return {
    available,
    availableToJoin,
    userChallenges,
    activeUserChallenges,
    completedUserChallenges,
    loading,
    joinChallenge,
    abandonChallenge,
    claimChallenge: claim,
    refetch: fetchAll,
  };
}