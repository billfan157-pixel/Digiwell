import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import {
  buildProgressShareText,
  DEFAULT_SOCIAL_COMPOSER,
  DEFAULT_SOCIAL_PROFILE_STATS,
  isMissingSocialSchemaError,
  type SocialComposerState,
  type SocialDiscoverProfile,
  type SocialFeedPost,
  type SocialProfileStats,
} from '../lib/social';

interface UseSocialDataProps {
  profile: any;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export function useSocialData({ profile, waterIntake, waterGoal, streak, activeTab, setActiveTab }: UseSocialDataProps) {
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [showDiscoverPeople, setShowDiscoverPeople] = useState(false);
  const [showSocialProfile, setShowSocialProfile] = useState(false);
  const [socialComposer, setSocialComposer] = useState<SocialComposerState>({ ...DEFAULT_SOCIAL_COMPOSER });
  const [socialPosts, setSocialPosts] = useState<SocialFeedPost[]>([]);
  const [socialStories, setSocialStories] = useState<SocialFeedPost[]>([]);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialSearchResults, setSocialSearchResults] = useState<SocialDiscoverProfile[]>([]);
  const [socialFollowingIds, setSocialFollowingIds] = useState<string[]>([]);
  const [socialProfileStats, setSocialProfileStats] = useState<SocialProfileStats>(DEFAULT_SOCIAL_PROFILE_STATS);
  const [socialError, setSocialError] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isPublishingSocialPost, setIsPublishingSocialPost] = useState(false);
  const [isSocialSearching, setIsSocialSearching] = useState(false);
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [socialImagePreview, setSocialImagePreview] = useState('');
  const socialImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.id) {
      setShowSocialComposer(false);
      setShowDiscoverPeople(false);
      setShowSocialProfile(false);
      setSocialPosts([]);
      setSocialStories([]);
      setSocialSearchResults([]);
      setSocialFollowingIds([]);
      setSocialProfileStats(DEFAULT_SOCIAL_PROFILE_STATS);
      setSocialError('');
      resetSocialComposer();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (activeTab === 'feed' && profile?.id) {
      void refreshSocialFeed();
    }
  }, [activeTab, profile?.id]);

  useEffect(() => {
    if (showDiscoverPeople && profile?.id) {
      void loadSocialDirectory(socialSearchQuery);
    }
  }, [showDiscoverPeople, profile?.id]);

  useEffect(() => () => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
  }, [socialImagePreview]);

  const getSocialErrorMessage = (message?: string) => {
    if (!message) return 'Không thể tải tính năng cộng đồng lúc này.';
    if (isMissingSocialSchemaError(message)) {
      return 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.';
    }
    return message;
  };

  const resetSocialComposer = () => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
    setSocialComposer({ ...DEFAULT_SOCIAL_COMPOSER });
    setSocialImageFile(null);
    setSocialImagePreview('');
  };

  const closeSocialComposer = () => {
    resetSocialComposer();
    setShowSocialComposer(false);
  };

  const openSocialComposer = (kind: SocialComposerState['postKind'] = 'status') => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng bài.');
      return;
    }

    const content = kind === 'progress'
      ? buildProgressShareText({
        nickname: profile.nickname,
        waterIntake,
        waterGoal,
        streak,
      })
      : '';

    resetSocialComposer();
    setSocialComposer({
      content,
      imageUrl: '',
      postKind: kind,
      visibility: kind === 'story' ? 'followers' : 'public',
    });
    setActiveTab('feed');
    setShowSocialComposer(true);
  };

  const uploadSocialImage = async (file: File) => {
    if (!profile?.id) throw new Error('Vui lòng đăng nhập lại.');

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg';
    const safeExtension = extension || 'jpg';
    const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
    const { error } = await supabase!.storage.from('social-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return supabase!.storage.from('social-media').getPublicUrl(filePath).data.publicUrl;
  };

  const loadSocialDirectory = async (query: string) => {
    if (!profile?.id) return;

    setIsSocialSearching(true);
    try {
      const keyword = query.trim();
      let request = supabase!
        .from('profiles')
        .select('id, nickname')
        .neq('id', profile.id);

      request = keyword.length >= 2
        ? request.ilike('nickname', `%${keyword}%`)
        : request.order('nickname', { ascending: true });

      const { data, error } = await request.limit(8);
      if (error) throw error;

      setSocialError('');
      setSocialSearchResults((data || []).map((user: any, index: number) => ({
        id: user.id || `search-user-fallback-${index}`,
        nickname: user.nickname || 'Người dùng DigiWell',
        isFollowing: socialFollowingIds.includes(user.id),
      })));
    } catch (err: any) {
      const friendlyMessage = getSocialErrorMessage(err.message);
      setSocialError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsSocialSearching(false);
    }
  };

  const refreshSocialFeed = async (options?: { silent?: boolean }) => {
    if (!profile?.id) return;

    if (!options?.silent) {
      setIsSocialLoading(true);
    }

    try {
      const [
        followingRes,
        followersCountRes,
        followingCountRes,
        postsCountRes,
      ] = await Promise.all([
        supabase!.from('social_follows').select('following_id').eq('follower_id', profile.id),
        supabase!.from('social_follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase!.from('social_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase!.from('social_posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
      ]);

      if (followingRes.error) throw followingRes.error;
      if (followersCountRes.error) throw followersCountRes.error;
      if (followingCountRes.error) throw followingCountRes.error;
      if (postsCountRes.error) throw postsCountRes.error;

      const followingIds = (followingRes.data || []).map((row: any) => row.following_id);
      setSocialFollowingIds(followingIds);
      setSocialProfileStats({
        followers: followersCountRes.count || 0,
        following: followingCountRes.count || 0,
        posts: postsCountRes.count || 0,
      });

      const feedAuthorIds = Array.from(new Set([profile.id, ...followingIds]));
      const { data: postRows, error: postsError } = await supabase!
        .from('social_posts')
        .select('id, author_id, content, image_url, post_kind, visibility, hydration_ml, streak_snapshot, like_count, created_at, expires_at')
        .in('author_id', feedAuthorIds)
        .order('created_at', { ascending: false })
        .limit(40);

      if (postsError) throw postsError;

      const validRows = (postRows || []).filter((row: any) => {
        if (row.post_kind !== 'story') return true;
        if (!row.expires_at) return false;
        return new Date(row.expires_at).getTime() > Date.now();
      });

      const authorIds = Array.from(new Set(validRows.map((row: any) => row.author_id)));
      const postIds = validRows.map((row: any) => row.id);

      const [profilesRes, likesRes] = await Promise.all([
        authorIds.length > 0
          ? supabase!.from('profiles').select('id, nickname').in('id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase!.from('social_post_likes').select('post_id').eq('user_id', profile.id).in('post_id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (likesRes.error) throw likesRes.error;

      const profileMap = new Map((profilesRes.data || []).map((row: any) => [row.id, {
        id: row.id,
        nickname: row.nickname || 'Người dùng DigiWell',
      }]));
      const likedPostIds = new Set((likesRes.data || []).map((row: any) => row.post_id));

      const mappedPosts: SocialFeedPost[] = validRows.map((row: any, index: number) => ({
        ...row,
        id: row.id || `post-fallback-${index}`,
        author: profileMap.get(row.author_id) || {
          id: row.author_id,
          nickname: row.author_id === profile.id ? (profile.nickname || 'Bạn') : 'Người dùng DigiWell',
        },
        likedByMe: likedPostIds.has(row.id),
      }));

      const storyMap = new Map<string, SocialFeedPost>();
      const latestStories = mappedPosts
        .filter(post => post.post_kind === 'story')
        .reduce<SocialFeedPost[]>((acc: SocialFeedPost[], post: SocialFeedPost) => {
          if (storyMap.has(post.author_id)) return acc;
          storyMap.set(post.author_id, post);
          acc.push(post);
          return acc;
        }, []);

      setSocialStories(latestStories);
      setSocialPosts(mappedPosts.filter(post => post.post_kind !== 'story'));
      setSocialError('');
    } catch (err: any) {
      const friendlyMessage = getSocialErrorMessage(err.message);
      setSocialError(friendlyMessage);
      setSocialPosts([]);
      setSocialStories([]);
      if (!options?.silent) {
        toast.error(friendlyMessage);
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSocialImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB để upload nhanh hơn.');
      event.target.value = '';
      return;
    }

    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSocialImageFile(file);
    setSocialImagePreview(previewUrl);
    setSocialComposer((prev: SocialComposerState) => ({ ...prev, imageUrl: '' }));
    event.target.value = '';
  };

  const handleSearchSocialUsers = async (query: string) => {
    setSocialSearchQuery(query);
    await loadSocialDirectory(query);
  };

  const handleFollowUser = async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;

    const toastId = toast.loading(`Đang theo dõi ${nickname}...`);
    try {
      const { error } = await supabase!
        .from('social_follows')
        .insert({ follower_id: profile.id, following_id: targetUserId });
      if (error) throw error;

      setSocialFollowingIds((prev: string[]) => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
      setSocialSearchResults((prev: SocialDiscoverProfile[]) => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: true } : user));
      setSocialProfileStats((prev: SocialProfileStats) => ({ ...prev, following: prev.following + 1 }));
      toast.success(`Đã theo dõi ${nickname}.`, { id: toastId });
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    }
  };

  const handleUnfollowUser = async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;

    const toastId = toast.loading(`Đang bỏ theo dõi ${nickname}...`);
    try {
      const { error } = await supabase!
        .from('social_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', targetUserId);
      if (error) throw error;

      setSocialFollowingIds((prev: string[]) => prev.filter(id => id !== targetUserId));
      setSocialSearchResults((prev: SocialDiscoverProfile[]) => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: false } : user));
      setSocialProfileStats((prev: SocialProfileStats) => ({ ...prev, following: Math.max(prev.following - 1, 0) }));
      toast.success(`Đã bỏ theo dõi ${nickname}.`, { id: toastId });
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    }
  };

  const handleToggleLikePost = async (post: SocialFeedPost) => {
    if (!profile?.id) return;

    const nextLiked = !post.likedByMe;
    const likeDelta = nextLiked ? 1 : -1;
    setSocialPosts((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));
    setSocialStories((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));

    try {
      // Validate user ID
      if (!profile?.id || profile.id === 'undefined') {
        console.error('[useSocialData] Invalid user ID for like:', profile?.id);
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      if (nextLiked) {
        const { error } = await supabase!.from('social_post_likes').insert({
          post_id: post.id,
          user_id: profile.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.from('social_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', profile.id);
        if (error) throw error;
      }

      const { error: countError } = await supabase!.from('social_posts')
        .update({ like_count: Math.max((post.like_count || 0) + likeDelta, 0) })
        .eq('id', post.id);
      if (countError) throw countError;
    } catch (err: any) {
      setSocialPosts((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? post : item));
      setSocialStories((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? post : item));
      toast.error(getSocialErrorMessage(err.message));
    }
  };

  const handlePublishSocialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const trimmedContent = socialComposer.content.trim();
    const trimmedImageUrl = socialComposer.imageUrl.trim();

    if (!trimmedContent && !trimmedImageUrl && !socialImageFile) {
      toast.error('Viết gì đó hoặc thêm ảnh trước khi đăng.');
      return;
    }

    setIsPublishingSocialPost(true);
    const toastId = toast.loading(socialComposer.postKind === 'story' ? 'Đang đăng story...' : 'Đang đăng bài...');

    try {
      let imageUrl = trimmedImageUrl || null;
      if (socialImageFile) {
        imageUrl = await uploadSocialImage(socialImageFile);
      }

      const expiresAt = socialComposer.postKind === 'story'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: trimmedContent,
        image_url: imageUrl,
        post_kind: socialComposer.postKind,
        visibility: socialComposer.visibility,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      });
      if (error) throw error;

      toast.success(
        socialComposer.postKind === 'story' ? 'Story đã lên sóng 24 giờ.' : 'Bài đăng đã xuất hiện trên feed.',
        { id: toastId },
      );
      closeSocialComposer();
      await refreshSocialFeed({ silent: true });
    } catch (err: any) {
      toast.error(getSocialErrorMessage(err.message), { id: toastId });
    } finally {
      setIsPublishingSocialPost(false);
    }
  };

  return {
    showSocialComposer, setShowSocialComposer,
    showDiscoverPeople, setShowDiscoverPeople,
    showSocialProfile, setShowSocialProfile,
    socialComposer, setSocialComposer,
    socialPosts, setSocialPosts,
    socialStories, setSocialStories,
    socialSearchQuery, setSocialSearchQuery,
    socialSearchResults, setSocialSearchResults,
    socialFollowingIds, setSocialFollowingIds,
    socialProfileStats, setSocialProfileStats,
    socialError, setSocialError,
    isSocialLoading, setIsSocialLoading,
    isPublishingSocialPost, setIsPublishingSocialPost,
    isSocialSearching, setIsSocialSearching,
    socialImageFile, setSocialImageFile,
    socialImagePreview, setSocialImagePreview,
    socialImageInputRef,
    closeSocialComposer,
    openSocialComposer,
    handleSocialImagePicked,
    handleSearchSocialUsers,
    handleFollowUser,
    handleUnfollowUser,
    handleToggleLikePost,
    handlePublishSocialPost
  };
}