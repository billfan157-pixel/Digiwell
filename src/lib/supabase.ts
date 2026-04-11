import { createClient } from '@supabase/supabase-js';

// Dán cứng thông tin kết nối để App Native không bị lỗi "Thiếu cấu hình"
const supabaseUrl = 'URL_SUPABASE_CỦA_BẠN';
const supabaseAnonKey = 'ANON_KEY_CỦA_BẠN';

// Khởi tạo client trực tiếp với string, không dùng env nữa
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Luôn trả về true vì mình đã dán cứng key rồi
export const isSupabaseConfigured = true;