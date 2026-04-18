// ============================================================
// DigiWell — Premium Feature Config (Upgraded)
// Giữ nguyên toàn bộ cấu trúc cũ và thêm các tính năng Pro
// ============================================================

export type PremiumTier = 'free' | 'premium';

// ── Giới hạn sử dụng mỗi ngày (Giữ nguyên) ─────────────────────────────

export const DAILY_LIMITS = {
  free: {
    aiMessages:   5,   
    aiAdvice:     3,   
    imageScan:    1,   
    historyDays:  7,   
  },
  premium: {
    aiMessages:   Infinity,
    aiAdvice:     Infinity,
    imageScan:    Infinity,
    historyDays:  365,
  },
} as const;

// ── Feature flags theo tier (Thêm Ads & Tracking) ────────────────────────────────

export const FEATURES = {
  // AI Features
  aiChat:               { free: true,  premium: true  },
  aiUnlimitedChat:      { free: false, premium: true  },
  aiWeeklyReport:       { free: false, premium: true  },
  aiMonthlyReport:      { free: false, premium: true  },
  aiPersonalizedPlan:   { free: false, premium: true  },
  aiDeepAnalysis:       { free: false, premium: true  },

  // NEW: AI Hydration Coach - tự điều chỉnh mục tiêu
  aiHydrationCoach:     { free: false, premium: true  },
  // NEW: Deep Health Insights
  deepHealthInsights:   { free: false, premium: true  },
  // NEW: Premium Health Score Dashboard
  premiumHealthScore:   { free: false, premium: true  },

  // Analytics & Specialized
  basicStats:           { free: true,  premium: true  },
  weeklyChart:          { free: false, premium: true  },
  monthlyChart:         { free: false, premium: true  },
  exportReport:         { free: false, premium: true  },
  streakCalendar:       { free: true,  premium: true  },
  advancedInsights:     { free: false, premium: true  },

  // MỚI: Theo dõi tiết kiệm để đầu tư (VESAF/DCDS)
  investmentTracking:   { free: false, premium: true  },

  // Device Integration
  weatherSync:          { free: true,  premium: true  },
  calendarSync:         { free: false, premium: true  },
  smartwatchSync:       { free: false, premium: true  },
  appleHealthSync:      { free: false, premium: true  },

  // MỚI: Chế độ đạp xe chuyên sâu
  cyclingProMode:       { free: false, premium: true  },

  // NEW: Smart Reminder Engine
  smartReminders:       { free: false, premium: true  },
  // NEW: Adaptive Reminders
  adaptiveReminders:    { free: false, premium: true  },

  // NEW: Streak Freeze
  streakFreeze:         { free: false, premium: true  },
  // NEW: Redemption Quest
  redemptionQuest:      { free: false, premium: true  },
  // NEW: Advanced Drink System
  advancedDrinkSystem:  { free: false, premium: true  },

  // Customization & UX
  customReminders:      { free: false, premium: true  },
  customGoals:          { free: true,  premium: true  },
  themes:               { free: false, premium: true  },
  imageScan:            { free: true,  premium: true  },

  // NEW: Premium Profile Frame
  premiumProfileFrame:  { free: false, premium: true  },
  // NEW: VIP Club Tools
  vipClubTools:         { free: false, premium: true  },
  // NEW: Premium Trial Preview
  premiumTrialPreview:  { free: false, premium: true  },
  // NEW: Before vs After Analytics
  beforeAfterAnalytics: { free: false, premium: true  },

  // MỚI: Gỡ quảng cáo
  ads:                  { free: true,  premium: false },
} as const;

export type FeatureKey = keyof typeof FEATURES;

// ── Pricing (Giữ nguyên) ────────────────────────────────────────────────

export const PRICING = {
  monthly: {
    vnd: 49_000,
    label: '49.000₫/tháng',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY ?? '',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_MONTHLY_URL ?? '',
  },
  yearly: {
    vnd: 399_000,
    label: '399.000₫/năm',
    perMonth: '33.250₫/tháng',
    discount: 'Tiết kiệm 32%',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY ?? '',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_YEARLY_URL ?? '',
  },
} as const;

export type BillingPlan = keyof typeof PRICING;

// ── Danh sách tính năng hiển thị (Thêm tính năng Premium mới) ────────

export const PREMIUM_HIGHLIGHTS = [
  {
    icon: '🧠',
    title: 'AI Hydration Coach thông minh',
    description: 'AI tự động điều chỉnh mục tiêu nước theo thời tiết, vận động, giấc ngủ và cafe',
    free: 'Mục tiêu cố định',
    premium: 'AI tự động điều chỉnh',
  },
  {
    icon: '📊',
    title: 'Deep Health Insights',
    description: 'Phân tích chuyên sâu khung giờ mất nước, mood liên quan, stress & dehydration risk',
    free: '—',
    premium: 'Phân tích sâu',
  },
  {
    icon: '💎',
    title: 'Premium Health Score',
    description: 'Dashboard điểm số Hydration, Recovery, Energy, Consistency',
    free: '—',
    premium: '4 điểm số chi tiết',
  },
  {
    icon: '🔔',
    title: 'Smart Reminder Engine',
    description: 'AI biết bạn đang ngủ, họp, lái xe và tự động điều chỉnh nhắc nhở',
    free: 'Nhắc cố định',
    premium: 'AI context-aware',
  },
  {
    icon: '🛡️',
    title: 'Streak Freeze',
    description: '2 ngày bảo vệ streak mỗi tháng, không mất tiến độ nếu quên uống',
    free: '—',
    premium: '2 ngày/tháng',
  },
  {
    icon: '🔄',
    title: 'Redemption Quest',
    description: 'Nếu gãy streak, AI cho nhiệm vụ cứu để khôi phục lại',
    free: '—',
    premium: 'Nhiệm vụ cứu streak',
  },
  {
    icon: '🍹',
    title: 'Advanced Drink System',
    description: 'Hệ số nước cho từng loại đồ uống (Water=1.0, Coffee=-0.2, Alcohol=-0.5)',
    free: '—',
    premium: 'Hệ số chi tiết',
  },
  {
    icon: '⌚',
    title: 'Smartwatch & Health Sync',
    description: 'Kết nối Apple Watch, Wear OS, Apple Health, Google Fit',
    free: '—',
    premium: 'Tất cả thiết bị',
  },
  {
    icon: '👑',
    title: 'Premium Profile Frame',
    description: 'Viền avatar động, tên vàng, hiệu ứng log nước, danh hiệu hiếm',
    free: '—',
    premium: 'Frame cao cấp',
  },
  {
    icon: '⚔️',
    title: 'VIP Club Tools',
    description: 'Tạo bang lớn, logo riêng, quest club, thông báo VIP, xếp hạng nâng cao',
    free: '—',
    premium: 'Công cụ VIP',
  },
  {
    icon: '🚫',
    title: 'Không quảng cáo',
    description: 'Trải nghiệm app mượt mà, sạch sẽ, không bị làm phiền bởi quảng cáo',
    free: 'Có Ads',
    premium: '100% Sạch',
  },
] as const;
