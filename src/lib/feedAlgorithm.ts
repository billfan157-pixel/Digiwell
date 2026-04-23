function timeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

export function rankFeedPosts(posts: any[], followingIds: string[], currentUser?: any) {
  if (!posts || posts.length === 0) return [];

  const now = new Date().getTime();

  const scoredPosts = posts.map(post => {
    let score = 0;

    // 1. Theo dõi (Following) - Tín hiệu cơ bản mạnh nhất
    const isFollowing = followingIds?.includes(post.user_id);
    if (isFollowing) score += 500;

    // 2. Độ mới (Recency) - Giảm điểm dần theo thời gian (Time Decay)
    const postTime = new Date(post.created_at).getTime();
    const hoursAgo = (now - postTime) / (1000 * 60 * 60);
    score += Math.max(0, 200 - (hoursAgo * 5)); // Bài viết mới trong 24h sẽ có lợi thế

    // 3. Lịch sử tương tác (Interaction History)
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    score += (likes * 5) + (comments * 10); // Comment thể hiện sự quan tâm sâu hơn Like

    // ==========================================
    // CÁC TÍN HIỆU CÁ NHÂN HÓA (PERSONALIZATION)
    // ==========================================
    if (currentUser && post.author) {
      // 4. Mức độ vận động (Similar Habits)
      if (post.activity && currentUser.activity && post.activity === currentUser.activity) {
        score += 30; // Cùng mức độ vận động (Vd: Cùng là người tập Gym/Yoga)
      }

      // 5. Cùng chung mục tiêu uống nước (Similar Hydration Goals)
      const postWater = post.hydration_ml || post.value || 0;
      const myGoal = currentUser.water_goal || 2000;
      if (postWater > 0 && myGoal > 0) {
        // Nếu bài viết báo cáo lượng nước ấn tượng (đạt > 80% mục tiêu của chính mình)
        if (postWater >= myGoal * 0.8) score += 40;
      }

      // 6. Tín hiệu Thách đấu (Challenge Interest)
      if (post.type === 'challenge') {
        score += 80; // Ưu tiên hiển thị thách đấu để đẩy mạnh Gamification
      }

      // --- PHASE 7: NEW SIGNALS ---
      // 7. Cùng nhóm tuổi (Same Age Group)
      if (post.author.age && currentUser.age && Math.abs(post.author.age - currentUser.age) <= 5) {
        score += 25;
      }

      // 8. Cùng loại đồ uống (Same Drinks) - Giả định user có favorite_drink
      if (post.drink_type && currentUser.favorite_drink && post.drink_type === currentUser.favorite_drink) {
        score += 20;
      }

      // 9. Cùng lịch trình (Similar Schedule)
      if (post.author.wake_up && currentUser.wakeUp && Math.abs(timeToMinutes(post.author.wake_up) - timeToMinutes(currentUser.wakeUp)) <= 60) {
        score += 15;
      }
    }

    return { ...post, _score: score };
  });

  // Sắp xếp danh sách bài viết theo điểm số giảm dần
  return scoredPosts.sort((a, b) => b._score - a._score);
}