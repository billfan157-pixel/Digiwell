import { BarChart3, Crown, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import type { HealthReport } from '../../lib/aiReports';

type WeeklyReportCardProps = {
  isPremium: boolean;
  report: HealthReport | null;
  isLoading: boolean;
  onGenerate: () => void;
  onUpgrade: () => void;
};

const glassCard = 'bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl';

export default function WeeklyReportCard({
  isPremium,
  report,
  isLoading,
  onGenerate,
  onUpgrade,
}: WeeklyReportCardProps) {
  if (!isPremium) {
    return (
      <div className={`${glassCard} relative overflow-hidden p-6`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.12),_transparent_30%)] pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              <Crown size={12} />
              Premium report
            </div>
            <h3 className="text-2xl font-black text-white">Weekly Hydration Report</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Mở khóa báo cáo AI theo tuần để xem tổng lượng nước, xu hướng cải thiện, phân tích tài chính và khuyến nghị cá nhân hóa.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Phân tích AI', value: 'Khóa', icon: Sparkles },
            { label: 'Tiết kiệm tuần', value: 'Khóa', icon: Wallet },
            { label: 'Xu hướng', value: 'Khóa', icon: TrendingUp },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 py-4 px-2 flex flex-col items-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400">
                <item.icon size={18} />
              </div>
              <p className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</p>
              <p className="mt-1 text-lg font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-5 w-full py-4 rounded-xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:opacity-90 active:scale-95 transition-all"
        >
          Mở khóa báo cáo tuần
        </button>
      </div>
    );
  }

  return (
    <div className={`${glassCard} relative overflow-hidden p-6`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_32%)] pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            <BarChart3 size={12} />
            Weekly report
          </div>
          <h3 className="text-2xl font-black text-white">Báo cáo AI tuần này</h3>
          <p className="mt-2 text-sm text-slate-400">
            {report ? `Kỳ báo cáo: ${report.period}` : 'Chưa có báo cáo nào được tạo cho tuần hiện tại.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition-all hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {report ? 'Làm mới' : 'Tạo ngay'}
        </button>
      </div>

      {report ? (
        <div className="relative mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'TB mỗi ngày', value: `${report.avgDaily.toLocaleString()} ml` },
              { label: 'Đạt mục tiêu', value: `${report.goalsAchieved}/${report.totalDays}` },
              { label: 'Tỷ lệ hoàn thành', value: `${report.achievementRate}%` },
              { label: 'Tiết kiệm', value: `${report.savingsVND.toLocaleString()}đ` },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles size={16} />
              <p className="text-[11px] font-black uppercase tracking-[0.18em]">AI Analysis</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{report.aiAnalysis}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Khuyến nghị tuần này</p>
              <div className="mt-3 space-y-2">
                {report.recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Snapshot</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Xu hướng</span>
                  <span className="font-black text-white">{report.trend}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Best day</span>
                  <span className="font-black text-white">{report.bestDay || '--'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Worst day</span>
                  <span className="font-black text-white">{report.worstDay || '--'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Quỹ tích lũy</span>
                  <span className="font-black text-cyan-300">{report.fundUnits}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mt-5 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center">
          <p className="text-lg font-black text-white">Chưa có báo cáo tuần nào</p>
          <p className="mt-2 text-sm text-slate-400">
            Bấm tạo báo cáo để AI phân tích thói quen uống nước tuần hiện tại và lưu lại snapshot sức khỏe.
          </p>
        </div>
      )}
    </div>
  );
}
