import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối trực tiếp cho DigiWell project
const supabaseUrl = 'https://plbwqjdrivyffrhpbmvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYndxamRyaXZ5ZmZyaHBibXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3NjYsImV4cCI6MjA5MDcwMjc2Nn0.nZDHmQyVdn4a99zISog9-hzOzsFQ7G8RClV8GPe7sJw';

// Khởi tạo supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Biến kiểm tra cấu hình. 
 * Luôn trả về true vì mình đã dán cứng Key, giúp bỏ qua các màn hình cảnh báo thiếu .env
 */
export const isSupabaseConfigured = true;

// Export thêm một hàm check (nếu các component khác có gọi)
export const checkSupabaseConfig = () => true;