import { Swords, Trophy, Zap, Target, Clock, TrendingUp, X, ChevronRight, Coins, Shield, Flame, Activity } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CountUp from '../components/CountUp';

// ── Types ──────────────────────────────────────────────────

interface Battle {
  id: string;
  opponent: {
    nickname: string;
    level: number;
    avatar?: string;
  };
  status: 'active' | 'pending' | 'completed';
  wager: number;
  mode: 'daily' | 'quick' | 'tournament';
  yourProgress: number;
  opponentProgress: number;
  endsAt: Date;
  result?: 'win' | 'loss' | 'draw';
}

interface ArenaStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  rank: number;
  rating: number;
  totalCoins: number;
}

interface ArenaTabProps {
  profile: any;
}

// ── Mock Data ──────────────────────────────────────────────

const MOCK_STATS: ArenaStats = {
  wins: 23,
  losses: 8,
  draws: 2,
  winStreak: 5,
  bestStreak: 12,
  rank: 47,
  rating: 1834,
  totalCoins: 2450,
};

const MOCK_BATTLES: Battle[] = [
  {
    id: '1',
    opponent: { nickname: 'HydroKing', level: 18 },
    status: 'active',
    wager: 100,
    mode: 'daily',
    yourProgress: 1850,
    opponentProgress: 1620,
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
  },
  {
    id: '2',
    opponent: { nickname: 'AquaWarrior', level: 15 },
    status: 'pending',
    wager: 50,
    mode: 'quick',
    yourProgress: 0,
    opponentProgress: 0,
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    opponent: { nickname: 'WaterMaster', level: 22 },
    status: 'completed',
    wager: 200,
    mode: 'tournament',
    yourProgress: 2100,
    opponentProgress: 2350,
    endsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    result: 'loss',
  },
];

// ── Component ──────────────────────────────────────────────

