import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { QuestEngineContext } from '@/lib/questEngine';
import { playWaterDropSound } from '@/lib/audio';
import type { Profile } from '@/models';
import { expGainedForWater } from '@/config/questConfig';

// ── Constants ──────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = 'digiwell_offline_water_queue';

// ── Types ──────────────────────────────────────────────────

export interface WaterLog {
  id:         string;
  user_id:    string;
  amount:     number;
  name:       string;
  day:        string;
  exp:        number;
  created_at: string;
  timestamp:  string;
  factor:     number;
}

interface OfflineQueueItem {
  tempId:     string;
  user_id:    string;
  amount:     number;
  name:       string;
  exp:        number;
  day:        string;   // FIX: lưu ngay khi push, tránh sai ngày khi sync qua đêm
  created_at: string;
  factor:     number;
}

// ── Pure helpers ───────────────────────────────────────────

const isRealUser = (id: unknown): id is string =>
  typeof id === 'string' && id.length >= 30;

const toDateStr = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // Local date
const normalizeRow = (row: any): WaterLog => {
  const createdAt = row.created_at ?? new Date().toISOString();
  return {
    id:         String(row.id ?? crypto.randomUUID()),
    user_id:    String(row.user_id ?? ''),
    amount:     Number(row.amount ?? 0),
    name:       row.name ?? 'Nuoc Loc',
    day:        row.day ?? toDateStr(new Date(createdAt)),
    exp:        Number(row.exp ?? 0),
    created_at: createdAt,
    timestamp:  row.timestamp ?? createdAt,
    factor:     Number(row.factor ?? 1),
  };
};

// ── Offline queue helpers ──────────────────────────────────

function readOfflineQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushOfflineQueue(item: OfflineQueueItem) {
  const queue = readOfflineQueue();
  queue.push(item);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ── Hook ───────────────────────────────────────────────────

export function useWaterData(
  profile: (Profile & { water_today?: number }) | null,
  onWaterLogged?: (optimisticAmount?: number, optimisticExp?: number) => void | Promise<void>,
) {
  const [waterEntries,        setWaterEntries]        = useState<WaterLog[]>([]);
  const [isSyncing,           setIsSyncing]           = useState(false);
  const [hasPendingCloudSync, setHasPendingCloudSync] = useState(false);

  const mountedRef      = useRef(true);
  const waterIntakeRef  = useRef(0);
  const waterEntriesRef = useRef<WaterLog[]>([]);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // FIX 1: Calculate from waterEntries with fallback to profile
  // Primary: sum of today's waterEntries
  // Fallback: profile.water_today if entries empty (fetch failed)
  const waterIntake = useMemo(() => {
    const fromEntries = waterEntries.reduce((sum, e) => sum + e.amount, 0);
    const fromProfile = profile?.water_today || 0;
    return fromEntries > 0 ? fromEntries : fromProfile;
  }, [waterEntries, profile?.water_today]);



  useEffect(() => {
    waterIntakeRef.current  = waterIntake;
    waterEntriesRef.current = waterEntries;
  }, [waterEntries, waterIntake]);

  // ── Fetch ──────────────────────────────────────────────

  const fetchAllWater = useCallback(async () => {
    console.log('[useWaterData] fetchAllWater called, profile.id:', profile?.id);
    if (!isRealUser(profile?.id)) {
      console.log('[useWaterData] Not real user, skipping');
      return;
    }

    const today = toDateStr();
    console.log('[useWaterData] Fetching water for today:', today);

    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('day', today)  // Only today's entries
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useWaterData] fetchAllWater error:', error);
        throw error;
      }

      console.log('[useWaterData] Fetched raw data:', data?.length || 0, 'records for today');
      const normalized = (data ?? []).map(normalizeRow);
      console.log('[useWaterData] Normalized entries:', normalized.length, normalized.slice(0, 3).map((e: WaterLog) => ({ amount: e.amount, name: e.name })));

      setWaterEntries(normalized);
      console.log('[useWaterData] Updated waterEntries state with', normalized.length, 'entries');
    } catch (err) {
      console.error('[useWaterData] fetchAllWater exception:', err);
      toast.error('Không thể tải nhật ký nước. Kiểm tra kết nối.');
      setWaterEntries([]);
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [profile?.id]);

  // Auto fetch water data on mount/profile change
  useEffect(() => {
    if (profile?.id) {
      console.log('[useWaterData] Profile changed, fetching water data');
      fetchAllWater();
    }
  }, [profile?.id, fetchAllWater]);

  // ── Listen to Smart Bottle Events for Optimistic UI ─────
  useEffect(() => {
    const handleSmartBottleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      
      if (detail?.source === 'smart_bottle' && detail?.amount_ml > 0) {
        const now = detail.occurred_at || new Date().toISOString();
        const newEntry: WaterLog = {
          id: detail.log_id || `bottle-${Date.now()}`,
          user_id: profile?.id || '',
          amount: detail.amount_ml,
          name: 'DigiBottle',
          day: toDateStr(),
          exp: detail.added_exp || 0,
          created_at: now,
          timestamp: now,
          factor: 1,
        };
        
        setWaterEntries(prev => [newEntry, ...prev]);
      }
    };

    window.addEventListener('hydrationEvent', handleSmartBottleEvent);
    return () => {
      window.removeEventListener('hydrationEvent', handleSmartBottleEvent);
    };
  }, [profile?.id]);

  // ── Add water ──────────────────────────────────────────

  const handleAddWater = useCallback(
    async (amount: number, factor = 1, name = 'Nuoc Loc') => {
      if (!profile?.id) return;

      const actualAmount = Math.round(amount * factor);
      if (actualAmount <= 0) return;

      const exp    = expGainedForWater(actualAmount, profile.level || 1);
      const now    = new Date().toISOString();
      const today  = toDateStr();
      const tempId = `temp-${Date.now()}`;

      // 1. Optimistic UI
      const optimisticEntry: WaterLog = {
        id: tempId, user_id: String(profile.id),
        amount: actualAmount, name, day: today,
        exp, created_at: now, timestamp: now, factor,
      };
      setWaterEntries(prev => [optimisticEntry, ...prev]);
      playWaterDropSound();

      // 2. Demo mode
      if (!isRealUser(profile.id)) {
        toast.success(`💧 +${actualAmount}ml nước!`);
        return;
      }

      // FIX 2: Chỉ gọi onWaterLogged MỘT lần sau khi DB confirm, không gọi trước
      try {
        const { data, error } = await supabase
          .from('water_logs')
          .insert({ user_id: profile.id, amount: actualAmount, name, exp, day: today })
          .select('id')
          .single();

        if (error) throw error;

        // [QUAN TRỌNG] Gọi RPC để backend tự cộng EXP, Level và Coin an toàn tuyệt đối
        const rpcRes = await supabase.rpc('process_hydration_event', {
          p_user_id: profile.id,
          p_amount_ml: actualAmount
        });
        if (rpcRes.error) {
          console.error('[useWaterData] RPC process_hydration_event error:', rpcRes.error);
        }

        // Swap tempId -> real ID, không cần refetch toàn bộ
        setWaterEntries(prev =>
          prev.map(e => e.id === tempId ? { ...e, id: String(data.id) } : e),
        );

        toast.success(`💧 +${actualAmount}ml · ⚡ +${exp} EXP!`);

        // FIX: Truyền amount và exp để App.tsx có thể tính toán lại level ngay lập tức
        await onWaterLogged?.(actualAmount, exp);

        // Clubs sync: fire & forget, không block UI
        syncToClubs(profile.id, actualAmount).catch(console.error);

      } catch (err) {
        console.error('[useWaterData] addWater:', err);
        toast.error('⚠️ Không thể ghi nhận uống nước. Đã lưu offline để đồng bộ sau.');

        // Rollback optimistic entry
        setWaterEntries(prev => prev.filter(e => e.id !== tempId));

        // FIX 3: Lưu day ngay tại đây thay vì tính lại khi sync
        pushOfflineQueue({
          tempId, user_id: String(profile.id),
          amount: actualAmount, name, exp,
          day: today,
          created_at: now, factor,
        });

        setHasPendingCloudSync(true);
      }
    },
    [profile?.id, onWaterLogged],
  );

  // ── Delete ─────────────────────────────────────────────

  const _doDelete = useCallback(
    async (id: string, entry: WaterLog) => {
      const snapshot = waterEntriesRef.current;
      setWaterEntries(prev => prev.filter(e => e.id !== id));

      if (id.startsWith('temp') || !isRealUser(profile?.id)) {
        toast.success('🗑️ Đã xóa thành công!');
        return;
      }

      try {
        console.log('[useWaterData] Deleting entry from DB:', id);
        const { error } = await supabase.from('water_logs').delete().eq('id', id);
        if (error) {
          console.error('[useWaterData] Delete error:', error);
          throw error;
        }

        console.log('[useWaterData] Delete successful, notifying parent');
        // Notify với số âm để parent trừ đúng delta
        await onWaterLogged?.(-entry.amount, -entry.exp);

        // Force refetch to ensure data consistency
        setTimeout(() => fetchAllWater(), 500);

        toast.success('🗑️ Đã xóa thành công!');
      } catch (err) {
        console.error('[useWaterData] Delete failed:', err);
        setWaterEntries(snapshot);
        toast.error('❌ Không thể xóa. Thử lại sau!');
      }
    },
    [profile?.id, onWaterLogged, fetchAllWater],
  );

  const handleDeleteEntry = useCallback(
    async (rawId: unknown) => {
      const id = String(rawId ?? '');
      if (!id) return;

      const entry = waterEntriesRef.current.find(e => e.id === id);
      if (!entry) return;

      toast(`Xóa ${entry.amount}ml ${entry.name}?`, {
        action:   { label: 'Xác nhận', onClick: () => _doDelete(id, entry) },
        cancel:   { label: 'Hủy',      onClick: () => {} },
        duration: 5000,
      });
    },
    [_doDelete],
  );

  // ── Edit ───────────────────────────────────────────────

  const handleEditEntry = useCallback(async (id: string, newAmount: number) => {
    const originalEntry = waterEntriesRef.current.find(e => e.id === id);
    if (!originalEntry) {
      toast.error('Lỗi: Không tìm thấy mục cần sửa.');
      return;
    }

    if (Number.isNaN(newAmount) || newAmount <= 0) {
      toast.error('Lượng nước không hợp lệ.');
      return;
    }

    const newExp      = expGainedForWater(newAmount, profile?.level || 1);
    const snapshot = waterEntriesRef.current;
    // Tính delta để notify parent đúng số chênh lệch, không phải tổng mới
    const deltaAmount = newAmount - originalEntry.amount;
    const deltaExp    = newExp    - originalEntry.exp;

    setWaterEntries(prev =>
      prev.map(e => e.id === id ? { ...e, amount: newAmount, exp: newExp } : e),
    );

    if (!isRealUser(profile?.id) || id.startsWith('temp-')) return;

    try {
      const { error } = await supabase
        .from('water_logs')
        .update({ amount: newAmount, exp: newExp })
        .eq('id', id);

      if (error) throw error;

      toast.success('Đã cập nhật lượng nước!');
      if (deltaAmount !== 0) await onWaterLogged?.(deltaAmount, deltaExp);
    } catch (err) {
      console.error('[useWaterData] edit failed:', err);
      setWaterEntries(snapshot);
      toast.error('❌ Không thể cập nhật. Kiểm tra kết nối!');
    }
  }, [profile?.id, onWaterLogged]);

  // ── Offline sync ───────────────────────────────────────

  const syncOfflineLogs = useCallback(async () => {
    if (!isRealUser(profile?.id)) return;

    const queue = readOfflineQueue();
    if (!queue.length) return;

    console.log('[useWaterData] Syncing offline queue:', queue.length, 'items');

    try {
      // Strip tempId và factor (không phải cột DB)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const payload = queue.map(({ tempId: _t, factor: _f, ...rest }) => rest);

      console.log('[useWaterData] Inserting payload:', payload);
      const { error } = await supabase.from('water_logs').insert(payload);
      if (error) {
        console.error('[useWaterData] Insert error:', error);
        throw error;
      }

      // Xử lý cộng EXP cho toàn bộ các lượt uống offline
      for (const item of queue) {
        await supabase.rpc('process_hydration_event', {
          p_user_id: profile.id,
          p_amount_ml: item.amount
        });
      }

      clearOfflineQueue();
      setHasPendingCloudSync(false);
      toast.success(`🔄 Đã đồng bộ ${payload.length} mục offline thành công!`);
      // FIX: Tính tổng amount và exp từ queue đã đồng bộ để cập nhật UI
      const totalAmountSynced = queue.reduce((sum, item) => sum + item.amount, 0);
      const totalExpSynced = queue.reduce((sum, item) => sum + item.exp, 0);
      await onWaterLogged?.(totalAmountSynced, totalExpSynced);

      fetchAllWater();
    } catch (err) {
      console.error('[useWaterData] syncOfflineLogs:', err);
      toast.error('📶 Không thể đồng bộ dữ liệu offline. Kiểm tra kết nối mạng!');
    }
  }, [profile?.id, onWaterLogged]);

  useEffect(() => {
    if (hasPendingCloudSync) syncOfflineLogs();
  }, [hasPendingCloudSync, syncOfflineLogs]);

  // ── Return ─────────────────────────────────────────────

  return {
    waterEntries,
    waterIntake,
    handleAddWater,
    handleDeleteEntry,
    handleEditEntry,
    hasPendingCloudSync,
    isSyncing,
    waterIntakeRef,
    waterEntriesRef,
    refetchWater: fetchAllWater,
    syncOfflineLogs,
  };
}

