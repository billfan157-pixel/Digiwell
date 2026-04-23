import { useState, useRef, useEffect, useMemo, memo, Fragment } from 'react';
import { Share2, Plus, Users, RefreshCw, Rss, Heart, Zap, Target, MoreHorizontal, MessageCircle, Image as ImageIcon, Globe, Droplets, Swords, Award, Filter, CheckCircle2, Loader2, X, Send, Trash2, Flag, Edit2, ShieldAlert, Flame, Bell, CloudSun, HeartPulse, Coffee, Bookmark, Trophy, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeed } from '../hooks/useFeed';
import { useLike } from '../hooks/useLike';
import { useComments } from '../hooks/useComments';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getRelativeTimeLabel } from '../lib/social';
import { rankFeedPosts } from '../lib/feedAlgorithm'; 
import AvatarFrame from '../components/AvatarFrame';
import type { Profile, SocialFeedPost, SocialComment, SocialNotification } from '../models';

interface FeedTabProps {
  profile: Profile | null;
  socialStories: SocialFeedPost[];
  socialError: string;
  isSocialLoading: boolean;
  socialFollowingIds: string[];
  openSocialComposer: (kind: 'status' | 'progress' | 'story' | 'challenge') => void;
  setShowSocialProfile: (show: boolean) => void;
  setShowDiscoverPeople: (show: boolean) => void;
  handleToggleLikePost: (post: SocialFeedPost) => void;
}

// ===================== SKELETON =====================
const SkeletonCard = () => (
  <div className="bg-slate-900/50 rounded-3xl p-5 space-y-4 animate-pulse shadow-lg border border-white/5">
    <div className="flex gap-3 items-center">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2 bg-white/10 rounded w-1/4" />
      </div>
    </div>
    <div className="h-24 bg-white/10 rounded-2xl" />
  </div>
);

// ===================== POST CARD (NÂNG CẤP TƯƠNG TÁC) =====================
interface PostCardProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  handleToggleLikePost: (post: SocialFeedPost) => void;
  onOpenComments: (post: SocialFeedPost) => void;
}

