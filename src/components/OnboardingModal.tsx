import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Activity, ArrowRight, ArrowLeft, Droplets, Loader2, User } from 'lucide-react';

import type { Profile } from '../models';
interface OnboardingModalProps {
  profile: Profile;
  onComplete: (weight: number, waterGoal: number, name: string) => void;
}

export default function OnboardingModal({ profile, onComplete }: OnboardingModalProps) {
  // Initialize with existing weight if available, otherwise empty
  const [step, setStep] = useState(1);
  const [name, setName] = useState<string>(profile?.nickname || '');
  const [weight, setWeight] = useState<string>(profile.weight ? String(profile.weight) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const waterGoal = weight ? Math.round(Number(weight) * 30) : 0; // 30ml/kg/day

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên của bạn!');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = Number(weight);
    if (!numWeight || numWeight <= 0 || numWeight > 300) {
      toast.error('Vui lòng nhập cân nặng hợp lệ!');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: name.trim(), weight: numWeight, water_goal: waterGoal, onboarding_completed: true })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Đã cập nhật mục tiêu của bạn!');
      onComplete(numWeight, waterGoal, name.trim());
    } catch (error: any) {
      toast.error(error.message || 'Lỗi cập nhật hồ sơ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-in zoom-in-95 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                <User size={32} className="text-cyan-400" />
              </div>
              
              <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Xin chào! Bạn tên là gì?</h2>
              <p className="text-sm text-slate-400 text-center mb-8 leading-relaxed">
                Hãy cho hệ thống biết cách xưng hô với bạn nhé.
              </p>

              <form onSubmit={handleNextStep} className="space-y-6">
                <div>
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Tên của bạn..."
                      className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-xl py-4 px-4 text-center text-lg font-bold text-white focus:border-cyan-500 focus:ring-0 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!name.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                >
                  Tiếp tục <ArrowRight size={20} />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setStep(1)} className="absolute -top-4 -left-4 flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm font-medium p-2">
                <ArrowLeft size={16} /> Quay lại
              </button>

              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner mt-6">
                <Activity size={32} className="text-cyan-400" />
              </div>
              
              <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Chào {name}! Bạn nặng bao nhiêu kg?</h2>
              <p className="text-sm text-slate-400 text-center mb-8 leading-relaxed">
                Hãy cho hệ thống biết cân nặng của bạn để AI tính toán lượng nước lý tưởng mỗi ngày nhé.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="number" 
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="60"
                      className="w-32 bg-slate-800/50 border-2 border-slate-700 rounded-2xl py-3 text-center text-3xl font-black text-white focus:border-cyan-500 focus:ring-0 outline-none transition-all"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <span className="absolute right-6 text-slate-500 font-bold">kg</span>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-center gap-3">
                  <Droplets className="text-cyan-400" size={24} />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Mục tiêu của bạn</p>
                    <p className="text-xl font-black text-cyan-300">{waterGoal} <span className="text-sm text-cyan-500/70">ml/ngày</span></p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !weight}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Bắt đầu hành trình <ArrowRight size={20} /></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}