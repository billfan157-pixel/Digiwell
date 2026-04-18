import React from 'react';
import { Trophy, Share2, Edit2, Users, Plus } from 'lucide-react';
import type { SocialProfileStats } from '../../lib/social';

interface SocialProfileModalProps {
  showSocialProfile: boolean;
  setShowSocialProfile: (show: boolean) => void;
  profile: any;
  currentRank: { name: string; color: string; bg: string; border: string };
  waterIntake: number;
  waterGoal: number;
  streak: number;
  socialError: string;
  socialProfileStats: SocialProfileStats;
  openSocialComposer: (kind: 'status' | 'progress' | 'story') => void;
  setShowDiscoverPeople: (show: boolean) => void;
  completionPercent: number;
  remainingWater: number;
}

export default function SocialProfileModal({
  showSocialProfile,
  setShowSocialProfile,
  profile,
  currentRank,
  waterIntake,
  waterGoal,
  streak,
  socialError,
  socialProfileStats,
  openSocialComposer,
  setShowDiscoverPeople,
  completionPercent,
  remainingWater
}: SocialProfileModalProps) {
  if (!showSocialProfile) return null;

  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";
  const cardGlow = "bg-slate-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.08)]";

  return (
    <div className="fixed inset-0 z-[80] flex justify-center" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Feed</p>
            <h3 className="text-2xl font-black text-white mt-1">Hồ sơ mạng xã hội</h3>
          </div>
          <button onClick={() => setShowSocialProfile(false)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
            Đóng
          </button>
        </div>

        <div className="px-5 pt-5 pb-10">
          <div className={`${cardGlow} overflow-hidden`}>
            <div className="relative p-6">
              <div className="absolute -top-10 -right-8 w-28 h-28 rounded-full blur-3xl bg-cyan-500/15 pointer-events-none" />
              <div className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full blur-3xl bg-indigo-500/10 pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                  <span className="text-4xl font-black text-slate-900">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-2xl font-black text-white truncate">{profile?.nickname || 'Khách'}</h3>
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${currentRank.bg} ${currentRank.border}`}
                      title={currentRank.name}
                    >
                      <Trophy size={14} className={currentRank.color} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4">
                    <div className="px-3 py-2 rounded-xl bg-slate-950/35 border border-white/10 text-cyan-200 text-[11px] font-bold">
                      {waterIntake}/{waterGoal}ml hôm nay
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-slate-950/35 border border-white/10 text-orange-200 text-[11px] font-bold">
                      Streak {streak} ngày
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {socialError ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">Thiết lập</p>
              <p className="text-slate-200 text-sm leading-relaxed">{socialError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Follower', value: socialProfileStats.followers, color: 'text-cyan-300' },
                  { label: 'Đang follow', value: socialProfileStats.following, color: 'text-emerald-300' },
                  { label: 'Bài viết', value: socialProfileStats.posts, color: 'text-amber-300' },
              ].map((item, index) => (
                <div key={`social-stat-${index}`} className={`${card} p-4`}>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{item.label}</p>
                    <p className={`mt-2 text-xl font-black ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowSocialProfile(false);
                    openSocialComposer('progress');
                  }}
                  className="py-3 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Share2 size={14} /> Share progress
                </button>
                <button
                  onClick={() => {
                    setShowSocialProfile(false);
                    openSocialComposer('status');
                  }}
                  className="py-3 rounded-xl bg-cyan-500/12 border border-cyan-500/25 text-cyan-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Edit2 size={14} /> Tạo bài
                </button>
                <button
                  onClick={() => {
                    setShowSocialProfile(false);
                    setShowDiscoverPeople(true);
                  }}
                  className="py-3 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Users size={14} /> Khám phá
                </button>
                <button
                  onClick={() => {
                    setShowSocialProfile(false);
                    openSocialComposer('story');
                  }}
                  className="py-3 rounded-xl bg-fuchsia-500/12 border border-fuchsia-500/25 text-fuchsia-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Plus size={14} /> Đăng story
                </button>
              </div>

              <div className={`${card} p-5 mt-4`}>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tổng quan</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tiến độ hôm nay</p>
                    <p className="mt-2 text-xl font-black text-cyan-300">{completionPercent}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Còn thiếu</p>
                    <p className="mt-2 text-xl font-black text-orange-300">{remainingWater} ml</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}