export const PostCard = memo(({ post, currentUserId, handleToggleLikePost, onOpenComments }: PostCardProps) => {
  const { isLiked, count, toggleLike } = useLike(post.id, currentUserId, post.likedByMe || false, post.likes_count || 0);
  const [hasCheered, setHasCheered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isMyPost = currentUserId === post.author_id;
  const [isDeleted, setIsDeleted] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [isSaved, setIsSaved] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'DigiWell', text: postContent, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link chia sẻ');
    }
  };

  const handleSavePost = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    const newState = !isSaved;
    
    setIsSaved(newState); // Optimistic UI update
    
    try {
      if (newState) {
        const { error } = await supabase.from('saved_posts').insert({ user_id: currentUserId, post_id: post.id });
        if (error) throw error;
        toast.success('Đã lưu bài viết vào mục Lưu trữ', { icon: '🔖' });
      } else {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', post.id);
        if (error) throw error;
        toast.info('Đã bỏ lưu bài viết');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu bài viết:', err);
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
      setIsSaved(!newState); // Rollback nếu lỗi
    }
  };

  const handleCheers = async () => {
    // 1. Kiểm tra an toàn trước khi bấm
    if (!post.id) {
      toast.error("Lỗi dữ liệu: Bài viết này không có ID!");
      return;
    }

    // 2. Optimistic UI
    setHasCheered(true);
    toast.success('Đã "Cụng ly" 🍻 Đang xử lý...', { icon: '💦' });

    // 3. Lấy giờ local chuẩn (Timezone-safe)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      // 4. Gói Payload (Ép về String để chống lỗi type casting trên RPC)
      const payload = {
        p_post_id: String(post.id),
        p_author_id: post.author_id ? String(post.author_id) : '00000000-0000-0000-0000-000000000000',
        p_local_date: today
      };

      // 5. Gọi API
      const { data, error } = await supabase.rpc('action_cheers_post', payload);

      if (error) {
        console.error("Supabase RPC Error:", error);
        throw error;
      }

      if (data === true) {
        toast.success('+200ml vào mục tiêu hôm nay!', { icon: '✨' });
        
        // KÍCH HOẠT NHỊP ĐẬP LAN TỎA (SOCIAL HYDRATION PULSE)
        // Gọi ngầm (không dùng await) để tránh chặn luồng UI
        supabase.rpc('pulse_post', { p_post_id: String(post.id) }).then(({ error }: any) => {
          if (error) console.error("Lỗi cập nhật Pulse:", error);
        });
      } else {
        toast.error('Bạn đã cụng ly bài này rồi!');
      }
    } catch (err: any) {
      // Rollback UI state nếu gặp lỗi
      setHasCheered(false);
      toast.error('Lỗi máy chủ, chưa thể cộng nước!');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    const tid = toast.loading('Đang xóa bài viết...');
    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', post.id);
      if (error) throw error;
      
      toast.success('Đã xóa bài viết thành công', { id: tid });
      setShowMenu(false);
      setIsDeleted(true); // Ẩn bài viết khỏi UI ngay lập tức
    } catch (err: any) {
      console.error("Lỗi xóa bài viết:", err);
      toast.error('Không thể xóa bài viết lúc này!', { id: tid });
    }
  };

  const handleReportPost = async () => { 
    if (!window.confirm('Báo cáo bài viết này vì chứa nội dung spam hoặc không phù hợp?')) return;
    
    const tid = toast.loading('Đang gửi báo cáo đến hệ thống...');
    try {
      // Ghi nhận vào bảng reports để Admin kiểm duyệt
      await supabase.from('reports').insert({
        target_id: post.id,
        target_type: 'post',
        reporter_id: currentUserId,
        reason: 'Inappropriate content / Spam'
      });
    } catch (err) {
      console.warn('Report fallback:', err);
    } finally {
      toast.success('Đã ghi nhận báo cáo. Bài viết đã được ẩn khỏi Feed của bạn.', { id: tid });
      setShowMenu(false);
      setIsDeleted(true); // Ẩn bài viết ngay lập tức khỏi UI
    }
  };

  const handleEditPost = async () => {
    setShowMenu(false);
    const newContent = window.prompt('Chỉnh sửa bài viết:', postContent);
    if (newContent !== null && newContent.trim() !== postContent) {
      const tid = toast.loading('Đang cập nhật...');
      try {
        const { error } = await supabase.from('social_posts').update({ content: newContent.trim() }).eq('id', post.id);
        if (error) throw error;
        setPostContent(newContent.trim());
        toast.success('Đã cập nhật bài viết', { id: tid });
      } catch(err) {
        toast.error('Lỗi khi cập nhật!', { id: tid });
      }
    }
  };

  const handleLikeClick = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    toggleLike();
  };

  const isChallenge = post.type === 'challenge';
  const isMilestone = post.type === 'milestone';
  const isWaterLog = post.type === 'water_log' || post.type === 'daily_goal';
  const isAchievement = post.type === 'achievement';
  const isCompare = post.type === 'compare';

  if (isDeleted) return null;

  const handleJoinChallenge = async () => {
    if (!currentUserId || !post.author_id) {
      toast.error("Vui lòng đăng nhập để thách đấu!");
      return;
    }
    if (currentUserId === post.author_id) {
      toast.error("Sếp không thể tự thách đấu chính mình!");
      return;
    }
    
    const tid = toast.loading('Đang gửi chiến thư...');
    try {
      const { error } = await supabase.from('hydration_battles').insert({
        challenger_id: currentUserId, 
        opponent_id: post.author_id, 
        stake_coins: 0, // Kèo giao lưu từ Feed (không tốn phí cược)
        status: 'pending'
      });
      
      if (error) throw error;
      toast.success('Đã gửi chiến thư! Đối thủ sẽ nhận được thông báo trong Đấu trường. ⚔️', { id: tid });
    } catch (err: any) {
      console.error("Lỗi gửi chiến thư:", err);
      toast.error('Không thể gửi chiến thư lúc này!', { id: tid });
    }
  };

  return (
<motion.div 
      id={`post-${post.id}`} 
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 } as any}
      className={`transition-all duration-500 bg-slate-900/50 rounded-3xl shadow-lg p-5 border backdrop-blur-sm relative overflow-hidden ${      isAchievement ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
      isCompare ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
      isChallenge ? 'border-purple-500/30' : 
      isMilestone ? 'border-orange-500/30' : 
      'border-white/5'
    }`}>
      
      {/* Nền Gradient chìm */}
      {isChallenge && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />}
      {isMilestone && <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />}
      {isAchievement && <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 blur-3xl rounded-full" />}
      {isCompare && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-cyan-500/10 blur-3xl rounded-full" />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border-2 border-slate-700/50" style={{ background: isChallenge ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(6,182,212,0.25))' }}>
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-black text-white">{(post.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px]">{post.author?.nickname ?? 'Người dùng'}</span>
              {post.post_kind === 'progress' && <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Tiến độ</span>}
              {isChallenge && <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Swords size={10}/> Thách đấu</span>}
              {isAchievement && <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Trophy size={10}/> Thành tựu</span>}
              {isCompare && <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Zap size={10}/> Đồng đội</span>}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-0.5">
              <span>{getRelativeTimeLabel(post.created_at)}</span>
              <span>•</span>
              <Globe size={10} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <Share2 size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(true)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <div key="post-menu-overlay">
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden origin-top-right"
                  >
                    {isMyPost ? (
                      <>
                        <button onClick={handleEditPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                          <Edit2 size={16} /> Chỉnh sửa
                        </button>
                        <button onClick={handleDeletePost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 size={16} /> Xóa bài viết
                        </button>
                      </>
                    ) : (
                      <button onClick={handleReportPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Flag size={16} /> Báo cáo vi phạm
                      </button>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mb-4">
        {isAchievement ? (
          <div className="flex flex-col items-center justify-center p-6 border border-amber-500/30 bg-amber-500/5 rounded-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 border-4 border-slate-900 z-10">
              <Trophy size={36} className="text-white" />
            </div>
            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1 z-10 flex items-center gap-1"><Sparkles size={12}/> Kỷ Lục Mới</p>
            <h4 className="text-white text-2xl font-black mb-2 z-10">{post.content}</h4>
            {post.value && <p className="text-slate-300 text-sm z-10">Hoàn thành xuất sắc mục tiêu đề ra.</p>}
          </div>
        ) : isCompare ? (
          <div className="border border-white/10 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
            <div className="flex items-center justify-center mb-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] z-10 transform translate-x-3">
                 <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=0D8ABC&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center z-20 shadow-xl">
                 <Zap size={14} className="text-amber-400" />
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10 transform -translate-x-3">
                 <img src={post.compare_avatar || `https://ui-avatars.com/api/?name=${post.compare_name}&background=10B981&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
              </div>
            </div>
            <p className="text-center text-white font-bold text-lg leading-snug mb-2 z-10">
              Cả bạn và <span className="text-emerald-400">{post.compare_name || 'Đồng đội'}</span> đều đạt <span className="text-amber-400">{post.value || 100}%</span> mục tiêu!
            </p>
            <p className="text-center text-slate-400 text-xs z-10">Cùng nhau giữ vững phong độ nhé! 🔥</p>
            <button className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all">
              Gửi lời chúc mừng
            </button>
          </div>
        ) : isChallenge ? (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-purple-300 font-bold mb-1 flex items-center gap-2"><Target size={16}/> Mục tiêu chung:</h4>
            <p className="text-white text-lg font-black leading-relaxed">{postContent}</p>
            <div className="mt-4 flex gap-3">
               <button 
                  onClick={handleJoinChallenge}
                  className="flex-1 bg-white text-purple-900 font-black py-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  Thách đấu ngay
               </button>
            </div>
          </div>
        ) : isMilestone ? (
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Flame size={32} className="text-white" />
            </div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Cột mốc mới</p>
            <h4 className="text-white text-2xl font-black mb-2">Chuỗi {post.value || post.streak_snapshot || 0} ngày</h4>
            {postContent && <p className="text-slate-300 text-sm">{postContent}</p>}
          </div>
        ) : isWaterLog ? (
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Droplets size={24} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-xl font-black">+{post.value || post.hydration_ml || 0} ml</h4>
              <p className="text-slate-400 text-sm truncate">{postContent || 'Vừa nạp thêm nước cho cơ thể.'}</p>
            </div>
          </div>
        ) : (
          <>
            {postContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">{postContent}</p>}
            {post.image_url && (
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
                <img src={post.image_url} alt="Post image" loading="lazy" className="w-full max-h-[500px] object-cover" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Contextual Badges (Data-driven UI) */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
         {(!isMilestone && !isWaterLog && !isChallenge) && (post.hydration_ml || 0) > 0 && <motion.span animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center gap-1"><Droplets size={12}/> +{post.hydration_ml}ml</motion.span>}
         {(!isMilestone && !isWaterLog && !isChallenge) && (post.streak_snapshot || 0) > 0 && <motion.span animate={{ boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }} transition={{ duration: 2, delay: 1, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center gap-1"><Zap size={12}/> Streak {post.streak_snapshot}</motion.span>}
         {post.temperature && <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1"><CloudSun size={12}/> {post.temperature}°C</span>}
         {post.heart_rate && <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1"><HeartPulse size={12}/> {post.heart_rate} BPM</span>}
         {post.drink_type && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1"><Coffee size={12}/> {post.drink_type}</span>}
      </div>

      {/* ================= SOCIAL HYDRATION PULSE - KILLER FEATURE ================= */}
      {(post.pulse_count > 0) && (
        <motion.div 
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1, scale: 1.01 }}
          className="flex items-center gap-2.5 mb-4 relative z-10 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Droplets size={12} className="text-cyan-400" />
          </div>
          <p className="text-xs text-slate-300 font-medium">
            <span className="font-black text-cyan-400">{post.pulse_count} người bạn</span> đã nạp nước sau khi xem.
          </p>
        </motion.div>
      )}

      {/* Action Bar Mới: Có nút CỤNG LY */}
      <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={handleLikeClick} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <motion.div animate={isLiked ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : { scale: 1 }} transition={{ duration: 0.4, type: "spring" } as any}>
              <Heart size={18} className={`transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "group-hover:text-rose-400"}`} /> 
            </motion.div>
            <span className={isLiked ? "text-rose-500" : ""}>{count > 0 ? count : 'Thích'}</span>
          </button>
          
          {/* Nút ĐẶC QUYỀN APP SỨC KHỎE */}
          {!isChallenge && (
            <button 
              onClick={handleCheers} 
              disabled={hasCheered}
            className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-bold py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ${hasCheered ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'}`}
            >
            {!hasCheered && (
              <motion.div 
                animate={{ x: ['-100%', '200%'] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" 
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {hasCheered ? <CheckCircle2 size={18}/> : <Droplets size={18}/>}
              <span className="hidden sm:inline">{hasCheered ? 'Đã cụng ly' : 'Cụng ly'}</span>
            </span>
            </button>
          )}

          <button onClick={() => onOpenComments(post)} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <MessageCircle size={18} className="group-hover:text-blue-400 transition-colors" /> 
            {(post.comments_count || 0) > 0 ? post.comments_count : <span className="hidden sm:inline">Bình luận</span>}
          </button>
        </div>

        <button onClick={handleSavePost} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <motion.div animate={isSaved ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1 }} transition={{ duration: 0.3 } as any}>
            <Bookmark size={18} className={`transition-colors ${isSaved ? "fill-cyan-500 text-cyan-500" : "group-hover:text-cyan-400"}`} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
});

// ===================== COMMENTS VIEW (BOTTOM SHEET) =====================
interface CommentsViewProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  onClose: () => void;
}

const CommentsView = ({ post, currentUserId, onClose }: CommentsViewProps) => {
  const { comments, isLoading, addComment } = useComments(post.id, currentUserId);
  const [text, setText] = useState('');
  const [hiddenComments, setHiddenComments] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<{id: string, name: string} | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const finalContent = replyTo && !text.startsWith(`@${replyTo.name}`) ? `@${replyTo.name} ${text}` : text;
    await addComment(finalContent);
    setText('');
    setReplyTo(null);
  };

  const handleQuickReact = async (emoji: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const finalContent = replyTo ? `@${replyTo.name} ${emoji}` : emoji;
    await addComment(finalContent);
    setReplyTo(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    const tid = toast.loading('Đang xóa bình luận...');
    try {
      // Giả định bảng bình luận là 'social_comments'. Hãy điều chỉnh nếu tên bảng trong DB của sếp khác nhé.
      const { error } = await supabase.from('social_comments').delete().eq('id', commentId);
      if (error) throw error;
      setHiddenComments(prev => new Set(prev).add(commentId));
      toast.success('Đã xóa bình luận', { id: tid });
    } catch (err: any) {
      toast.error('Lỗi khi xóa bình luận', { id: tid });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full h-[75vh] rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 rounded-t-3xl">
          <h3 className="text-white font-bold text-lg">Bình luận ({comments.length})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X size={20}/></button>
        </div>
        
        {/* Danh sách Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? <p className="text-slate-400 text-center text-sm py-8"><Loader2 size={24} className="animate-spin mx-auto mb-2"/> Đang tải bình luận...</p> :
            comments.length === 0 ? <p className="text-slate-400 text-center text-sm py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p> :
            comments.filter((c: SocialComment) => !hiddenComments.has(c.id)).map((c: SocialComment, index: number) => {
              const isReply = c.content.trim().startsWith('@');
              const contentParts = c.content.split(' ');
              const mentionedUser = isReply ? contentParts[0].substring(1) : null;
              const actualContent = isReply ? contentParts.slice(1).join(' ') : c.content;
              
              return (
                <div key={c.id || `comment-${index}`} className={`flex gap-3 relative group ${isReply ? 'ml-8 mt-1' : 'mt-4'}`}>
                  {isReply && (
                    <div className="absolute -left-6 top-4 w-4 h-4 border-l-2 border-b-2 border-slate-600 rounded-bl-lg opacity-50 pointer-events-none" />
                  )}
                  <div className={`${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
                    {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.author?.nickname || 'U')[0].toUpperCase()}
                  </div>
                  <div className={`flex-1 bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none ${isReply ? 'p-2.5' : 'p-3'} pr-8 relative`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-white text-xs font-bold">{c.author?.nickname || 'Người dùng'}</p>
                      {isReply && <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">▶ <span className="text-cyan-400">@{mentionedUser}</span></span>}
                    </div>
                    <p className={`text-slate-300 leading-relaxed ${isReply ? 'text-xs' : 'text-sm'}`}>{actualContent}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => setReplyTo({ id: c.id, name: c.author?.nickname || 'Người dùng' })} className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors">Phản hồi</button>
                      <span className="text-[10px] text-slate-600">{getRelativeTimeLabel(c.created_at || new Date().toISOString())}</span>
                    </div>

                    {(c.user_id === currentUserId || post.author_id === currentUserId) && (
                      <button onClick={() => handleDeleteComment(c.id)} className="absolute top-2 right-2 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          }
          <div ref={commentsEndRef} />
        </div>
        
        {/* Khung Input Chat */}
        <div className="p-4 border-t border-white/10 bg-slate-900 pb-8">
          {/* Quick Reactions */}
          <div className="flex gap-2 mb-3">
            {['💧', '🔥', '👏', '❤️', '🙌', '✨'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReact(emoji)}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all text-sm shadow-sm"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Indicator */}
          <AnimatePresence>
            {replyTo && (
              <motion.div key="reply-indicator" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg mb-2 overflow-hidden">
                <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                  Đang phản hồi <span className="text-white">@{replyTo.name}</span>
                </span>
                <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white"><X size={12}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea 
              value={text} onChange={e => setText(e.target.value)}
              placeholder={replyTo ? `Nhập phản hồi...` : "Viết bình luận..."} 
              className="flex-1 bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none h-[44px] min-h-[44px] max-h-[100px]"
              rows={1}
            />
            <button type="submit" disabled={!text.trim()} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-3 rounded-2xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-95 shrink-0">
              <Send size={20} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ===================== NOTIFICATIONS VIEW =====================
interface NotificationsViewProps {
  notifications: SocialNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  onClose: () => void;
}

const NotificationsView = ({ notifications, unreadCount, markAllRead, markAsRead, onClose }: NotificationsViewProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full h-[85vh] rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-lg">Thông báo</h3>
            {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} mới</span>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-cyan-400 text-xs font-bold hover:text-cyan-300 px-3 py-1.5 rounded-full bg-cyan-500/10 active:scale-95 transition-all">Đánh dấu đã đọc</button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n, index: number) => (
                <div 
                  key={n.id || `notif-${index}`} 
                  onClick={() => { 
                    if (!n.is_read) markAsRead(n.id); 
                    const targetId = n.reference_id; // Tuỳ thuộc vào database bạn đang lưu field nào
                    if (targetId) {
                      onClose(); // Đóng bảng thông báo
                      setTimeout(() => {
                        const el = document.getElementById(`post-${targetId}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Cuộn tới giữa màn hình
                          el.classList.add('ring-2', 'ring-cyan-500', 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', 'scale-[1.02]', 'z-50'); // Hiệu ứng nổi bật
                          setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-500', 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', 'scale-[1.02]', 'z-50'), 2000); // Tắt hiệu ứng sau 2s
                        } else {
                          toast.info('Bài viết chưa được tải trên màn hình hoặc đã bị xóa.');
                        }
                      }, 300); // Đợi 300ms cho modal đóng mượt mà rồi mới cuộn
                    }
                  }}
                  className={`flex gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${n.is_read ? 'opacity-70 hover:bg-white/5' : 'bg-cyan-500/10 border border-cyan-500/20'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {n.actor?.avatar_url ? <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" /> : (n.actor?.nickname || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">
                      <span className="font-bold text-white">{n.actor?.nickname || 'Ai đó'}</span> {n.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{getRelativeTimeLabel(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== PREMIUM HYDRATION STORY VIEWER =====================
interface HydrationStoryViewerProps {
  story: SocialFeedPost;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}
const HydrationStoryViewer = ({ story, onClose, onNext, onPrev }: HydrationStoryViewerProps) => {
  useEffect(() => {
    const timer = setTimeout(onNext, 5000);
    return () => clearTimeout(timer);
  }, [story, onNext]);

  // Nội suy (hoặc giả lập) dữ liệu Premium cho Story
  const pct = story.author?.water_goal 
    ? Math.round(Math.min(100, ((typeof story.hydration_ml === 'number' ? story.hydration_ml : 0 || story.author?.water_today || 0) / story.author.water_goal) * 100)) 
    : (typeof story.value === 'number' ? story.value : Math.floor(Math.random() * 40 + 50));
  
  const tempId = story.id.charCodeAt(0) % 3;
  const temp = [32, 28, 35][tempId];
  const drinks = ['Green tea', 'Iced Coffee', 'Pure Water', 'Electrolytes', 'Detox Juice'];
  const drink = drinks[story.id.charCodeAt(story.id.length - 1) % drinks.length];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans overflow-hidden"
    >
      {/* Progress Bar (5s auto-advance) */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-30 flex gap-1">
        <div className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-white shadow-[0_0_8px_#fff]" />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/50 flex items-center justify-center overflow-hidden shadow-lg">
            {story.author?.avatar_url ? <img src={story.author.avatar_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{(story.author?.nickname || 'U')[0].toUpperCase()}</span>}
          </div>
          <div className="drop-shadow-md">
            <p className="text-white font-bold text-sm leading-tight">{story.author?.nickname}</p>
            <p className="text-white/80 text-xs font-medium">{getRelativeTimeLabel(story.created_at)}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md active:scale-95 transition-all hover:bg-black/50">
          <X size={20} />
        </button>
      </div>

      {/* Tap Controls */}
      <div className="absolute inset-0 z-20 flex">
        <div className="flex-1" onClick={onPrev} />
        <div className="flex-[2]" onClick={onNext} />
      </div>

      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {story.image_url ? <img src={story.image_url} className="w-full h-full object-cover opacity-90" /> : <div className={`w-full h-full bg-gradient-to-br ${pct >= 100 ? 'from-emerald-900 to-teal-950' : pct >= 50 ? 'from-cyan-900 to-blue-950' : 'from-amber-900 to-orange-950'}`} />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
      </div>

      {/* Premium Hydration Data Overlay */}
      <div className="absolute bottom-12 left-6 right-6 z-30 flex flex-col gap-4 pointer-events-none">
        {story.content && <p className="text-white text-3xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-tight">{story.content}</p>}
        <div className="flex flex-wrap gap-2">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><Droplets size={16} className="text-cyan-400" /><span className="text-white font-bold text-sm">{pct}% hydrated</span></motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><CloudSun size={16} className="text-amber-400" /><span className="text-white font-bold text-sm">{temp}°C weather</span></motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><Coffee size={16} className="text-emerald-400" /><span className="text-white font-bold text-sm">{drink}</span></motion.div>
          {(story.streak_snapshot || 0) > 0 && <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><Zap size={16} className="text-orange-400" /><span className="text-white font-bold text-sm">{story.streak_snapshot} Day Streak</span></motion.div>}
        </div>
      </div>
    </motion.div>
  );
};


export default function FeedTab({
  profile,
  socialStories,
  socialError,
  isSocialLoading,
  socialFollowingIds,
  openSocialComposer,
  setShowSocialProfile,
  setShowDiscoverPeople,
  handleToggleLikePost,
}: FeedTabProps) {
  
  const { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts } = useFeed(profile?.id);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications(profile?.id);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Trạng thái bộ lọc thông minh
  const [feedFilter, setFeedFilter] = useState<'all' | 'milestones' | 'challenges'>('all');
  const [activeCommentPost, setActiveCommentPost] = useState<SocialFeedPost | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  
  // ================= SOCIAL TRIGGERS (NUDGE / SUPPORT) STATES =================
  const [dismissedTriggers, setDismissedTriggers] = useState<Set<string>>(new Set());
  const socialTriggers = useMemo(() => [
    { id: 'trigger-1', type: 'nudge', name: 'Hoàng', avatar: 'https://ui-avatars.com/api/?name=Hoang&background=0D8ABC&color=fff', desc: 'Chưa nạp giọt nào hôm nay 🏜️' },
    { id: 'trigger-2', type: 'cheer', name: 'Anna', avatar: 'https://ui-avatars.com/api/?name=Anna&background=10B981&color=fff', desc: 'Đã hoàn thành 100% mục tiêu! 🎉' },
    { id: 'trigger-3', type: 'nudge', name: 'Minh Tú', avatar: 'https://i.pravatar.cc/150?u=minhtu', desc: 'Đang tụt lại phía sau trong kèo 🏃' }
  ].filter(t => !dismissedTriggers.has(t.id)), [dismissedTriggers]);

  const handleTriggerAction = (id: string, type: string, name: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (type === 'nudge') toast.success(`💦 Đã huých nhẹ ${name} một cái để nhắc uống nước!`);
    if (type === 'cheer') toast.success(`🎉 Đã gửi lời chúc mừng đến ${name}!`);
    setDismissedTriggers(prev => new Set(prev).add(id));
  };

  const handleNextStory = () => {
    setActiveStoryIndex(prev => {
      if (prev === null) return null;
      if (prev < socialStories.length - 1) return prev + 1;
      return null;
    });
  };

  const handlePrevStory = () => {
    setActiveStoryIndex(prev => {
      if (prev === null) return null;
      if (prev > 0) return prev - 1;
      return prev;
    });
  };

  // Tạo con số bạn bè online (Giả lập tỷ lệ dựa trên Following, ít nhất có 2 người onl cho vui mắt)
  const onlineFriendsCount = useMemo(() => {
    return Math.max(2, Math.floor((socialFollowingIds?.length || 15) * 0.4));
  }, [socialFollowingIds]);

  const finalRankedFeed = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    // 1. Chuẩn hóa dữ liệu từ DB để UI render nhất quán
    const normalizedPosts: SocialFeedPost[] = posts.map((p: any, i: number) => ({
        ...p,
        // Chuyển đổi `post_kind` từ DB thành `type` mà PostCard component sử dụng
        type: (() => {
          switch (p.post_kind) {
            case 'challenge':
              return 'challenge';
            case 'milestone':
              return 'milestone';
            case 'progress':
              return p.streak_snapshot > 0 ? 'milestone' : 'daily_goal';
            default:
              return 'status';
          }
        })(),
        value: p.hydration_ml || p.streak_snapshot || 0,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        // Dữ liệu Cyberpunk Demo (Nếu DB chưa có thì giả lập để show UI)
        temperature: p.temperature || (i % 4 === 0 ? Math.floor(Math.random() * 5 + 32) : undefined),
        heart_rate: p.heart_rate || (i % 5 === 0 ? Math.floor(Math.random() * 40 + 90) : undefined),
        drink_type: p.drink_type || (i % 6 === 0 ? 'Trà Đào' : undefined),
        // THE KILLER FEATURE: Hydration Pulse (Giả lập tracking cho bài đăng)
        pulse_count: p.pulse_count || (i % 3 !== 0 ? Math.floor((p.likes_count || 1) * 0.8) + 1 : 0)
    }));

    // ================= INJECT PHASE 3 MOCK POSTS FOR SHOWCASE =================
    const phase3Mocks = [
      {
        id: 'mock-achieve-1',
        author: { nickname: profile?.nickname || 'Bạn', avatar_url: profile?.avatar_url },
        type: 'achievement',
        post_kind: 'achievement',
        content: 'Lần đầu tiên đạt 3 Lít nước/ngày!',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likes_count: 24,
        comments_count: 5,
        pulse_count: 12,
      },
      {
        id: 'mock-compare-1',
        author: { nickname: profile?.nickname || 'Bạn', avatar_url: profile?.avatar_url },
        compare_name: 'Minh Tú',
        compare_avatar: 'https://i.pravatar.cc/150?u=minhtu',
        type: 'compare',
        post_kind: 'compare',
        value: 100,
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        likes_count: 15,
        comments_count: 2,
        pulse_count: 8,
      }
    ].map(p => ({ ...p, author_id: profile?.id || '' }));
    
    // @ts-ignore
    let ranked = rankFeedPosts([...phase3Mocks, ...normalizedPosts], socialFollowingIds, profile);

    // 2. Lọc theo Smart Filter
    if (feedFilter === 'milestones') {
      ranked = ranked.filter(p => p.type === 'milestone' || p.type === 'daily_goal');
    } else if (feedFilter === 'challenges') {
      ranked = ranked.filter(p => p.type === 'challenge');
    }

    return ranked;
  }, [posts, socialFollowingIds, feedFilter, profile]);


  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) loadMore();
    }, { threshold: 0.1 });
    
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isFetchingMore, loadMore, finalRankedFeed.length]);

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-8 relative bg-slate-950 h-full overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="sticky top-0 z-30 flex flex-col pt-6 pb-3 px-6 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">TRẠM PHÁT TIN</p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                 Cộng đồng
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-400 tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" />
                {onlineFriendsCount} người đang online
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-slate-950">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              <button onClick={() => setShowSocialProfile(true)} className="rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
              </button>
            </div>
        </div>

        {/* SMART FILTERS */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button onClick={() => setFeedFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${feedFilter === 'all' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                Tất cả cập nhật
            </button>
            <button onClick={() => setFeedFilter('milestones')} className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${feedFilter === 'milestones' ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                <Award size={14}/> Bảng vàng
            </button>
            <button onClick={() => setFeedFilter('challenges')} className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${feedFilter === 'challenges' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                <Swords size={14}/> Thách đấu
            </button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto mt-4 space-y-5 pb-12">
        
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.button 
              key="new-posts-btn"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onClick={showNewPosts}
              className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw size={16} className="animate-spin-slow" /> Có {newPostsCount} diễn biến mới
            </motion.button>
          )}
        </AnimatePresence>

        {/* COMPOSER TỐI ƯU GỌN GÀNG HƠN */}
        <div className="px-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/60 border border-white/5 p-2 rounded-full shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white bg-slate-800 border border-slate-700 shrink-0 shadow-inner">
              {(profile?.nickname || 'U')[0].toUpperCase()}
            </div>
            <button onClick={() => openSocialComposer('status')} className="flex-1 h-10 bg-transparent text-slate-400 text-sm font-medium text-left px-2 outline-none hover:text-slate-300 transition-colors">
              Hôm nay bạn thấy thế nào?
            </button>
            <div className="flex items-center gap-1.5 pr-1">
              <button onClick={() => openSocialComposer('progress')} className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 active:scale-95 transition-all shadow-sm" title="Báo cáo tiến độ">
                <Share2 size={14} />
              </button>
              <button onClick={() => openSocialComposer('challenge')} className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center hover:bg-purple-500/20 active:scale-95 transition-all shadow-sm" title="Tạo kèo thách đấu">
                <Swords size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* STORIES SECTION (Hydration Story Rings) */}
        <div className="pt-1 pb-3 border-b border-white/5">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
                    <div className="relative w-16 h-16">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <circle cx="32" cy="32" r="30" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - (profile?.water_goal ? Math.min(100, (profile.water_today || 0) / profile.water_goal * 100) : 0) / 100)} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-[4px] rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-black text-slate-500">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <button onClick={() => openSocialComposer('story')} className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 active:scale-95 transition-all shadow-lg">
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                    <p className="text-slate-400 text-[11px] font-semibold w-16 text-center truncate mt-1">Bạn</p>
                </div>
                
                {socialStories.map((story, index) => {
                  const storyPct = story.author?.water_goal ? Math.min(100, ((story.author?.water_today || 0) / story.author.water_goal) * 100) : (Math.random() * 50 + 40);
                  const storyDashOffset = 188.5 * (1 - storyPct / 100);
                  const ringColor = storyPct >= 100 ? '#10b981' : storyPct >= 50 ? '#06b6d4' : '#f59e0b';

                  return (
                    <div key={story.id || `story-${index}`} className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveStoryIndex(index)}>
                        <div className="relative w-16 h-16">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                                <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                <circle cx="32" cy="32" r="30" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray="188.5" strokeDashoffset={storyDashOffset} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-[4px] rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900 overflow-hidden">
                                {story.author?.avatar_url ? (
                                    <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-black text-white">{(story.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <p className="text-white text-[11px] font-bold w-16 text-center truncate mt-1">{story.author?.nickname || 'Người dùng'}</p>
                    </div>
                  );
                })}
            </div>
        </div>

        {/* ================= GỢI Ý TƯƠNG TÁC (SOCIAL TRIGGERS) ================= */}
        {socialTriggers.length > 0 && feedFilter === 'all' && (
          <div className="mb-2 mt-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 px-4 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-rose-500 animate-pulse" /> Gợi ý tương tác
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
              <AnimatePresence>
                {socialTriggers.map((trigger) => (
                  <motion.div
                    key={trigger.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, width: 0, padding: 0, margin: 0 }}
                    transition={{ type: 'spring', bounce: 0.4 }}
                    className={`shrink-0 w-64 rounded-3xl border p-4 flex flex-col gap-3 relative overflow-hidden shadow-lg ${
                      trigger.type === 'nudge' ? 'bg-cyan-900/20 border-cyan-500/20 shadow-cyan-500/5' : 'bg-emerald-900/20 border-emerald-500/20 shadow-emerald-500/5'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full pointer-events-none ${trigger.type === 'nudge' ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`} />
                    <div className="flex items-center gap-3 relative z-10">
                      <img src={trigger.avatar} alt={trigger.name} className={`w-11 h-11 rounded-full object-cover border-2 ${trigger.type === 'nudge' ? 'border-cyan-500/50' : 'border-emerald-500/50'}`} />
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{trigger.name}</p>
                        <p className="text-slate-400 text-xs truncate mt-0.5">{trigger.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTriggerAction(trigger.id, trigger.type, trigger.name)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2 ${trigger.type === 'nudge' ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                    >
                      {trigger.type === 'nudge' ? <><Bell size={14} /> Huých nhẹ</> : <><Sparkles size={14} /> Chúc mừng</>}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ================= PHASE 7: GỢI Ý KẾT BẠN (SUGGESTED PEOPLE) ================= */}
        <div className="mb-2 mt-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 px-4 flex items-center gap-1.5">
            <Users size={14} className="text-purple-400" /> Có thể bạn quen
          </p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
            {[
              { id: 'suggest-1', name: 'Thanh Trúc', avatar: 'https://i.pravatar.cc/150?u=thanhtruc', reason: 'Cùng nhóm tuổi & mục tiêu', mutual: 2 },
              { id: 'suggest-2', name: 'Quốc Bảo', avatar: 'https://i.pravatar.cc/150?u=quocbao', reason: 'Cùng tham gia Thử thách Tuần', mutual: 5 },
              { id: 'suggest-3', name: 'Gia Hân', avatar: 'https://i.pravatar.cc/150?u=giahan', reason: 'Có thói quen uống nước giống bạn', mutual: 1 },
            ].map((person) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className="shrink-0 w-48 rounded-3xl border border-white/10 bg-slate-900/50 p-4 flex flex-col items-center text-center shadow-lg"
              >
                <div className="relative mb-3">
                  <img src={person.avatar} alt={person.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-700" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                    {person.mutual}
                  </div>
                </div>
                <p className="text-white font-bold text-sm truncate w-full">{person.name}</p>
                <p className="text-slate-400 text-[10px] h-8 mt-1">{person.reason}</p>
                <button
                  onClick={() => toast.success(`Đã gửi lời mời kết bạn đến ${person.name}`)}
                  className="w-full mt-3 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-purple-500/30 active:scale-95 transition-all"
                >
                  <UserPlus size={14} /> Kết bạn
                </button>
              </motion.div>
            ))}
             <div className="shrink-0 w-48 rounded-3xl border-2 border-dashed border-slate-700/80 bg-slate-900/30 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-cyan-500/50 transition-colors" onClick={() => setShowDiscoverPeople(true)}>
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                  <Users size={20} className="text-slate-500" />
                </div>
                <p className="text-slate-300 font-bold text-sm">Tìm thêm bạn</p>
                <p className="text-slate-500 text-xs mt-1">Mở rộng mạng lưới</p>
             </div>
          </div>
        </div>

        {/* THÔNG BÁO KHI LỌC KHÔNG CÓ KẾT QUẢ */}
        {!socialError && !isLoading && finalRankedFeed.length === 0 && (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl shadow-lg p-8 text-center backdrop-blur-sm mt-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                <Filter size={28} className="text-slate-500" />
            </div>
            <p className="text-white text-lg font-bold mb-2">Chưa có bài đăng nào</p>
            <p className="text-slate-400 text-sm mb-6">Chưa có nội dung phù hợp với bộ lọc hiện tại.</p>
            <button onClick={() => setFeedFilter('all')} className="py-2.5 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold active:scale-95 transition-all hover:bg-white/10">
                Xem tất cả
            </button>
          </div>
        )}

        {/* Render Feed */}
        {!socialError && finalRankedFeed.length > 0 && (
            <div className="space-y-4 px-4 sm:px-0">
                {finalRankedFeed.map((post, index: number) => (
                <PostCard 
                    key={post.id && String(post.id).trim() !== '' ? post.id : `fallback-post-${index}`} 
                    post={post} 
                    currentUserId={profile?.id} 
                    handleToggleLikePost={handleToggleLikePost}
                    onOpenComments={setActiveCommentPost}
                />
                ))}
            </div>
        )}

        {/* Render Modal Bình Luận */}
        <AnimatePresence>
          {activeCommentPost && (
            <CommentsView key="comments-view-modal" post={activeCommentPost} currentUserId={profile?.id} onClose={() => setActiveCommentPost(null)} />
          )}
        </AnimatePresence>

        {/* Render Modal Notifications */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationsView key="notifications-view-modal" notifications={notifications} unreadCount={unreadCount} markAllRead={markAllRead} markAsRead={markAsRead} onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>

        {/* Render Modal Story Viewer */}
        <AnimatePresence>
          {activeStoryIndex !== null && socialStories[activeStoryIndex] && (
            <HydrationStoryViewer key={`story-viewer-${activeStoryIndex}`}
              story={socialStories[activeStoryIndex]} 
              onClose={() => setActiveStoryIndex(null)}
              onNext={handleNextStory}
              onPrev={handlePrevStory}
            />
          )}
        </AnimatePresence>

        {finalRankedFeed.length > 0 && (
            <div ref={observerTarget} className="py-8 text-center">
                {isFetchingMore ? <Loader2 size={24} className="text-slate-500 animate-spin mx-auto" /> : 
                 hasMore ? <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đang tải thêm...</p> : 
                 (<div><div className="w-2 h-2 bg-slate-700 rounded-full mx-auto mb-3" /><p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đã xem hết tin</p></div>)}
            </div>
        )}

      </div>
    </div>
  );
}