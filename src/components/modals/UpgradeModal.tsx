import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [step, setStep] = useState<'plan' | 'qr'>('plan');
  const [userId, setUserId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    if (open) {
      setStep('plan');
      supabase.auth.getUser().then(({ data }: { data: any }) => {
        if (data.user) setUserId(data.user.id);
      });
    }
  }, [open]);

  if (!open) return null;

  const amount = selectedPlan === 'yearly' ? 399000 : 49000;
  const transferContent = `DIGIWELL ${userId ? userId.substring(0, 8).toUpperCase() : 'UNKNOWN'}`;
  
  // Replace with your actual VietQR details later
  const qrUrl = `https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=NGUYEN%20VAN%20A`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-20">
          <X size={18} />
        </button>

        {/* Left Column - Features */}
        <div className="w-full p-6 bg-slate-950/50 border-b border-slate-800 flex flex-col justify-center relative shrink-0">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10 mt-4">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Sparkles size={24} />
            </div>
            <h2 className="text-3xl font-black text-white">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">Nâng cấp để mở khóa toàn bộ tính năng thông minh và tối ưu hóa sức khỏe của bạn.</p>
          
          <ul className="space-y-3 relative z-10">
            {[
              'Xuất báo cáo PDF chuẩn Y khoa',
              'Chế độ Nhịn ăn gián đoạn (Fasting)',
              'AI Analytics chuyên sâu phân tích thói quen',
              'Không giới hạn lưu trữ dữ liệu'
            ].map((ft, index) => (
              <li key={`feat-${index}`} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-amber-400" />
                </div>
                {ft}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column - Content */}
        <div className="w-full p-6 relative flex flex-col justify-center shrink-0">
          <AnimatePresence mode="wait">
            {step === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full justify-center w-full"
              >
                <h3 className="text-xl font-bold text-white mb-6">CHỌN GÓI</h3>
                
                <div className="flex flex-col gap-3 mb-6">
                  <div onClick={() => setSelectedPlan('yearly')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'yearly' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <span className="absolute -top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Tiết kiệm 30%</span>
                    <p className={`font-bold ${selectedPlan === 'yearly' ? 'text-amber-400' : 'text-slate-300'}`}>GÓI NĂM</p>
                    <p className={`font-black text-xl mt-1 ${selectedPlan === 'yearly' ? 'text-white' : 'text-slate-400'}`}>399.000đ<span className="text-xs font-normal text-slate-500">/năm</span></p>
                  </div>

                  <div onClick={() => setSelectedPlan('monthly')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <p className={`font-bold ${selectedPlan === 'monthly' ? 'text-amber-400' : 'text-slate-300'}`}>GÓI THÁNG</p>
                    <p className={`font-black text-xl mt-1 ${selectedPlan === 'monthly' ? 'text-white' : 'text-slate-400'}`}>49.000đ<span className="text-xs font-normal text-slate-500">/tháng</span></p>
                  </div>
                </div>

                <button 
                  onClick={() => setStep('qr')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm active:scale-95 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  THANH TOÁN QUA MÃ QR
                </button>
                <p className="text-center text-xs text-slate-500 mt-4">Kích hoạt tự động sau xác minh</p>
              </motion.div>
            )}

            {step === 'qr' && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full justify-center items-center text-center w-full"
              >
                <h3 className="text-xl font-bold text-white mb-6">Quét mã QR để thanh toán</h3>
                
                <div className="bg-white p-2 rounded-xl shadow-xl mb-6 inline-block">
                  <img src={qrUrl} alt="VietQR" className="w-48 h-48 object-contain rounded-lg" />
                </div>

                <div className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6 text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-xs text-slate-400">Số tiền</span>
                    <span className="text-sm font-black text-white">{amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-400">Nội dung</span>
                    <span className="text-sm font-black text-amber-400">{transferContent}</span>
                  </div>
                </div>

                <button onClick={() => setStep('plan')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronLeft size={16} /> Quay lại chọn gói
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}