// ── Club sync (fire & forget) ──────────────────────────────

async function syncToClubs(userId: string, amountMl: number) {
  const { data: clubs } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);

  if (!clubs?.length) return;

  await Promise.allSettled(
    clubs.map(({ club_id }: { club_id: string }) =>
      Promise.all([
        supabase.rpc('increment_club_member_intake', {
          p_user_id: userId, p_club_id: club_id, p_amount_to_add: amountMl,
        }),
        supabase.from('club_activity').insert({
          club_id, user_id: userId,
          activity_type: 'drink',
          message: `da nap them ${amountMl}ml nuoc`,
        }),
      ]),
    ),
  );
}

// Sample quests data with proper Vietnamese names - simplified for debugging
const sampleQuests = [
  { type: 'daily', title: 'Khởi động', description: 'Uống ít nhất 500ml', condition_type: 'drink_today', condition_value: 500 },
  { type: 'daily', title: 'Nửa chặng', description: 'Đạt 50% mục tiêu', condition_type: 'goal_percent', condition_value: 50 },
  { type: 'weekly', title: 'Tuần lễ nước', description: '5 ngày trong tuần', condition_type: 'drink_weekly_days', condition_value: 5 },
  { type: 'level', title: 'Người mới bắt đầu', description: '3 ngày liên tục', condition_type: 'drink_streak', condition_value: 3 },
  { type: 'level', title: 'Tích lũy đầu tiên', description: '10.000ml tổng cộng', condition_type: 'drink_total', condition_value: 10000 },
];

