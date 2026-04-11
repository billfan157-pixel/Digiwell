import { createClient } from '@supabase/supabase-js';

// Dán cứng thông tin kết nối để App Native không bị lỗi "Thiếu cấu hình"
const supabaseUrl = 'https://plbwqjdrivyffrhpbmvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYndxamRyaXZ5ZmZyaHBibXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3NjYsImV4cCI6MjA5MDcwMjc2Nn0.nZDHmQyVdn4a99zISog9-hzOzsFQ7G8RClV8GPe7sJw';

// Khởi tạo client trực tiếp với string, không dùng env nữa
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Luôn trả về true vì mình đã dán cứng key rồi
export const isSupabaseConfigured = true;