import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối trực tiếp cho DigiWell project
const supabaseUrl = 'https://psaypwhpxtpncvgeenue.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYXlwd2hweHRwbmN2Z2VlbnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMzQ4MDIsImV4cCI6MjA1NTYxMDgwMn0.HofRizpT6tYp-w9i3v0Iq7Q29fA0p3X9q3_T9X9-D9k';

// Khởi tạo supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Biến kiểm tra cấu hình. 
 * Luôn trả về true vì mình đã dán cứng Key, giúp bỏ qua các màn hình cảnh báo thiếu .env
 */
export const isSupabaseConfigured = true;

// Export thêm một hàm check (nếu các component khác có gọi)
export const checkSupabaseConfig = () => true;