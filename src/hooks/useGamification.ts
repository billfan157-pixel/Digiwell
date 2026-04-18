import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Challenge, UserBadge, UserChallenge } from '@/types/gamification';

export function useGamification(userId: string | undefined) {
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Danh sách Thử thách từ Master Table
  const fetchAvailableChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAvailableChallenges(data as Challenge[]);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải danh sách thử thách');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch Thử thách USER ĐANG CHẠY (Tao đã bổ sung hàm này cho đệ)
  const fetchUserChallenges = useCallback(async () => {
    if (!userId || userId === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*, challenge:challenges(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      if (data) setUserChallenges(data as UserChallenge[]);
    } catch (err: any) {
      console.error('Lỗi tải thử thách của user:', err.message);
    }
  }, [userId]);

  // 3. Fetch Huy hiệu đã mở khoá của User
  const fetchUserBadges = useCallback(async () => {
    if (!userId || userId === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      if (data) setUserBadges(data as UserBadge[]);
    } catch (err: any) {
      console.error('Lỗi tải huy hiệu:', err.message);
    }
  }, [userId]);

  // 4. Tham gia Thử thách (Giao dịch an toàn qua RPC)
  const joinChallenge = async (challengeId: string, stakeWp: number) => {
    if (!userId || userId === 'undefined') {
      toast.error('Bạn cần đăng nhập để tham gia!');
      return false;
    }
    const toastId = toast.loading('Đang làm thủ tục đóng họ...');

    try {
      // Gọi hàm RPC Backend
      const { error } = await supabase.rpc('join_challenge', {
        p_user_id: userId,
        p_challenge_id: challengeId,
        p_stake_wp: stakeWp
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Chốt kèo thành công! Đã cược ${stakeWp} WP.`, { id: toastId, icon: '🔥' });
      
      // Optimistic Update: Thêm thử thách vào state hiện tại để UI cập nhật tức thì
      const joinedChallenge = availableChallenges.find(c => c.id === challengeId);
      if (joinedChallenge) {
        setUserChallenges(prev => [{
          id: `temp-${Date.now()}`,
          user_id: userId,
          challenge_id: challengeId,
          status: 'active',
          progress_days: 0,
          joined_at: new Date().toISOString(),
          challenge: joinedChallenge
        }, ...prev]);
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tham gia thử thách', { id: toastId });
      return false;
    }
  };

  // Đã export đầy đủ các hàm ra ngoài
  return {
    availableChallenges, 
    userChallenges, 
    userBadges, 
    isLoading,
    fetchAvailableChallenges, 
    fetchUserChallenges, 
    fetchUserBadges, 
    joinChallenge
  };
}