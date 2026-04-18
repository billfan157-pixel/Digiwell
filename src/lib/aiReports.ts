/// <reference types="vite/client" />

// ============================================================
// DigiWell — AI Weekly/Monthly Health Report (Premium Version)
// Giữ nguyên cấu trúc của mày và thêm logic Tài chính + Vận động
// ============================================================

import Groq from 'groq-sdk';
import { supabase } from './supabase';

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY ?? '';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

// ── Các hằng số mới cho Premium ────────────────────────────
const SAVINGS_PER_DAY = 30000; // Tiết kiệm 30k/ngày nếu đạt mục tiêu
const FUND_UNIT_PRICE = 25000; // Giá giả định 1 đơn vị quỹ VESAF/DCDS

function createGroqClient() {
  return new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
}

// ── Types (Thêm 2 field mới) ───────────────────────────────

export type DailyEntry = {
  date:        string;
  waterIntake: number;
  waterGoal:   number;
  achieved:    boolean;
};

export type HealthReport = {
  period:           string;
  totalIntake:      number;
  avgDaily:         number;
  goalsAchieved:    number;
  totalDays:        number;
  achievementRate:  number;
  bestDay:          string;
  worstDay:         string;
  trend:            'improving' | 'declining' | 'stable';
  
  // MỚI: Thêm 2 field này cho Premium
  savingsVND:       number;      
  fundUnits:        string;      

  aiAnalysis:       string;
  recommendations:  string[];
  generatedAt:      string;
};

export type ReportPeriod = 'weekly' | 'monthly';

// ── Fetch water data from Supabase (Giữ nguyên) ─────────────

async function fetchWaterEntries(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('day, amount')
    .eq('user_id', userId)
    .gte('day', fromDate)
    .lte('day', toDate)
    .order('day', { ascending: true });

  if (error || !data) return [];

  const byDate = new Map<string, { intake: number; goal: number }>();

  for (const row of data) {
    const date = row.day;
    const existing = byDate.get(date) ?? { intake: 0, goal: 2000 };
    byDate.set(date, { intake: existing.intake + (row.amount ?? 0), goal: existing.goal });
  }

  return Array.from(byDate.entries()).map(([date, { intake, goal }]) => ({
    date,
    waterIntake: intake,
    waterGoal: goal,
    achieved: intake >= goal,
  }));
}

// ── Calculate stats (Giữ nguyên logic cũ) ────────────────────

function calculateStats(entries: DailyEntry[]) {
  if (entries.length === 0) return null;

  const totalIntake     = entries.reduce((s, e) => s + e.waterIntake, 0);
  const avgDaily        = Math.round(totalIntake / entries.length);
  const goalsAchieved   = entries.filter(e => e.achieved).length;
  const achievementRate = Math.round((goalsAchieved / entries.length) * 100);

  const sorted         = [...entries].sort((a, b) => b.waterIntake - a.waterIntake);
  const bestDay        = sorted[0]?.date  ?? '';
  const worstDay       = sorted[sorted.length - 1]?.date ?? '';

  const mid    = Math.floor(entries.length / 2);
  const firstHalf  = entries.slice(0, mid).reduce((s, e) => s + e.waterIntake, 0) / (mid || 1);
  const secondHalf = entries.slice(mid).reduce((s, e) => s + e.waterIntake, 0) / (entries.length - mid || 1);
  const diff = secondHalf - firstHalf;
  const trend: HealthReport['trend'] =
    diff > 50 ? 'improving' : diff < -50 ? 'declining' : 'stable';

  return { totalIntake, avgDaily, goalsAchieved, totalDays: entries.length,
           achievementRate, bestDay, worstDay, trend };
}

const normalizeReport = (value: unknown): HealthReport | null => {
  if (!value) return null;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (!parsed || typeof parsed !== 'object') return null;

    const report = parsed as Partial<HealthReport>;

    return {
      period: report.period ?? '',
      totalIntake: report.totalIntake ?? 0,
      avgDaily: report.avgDaily ?? 0,
      goalsAchieved: report.goalsAchieved ?? 0,
      totalDays: report.totalDays ?? 0,
      achievementRate: report.achievementRate ?? 0,
      bestDay: report.bestDay ?? '',
      worstDay: report.worstDay ?? '',
      trend: report.trend ?? 'stable',
      savingsVND: report.savingsVND ?? 0,
      fundUnits: report.fundUnits ?? '0',
      aiAnalysis: report.aiAnalysis ?? '',
      recommendations: report.recommendations ?? [],
      generatedAt: report.generatedAt ?? '',
    };
  } catch {
    return null;
  }
};

export async function getLatestHealthReport(
  userId: string,
  reportType: ReportPeriod,
): Promise<HealthReport | null> {
  const { data, error } = await supabase
    .from('ai_reports')
    .select('content')
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return normalizeReport(data.content);
}

// ── Generate AI analysis (Update Prompt Premium) ─────────────

