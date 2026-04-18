import React from 'react';
import { Search, RefreshCw, Users, UserMinus, UserPlus } from 'lucide-react';
import type { SocialDiscoverProfile } from '../../lib/social';

interface SocialDiscoverModalProps {
  showDiscoverPeople: boolean;
  setShowDiscoverPeople: (show: boolean) => void;
  socialSearchQuery: string;
  handleSearchSocialUsers: (query: string) => void;
  isSocialSearching: boolean;
  socialSearchResults: SocialDiscoverProfile[];
  handleUnfollowUser: (id: string, nickname: string) => void;
  handleFollowUser: (id: string, nickname: string) => void;
}

export default function SocialDiscoverModal({
  showDiscoverPeople,
  setShowDiscoverPeople,
  socialSearchQuery,
  handleSearchSocialUsers,
  isSocialSearching,
  socialSearchResults,
  handleUnfollowUser,
  handleFollowUser
}: SocialDiscoverModalProps) {
  if (!showDiscoverPeople) return null;
  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

  return (
    <div className="fixed inset-0 z-[90] flex justify-center" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Feed</p>
            <h3 className="text-2xl font-black text-white mt-1">Khám phá</h3>
          </div>
          <button onClick={() => setShowDiscoverPeople(false)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
            Đóng
          </button>
        </div>

        <div className="px-5 pt-5 pb-10">
          <div className="relative mb-5">
            <input
              type="text"
              value={socialSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => void handleSearchSocialUsers(e.target.value)}
              placeholder="Tìm theo nickname..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {isSocialSearching ? (
            <div className={`${card} p-8 text-center`}>
              <RefreshCw size={26} className="text-emerald-400 mx-auto mb-4 animate-spin" />
              <p className="text-white font-semibold">Đang tìm profile...</p>
            </div>
          ) : socialSearchResults.length > 0 ? (
            <div className="space-y-3">
              {socialSearchResults.map((user, index) => (
                <div key={user.id || `discover-res-${index}`} className="rounded-[1.5rem] border border-slate-700 bg-slate-800/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-inner" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                        {(user.nickname || 'D').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold truncate">{user.nickname}</p>
                        <p className="text-slate-500 text-[11px] mt-1">Người dùng DigiWell</p>
                      </div>
                    </div>

                    {user.isFollowing ? (
                      <button onClick={() => void handleUnfollowUser(user.id, user.nickname)} className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                        <UserMinus size={14} /> Bỏ follow
                      </button>
                    ) : (
                      <button onClick={() => void handleFollowUser(user.id, user.nickname)} className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                        <UserPlus size={14} /> Follow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${card} p-8 text-center`}>
              <Users size={34} className="text-slate-600 mx-auto mb-3" />
              <p className="text-white text-sm font-semibold mb-1">Chưa có kết quả phù hợp</p>
              <p className="text-slate-400 text-xs">
                {socialSearchQuery.trim().length >= 2
                  ? 'Thử nickname ngắn hơn hoặc gần giống hơn.'
                  : 'Nhập nickname để follow và xây network của riêng bạn.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}