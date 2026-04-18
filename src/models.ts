export interface Profile {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  climate: string;
  goal: string;
  wakeUp?: string;
  bedTime?: string;
  water_goal?: number;
  wp?: number;
  coins?: number;
  avatar_url?: string;
  city?: string;
}

export interface Friend {
  id: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

export interface SearchResult {
  id: string;
  nickname: string;
}