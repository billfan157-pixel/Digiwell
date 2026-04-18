import { supabase } from './supabase';

/**
 * Gọi Supabase RPC để ghi nhận lượng nước và tính toán Gamification an toàn trên Server.
 */
export async function logWaterAndUpdateStreakSecurely(userId: string, mlAdded: number, name: string = 'Nước lọc') {
  
  // 🛑 CHỐT CHẶN BÊ TÔNG: Block ID giả (ngắn hơn 30 ký tự)
  if (String(userId).length < 30) {
    console.warn(`🛡️ Gamification: ID "${userId}" là ID giả. Trả về data ảo, KHÔNG gọi Supabase!`);
    // Trả về một object giả lập y hệt cấu trúc DB để UI vẫn hoạt động mượt mà
    return {
      success: true,
      log_id: `mock-log-${Date.now()}`,
      current_streak: 1, 
      wp: 10,            
      streak_freezes: 0  
    };
  }

  // ✅ ĐÃ FIX TÊN BIẾN (Thêm p_): TIẾN HÀNH GỌI API CHO USER THẬT
  const { data, error } = await supabase.rpc('log_water_and_update_streak', {
    p_user_id: userId,
    p_ml_added: mlAdded,
    p_name: name
  });

  if (error) {
    console.error('Lỗi khi gọi RPC Gamification:', error);
    throw error;
  }

  return data;
}