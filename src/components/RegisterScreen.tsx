import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

export default function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setIsLoading(false);

    // In ra console để theo dõi (bấm F12 để xem)
    console.log('=== KẾT QUẢ ĐĂNG KÝ SUPABASE ===', { data, error });

    // 🚨 1. BẮT TRƯỜNG HỢP "THÀNH CÔNG GIẢ" (Bảo mật của Supabase)
    // Nếu data có user, nhưng mảng identities lại rỗng -> Nghĩa là email đã tồn tại!
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      toast.error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!');
      return; // CHẶN LẠI NGAY, KHÔNG CHO CHẠY TIẾP!
    }

    // 🚨 2. BẮT CÁC LỖI THÔNG THƯỜNG KHÁC (Pass ngắn, lỗi mạng...)
    if (error) {
      console.error('Lỗi đăng ký Supabase:', error);
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        toast.error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!');
      } else if (error.message.includes('Password should be at least')) {
        toast.error('Mật khẩu quá ngắn, phải có ít nhất 6 ký tự!');
      } else if (error.message.includes('invalid format') || error.message.includes('Invalid email')) {
        toast.error('Định dạng email không hợp lệ!');
      } else {
        toast.error(`Lỗi đăng ký: ${error.message}`);
      }
      return; // CHẶN LẠI!
    }

    // Bổ sung tạo Profile mặc định cho user vừa đăng ký
    if (data?.user) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        nickname: email.split('@')[0], // Lấy tạm phần đầu email làm nickname
        weight: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' });
    }

    // 🎉 3. NẾU VƯỢ QUA HẾT CÁC ẢI TRÊN -> ĐĂNG KÝ THÀNH CÔNG THẬT!
    toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
    onSuccess(email);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          Quay lại
        </button>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight">Tạo tài khoản</h1>
          <p className="text-slate-400 mt-2">Bắt đầu hành trình sức khỏe của bạn.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:border-cyan-500 focus:ring-0 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="password"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:border-cyan-500 focus:ring-0 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:border-cyan-500 focus:ring-0 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Đăng ký'}
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-500 mt-8">
          Đã có tài khoản?{' '}
          <button onClick={() => onBack()} className="font-bold text-cyan-400 hover:underline">
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}