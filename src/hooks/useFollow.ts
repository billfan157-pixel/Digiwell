import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useFollow(targetUserId: string, currentUserId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    supabase.from('social_follows').select('id').eq('follower_id', currentUserId).eq('following_id', targetUserId).single()
      .then(({ data }: { data: any }) => setIsFollowing(!!data));
  }, [targetUserId, currentUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    const prev = isFollowing;
    setIsFollowing(!prev);

    try {
      if (!prev) {
        const { error } = await supabase.from('social_follows').insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('social_follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId);
        if (error) throw error;
      }
    } catch (err) { setIsFollowing(prev); toast.error('Lỗi thao tác, thử lại sau'); }
  }, [targetUserId, currentUserId, isFollowing]);

  return { isFollowing, toggleFollow };
}