// =================== CORE ===================
export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  level: number;
  total_exp: number;
  coins: number;
  wp: number;
  water_today: number;
  water_goal: number;
  gender: 'Nam' | 'Nữ' | 'Khác' | string;
  age: number;
  height: number;
  weight: number;
  activity: 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete' | string;
  climate: 'temperate' | 'warm' | 'hot' | 'tropical' | 'cold' | string;
  goal: string;
  equipped_bottle_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  factor: number;
  name: string;
  icon: string;
  color: string;
  timestamp: string;
  created_at: string;
  day: string; // YYYY-MM-DD
}

export interface DrinkPreset {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  color: string;
}

export interface SearchResult {
  id: string;
  nickname: string;
  avatar_url?: string | null;
}

export interface Friend {
  id: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

// =================== SOCIAL & FEED ===================
export interface SocialFeedPost {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  post_kind: 'status' | 'progress' | 'story' | 'challenge' | 'achievement' | 'compare';
  visibility: 'public' | 'followers';
  hydration_ml: number | null;
  streak_snapshot: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  expires_at: string | null;
  
  // Joined data
  author?: Partial<Profile>;
  likedByMe?: boolean;

  // Client-side computed or demo data
  type: 'status' | 'daily_goal' | 'milestone' | 'challenge' | 'achievement' | 'compare' | 'water_log';
  value?: number | string;
  pulse_count: number;
  temperature?: number;
  heart_rate?: number;
  drink_type?: string;
  compare_name?: string;
  compare_avatar?: string;
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Partial<Profile>;
}

export interface SocialNotification {
  id: string;
  user_id: string; // The one who receives the notification
  actor_id: string; // The one who performed the action
  type: 'like' | 'comment' | 'follow' | 'battle_invite' | 'battle_result';
  content: string;
  reference_id: string; // e.g., post_id or battle_id
  is_read: boolean;
  created_at: string;
  actor?: Partial<Profile>;
}

// =================== GAMIFICATION ===================
export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  stake_coins: number;
  status: 'active' | 'pending' | 'completed' | 'declined';
  mode: 'daily' | 'quick' | 'tournament';
  winner_id: string | null;
  created_at: string;
  
  // Joined data
  challenger?: Partial<Profile>;
  opponent?: Partial<Profile>;

  // Client-side computed
  yourProgress?: number;
  opponentProgress?: number;
}