// Debug function: Clear duplicate quests first
export const clearDuplicateQuests = async () => {
  try {
    console.log('🧹 Clearing duplicate quests...');

    // First check how many quests exist and analyze duplicates
    const { data: allQuests } = await supabase.from('quests').select('id, title');
    console.log('📊 Total quests before clear:', allQuests?.length || 0);

    if (allQuests) {
      const titleCounts: Record<string, number> = {};
      allQuests.forEach((q: any) => {
        titleCounts[q.title] = (titleCounts[q.title] || 0) + 1;
      });
      console.log('📋 Duplicate analysis:', titleCounts);

      const duplicates = Object.entries(titleCounts).filter(([_, count]) => count > 1);
      console.log('🔍 Titles with duplicates:', duplicates);
    }

    // Delete all quests
    const { error: deleteError } = await supabase
      .from('quests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Clear error:', deleteError);
      toast.error('❌ Lỗi khi xóa quests');
      return;
    }

    // Check after clear
    const { data: afterCount } = await supabase.from('quests').select('id', { count: 'exact' });
    console.log('📊 Quests after clear:', afterCount?.length || 0);

    toast.success('🧹 Đã xóa tất cả quests!');
  } catch (err) {
    console.error('[clearDuplicateQuests]', err);
    toast.error('❌ Lỗi khi clear quests');
  }
};

