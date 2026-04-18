export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'beginner' | 'discipline' | 'hardcore' | 'weekend' | 'social';
  stake_wp: number;
  reward_wp: number;
  duration_days: number;
  created_at?: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'active' | 'completed' | 'failed';
  progress_days: number;
  joined_at: string;
  challenge?: Challenge; 
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  tier: 'common' | 'rare' | 'epic' | 'easter_egg';
  description: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge; 
}