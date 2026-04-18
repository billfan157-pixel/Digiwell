// src/lib/feedAlgorithm.ts

export type PostType = 'milestone' | 'daily_goal' | 'water_log' | 'status' | 'challenge';

export interface FeedPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  type: PostType;
  content: string;
  value?: number; // Ví dụ: chuỗi 5 ngày, hoặc 2000ml
  likes: number;
  comments: number;
  created_at: string;
  isLiked?: boolean;
}

// THUẬT TOÁN CHẤM ĐIỂM BÀI VIẾT (EdgeRank-lite)
export function rankFeedPosts(
  posts: FeedPost[], 
  closeFriendIds: string[] = [] // Danh sách ID bạn thân
): FeedPost[] {
  const NOW = Date.now();

  const rankedPosts = posts.map(post => {
    let score = 0;

    // 1. CONTENT WEIGHT (Trọng số nội dung)
    // Cột mốc (Streak, Huy hiệu) quan trọng nhất, sau đó đến Đạt mục tiêu, rồi mới tới Uống nước lẻ tẻ
    switch (post.type) {
      case 'milestone': score += 100; break;
      case 'daily_goal': score += 70; break;
      case 'status': score += 50; break;
      case 'water_log': score += 20; break;
      default: score += 10;
    }

    // 2. AFFINITY (Độ thân thiết)
    // Nếu là bạn thân/người hay tương tác -> Cộng điểm mạnh
    if (closeFriendIds.includes(post.user_id)) {
      score += 50;
    }

    // 3. ENGAGEMENT (Độ viral)
    // Bài nhiều like/comment tự động ngoi lên
    score += (post.likes * 2) + (post.comments * 3);

    // 4. TIME DECAY (Độ "thiu" của bài viết)
    // Mỗi giờ trôi qua, bài viết sẽ bị trừ điểm để nhường chỗ cho bài mới
    const hoursOld = (NOW - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    // Công thức suy giảm: Trừ điểm theo cấp số mũ nhẹ
    const decayPenalty = Math.pow(hoursOld, 1.2) * 5; 
    
    score -= decayPenalty;

    return { ...post, _score: score }; // Gắn điểm ngầm vào để sort
  });

  // Sort từ điểm cao xuống thấp
  return rankedPosts.sort((a: any, b: any) => b._score - a._score);
}