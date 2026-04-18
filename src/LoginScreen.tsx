import { useState, type FormEvent } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';

interface LoginScreenProps {
  onBack: () => void;
  initialEmail?: string;
}

export default function LoginScreen({ onBack, initialEmail = '' }: LoginScreenProps) {
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPass, setLoginPass] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingLogin) return;
    if (!loginEmail || !loginPass) { toast.error("Vui lòng nhập Email và Mật khẩu!"); return; }
    setIsSubmittingLogin(true);
    const toastId = toast.loading("Đang xác thực...");
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email: loginEmail.toLowerCase().trim(), password: loginPass });
      if (error) throw error;
      toast.success("Đăng nhập thành công! 👋", { id: toastId });
    } catch (err: any) {
      toast.error(err.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng!' : err.message, { id: toastId });
    } finally { setIsSubmittingLogin(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Capacitor.isNativePlatform() ? 'digiwell://login-callback' : window.location.origin,
          skipBrowserRedirect: Capacitor.isNativePlatform()
        }
      });
      if (error) throw error;
      if (data?.url && Capacitor.isNativePlatform()) await Browser.open({ url: data.url });
    } catch (err: any) {
      toast.error("Lỗi kết nối Google: " + err.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Capacitor.isNativePlatform() ? 'digiwell://login-callback' : window.location.origin,
          skipBrowserRedirect: Capacitor.isNativePlatform()
        }
      });
      if (error) throw error;
      if (data?.url && Capacitor.isNativePlatform()) await Browser.open({ url: data.url });
    } catch (err: any) {
      toast.error("Lỗi kết nối Apple: " + err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto font-sans bg-slate-950">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="p-6 pt-14">
        <button onClick={onBack} className="mb-10 p-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-slate-400 inline-flex active:scale-95 transition-all duration-200 ease-out hover:text-white">
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-3xl font-black text-white mb-8">Đăng nhập</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Email</label>
            <input type="email" placeholder="your@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} disabled={isSubmittingLogin} className="w-full p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Mật khẩu</label>
            <div className="relative">
              <input type="password" placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} disabled={isSubmittingLogin} className="w-full p-4 pl-12 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50 text-sm" />
              <Lock className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
            </div>
          </div>
          <button type="submit" disabled={isSubmittingLogin} className="w-full py-4 rounded-2xl font-semibold text-slate-950 text-sm mt-2 disabled:opacity-50 active:scale-95 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]" style={{ background: isSubmittingLogin ? '#334155' : '#06b6d4' }}>
            {isSubmittingLogin ? <span className="animate-pulse">Đang xác thực...</span> : "Đăng nhập →"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <hr className="w-full border-slate-700" /><span className="px-3 font-bold tracking-widest">HOẶC</span><hr className="w-full border-slate-700" />
        </div>

        <button onClick={handleGoogleLogin} className="w-full py-4 rounded-2xl font-bold text-white text-sm mt-6 border border-white/5 bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800/80 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Đăng nhập bằng Google
        </button>
        
        <button onClick={handleAppleLogin} className="w-full py-4 rounded-2xl font-bold text-white text-sm mt-3 border border-white/5 bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800/80 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2">
          <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
          Đăng nhập bằng Apple
        </button>
      </div>
    </div>
  );
}
