import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const PAGE_SIZE = 10;

export function useFeed(currentUserId: string | undefined) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);

  const fetchPosts = useCallback(async (offset: number) => {
    if (!currentUserId || currentUserId === 'undefined') return;
    const isFirstPage = offset === 0;
    if (isFirstPage) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          author:profiles!social_posts_author_id_fkey (*),
          social_post_likes (user_id)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const formatted = data.map((post: any) => ({
          ...post,
          likedByMe: post.social_post_likes?.some((l: any) => l.user_id === currentUserId) ?? false,
        }));

        if (isFirstPage) setPosts(formatted);
        else setPosts(prev => [...prev, ...formatted]);

        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error('Lỗi tải feed:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [currentUserId]);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // Supabase Realtime Subscription cho bài mới
  useEffect(() => {
    if (!currentUserId || currentUserId === 'undefined') return;

    // FIX CRASH: Tạo tên channel độc nhất để tránh lỗi tái sử dụng channel cũ trong React Strict Mode
    const channelId = `feed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'social_posts' }, 
        async (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const newPost = payload.new as { id: string; [key: string]: any };
          const { data } = await supabase.from('social_posts').select('*, author:profiles!social_posts_author_id_fkey (*)').eq('id', newPost.id).single();
          if (data) {
            setPendingPosts(prev => [data, ...prev]);
            setNewPostsCount(prev => prev + 1);
          }
        }
      )
      .subscribe(); // <-- MUST BE HERE AT THE END

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [currentUserId]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore) fetchPosts(posts.length);
  }, [isLoading, isFetchingMore, hasMore, posts.length, fetchPosts]);

  const showNewPosts = useCallback(() => {
    const formattedPending = pendingPosts.map(p => ({ ...p, likedByMe: false }));
    setPosts(prev => [...formattedPending, ...prev]);
    setPendingPosts([]); setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pendingPosts, currentUserId]);

  return { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts };
}