// Debug function: Clear duplicate user_quests
export const clearDuplicateUserQuests = async (userId: string) => {
  try {
    console.log('🧹 Clearing duplicate user_quests for user:', userId);

    // Get all user_quests for the user
    const { data: allUserQuests } = await supabase
      .from('user_quests')
      .select('id, quest_id, reset_date')
      .eq('user_id', userId);

    console.log('📊 Total user_quests before clear:', allUserQuests?.length || 0);

    if (allUserQuests) {
      const questCounts: Record<string, number> = {};
      allUserQuests.forEach((uq: any) => {
        const key = `${uq.quest_id}-${uq.reset_date || 'null'}`;
        questCounts[key] = (questCounts[key] || 0) + 1;
      });
      console.log('📋 Duplicate analysis:', questCounts);

      const duplicates = Object.entries(questCounts).filter(([_, count]) => count > 1);
      console.log('🔍 Keys with duplicates:', duplicates);

      // For each duplicate key, keep one, delete others
      for (const [key, count] of duplicates) {
        const [questId, resetDateStr] = key.split('-');
        const resetDate = resetDateStr === 'null' ? null : resetDateStr;

        const duplicatesForKey = allUserQuests.filter((uq: any) =>
          uq.quest_id === questId && uq.reset_date === resetDate
        );

        // Keep the first one, delete the rest
        const toDelete = duplicatesForKey.slice(1).map((uq: any) => uq.id);

        if (toDelete.length > 0) {
          console.log(`🗑️ Deleting ${toDelete.length} duplicates for quest ${questId}`);
          const { error } = await supabase
            .from('user_quests')
            .delete()
            .in('id', toDelete);

          if (error) {
            console.error('Delete error:', error);
          }
        }
      }
    }

    // Check after clear
    const { data: afterCount } = await supabase
      .from('user_quests')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    console.log('📊 User_quests after clear:', afterCount?.length || 0);

    toast.success('🧹 Đã xóa duplicate user_quests!');
  } catch (err) {
    console.error('[clearDuplicateUserQuests]', err);
    toast.error('❌ Lỗi khi clear user_quests');
  }
};

// Function to clean up only duplicates, keeping one of each
export const cleanupDuplicateQuests = async () => {
  try {
    console.log('🧽 Cleaning up duplicate quests...');

    const { data: allQuests } = await supabase.from('quests').select('id, title').order('id');
    if (!allQuests) return;

    console.log('📊 Total quests:', allQuests.length);

    const seenTitles = new Set();
    const toDelete = [];

    for (const quest of allQuests) {
      if (seenTitles.has(quest.title)) {
        // This is a duplicate, mark for deletion
        toDelete.push(quest.id);
        console.log(`🔄 Marking duplicate "${quest.title}" (ID: ${quest.id}) for deletion`);
      } else {
        // First occurrence, keep it
        seenTitles.add(quest.title);
      }
    }

    console.log(`🗑️ Will delete ${toDelete.length} duplicate quests`);

    if (toDelete.length > 0) {
      // Delete duplicates in batches to avoid issues
      for (let i = 0; i < toDelete.length; i += 10) {
        const batch = toDelete.slice(i, i + 10);
        const { error } = await supabase
          .from('quests')
          .delete()
          .in('id', batch);

        if (error) {
          console.error('Batch delete error:', error);
        } else {
          console.log(`✅ Deleted batch of ${batch.length} duplicates`);
        }
      }
    }

    // Verify cleanup
    const { data: remaining } = await supabase.from('quests').select('id, title');
    console.log('📊 Remaining quests after cleanup:', remaining?.length || 0);

    if (remaining) {
      const uniqueTitles = new Set(remaining.map((q: any) => q.title));
      console.log('🎯 Unique quest titles:', uniqueTitles.size);
      console.log('📋 Final quests:', Array.from(uniqueTitles));
    }

    toast.success(`🧽 Đã xóa ${toDelete.length} duplicate quests!`);

  } catch (err) {
    console.error('Cleanup error:', err);
    toast.error('❌ Lỗi khi cleanup duplicates');
  }
};