async function generateAiAnalysis(
  stats: any,
  entries: DailyEntry[],
  periodLabel: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<{ analysis: string; recommendations: string[]; savings: number; units: string }> {
  if (!stats) return { analysis: 'Không đủ dữ liệu.', recommendations: [], savings: 0, units: '0' };

  // MỚI: Tính toán số liệu đầu tư
  const savings = stats.goalsAchieved * SAVINGS_PER_DAY;
  const units = (savings / FUND_UNIT_PRICE).toFixed(2);

  const entryText = entries
    .map(e => `${e.date}: ${e.waterIntake}ml/${e.waterGoal}ml (${e.achieved ? '✓' : '✗'})`)
    .join('\n');

  // Cải tiến prompt để AI phân tích cả tài chính và nhịp tim
  const prompt = `Bạn là Chuyên gia Sức khỏe và Cố vấn Tài chính AI của DigiWell.
Hãy phân tích báo cáo cho người dùng ${profile?.nickname ?? 'bạn'}.

Thông tin:
- Kỳ báo cáo: ${periodLabel}
- Thành tích: ${stats.goalsAchieved}/${stats.totalDays} ngày đạt mục tiêu (${stats.achievementRate}%).
- Nhịp tim trung bình: ${profile?.avgHeartRate ?? 'N/A'} BPM (Dành cho dân đạp xe/vận động).
- Tiết kiệm: ${savings.toLocaleString()} VND (Tương đương ${units} đơn vị quỹ VESAF/DCDS).

Yêu cầu:
1. "analysis": Nhận xét sâu sắc, thân thiện về sự kỷ luật, mối liên hệ giữa nước, nhịp tim và tích lũy tài chính.
2. "recommendations": 3 gợi ý thực tế về Hydration, Vận động và Kỷ luật đầu tư.

Trả về JSON thuần:
{
  "analysis": "...",
  "recommendations": ["...", "...", "..."]
}`;

  const groq = createGroqClient();
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    return {
      analysis: parsed.analysis || '',
      recommendations: parsed.recommendations || [],
      savings: savings,
      units: `${units} đơn vị quỹ`
    };
  } catch {
    return { analysis: 'Lỗi xử lý AI', recommendations: [], savings: savings, units: units };
  }
}

// ── Public: Generate Weekly Report (Giữ nguyên + Update Return) ──

export async function generateWeeklyReport(
  userId: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<HealthReport> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const fromDate = weekAgo.toISOString().split('T')[0];
  const toDate   = today.toISOString().split('T')[0];
  const periodLabel = `${formatDate(weekAgo)} – ${formatDate(today)}`;

  const entries = await fetchWaterEntries(userId, fromDate, toDate);
  const stats   = calculateStats(entries);
  const aiRes   = await generateAiAnalysis(stats, entries, periodLabel, profile);

  const report: HealthReport = {
    period:          periodLabel,
    totalIntake:      stats?.totalIntake      ?? 0,
    avgDaily:         stats?.avgDaily         ?? 0,
    goalsAchieved:    stats?.goalsAchieved    ?? 0,
    totalDays:        stats?.totalDays        ?? 0,
    achievementRate: stats?.achievementRate ?? 0,
    bestDay:          stats?.bestDay          ?? '',
    worstDay:         stats?.worstDay         ?? '',
    trend:            stats?.trend            ?? 'stable',
    savingsVND:       aiRes.savings,
    fundUnits:        aiRes.units,
    aiAnalysis:       aiRes.analysis,
    recommendations:  aiRes.recommendations,
    generatedAt:      new Date().toISOString(),
  };

  await supabase.from('ai_reports').insert({
    user_id:      userId,
    report_type:  'weekly',
    content:      JSON.stringify(report),
    period_start: fromDate,
    period_end:   toDate,
  });

  return report;
}

// ── Public: Generate Monthly Report (Giữ nguyên + Update Return) ──

export async function generateMonthlyReport(
  userId: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<HealthReport> {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  const fromDate = monthAgo.toISOString().split('T')[0];
  const toDate   = today.toISOString().split('T')[0];
  const periodLabel = `${formatDate(monthAgo)} – ${formatDate(today)}`;

  const entries = await fetchWaterEntries(userId, fromDate, toDate);
  const stats   = calculateStats(entries);
  const aiRes   = await generateAiAnalysis(stats, entries, periodLabel, profile);

  const report: HealthReport = {
    period:          periodLabel,
    totalIntake:      stats?.totalIntake      ?? 0,
    avgDaily:         stats?.avgDaily         ?? 0,
    goalsAchieved:    stats?.goalsAchieved    ?? 0,
    totalDays:        stats?.totalDays        ?? 0,
    achievementRate: stats?.achievementRate ?? 0,
    bestDay:          stats?.bestDay          ?? '',
    worstDay:         stats?.worstDay         ?? '',
    trend:            stats?.trend            ?? 'stable',
    savingsVND:       aiRes.savings,
    fundUnits:        aiRes.units,
    aiAnalysis:       aiRes.analysis,
    recommendations:  aiRes.recommendations,
    generatedAt:      new Date().toISOString(),
  };

  await supabase.from('ai_reports').insert({
    user_id:      userId,
    report_type:  'monthly',
    content:      JSON.stringify(report),
    period_start: fromDate,
    period_end:   toDate,
  });

  return report;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d);
}
