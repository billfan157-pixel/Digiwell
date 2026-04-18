import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useClubs(userId?: string) {
  const [myClub, setMyClub] = useState<any>(null);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // =========================
  // LOAD DATA
  // =========================
  const fetchClubData = useCallback(async () => {
    if (!userId) {
      setMyClub(null);
      setAllClubs([]);
      return;
    }

    setLoading(true);

    try {
      // user current club
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select(`
          role,
          club_id,
          clubs (
            id,
            name,
            description,
            avatar_url,
            owner_id,
            daily_goal,
            is_private,
            created_at
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) throw memberError;

      const clubData = memberData?.clubs
        ? {
            ...memberData.clubs,
            role: memberData.role
          }
        : null;

      setMyClub(clubData);

      // all clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select(`
          *,
          club_members(count)
        `)
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;

      const normalized =
        clubsData?.map((club: any) => ({
          ...club,
          member_count: club.club_members?.[0]?.count ?? 0
        })) || [];

      setAllClubs(normalized);
    } catch (error: any) {
      console.error('fetchClubData error:', error);
      toast.error('Không tải được dữ liệu club');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =========================
  // JOIN CLUB
  // =========================
  const joinClub = useCallback(
    async (clubId: string) => {
      if (!userId || joining) return;

      try {
        setJoining(true);

        // leave current first
        await supabase
          .from('club_members')
          .delete()
          .eq('user_id', userId);

        const { error } = await supabase
          .from('club_members')
          .insert({
            user_id: userId,
            club_id: clubId,
            role: 'member'
          });

        if (error) throw error;

        toast.success('Đã tham gia câu lạc bộ');
        fetchClubData();
      } catch (error: any) {
        console.error(error);
        toast.error('Không thể tham gia club');
      } finally {
        setJoining(false);
      }
    },
    [userId, joining, fetchClubData]
  );

  // =========================
  // LEAVE CLUB
  // =========================
  const leaveClub = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setMyClub(null);
      toast.success('Đã rời câu lạc bộ');
      fetchClubData();
    } catch (error) {
      toast.error('Không thể rời club');
    }
  }, [userId, fetchClubData]);

  // =========================
  // INITIAL LOAD + REALTIME
  // =========================
  useEffect(() => {
    if (!userId) return;

    fetchClubData();

    const channel = supabase
      .channel(`clubs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members'
        },
        () => {
          fetchClubData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clubs'
        },
        () => {
          fetchClubData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchClubData]);

  return {
    myClub,
    allClubs,
    loading,
    joining,
    joinClub,
    leaveClub,
    refresh: fetchClubData
  };
}