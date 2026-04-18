import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Share2, Plus, Users, RefreshCw, Rss, Heart, Zap, Target, MoreHorizontal, MessageCircle, Image as ImageIcon, Globe, Droplets, Swords, Award, Filter, CheckCircle2, Loader2, X, Send, Trash2, Flag, Edit2, ShieldAlert, Flame, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTimeLabel, type SocialFeedPost } from '../lib/social';
import { useFeed } from '../hooks/useFeed';
import { useLike } from '../hooks/useLike';
import { useComments } from '../hooks/useComments';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// ================= NHẬP THUẬT TOÁN =================
import { rankFeedPosts } from '../lib/feedAlgorithm'; 

interface FeedTabProps {
  profile: any;
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
export const PostCard = memo(({ post, currentUserId, handleToggleLikePost, onOpenComments }: any) => {
  const { isLiked, count, toggleLike } = useLike(post.id, currentUserId, post.likedByMe, post.likes_count || 0);
  const [hasCheered, setHasCheered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isMyPost = currentUserId === post.user_id;
  const [isDeleted, setIsDeleted] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'DigiWell', text: post.content, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link chia sẻ');
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
        p_author_id: post.user_id ? String(post.user_id) : '00000000-0000-0000-0000-000000000000',
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
  const handleReportPost = () => { toast.success('Đã gửi báo cáo vi phạm'); setShowMenu(false); };

  const isChallenge = post.type === 'challenge';
  const isMilestone = post.type === 'milestone';
  const isWaterLog = post.type === 'water_log' || post.type === 'daily_goal';

  if (isDeleted) return null;

  return (
    <div id={`post-${post.id}`} className={`transition-all duration-500 bg-slate-900/50 rounded-3xl shadow-lg p-5 border backdrop-blur-sm relative overflow-hidden ${
      isChallenge ? 'border-purple-500/30' : 
      isMilestone ? 'border-orange-500/30' : 
      'border-white/5'
    }`}>
      
      {/* Nền Gradient chìm */}
      {isChallenge && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />}
      {isMilestone && <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />}

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
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden origin-top-right"
                  >
                    {isMyPost ? (
                      <>
                        <button onClick={() => { setShowMenu(false); toast.info('Tính năng chỉnh sửa đang phát triển'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors">
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
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mb-4">
        {isChallenge ? (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-purple-300 font-bold mb-1 flex items-center gap-2"><Target size={16}/> Mục tiêu chung:</h4>
            <p className="text-white text-lg font-black leading-relaxed">{post.content}</p>
            <div className="mt-4 flex gap-3">
               <button 
                  onClick={() => toast.success('Đã tham gia thử thách! Cùng cố gắng nhé! 🚀')}
                  className="flex-1 bg-purple-500 text-white font-bold py-2.5 rounded-xl hover:bg-purple-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  Tham gia ngay
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
            {post.content && <p className="text-slate-300 text-sm">{post.content}</p>}
          </div>
        ) : isWaterLog ? (
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Droplets size={24} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-xl font-black">+{post.value || post.hydration_ml || 0} ml</h4>
              <p className="text-slate-400 text-sm truncate">{post.content || 'Vừa nạp thêm nước cho cơ thể.'}</p>
            </div>
          </div>
        ) : (
          <>
            {post.content && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>}
            {post.image_url && (
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
                <img src={post.image_url} alt="Post image" loading="lazy" className="w-full max-h-[500px] object-cover" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Health Context Chips */}
      {(!isMilestone && !isWaterLog && !isChallenge) && (post.hydration_ml || post.streak_snapshot) && (
        <div className="flex items-center gap-2 mb-4 relative z-10">
          {(post.hydration_ml || 0) > 0 && <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1.5"><Droplets size={14}/> +{post.hydration_ml}ml hôm nay</span>}
          {(post.streak_snapshot || 0) > 0 && <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold flex items-center gap-1.5"><Zap size={14}/> Đang giữ chuỗi {post.streak_snapshot} ngày</span>}
        </div>
      )}

      {/* Action Bar Mới: Có nút CỤNG LY */}
      <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
        <button onClick={toggleLike} className="flex flex-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <Heart size={18} className={`transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "group-hover:text-rose-400"}`} /> 
          <span className={isLiked ? "text-rose-500" : ""}>{count > 0 ? count : 'Thích'}</span>
        </button>
        
        {/* Nút ĐẶC QUYỀN APP SỨC KHỎE */}
        {!isChallenge && (
          <button 
            onClick={handleCheers} 
            disabled={hasCheered}
            className={`flex flex-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-95 ${hasCheered ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'}`}
          >
            {hasCheered ? <CheckCircle2 size={18}/> : <Droplets size={18}/>}
            {hasCheered ? 'Đã cụng ly' : 'Cụng ly'}
          </button>
        )}

        <button onClick={() => onOpenComments(post)} className="flex flex-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <MessageCircle size={18} className="group-hover:text-blue-400 transition-colors" /> 
          {(post.comments_count || 0) > 0 ? post.comments_count : 'Bình luận'}
        </button>
      </div>
    </div>
  );
});

// ===================== COMMENTS VIEW (BOTTOM SHEET) =====================
const CommentsView = ({ post, currentUserId, onClose }: any) => {
  const { comments, isLoading, addComment } = useComments(post.id, currentUserId);
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment(text);
    setText('');
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
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                  {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.author?.nickname || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none p-3">
                  <p className="text-white text-xs font-bold mb-1">{c.author?.nickname || 'Người dùng'}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          }
        </div>
        
        {/* Khung Input Chat */}
        <div className="p-4 border-t border-white/10 bg-slate-900 pb-8">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea 
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Viết bình luận..." 
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
const NotificationsView = ({ notifications, unreadCount, markAllRead, markAsRead, onClose }: any) => {
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
              {notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  onClick={() => { 
                    if (!n.is_read) markAsRead(n.id); 
                    const targetId = n.reference_id || n.post_id; // Tuỳ thuộc vào database bạn đang lưu field nào
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
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const finalRankedFeed = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    // 1. Chuẩn hóa dữ liệu từ DB để UI render nhất quán
    const normalizedPosts = posts.map((p: any) => ({
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
        user_name: p.author?.nickname || 'Người dùng',
        user_id: p.author_id,
        user_avatar: p.author?.avatar_url || ''
    }));

    let ranked = rankFeedPosts(normalizedPosts, socialFollowingIds);

    // 2. Lọc theo Smart Filter
    if (feedFilter === 'milestones') {
      ranked = ranked.filter(p => p.type === 'milestone' || p.type === 'daily_goal');
    } else if (feedFilter === 'challenges') {
      ranked = ranked.filter(p => p.type === 'challenge');
    }

    return ranked;
  }, [posts, socialFollowingIds, feedFilter]);


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
      <div className="sticky top-0 z-30 flex flex-col pt-8 pb-3 px-6 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
               Cộng đồng <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] uppercase tracking-widest border border-cyan-500/30">Live</span>
            </h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-slate-950">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              <button onClick={() => setShowSocialProfile(true)} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center active:scale-95 transition-transform">
                  <span className="text-sm font-black text-cyan-400">{(profile?.nickname || 'U')[0].toUpperCase()}</span>
              </button>
            </div>
        </div>

        {/* SMART FILTERS */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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

      <div className="max-w-[600px] mx-auto px-4 mt-4 space-y-6">
        
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.button 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onClick={showNewPosts}
              className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw size={16} className="animate-spin-slow" /> Có {newPostsCount} diễn biến mới
            </motion.button>
          )}
        </AnimatePresence>

        {/* COMPOSER MỚI CÓ NÚT THÁCH ĐẤU */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl shadow-lg p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white bg-slate-800 border-2 border-slate-700/50 flex-shrink-0">
              {(profile?.nickname || 'U')[0].toUpperCase()}
            </div>
            <button onClick={() => openSocialComposer('status')} className="flex-1 h-11 rounded-2xl bg-black/20 border border-white/10 text-slate-400 text-sm font-medium text-left px-5 active:scale-[0.98] transition-all hover:bg-white/5 hover:border-white/20 outline-none">
              Tạo động lực cho cộng đồng...
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openSocialComposer('progress')} className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 active:scale-95 transition-all">
              <Share2 size={16} /> Báo cáo
            </button>
            <button onClick={() => openSocialComposer('challenge')} className="flex-1 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-500/20 active:scale-95 transition-all">
              <Swords size={16} /> Tạo kèo
            </button>
          </div>
        </div>

        {/* STORIES SECTION (Nhỏ gọn hơn) */}
        {socialStories && socialStories.length > 0 && (
            <div className="pt-2 pb-2">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 px-2 flex items-center gap-1"><Zap size={12}/> Vừa cập nhật</p>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-2 snap-x snap-mandatory">
                <div className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-slate-800 border border-white/10">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <span className="text-xl font-black text-slate-500">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <button onClick={() => openSocialComposer('story')} className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 active:scale-95 transition-all shadow-lg">
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                    <p className="text-slate-400 text-[11px] font-semibold w-16 text-center truncate mt-1">Bạn</p>
                </div>
                
                {socialStories.map((story: any, index) => (
                <div key={story.id || `story-${index}`} className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-[3px] border-slate-900 overflow-hidden">
                            {story.author?.avatar_url ? (
                                 <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-black text-white">{(story.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <p className="text-white text-[11px] font-bold w-16 text-center truncate mt-1">{story.author?.nickname || 'Người dùng'}</p>
                </div>
                ))}
            </div>
            </div>
        )}

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
            <div className="space-y-5">
                {finalRankedFeed.map((post: any, index: number) => (
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
            <CommentsView post={activeCommentPost} currentUserId={profile?.id} onClose={() => setActiveCommentPost(null)} />
          )}
        </AnimatePresence>

        {/* Render Modal Notifications */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationsView notifications={notifications} unreadCount={unreadCount} markAllRead={markAllRead} markAsRead={markAsRead} onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>

        {finalRankedFeed.length > 0 && (
            <div ref={observerTarget} className="py-8 text-center">
                {isFetchingMore ? <Loader2 size={24} className="text-slate-500 animate-spin mx-auto" /> : 
                 hasMore ? <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đang tải thêm...</p> : 
                 <div><div className="w-2 h-2 bg-slate-700 rounded-full mx-auto mb-3" /><p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đã xem hết tin</p></div>}
            </div>
        )}

      </div>
    </div>
  );
}