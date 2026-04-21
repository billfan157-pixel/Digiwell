import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Plus,
  CheckCircle2,
  Shield,
  X,
  Loader2,
  Search,
  Flame,
  ChevronRight,
  Crown,
  ShieldCheck,
  Lock as LockIcon
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import ClubDashboard from "./clubs/ClubDashboard";

interface Club {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  member_count: number;
  total_wp: number;
  created_at: string;
  min_level_required: number;
  club_level: number;
}

// --- BỘ LUẬT NGŨ ĐẠI THỬ THÁCH ---
const REQ_WATER_ML = 50000;   // 1. 50 Lít nước
const REQ_LEVEL = 30;         // 2. Level 30
const REQ_STREAK = 21;        // 3. 21 ngày streak
const REQ_FRIENDS = 10;       // 4. 10 người bạn
const CREATION_FEE_WP = 10000; // 5. Phí 10.000 WP

export default function ClubsView({ userId }: { userId: string }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myRoles, setMyRoles] = useState<Record<string, string>>({});
  
  // STATE LƯU TRỮ CHỈ SỐ CỦA SẾP
  const [userStats, setUserStats] = useState({
    totalWater: 0,
    level: 0,
    currentStreak: 0,
    friendCount: 0,
    currentWP: 0,
    ownedClubs: 0
  });

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubMinLevel, setNewClubMinLevel] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userId || userId === 'undefined') return;

    setLoading(true);
    try {
      const [clubsRes, membersRes, waterRes, profileRes, friendsRes, ownedRes] = await Promise.all([
        supabase.from("clubs").select("*").order("total_wp", { ascending: false }),
        supabase.from("club_members").select("club_id, role").eq("user_id", userId),
        supabase.from("water_logs").select("amount, created_at").eq("user_id", userId).order('created_at', { ascending: false }),
        supabase.from("profiles").select("level, total_wp").eq("id", userId).maybeSingle(),
        // Thêm head: true để chỉ lấy count (tiết kiệm băng thông)
        supabase.from("friends").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("clubs").select("*", { count: 'exact', head: true }).eq("owner_id", userId)
      ]);

      if (clubsRes.error) throw clubsRes.error;
      if (membersRes.error) throw membersRes.error;

      // 1. Tính toán lượng nước và Streak
      const logs = waterRes.data || [];
      const totalWater = logs.reduce((sum: number, log: { amount: number | null }) => sum + (log.amount || 0), 0);
      
      const uniqueDays = Array.from(new Set(logs.map((l: { created_at: string }) => l.created_at.split('T')[0]))).sort().reverse();
      const streak = uniqueDays.length > 0 ? uniqueDays.length : 0; // Tạm dùng tổng số ngày log làm streak

      // Cập nhật chỉ số
      setUserStats({
        totalWater,
        level: profileRes.data?.level || 0,
        currentStreak: streak,
        friendCount: friendsRes.count || 0,
        currentWP: profileRes.data?.total_wp || 0,
        ownedClubs: ownedRes.count || 0
      });

      setClubs(clubsRes.data || []);
      
      const rolesMap: Record<string, string> = {};
      (membersRes.data || []).forEach((m: { club_id: string; role: string }) => {
        rolesMap[m.club_id] = m.role;
      });
      setMyRoles(rolesMap);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể kết nối với bộ não Bang hội");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userId !== 'undefined') fetchData();
  }, [userId]);

  const handleJoin = async (clubId: string) => {
    setJoiningId(clubId);
    try {
      const { error } = await supabase.from("club_members").insert({
        club_id: clubId,
        user_id: userId,
        role: "member",
      });

      if (error) throw error;

      toast.success("Chào mừng đồng chí gia nhập bang! 🤝");
      await fetchData(); 
    } catch (err: any) {
      toast.error("Không thể gia nhập: " + err.message);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newClubName.trim();
    const trimmedDesc = newClubDesc.trim();

    if (!trimmedName) {
      toast.error("Tên bang hội không được để trống sếp ơi!");
      return;
    }
    if (trimmedName.length < 3) {
      toast.error("Tên bang phải có ít nhất 3 ký tự.");
      return;
    }
    if (trimmedName.length > 50) {
      toast.error("Tên bang không được dài quá 50 ký tự.");
      return;
    }
    if (trimmedDesc.length > 200) {
      toast.error("Mô tả không được dài quá 200 ký tự.");
      return;
    }

    setIsCreating(true);
    try {
      // BƯỚC 1: KIỂM TRA TÊN TRÙNG LẶP
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('name')
        .ilike('name', trimmedName)
        .maybeSingle();

      if (existingClub) {
        throw new Error("Tên bang hội này đã tồn tại. Vui lòng chọn tên khác.");
      }

      // BƯỚC 2: TẠO BANG MỚI
      const { data: newClubData, error: insertError } = await supabase
        .from("clubs")
        .insert({
          name: trimmedName,
          description: trimmedDesc,
          owner_id: userId,
          min_level_required: newClubMinLevel,
        })
        .select()
        .maybeSingle();

      if (insertError) throw insertError; // Lỗi từ DB
      if (!newClubData) throw new Error("Không thể lấy thông tin bang vừa tạo. Có thể do chính sách RLS."); // Lỗi không đọc lại được

      // BƯỚC 2.5: TỰ ĐỘNG THÊM CHỦ BANG LÀM THÀNH VIÊN (FIX LỖI CHAT & QUẢN LÝ)
      const { error: memberError } = await supabase
        .from("club_members")
        .insert({
          club_id: newClubData.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) throw new Error("Lỗi thiết lập vai trò chủ bang: " + memberError.message);

      // BƯỚC 3: TRỪ THUẾ LẬP BANG
      const { error: wpError } = await supabase
        .from("profiles")
        .update({ total_wp: userStats.currentWP - CREATION_FEE_WP })
        .eq("id", userId);

      if (wpError) console.error("Lỗi khấu trừ WP:", wpError);

      toast.success(`Bang hội "${trimmedName}" đã khai sinh! Sếp đã chi ${CREATION_FEE_WP} WP! 🚩`);
      setShowCreateModal(false);
      setNewClubName("");
      setNewClubDesc("");
      setNewClubMinLevel(1);
      await fetchData(); 
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo bang hội.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    const { totalWater, level, currentStreak, friendCount, currentWP, ownedClubs } = userStats;

    if (ownedClubs >= 1) return toast.error("Sếp đã lãnh đạo một bang rồi, nhường sân chơi cho ae khác nhé! 👑");

    // KIỂM TRA NGŨ ĐẠI THỬ THÁCH
    if (totalWater < REQ_WATER_ML) 
      return toast.error(`Thử thách 1: Cần 50L nước (Sếp có ${(totalWater/1000).toFixed(1)}L) 💧`);
    
    if (level < REQ_LEVEL) 
      return toast.error(`Thử thách 2: Cần Level ${REQ_LEVEL} (Sếp đang Level ${level}) 🆙`);
    
    if (currentStreak < REQ_STREAK) 
      return toast.error(`Thử thách 3: Cần chuỗi ${REQ_STREAK} ngày (Sếp có ${currentStreak} ngày) 🔥`);
    
    if (friendCount < REQ_FRIENDS) 
      return toast.error(`Thử thách 4: Cần ${REQ_FRIENDS} chiến hữu (Sếp có ${friendCount}) 🤝`);
    
    if (currentWP < CREATION_FEE_WP) 
      return toast.error(`Thử thách 5: Thiếu ${CREATION_FEE_WP.toLocaleString()} WP (Sếp còn ${currentWP.toLocaleString()}) 💎`);

    // XÁC NHẬN CHI TRẢ WP
    if (window.confirm(`Sếp chuẩn bị hiến tế ${CREATION_FEE_WP.toLocaleString()} WP để khai sinh bang hội. Sẵn sàng chứ?`)) {
      setShowCreateModal(true);
    }
  };

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-slate-500 text-sm animate-pulse">Đang triệu tập các bang phái...</p>
      </div>
    );
  }

  return (
    <>
      {!selectedClub && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 mt-6 pb-20"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-white font-black text-2xl flex items-center gap-2">
                <Shield className="text-cyan-400" fill="currentColor" fillOpacity={0.2} />
                Cộng đồng
              </h3>
              <p className="text-slate-500 text-xs mt-1">Gia nhập bang, cùng nhau nạp nước</p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
            >
              + Tạo Bang
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bang hội..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="grid gap-4">
            {filteredClubs.map((club) => {
              const myRole = myRoles[club.id]; 
              const isMember = !!myRole; 
              const isOwner = myRole === 'owner' || club.owner_id === userId; 
              const canJoin = userStats.level >= (club.min_level_required || 1);
              const isJoining = joiningId === club.id;

              return (
                <motion.div
                  key={club.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => (isMember || isOwner) && setSelectedClub(club)}
                  className={`relative overflow-hidden bg-slate-900/40 border rounded-3xl p-5 transition-all group ${
                    (isMember || isOwner) ? "cursor-pointer border-white/10 hover:border-cyan-500/30" : "border-white/5"
                  }`}
                >
                  {(isMember || isOwner) && (
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full" />
                  )}

                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-lg">{club.name}</h4>
                        {club.total_wp > 50000 && <Flame size={14} className="text-orange-500" fill="currentColor" />}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1 pr-10">
                        {club.description || "Thành viên tích cực, nạp nước mỗi ngày"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400">
                        <Users size={18} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{club.member_count} mems</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
                        <Shield size={14} /> Cấp {club.club_level || 1}
                      </div>
                      {(club.min_level_required || 1) > 1 && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                          <ShieldCheck size={14} /> Y/C: Lv.{club.min_level_required}+
                        </div>
                      )}
                    </div>

                    {isOwner ? (
                      <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                        <Crown size={14} /> Bang của sếp
                      </div>
                    ) : isMember ? (
                      <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors">
                        Vào bang <ChevronRight size={14} />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canJoin) {
                            handleJoin(club.id);
                          } else {
                            toast.error(`Cảnh giới chưa đủ! Yêu cầu cấp ${club.min_level_required} để gia nhập.`);
                          }
                        }}
                        disabled={isJoining || !canJoin}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[100px] ${
                          canJoin
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isJoining ? <Loader2 size={14} className="animate-spin" /> : canJoin ? "Gia nhập" : <LockIcon size={12} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedClub && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-slate-950"
          >
            <ClubDashboard 
              clubId={selectedClub.id} 
              userId={userId}
              onBack={() => setSelectedClub(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.form
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onSubmit={handleCreateClub}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-7 rounded-[2.5rem] shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-white font-black text-xl">Lập Bang Mới</h2>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Tên Bang Hội</label>
                    <span className={`text-[10px] font-mono ${newClubName.length > 50 ? 'text-red-400' : 'text-slate-500'}`}>{newClubName.length}/50</span>
                  </div>
                  <input
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="Vd: Biệt Đội Nước Cam"
                    maxLength={50}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Khẩu Hiệu / Mô tả</label>
                    <span className={`text-[10px] font-mono ${newClubDesc.length > 200 ? 'text-red-400' : 'text-slate-500'}`}>{newClubDesc.length}/200</span>
                  </div>
                  <textarea
                    value={newClubDesc}
                    onChange={(e) => setNewClubDesc(e.target.value)}
                    placeholder="Vd: Không uống nước, không về nhà..."
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white h-28 resize-none outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Cấp độ yêu cầu tối thiểu</label>
                    <span className="font-bold text-cyan-400">Lv.{newClubMinLevel}</span>
                  </div>
                  <input
                    type="range" min="1" max="100"
                    value={newClubMinLevel}
                    onChange={(e) => setNewClubMinLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isCreating ? "ĐANG TRIỆU TẬP..." : "XÁC NHẬN LẬP BANG"}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}