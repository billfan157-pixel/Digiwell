import { createClient } from '@supabase/supabase-js';

// Dán cứng thông tin kết nối từ project DigiWell của mày
const supabaseUrl = 'https://psaypwhpxtpncvgeenue.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYXlwd2hweHRwbmN2Z2VlbnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMzQ4MDIsImV4cCI6MjA1NTYxMDgwMn0.HofRizpT6tYp-w9i3v0Iq7Q29fA0p3X9q3_T9X9-D9k';

// Khởi tạo client trực tiếp, bỏ qua hoàn toàn import.meta.env
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Luôn trả về true để bỏ qua cái bảng báo lỗi "Thiếu cấu hình" trên iPhone
export const isSupabaseConfigured = true;