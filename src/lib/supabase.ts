import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Khởi tạo supabase client dưới dạng Singleton để tránh lỗi Multiple GoTrueClient instances khi HMR
const globalAny = globalThis as any;
if (!globalAny.__supabaseClient) {
  globalAny.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = globalAny.__supabaseClient;

/**
 * Check if Supabase is configured properly
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Export thêm một hàm check (nếu các component khác có gọi)
export const checkSupabaseConfig = () => isSupabaseConfigured;