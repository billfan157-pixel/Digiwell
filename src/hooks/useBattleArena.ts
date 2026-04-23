import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useBattleArena(profile: any, isOpen: boolean, onSpendCoins: (amount: number) => Promise<boolean>) {
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(100);

  const loadArenaData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    
    try {
      const { data: battles, error } = await supabase
        .from('hydration_battles')
        .select(`
          *,
          challenger:profiles!challenger_id(id, nickname, avatar_url, water_today, water_goal),
          opponent:profiles!opponent_id(id, nickname, avatar_url, water_today, water_goal)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      let currentActive = battles?.find((b: any) => b.status === 'active');
      
      if (currentActive) {
        const battleDay = new Date(currentActive.created_at).toISOString().split('T')[0];
        if (battleDay < today) {
          const { data: result, error } = await supabase.rpc('resolve_stale_battle', {
            battle_id: currentActive.id
          });
          if (!error && result) {
            if (result.status === 'won') toast.success(`🎉 Trận hôm qua đã kết thúc. Bạn THẮNG và ẵm trọn ${result.reward} Vàng!`, { duration: 8000 });
            else if (result.status === 'draw') toast.info(`Trận đấu hôm qua HÒA. Đã hoàn trả ${result.reward} Vàng.`);
            else if (result.status === 'lost') toast.error(`Thua cuộc! Đối thủ đã uống nhiều hơn bạn vào hôm qua.`);
          }
          currentActive = null; 
        }
      }

      setActiveBattle(currentActive);
      setPendingInvites(battles?.filter((b: any) => b.status === 'pending' && b.opponent_id === profile.id) || []);

      if (!currentActive) {
        const { data: users } = await supabase.from('profiles').select('id, nickname, level, avatar_url').neq('id', profile.id).limit(10);
        setOpponents(users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu Đấu trường');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) loadArenaData();
  }, [isOpen, loadArenaData]);

  const handleChallenge = async (opponentId: string) => {
    if (profile.coins < stakeAmount) return toast.error('Không đủ Vàng để cược!');
    const success = await onSpendCoins(stakeAmount);
    if (!success) return;

    const tid = toast.loading('Đang rải chiến thư...');
    try {
      await supabase.from('hydration_battles').insert({
        challenger_id: profile.id, opponent_id: opponentId, stake_coins: stakeAmount, status: 'pending'
      });
      toast.success('Đã gửi chiến thư!', { id: tid });
      loadArenaData();
    } catch (err) {
      toast.error('Lỗi gửi thách đấu', { id: tid });
    }
  };

  const handleAccept = async (battle: any) => {
    if (profile.coins < battle.stake_coins) return toast.error('Sếp không đủ Vàng để theo cược!');
    const success = await onSpendCoins(battle.stake_coins);
    if (!success) return;

    const tid = toast.loading('Đang lên đài...');
    try {
      await supabase.from('hydration_battles').update({ status: 'active' }).eq('id', battle.id);
      const otherPending = pendingInvites.filter((b: any) => b.id !== battle.id);
      for (const p of otherPending) {
        await supabase.from('hydration_battles').update({ status: 'declined' }).eq('id', p.id);
      }
      toast.success('🔥 Bắt đầu cuộc đua!', { id: tid });
      loadArenaData();
    } catch (err) {
      toast.error('Lỗi vào trận', { id: tid });
    }
  };

  return { activeBattle, pendingInvites, opponents, isLoading, stakeAmount, setStakeAmount, handleChallenge, handleAccept };
}