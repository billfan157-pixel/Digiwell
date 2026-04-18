import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useLike(postId: string, currentUserId: string | undefined, initialLiked: boolean, initialCount: number) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const toggleLike = useCallback(async () => {
    if (!currentUserId) return;
    const prevLiked = isLiked;
    const prevCount = count;

    // Optimistic Update
    setIsLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));

    try {
      if (!prevLiked) {
        const { error } = await supabase.from('social_post_likes').insert({ post_id: postId, user_id: currentUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('social_post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
        if (error) throw error;
      }
    } catch (err) {
      setIsLiked(prevLiked); // Revert on fail
      setCount(prevCount);
      toast.error('Không thể thích bài, thử lại sau');
    }
  }, [postId, currentUserId, isLiked, count]);

  return { isLiked, count, toggleLike };
}