// Debug function: Seed sample quests for testing
export const seedSampleQuests = async () => {
  console.log('🎯 Starting quest seeding...');

  // First check if we already have quests to avoid duplicates
  const { data: existingQuests } = await supabase.from('quests').select('title');
  const existingTitles = new Set(existingQuests?.map((q: any) => q.title) || []);

  console.log('📊 Existing quests:', existingTitles.size);

  if (existingTitles.size > 0) {
    const shouldContinue = confirm(`Đã có ${existingTitles.size} quests. Tiếp tục seed sẽ tạo duplicate. Clear trước?`);
    if (!shouldContinue) {
      toast.info('❌ Đã hủy seeding để tránh duplicate');
      return;
    }
  }

  console.log('📋 Sample quests to seed:', sampleQuests.length);

  try {
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < sampleQuests.length; i++) {
      const quest = sampleQuests[i];

      // Skip if already exists
      if (existingTitles.has(quest.title)) {
        console.log(`⏭️ Quest "${quest.title}" already exists, skipping`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 Processing quest ${i + 1}/${sampleQuests.length}:`, quest.title);

      try {
        const { data, error } = await supabase.from('quests').insert({
          type: quest.type,
          title: quest.title,
          description: quest.description,
          condition_type: quest.condition_type,
          condition_value: quest.condition_value,
          reward_exp: quest.condition_value >= 100 ? Math.floor(quest.condition_value / 10) : 50,
          reward_coins: quest.condition_value >= 100 ? Math.floor(quest.condition_value / 50) : 10,
          min_level: 1,
          is_active: true
        }).select('id');

        if (error) {
          console.error(`❌ Insert error for "${quest.title}":`, error);
          skippedCount++;
        } else if (data && data.length > 0) {
          console.log(`✅ Successfully inserted "${quest.title}" with ID:`, data[0].id);
          insertedCount++;
        } else {
          console.log(`⚠️ Insert succeeded but no data returned for "${quest.title}"`);
          insertedCount++;
        }
      } catch (err) {
        console.error(`💥 Exception inserting "${quest.title}":`, err);
        skippedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🎯 Seeding complete: ${insertedCount} inserted, ${skippedCount} skipped`);
    toast.success(`✅ Đã seed ${insertedCount} quests!`);

    // Verify by fetching count
    const { data: allQuests } = await supabase.from('quests').select('id, title');
    console.log('📊 Total quests in DB after seeding:', allQuests?.length || 0);
    if (allQuests) {
      const titleCounts: Record<string, number> = {};
      allQuests.forEach((q: any) => {
        titleCounts[q.title] = (titleCounts[q.title] || 0) + 1;
      });
      console.log('📋 Quest title counts:', titleCounts);
    }

  } catch (err) {
    console.error('[useWaterData] Seed error:', err);
    toast.error('❌ Lỗi khi seed quests');
  }
};

// Debug function: Seed sample water logs for testing
export const seedSampleWaterLogs = async (userId: string) => {
  if (!userId) return;

  // Sample quests data with proper Vietnamese names
  const sampleQuests = [
    { type: 'daily', title: 'Khởi động', description: 'Uống ít nhất 500ml trước 10 giờ sáng', condition_type: 'drink_today', condition_value: 500 },
    { type: 'daily', title: 'Nửa chặng', description: 'Đạt 50% mục tiêu nước trong ngày', condition_type: 'goal_percent', condition_value: 50 },
    { type: 'daily', title: 'Về đích', description: 'Hoàn thành 100% mục tiêu nước hôm nay', condition_type: 'goal_percent', condition_value: 100 },
    { type: 'daily', title: 'Ghi chép cẩn thận', description: 'Log ít nhất 5 lần uống trong ngày', condition_type: 'log_count', condition_value: 5 },
    { type: 'weekly', title: 'Tuần lễ nước', description: 'Đạt mục tiêu ít nhất 5 ngày trong tuần', condition_type: 'drink_weekly_days', condition_value: 5 },
    { type: 'level', title: 'Người mới bắt đầu', description: 'Uống nước 3 ngày liên tục lần đầu', condition_type: 'drink_streak', condition_value: 3 },
    { type: 'level', title: 'Tích lũy đầu tiên', description: 'Uống tổng cộng 10.000ml', condition_type: 'drink_total', condition_value: 10000 },
  ];

  const sampleLogs = [
    { amount: 250, name: 'Nước lọc', day: '2026-04-18' },
    { amount: 300, name: 'Cà phê', day: '2026-04-17' },
    { amount: 200, name: 'Trà xanh', day: '2026-04-16' },
    { amount: 350, name: 'Nước cam', day: '2026-04-15' },
    { amount: 250, name: 'Sinh tố', day: '2026-04-14' },
  ];

  try {
    for (const log of sampleLogs) {
      const fakeCreatedAt = new Date(`${log.day}T12:00:00Z`).toISOString();
      await supabase.from('water_logs').insert({
        user_id: userId,
        amount: log.amount,
        name: log.name,
        day: log.day,
        created_at: fakeCreatedAt,
        timestamp: fakeCreatedAt,
        exp: Math.floor(log.amount / 100) * 5
      });
    }
    console.log('[useWaterData] Seeded sample water logs');
    toast.success('💧 Đã thêm sample data để test!');

    // Also seed quests
    await seedSampleQuests();
  } catch (err) {
    console.error('[useWaterData] Seed error:', err);
  }
};

// SQL Script to fix quest names - Run this in Supabase SQL Editor
export const getQuestFixSQL = () => {
  return `
-- Fix quest names with proper Vietnamese accents
UPDATE public.quests SET title = 'Người mới bắt đầu', description = 'Uống nước 3 ngày liên tục lần đầu' WHERE title = 'Nguoi moi bat dau';
UPDATE public.quests SET title = 'Tích lũy đầu tiên', description = 'Uống tổng cộng 10.000ml' WHERE title = 'Tich luy dau tien';
UPDATE public.quests SET title = 'Chiến binh nước', description = 'Đạt 14 ngày streak' WHERE title = 'Chien binh nuoc';
UPDATE public.quests SET title = 'Hành trình dài', description = 'Uống tổng cộng 50.000ml' WHERE title = 'Hanh trinh dai';
UPDATE public.quests SET title = 'Huyền thoại', description = 'Đạt 30 ngày streak' WHERE title = 'Huyen thoai';
UPDATE public.quests SET title = 'Khởi động', description = 'Uống ít nhất 500ml trước 10 giờ sáng' WHERE title = 'Khoi dong';
UPDATE public.quests SET title = 'Nửa chặng', description = 'Đạt 50% mục tiêu nước trong ngày' WHERE title = 'Nua chang';
UPDATE public.quests SET title = 'Về đích', description = 'Hoàn thành 100% mục tiêu nước hôm nay' WHERE title = 'Ve dich';
UPDATE public.quests SET title = 'Ghi chép cẩn thận', description = 'Log ít nhất 5 lần uống trong ngày' WHERE title = 'Ghi chep can than';
UPDATE public.quests SET title = 'Tuần lễ nước', description = 'Đạt mục tiêu ít nhất 5 ngày trong tuần' WHERE title = 'Tuan le nuoc';
UPDATE public.quests SET title = 'Siêu cấp hydration', description = 'Uống 120% mục tiêu' WHERE title = 'Sieu cap hydration';
UPDATE public.quests SET title = 'Streaker', description = 'Duy trì streak >= 7 ngày' WHERE title = 'Streaker';

-- Fix challenge names too
UPDATE public.challenges SET title = 'The First Flood', description = 'Uống đủ mục tiêu 7 ngày liên tục. Không được đứt streak.' WHERE slug = 'the-first-flood';
UPDATE public.challenges SET title = 'Monsoon Season', description = 'Duy trì 14 ngày hydration. Được phép 1 ngày đạt 80%.' WHERE slug = 'monsoon-season';
UPDATE public.challenges SET title = 'Reign of Rain', description = '30 ngày hoặc đạt >= 90% mục tiêu. Thách thức dài hạn chính thức.' WHERE slug = 'reign-of-rain';
UPDATE public.challenges SET title = 'The Drip Protocol', description = 'Uống tổng cộng 50.000ml. Có 4 mốc phần thưởng nhỏ dọc đường.' WHERE slug = 'the-drip-protocol';
UPDATE public.challenges SET title = 'Century of Drops', description = 'Uống tổng cộng 100.000ml. Dành cho người chơi lâu dài.' WHERE slug = 'century-of-drops';
`;
};

// Update existing quest names with proper Vietnamese accents
export const updateQuestNames = async () => {
  try {
    console.log('🇻🇳 Starting quest name updates...');

    // Direct updates using known quest IDs or types
    const updates = [
      { condition: { type: 'level', condition_value: 3 }, updates: { title: 'Người mới bắt đầu', description: 'Uống nước 3 ngày liên tục lần đầu' } },
      { condition: { type: 'level', condition_value: 10000 }, updates: { title: 'Tích lũy đầu tiên', description: 'Uống tổng cộng 10.000ml' } },
      { condition: { type: 'level', condition_value: 14 }, updates: { title: 'Chiến binh nước', description: 'Đạt 14 ngày streak' } },
      { condition: { type: 'level', condition_value: 50000 }, updates: { title: 'Hành trình dài', description: 'Uống tổng cộng 50.000ml' } },
      { condition: { type: 'level', condition_value: 30 }, updates: { title: 'Huyền thoại', description: 'Đạt 30 ngày streak' } },
    ];

    for (const { condition, updates: updateData } of updates) {
      const { error } = await supabase
        .from('quests')
        .update(updateData)
        .eq('type', condition.type)
        .eq('condition_value', condition.condition_value);

      if (error) console.error('Update error:', error);
    }

    // Also try by title patterns (less reliable but worth trying)
    const titleUpdates = [
      { oldPattern: '%Nguoi%', newTitle: 'Người mới bắt đầu' },
      { oldPattern: '%Tich%', newTitle: 'Tích lũy đầu tiên' },
      { oldPattern: '%Chien%', newTitle: 'Chiến binh nước' },
      { oldPattern: '%Hanh%', newTitle: 'Hành trình dài' },
      { oldPattern: '%Huyen%', newTitle: 'Huyền thoại' },
    ];

    for (const { oldPattern, newTitle } of titleUpdates) {
      const { error } = await supabase
        .from('quests')
        .update({ title: newTitle })
        .ilike('title', oldPattern);

      if (error) console.error('Pattern update error:', error);
    }

    console.log('[useWaterData] Attempted quest name updates');

    // Show SQL script in a prominent way
    const sqlScript = getQuestFixSQL();
    console.log('🇻🇳 === COPY THIS SQL TO SUPABASE SQL EDITOR ===');
    console.log(sqlScript);
    console.log('================================================');

    // Also show in toast
    toast.success('📋 Check console for SQL script to fix quest names!', {
      duration: 10000,
      action: {
        label: 'Copy SQL',
        onClick: () => navigator.clipboard.writeText(sqlScript)
      }
    });

  } catch (err) {
    console.error('[useWaterData] Update quest names error:', err);
    toast.error('❌ Lỗi khi cập nhật tên quests');

    // Still show the SQL script
    console.log('📋 Copy this SQL to Supabase SQL Editor:');
    console.log(getQuestFixSQL());
  }
};
