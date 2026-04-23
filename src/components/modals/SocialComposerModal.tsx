import React from 'react';
import { ImagePlus } from 'lucide-react';
import { buildProgressShareText, type SocialComposerState } from '../../lib/social';
import { useModalStore } from '../../store/useModalStore';

interface SocialComposerModalProps {
  handlePublishSocialPost: (e: React.FormEvent) => void;
  isPublishingSocialPost: boolean;
  socialComposer: SocialComposerState;
  setSocialComposer: React.Dispatch<React.SetStateAction<SocialComposerState>>;
  profile: any;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  socialImageInputRef: React.RefObject<HTMLInputElement>;
  handleSocialImagePicked: (event: React.ChangeEvent<HTMLInputElement>) => void;
  socialImageFile: File | null;
  setSocialImageFile: (file: File | null) => void;
  socialImagePreview: string;
  setSocialImagePreview: (url: string) => void;
}

export default function SocialComposerModal({
  handlePublishSocialPost,
  isPublishingSocialPost,
  socialComposer,
  setSocialComposer,
  profile,
  waterIntake,
  waterGoal,
  streak,
  socialImageInputRef,
  handleSocialImagePicked,
  socialImageFile,
  setSocialImageFile,
  socialImagePreview,
  setSocialImagePreview
}: SocialComposerModalProps) {
  const { showSocialComposer, setShowSocialComposer } = useModalStore();
  const closeSocialComposer = () => setShowSocialComposer(false);

  if (!showSocialComposer) return null;
  const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

  return (
    <div className="fixed inset-0 z-[95] flex justify-center" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-md min-h-screen overflow-y-auto scrollbar-hide">
        <form onSubmit={handlePublishSocialPost}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
            <button type="button" onClick={closeSocialComposer} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-all active:scale-95">
              Hủy
            </button>
            <div className="text-center min-w-0">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Composer</p>
              <h3 className="text-xl font-black text-white truncate mt-1">{socialComposer.postKind === 'story' ? 'Đăng story' : 'Tạo bài viết'}</h3>
            </div>
            <button type="submit" disabled={isPublishingSocialPost} className="px-4 py-2 rounded-xl text-slate-950 text-xs font-black disabled:opacity-60 active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #22d3ee, #06b6d4)' }}>
              {isPublishingSocialPost ? 'Đang đăng' : 'Đăng'}
            </button>
          </div>

          <div className="px-5 pt-5 pb-10 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Bài viết', value: 'status' as const },
                { label: 'Tiến độ', value: 'progress' as const },
                { label: 'Tạo kèo', value: 'challenge' as any },
                { label: 'Story', value: 'story' as const },
              ].map((option, index) => (
                <button
                  key={`composer-opt-${index}`}
                  type="button"
                  onClick={() => setSocialComposer((prev: any) => ({ ...prev, postKind: option.value, visibility: option.value === 'story' ? 'followers' : prev.visibility }))}
                  className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${(socialComposer.postKind as string) === option.value ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={`${card} p-4`}>
              <textarea
                value={socialComposer.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSocialComposer((prev: SocialComposerState) => ({ ...prev, content: e.target.value }))}
                rows={6}
                placeholder={
                  (socialComposer.postKind as string) === 'story' ? 'Viết caption ngắn cho story 24h...' :
                  (socialComposer.postKind as string) === 'challenge' ? 'Nhập mục tiêu kèo (VD: Ai đua 2 lít trước 5h chiều không?)...' :
                  (socialComposer.postKind as string) === 'progress' ? 'Chia sẻ tiến độ hôm nay của bạn...' :
                  'Hôm nay bạn muốn chia sẻ gì với cộng đồng?'
                }
                className="w-full rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm p-4 outline-none focus:border-cyan-500 resize-none"
              />

              <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1 -mx-1 px-1">
                {["💦 Vừa nạp 500ml, quá đã!", "🔥 Đang giữ chuỗi, ai đua top không?", "😴 Nay lười quá, ai nhắc tui đi!", "🏋️ Vừa tập xong, bù nước gấp 💦"].map((temp, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    onClick={() => setSocialComposer((prev: SocialComposerState) => ({...prev, content: prev.content ? prev.content + ' ' + temp : temp}))}
                    className="whitespace-nowrap px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-400 hover:bg-slate-800 hover:text-cyan-300 active:scale-95 transition-all"
                  >
                    {temp}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button type="button" onClick={() => setSocialComposer((prev: SocialComposerState) => ({ ...prev, content: buildProgressShareText({ nickname: profile?.nickname, waterIntake, waterGoal, streak }), postKind: 'progress' }))} className="py-3 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-300 text-xs font-bold active:scale-95 transition-all">
                  Dùng progress card
                </button>
                <select
                  value={socialComposer.visibility}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSocialComposer((prev: SocialComposerState) => ({ ...prev, visibility: e.target.value as SocialComposerState['visibility'] }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white text-xs px-3 outline-none focus:border-cyan-500"
                >
                  <option value="public">Công khai</option>
                  <option value="followers">Chỉ follower</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex gap-3">
                <button type="button" onClick={() => socialImageInputRef.current?.click()} className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <ImagePlus size={14} /> Upload ảnh
                </button>
                <button type="button" onClick={() => { setSocialImageFile(null); if (socialImagePreview.startsWith('blob:')) URL.revokeObjectURL(socialImagePreview); setSocialImagePreview(''); setSocialComposer((prev: SocialComposerState) => ({ ...prev, imageUrl: '' })); }} className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold active:scale-95 transition-all">
                  Xóa ảnh
                </button>
              </div>

              <input
                ref={socialImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleSocialImagePicked}
                className="hidden"
              />

              <input
                type="url"
                value={socialComposer.imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSocialComposer((prev: SocialComposerState) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Hoặc dán link ảnh công khai..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white text-xs px-3 py-3 outline-none focus:border-cyan-500"
              />

              {(socialImagePreview || socialComposer.imageUrl.trim()) && (
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                  <img src={socialImagePreview || socialComposer.imageUrl.trim()} alt="Xem trước ảnh bài viết" className="w-full h-48 object-cover" />
                </div>
              )}

              {socialImageFile && (
                <p className="text-slate-400 text-[11px]">File đã chọn: {socialImageFile.name}</p>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-cyan-500/15 bg-cyan-500/5 p-4">
              <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest mb-2">Snapshot khi đăng</p>
              <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-cyan-300 font-semibold">{waterIntake}/{waterGoal}ml</div>
                <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-orange-300 font-semibold">Streak {streak} ngày</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}