import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Droplets,
  Crown,
  Medal,
  Loader2,
  ChevronLeft,
  MessageSquare,
  LayoutDashboard,
  ShieldAlert,
  MoreVertical,
  Shield,
  User,
  XCircle,
  History,
  Edit2,
  X,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import ClubChat from "./ClubChat"; // Cực kỳ quan trọng: Nhớ import file Chat vào đây sếp nhé!

interface Club {
  id: string;
  name: string;
  description?: string;
  weekly_goal_ml?: number;
  owner_id: string;
  min_level_required: number;
}

interface Leader {
  user_id: string;
  total_ml: number;
  role: string;
  profiles?: {
    nickname?: string;
    avatar_url?: string;
  };
}

interface Activity {
  id: string;
  message: string;
  amount: number;
  created_at: string;
  profiles?: {
    nickname?: string;
  };
}

interface AdminLog {
  id: string;
  created_at: string;
  message: string;
  profiles: {
    nickname: string;
  } | null;
}

export default function ClubDashboard({
  clubId,
  userId, // THÊM PROP NÀY ĐỂ TRUYỀN CHO CHAT
  onBack,
}: {
  clubId: string;
  userId: string; // THÊM PROP NÀY
  onBack: () => void;
}) {
  const [club, setClub] = useState<Club | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [managingMember, setManagingMember] = useState<Leader | null>(null);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [clubLevel, setClubLevel] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClubMinLevel, setEditingClubMinLevel] = useState(1);
  const [editingClubName, setEditingClubName] = useState("");
  const [editingClubDesc, setEditingClubDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // STATE CHUYỂN TAB
  const [tab, setTab] = useState<'overview' | 'chat' | 'admin'>('overview');

  const currentUserRole = useMemo(() => {
    return leaders.find(l => l.user_id === userId)?.role;
  }, [leaders, userId]);

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'deputy';

  const goal = club?.weekly_goal_ml || 100000;

  const totalMl = useMemo(() => {
    return leaders.reduce((sum, item) => sum + item.total_ml, 0);
  }, [leaders]);

  const progress = Math.min((totalMl / goal) * 100, 100);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sử dụng Promise.allSettled để tất cả các API đều chạy, kể cả khi một trong số chúng lỗi
      const results = await Promise.allSettled([
        supabase.from("clubs").select("id,name,description,weekly_goal_ml,owner_id,min_level_required").eq("id", clubId).single(),
        supabase.from('club_members').select('user_id, role, total_ml, profiles(nickname, avatar_url)').eq('club_id', clubId).order('total_ml', { ascending: false }).limit(50),
        supabase.from("club_activity").select(`id, message, amount, created_at, profiles (nickname)`).eq("club_id", clubId).order("created_at", { ascending: false }).limit(20),
        supabase.from('club_admin_logs').select(`id, created_at, message, profiles ( nickname )`).eq('club_id', clubId).order('created_at', { ascending: false }).limit(50),
        supabase.rpc('get_club_level', { p_club_id: clubId })
      ]);

      // Xử lý từng kết quả một cách an toàn
      if (results[0].status === 'fulfilled' && results[0].value.data) {
        setClub(results[0].value.data);
      } else if (results[0].status === 'rejected') {
        console.error("Error fetching club info:", results[0].reason);
        throw new Error("Không thể tải thông tin bang hội.");
      }

      if (results[1].status === 'fulfilled' && results[1].value.data) {
        setLeaders(results[1].value.data as Leader[]);
      } else {
        console.error("Error fetching leaders:", results[1].status === 'rejected' && results[1].reason);
        setLeaders([]); // Fallback
      }

      if (results[2].status === 'fulfilled' && results[2].value.data) {
        setActivities(results[2].value.data || []);
      } else {
        console.error("Error fetching activities:", results[2].status === 'rejected' && results[2].reason);
        setActivities([]); // Fallback
      }

      if (results[3].status === 'fulfilled' && results[3].value.data) {
        setAdminLogs(results[3].value.data as AdminLog[]);
      } else {
        console.warn("Could not fetch admin logs. The table might not exist yet.", results[3].status === 'rejected' && results[3].reason);
        setAdminLogs([]); // Fallback
      }

      if (results[4].status === 'fulfilled' && results[4].value.data) {
        setClubLevel(results[4].value.data);
      } else {
        console.warn("Could not fetch club level. The RPC might not exist yet.", results[4].status === 'rejected' && results[4].reason);
        setClubLevel(1); // Fallback
      }

    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra khi tải dữ liệu bang hội.");
      toast.error("Không thể tải dashboard bang hội.");
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (message: string) => {
    await supabase.from('club_admin_logs').insert({
      club_id: clubId,
      actor_id: userId,
      message: message,
    });
  };

  const handleOpenEditModal = () => {
    if (!club) return;
    setEditingClubName(club.name);
    setEditingClubDesc(club.description || "");
    setEditingClubMinLevel(club.min_level_required || 1);
    setShowEditModal(true);
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || userId !== club.owner_id) {
      toast.error("Chỉ chủ bang mới có quyền này.");
      return;
    }

    const trimmedName = editingClubName.trim();
    const trimmedDesc = editingClubDesc.trim();

    if (!trimmedName || trimmedName.length < 3) {
      toast.error("Tên bang phải có ít nhất 3 ký tự.");
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading("Đang cập nhật thông tin bang...");

    try {
      const { error } = await supabase
        .from('clubs')
        .update({ name: trimmedName, description: trimmedDesc, min_level_required: editingClubMinLevel })
        .eq('id', clubId);

      if (error) throw error;

      await logAdminAction(`đã cập nhật thông tin bang hội.`);
      toast.success("Cập nhật thành công!", { id: toastId });
      setShowEditModal(false);
      // Cập nhật UI ngay lập tức
      setClub(prev => prev ? { ...prev, name: trimmedName, description: trimmedDesc, min_level_required: editingClubMinLevel } : null);
    } catch (err: any) {
      toast.error("Lỗi: " + err.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisbandClub = async () => {
    if (!club || !userId || userId !== club.owner_id) {
      toast.error("Chỉ chủ bang mới có quyền giải tán bang.");
      return;
    }

    if (!window.confirm(`Sếp có chắc chắn muốn giải tán bang "${club.name}" không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan!`)) {
      return;
    }

    setIsDisbanding(true);
    const toastId = toast.loading("Đang tiến hành giải tán bang hội...");

    try {
      // LƯU Ý: Cách tốt nhất là tạo một hàm RPC trên Supabase để thực hiện các thao tác xóa này trong một transaction duy nhất,
      // đảm bảo tính toàn vẹn dữ liệu và bảo mật. Đây là cách làm tạm thời trên client.
      
      // Xóa các bản ghi phụ thuộc trước
      await supabase.from('club_activity').delete().eq('club_id', club.id);
      await supabase.from('club_messages').delete().eq('club_id', club.id);
      await supabase.from('club_daily_stats').delete().eq('club_id', club.id);
      await supabase.from('club_members').delete().eq('club_id', club.id);

      // Cuối cùng, xóa bang hội
      const { error: clubError } = await supabase.from('clubs').delete().eq('id', club.id);

      if (clubError) {
        throw clubError;
      }

      toast.success(`Bang hội "${club.name}" đã được giải tán.`, { id: toastId });
      onBack(); // Quay về trang danh sách clubs
    } catch (err: any) {
      console.error("Lỗi giải tán bang:", err);
      toast.error("Không thể giải tán bang lúc này: " + err.message, { id: toastId });
    } finally {
      setIsDisbanding(false);
    }
  };

  const handleSetRole = async (targetUserId: string, newRole: 'deputy' | 'member') => {
    if (!club || userId !== club.owner_id) {
      toast.error("Chỉ chủ bang mới có quyền này.");
      return;
    }
    if (targetUserId === userId) {
      toast.error("Sếp không thể tự thay đổi vai trò của mình.");
      return;
    }

    const toastId = toast.loading(`Đang ${newRole === 'deputy' ? 'bổ nhiệm' : 'hạ chức'}...`);
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ role: newRole })
        .match({ club_id: clubId, user_id: targetUserId });

      if (error) throw error;

      // LOG ACTION
      const targetUserName = managingMember?.profiles?.nickname || 'thành viên';
      const message = newRole === 'deputy' 
        ? `đã bổ nhiệm ${targetUserName} làm Phó bang`
        : `đã hạ chức ${targetUserName} về làm thành viên`;
      await logAdminAction(message);

      toast.success("Cập nhật vai trò thành công!", { id: toastId });
      setManagingMember(null); // Close the menu
      fetchDashboard();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message, { id: toastId });
    }
  };

  const handleKickMember = async (targetUserId: string, targetUserName: string) => {
    const targetUser = leaders.find(l => l.user_id === targetUserId);
    if (!club || !isAdmin) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    if (targetUserId === userId) {
      toast.error("Sếp không thể tự kick chính mình.");
      return;
    }
    if (currentUserRole === 'deputy' && (targetUser?.role === 'owner' || targetUser?.role === 'deputy')) {
      toast.error("Phó bang không thể mời người có chức vụ tương đương hoặc cao hơn ra khỏi bang.");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn mời "${targetUserName}" ra khỏi bang không?`)) return;

    const toastId = toast.loading(`Đang xử lý...`);
    try {
      const { error } = await supabase.from('club_members').delete().match({ club_id: clubId, user_id: targetUserId });
      if (error) throw error;

      await logAdminAction(`đã mời ${targetUserName} ra khỏi bang`);

      toast.success(`Đã mời "${targetUserName}" ra khỏi bang.`, { id: toastId });
      setManagingMember(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message, { id: toastId });
    }
  };

  useEffect(() => {
    if (!clubId) return;
    fetchDashboard();

    const channel = supabase.channel(`club-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "club_activity",
          filter: `club_id=eq.${clubId}`,
        },
        (payload: any) => {
          console.log('New activity received!', payload);
          fetchDashboard(); // Refetch all for simplicity, can be optimized later
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "club_admin_logs",
          filter: `club_id=eq.${clubId}`,
        },
        (payload: any) => {
          console.log('New admin log received!', payload);
          fetchDashboard(); // Refetch all
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border border-yellow-500/30";
    if (index === 1) return "bg-slate-300/10 border border-slate-300/20";
    if (index === 2) return "bg-orange-500/10 border border-orange-500/20";
    return "bg-white/5 border border-white/5";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400" size={18} />;
    if (index === 1) return <Medal className="text-slate-300" size={18} />;
    if (index === 2) return <Medal className="text-orange-400" size={18} />;
    return <span className="text-slate-500 font-bold">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
        <p className="text-slate-500 mt-3 text-sm">Đang tải dữ liệu bang hội...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <AlertTriangle size={40} className="text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Lỗi Tải Dữ Liệu</h3>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button onClick={onBack} className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold">Quay lại</button>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-white/5 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} />
        </button>

        <h2 className="text-white font-bold">
          {club?.name || "Đang tải..."}
        </h2>

        <div className="ml-3 flex items-center gap-1.5 text-cyan-400 text-xs font-bold bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
          <Shield size={14} /> Cấp {clubLevel}
        </div>

        {userId === club?.owner_id && (
          <button
            onClick={handleOpenEditModal}
            className="ml-auto p-2 rounded-xl bg-white/5 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Club Info Header - LUÔN LUÔN HIỂN THỊ */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-lg">
          <h2 className="text-white text-xl font-black">{club?.name}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {club?.description || "Không có mô tả"}
          </p>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Tiến độ bang hội</span>
              <span className="font-bold text-cyan-400">
                {totalMl.toLocaleString()} / {goal.toLocaleString()} ml
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* BỘ NÚT CHUYỂN TAB */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setTab('overview')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              tab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} /> Tổng quan
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              tab === 'chat' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={18} /> Trò chuyện
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                tab === 'admin' ? 'bg-red-500/80 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield size={18} /> Quản trị
            </button>
          )}
        </div>

        {/* NỘI DUNG TÙY THEO TAB ĐƯỢC CHỌN */}
        {tab === 'overview' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Leaderboard */}
            <div className="space-y-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Trophy className="text-yellow-400" size={18} />
                Leaderboard hôm nay
              </h3>

              {leaders.length === 0 ? (
                <div className="text-center p-6 rounded-2xl bg-white/5 text-slate-400 text-sm">
                  Bang hội chưa có hoạt động hôm nay, hãy là người đầu tiên tu nước nào 🔥
                </div>
              ) : (
                leaders.map((user, index) => (
                  <div
                    key={user.user_id}
                    className={`flex items-center justify-between p-4 rounded-2xl ${getRankStyle(index)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <p className="text-white font-semibold flex items-center gap-2">
                          {user.profiles?.nickname || "Ẩn danh"}
                          {user.role === 'owner' && <Crown size={14} className="text-yellow-400" />}
                          {user.role === 'deputy' && <Shield size={14} className="text-cyan-400" />}
                        </p>
                        <p className="text-xs text-cyan-400 font-medium">
                          {user.total_ml.toLocaleString()} ml
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Flame className="text-yellow-400 animate-pulse" size={18} />
                      )}
                      {isAdmin && user.user_id !== userId && !(currentUserRole === 'deputy' && user.role !== 'member') && (
                        <button onClick={() => setManagingMember(user)} className="p-2 rounded-full hover:bg-white/10 text-slate-500">
                          <MoreVertical size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Activity Feed */}
            <div className="space-y-3 pb-10">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Droplets className="text-cyan-400" size={18} />
                Hoạt động gần đây
              </h3>

              <div className="space-y-2">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col"
                  >
                    <p className="text-sm text-white">
                      <span className="font-semibold text-cyan-400">
                        {item.profiles?.nickname || "Ai đó"}
                      </span>{" "}
                      {item.message}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1 self-end">
                      {new Date(item.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === 'chat' ? (
          /* TAB TRÒ CHUYỆN (CLUB CHAT) */
          <div className="h-[60vh] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ClubChat clubId={clubId} userId={userId} />
          </div>
        ) : (
          /* TAB QUẢN TRỊ */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <History className="text-slate-400" size={18} />
                Nhật ký quản trị
              </h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {adminLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-sm">
                    <span className="font-bold text-cyan-400">{log.profiles?.nickname || 'Một admin'}</span>
                    <span className="text-slate-300"> {log.message}</span>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{new Date(log.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KHU VỰC NGUY HIỂM CHO CHỦ BANG */}
            {userId === club?.owner_id && (
              <div className="mt-8 pt-6 border-t border-red-500/20">
                <h3 className="text-red-400 font-bold text-center mb-3 text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldAlert size={16} /> Khu vực nguy hiểm
                </h3>
                <button
                  onClick={handleDisbandClub}
                  disabled={isDisbanding}
                  className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisbanding ? <Loader2 className="animate-spin" /> : 'Giải tán Bang hội'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {managingMember && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setManagingMember(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative z-10 w-full max-w-md bg-slate-900 border-t border-white/10 rounded-t-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-2">Quản lý thành viên</h3>
              <p className="text-slate-400 mb-6">Bạn đang quản lý: <span className="font-bold text-cyan-400">{managingMember.profiles?.nickname}</span></p>
              
              <div className="space-y-3">
                {managingMember.role !== 'deputy' && (
                  <button onClick={() => handleSetRole(managingMember.user_id, 'deputy')} className="w-full p-4 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold flex items-center gap-3 hover:bg-cyan-500/20 transition-colors">
                    <Shield size={18} /> Bổ nhiệm làm Phó bang
                  </button>
                )}
                {managingMember.role === 'deputy' && (
                  <button onClick={() => handleSetRole(managingMember.user_id, 'member')} className="w-full p-4 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center gap-3 hover:bg-amber-500/20 transition-colors">
                    <User size={18} /> Hạ chức về Thành viên
                  </button>
                )}
                <button onClick={() => handleKickMember(managingMember.user_id, managingMember.profiles?.nickname || 'Thành viên này')} className="w-full p-4 rounded-xl bg-red-500/10 text-red-400 font-bold flex items-center gap-3 hover:bg-red-500/20 transition-colors">
                  <XCircle size={18} /> Mời khỏi bang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onSubmit={handleUpdateClub}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-7 rounded-[2.5rem] shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black text-xl">Chỉnh sửa Bang hội</h2>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Tên Bang Hội</label>
                  <input
                    value={editingClubName}
                    onChange={(e) => setEditingClubName(e.target.value)}
                    maxLength={50}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Khẩu Hiệu / Mô tả</label>
                  <textarea
                    value={editingClubDesc}
                    onChange={(e) => setEditingClubDesc(e.target.value)}
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white h-28 resize-none outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Cấp độ yêu cầu</label>
                    <span className="font-bold text-cyan-400">Lv.{editingClubMinLevel}</span>
                  </div>
                  <input
                    type="range" min="1" max="100"
                    value={editingClubMinLevel}
                    onChange={(e) => setEditingClubMinLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
              <button type="submit" disabled={isUpdating} className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform disabled:opacity-50">
                {isUpdating ? <Loader2 className="animate-spin mx-auto" /> : "LƯU THAY ĐỔI"}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}