const ArenaTab = ({ profile }: ArenaTabProps) => {
  const [selectedMode, setSelectedMode] = useState<'daily' | 'quick' | 'tournament' | null>(null);
  const [showBattleDetail, setShowBattleDetail] = useState<Battle | null>(null);

  const stats = MOCK_STATS;
  const battles = MOCK_BATTLES;
  const activeBattles = battles.filter(b => b.status === 'active');
  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-28 pt-6 h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="px-6 mb-6">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">KHU VỰC THÁCH ĐẤU</p>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          Võ Đài <Swords size={28} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        </h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">Thách đấu cùng người chơi khác, cược điểm WP và giành lấy vinh quang trên bảng xếp hạng!</p>
      </div>

      {/* Stats Grid */}
      <div className="px-5 mb-8 grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg group hover:border-cyan-500/30 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/10 blur-2xl rounded-full" />
          <div className="flex justify-between items-start mb-2">
             <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
               <Activity size={16} className="text-cyan-400" />
             </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tỉ lệ thắng</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white"><CountUp value={winRate} /></span>
            <span className="text-sm font-bold text-cyan-400">%</span>
          </div>
          <div className="flex gap-2 mt-3 text-[10px] font-black uppercase tracking-wider">
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{stats.wins} W</span>
            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">{stats.losses} L</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg group hover:border-amber-500/30 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 blur-2xl rounded-full" />
          <div className="flex justify-between items-start mb-2">
             <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
               <Trophy size={16} className="text-amber-400" />
             </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Hạng / Elo</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-500">#</span>
            <span className="text-3xl font-black text-white"><CountUp value={stats.rank} /></span>
          </div>
          <div className="flex gap-2 mt-3 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg w-fit border border-amber-500/20">
            <Flame size={14} /> <CountUp value={stats.rating} /> Elo
          </div>
        </div>
      </div>

      {/* Battle Modes */}
      <div className="px-5 mb-8">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
           <Target size={18} className="text-cyan-400" /> Chọn chế độ
        </h3>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-2 flex gap-2">
          {[
            { id: 'daily' as const, icon: Clock, label: 'Hằng ngày', desc: '24h', wager: '50-200' },
            { id: 'quick' as const, icon: Zap, label: 'Tức thời', desc: '1h', wager: '10-100' },
            { id: 'tournament' as const, icon: Trophy, label: 'Giải đấu', desc: '7 ngày', wager: '100-500' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMode(m.id);
                toast(`Bắt đầu tìm đối thủ cho chế độ ${m.label}...`, {
                  duration: 2000,
                  action: { label: 'Huỷ', onClick: () => setSelectedMode(null) },
                });
              }}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-300 relative overflow-hidden ${
                selectedMode === m.id 
                  ? 'bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                  : 'hover:bg-white/5 border border-transparent'
              } active:scale-95`}
            >
              {selectedMode === m.id && <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />}
              <m.icon size={20} className={selectedMode === m.id ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500'} />
              <div className="text-center relative z-10">
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedMode === m.id ? 'text-cyan-400' : 'text-slate-400'}`}>{m.label}</p>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5 flex items-center justify-center gap-1"><Coins size={10}/> {m.wager}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Battles */}
      {activeBattles.length > 0 && (
        <div className="px-5 mb-8">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
             <div className="relative">
               <Swords size={18} className="text-red-400" />
               <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
             </div>
             Đang diễn ra
          </h3>
          <div className="space-y-3">
            {activeBattles.map(battle => (
              <BattleCard
                key={battle.id}
                battle={battle}
                userNickname={profile?.nickname || 'Bạn'}
                onClick={() => setShowBattleDetail(battle)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Battles */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-white font-bold text-lg flex items-center gap-2">
             <TrendingUp size={18} className="text-emerald-400" /> Lịch sử đấu
           </h3>
           <button className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">
             Xem tất cả
           </button>
        </div>

        <div className="space-y-2">
          {battles.filter(b => b.status === 'completed').slice(0, 3).map(battle => (
            <BattleHistoryItem key={battle.id} battle={battle} />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {battles.length === 0 && (
        <div className="px-5 py-12 flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-slate-700 rounded-3xl mx-5 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <Swords size={28} className="text-slate-500" />
          </div>
          <p className="text-white text-base font-bold mb-1">Chưa có trận đấu nào</p>
          <p className="text-slate-400 text-xs text-center px-4">Chọn chế độ ở trên để bắt đầu tìm kiếm đối thủ và so tài!</p>
        </div>
      )}

      {/* Battle Detail Modal */}
      <AnimatePresence>
        {showBattleDetail && (
          <BattleDetailModal
            battle={showBattleDetail}
            userNickname={profile?.nickname || 'Bạn'}
            onClose={() => setShowBattleDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── BattleCard Component ───────────────────────────────────

interface BattleCardProps {
  battle: Battle;
  userNickname: string;
  onClick: () => void;
}

const BattleCard = ({ battle, userNickname, onClick }: BattleCardProps) => {
  const yourLead = battle.yourProgress > battle.opponentProgress;
  const delta = Math.abs(battle.yourProgress - battle.opponentProgress);
  const totalProgress = battle.yourProgress + battle.opponentProgress;
  const yourPct = totalProgress > 0 ? (battle.yourProgress / totalProgress) * 100 : 50;

  const timeLeft = Math.max(0, battle.endsAt.getTime() - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-xl hover:border-cyan-500/30 transition-all p-5 shadow-lg group relative overflow-hidden"
    >
      {/* Mode Badge & Time */}
      <div className="flex justify-between items-center mb-5">
         <div className="flex items-center gap-2">
           <div className="px-3 py-1 rounded-lg bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 border border-slate-700">
             {battle.mode === 'daily' ? 'Hằng ngày' : battle.mode === 'quick' ? 'Tức thời' : 'Giải đấu'}
           </div>
           <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
             <Coins size={12}/> {battle.wager} WP
           </div>
         </div>
         <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
           <Clock size={12}/> {hoursLeft}h {minsLeft}m
         </div>
      </div>

      {/* VS HUD */}
      <div className="flex items-center justify-between mb-4">
         {/* You */}
         <div className="flex flex-col items-start w-1/3">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-[10px] font-black">
               {userNickname.charAt(0).toUpperCase()}
             </div>
             <span className="text-xs font-bold text-slate-300 truncate">{userNickname}</span>
           </div>
           <span className={`text-2xl font-black ${yourLead ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-white'}`}>{battle.yourProgress}</span>
         </div>

         {/* VS Badge */}
         <div className="flex flex-col items-center justify-center px-2">
           <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-500 italic">VS</div>
           <div className={`text-[10px] font-black mt-1 px-2 py-0.5 rounded ${yourLead ? 'text-cyan-400 bg-cyan-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
             {yourLead ? '+' : '-'}{delta}
           </div>
         </div>

         {/* Opponent */}
         <div className="flex flex-col items-end w-1/3">
           <div className="flex items-center gap-2 mb-1 flex-row-reverse">
             <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-[10px] font-black">
               {battle.opponent.nickname.charAt(0).toUpperCase()}
             </div>
             <span className="text-xs font-bold text-slate-300 truncate">{battle.opponent.nickname}</span>
           </div>
           <span className={`text-2xl font-black ${!yourLead ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(243,62,110,0.5)]' : 'text-white'}`}>{battle.opponentProgress}</span>
         </div>
      </div>

      {/* Tug of war bar */}
      <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden flex border border-white/5">
        <motion.div initial={{ width: '50%' }} animate={{ width: `${yourPct}%` }} className="bg-gradient-to-r from-cyan-600 to-cyan-400 relative">
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
        <motion.div initial={{ width: '50%' }} animate={{ width: `${100 - yourPct}%` }} className="bg-gradient-to-l from-rose-600 to-rose-400" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10" />
      </div>
    </motion.button>
  );
};

// ── BattleHistoryItem Component ────────────────────────────

const BattleHistoryItem = ({ battle }: { battle: Battle }) => {
  if (battle.status !== 'completed' || !battle.result) return null;

  const isWin = battle.result === 'win';
  const isDraw = battle.result === 'draw';

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
          isDraw ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' : 
          'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {isWin ? <Trophy size={18} /> : isDraw ? <Shield size={18} /> : <X size={18} />}
        </div>
        <div>
          <p className="text-sm font-bold text-white">vs {battle.opponent.nickname}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {battle.yourProgress} - {battle.opponentProgress}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              isWin ? 'text-emerald-500' : isDraw ? 'text-slate-500' : 'text-rose-500'
            }`}>
              {isWin ? 'Thắng' : isDraw ? 'Hoà' : 'Thua'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right">
         <div className={`flex items-center justify-end gap-1 text-sm font-black ${
          isWin ? 'text-amber-400' : 'text-slate-500'
         }`}>
           {isWin ? '+' : '-'}{battle.wager} <Coins size={14} className={isWin ? "text-amber-400" : "text-slate-500"}/>
         </div>
         <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">2 giờ trước</p>
      </div>
    </div>
  );
};

// ── BattleDetailModal Component ────────────────────────────

interface BattleDetailModalProps {
  battle: Battle;
  userNickname: string;
  onClose: () => void;
}

const BattleDetailModal = ({ battle, userNickname, onClose }: BattleDetailModalProps) => {
  const yourLead = battle.yourProgress > battle.opponentProgress;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden"
      >
        {/* Glowing background */}
        <div className={`absolute -top-20 ${yourLead ? 'left-0 bg-cyan-500/20' : 'right-0 bg-rose-500/20'} w-40 h-40 blur-[50px] rounded-full pointer-events-none transition-all duration-500`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-xl font-black text-white">Chi tiết trận đấu</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-slate-800 px-2 py-0.5 rounded w-fit border border-slate-700">
              {battle.mode === 'daily' ? 'Hằng ngày' : battle.mode === 'quick' ? 'Tức thời' : 'Giải đấu'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* VS Display */}
        <div className="relative mb-8 z-10">
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-xl">
              <span className="text-xs font-black text-slate-500 italic">VS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {/* You */}
            <div className={`rounded-3xl border p-4 text-center transition-colors ${yourLead ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-800/50 border-white/5'}`}>
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border ${yourLead ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                <span className="text-xl font-black">{userNickname.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1 truncate">{userNickname}</p>
              <p className={`text-2xl font-black ${yourLead ? 'text-cyan-400' : 'text-white'}`}>{battle.yourProgress}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">ml uống</p>
            </div>

            {/* Opponent */}
            <div className={`rounded-3xl border p-4 text-center transition-colors ${!yourLead ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(243,62,110,0.15)]' : 'bg-slate-800/50 border-white/5'}`}>
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border ${!yourLead ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                <span className="text-xl font-black">{battle.opponent.nickname.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1 truncate">{battle.opponent.nickname}</p>
              <p className={`text-2xl font-black ${!yourLead ? 'text-rose-400' : 'text-white'}`}>{battle.opponentProgress}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">ml uống</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={14} className="text-amber-500" />
              <span className="text-[9px] text-amber-500/70 uppercase tracking-widest font-bold">Mức cược</span>
            </div>
            <p className="text-lg font-black text-amber-400">{battle.wager} WP</p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-slate-400" />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Thời gian còn</span>
            </div>
            <p className="text-lg font-black text-white">
              {Math.floor((battle.endsAt.getTime() - Date.now()) / (1000 * 60 * 60))}h
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10">
          {battle.status === 'active' && (
            <button
              onClick={() => {
                toast.success('💧 Đã nạp thêm nước và đẩy tiến độ!');
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 transition-all"
            >
              Bơm thêm nước ngay!
            </button>
          )}

          {battle.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.error('Đã từ chối thách đấu');
                  onClose();
                }}
                className="flex-1 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm active:scale-95 transition-all hover:bg-slate-700"
              >
                Từ chối
              </button>
              <button
                onClick={() => {
                  toast.success('⚔️ Đã chấp nhận thách đấu!');
                  onClose();
                }}
                className="flex-[2] py-4 rounded-2xl bg-cyan-500 text-black font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all hover:bg-cyan-400"
              >
                Chấp nhận
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ArenaTab;