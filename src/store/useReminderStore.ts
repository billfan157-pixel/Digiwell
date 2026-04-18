import { create } from 'zustand';
import { toast } from 'sonner';
import {
  DEFAULT_HYDRATION_REMINDER_SETTINGS,
  checkHydrationReminderPermission,
  getHydrationReminderPreview,
  requestHydrationReminderPermission,
  scheduleHydrationReminders,
  supportsNativeHydrationReminders,
  validateHydrationReminderSettings,
  type HydrationReminderSettings,
} from '../lib/hydrationReminders';

// Re-export the type so other modules can import it from this store
export type { HydrationReminderSettings };

interface ReminderState {
  reminderSettings: HydrationReminderSettings;
  isReminderPermissionGranted: boolean;
  isApplyingReminderSettings: boolean;
  
  setReminderSettings: (settings: HydrationReminderSettings) => void;
  setIsReminderPermissionGranted: (granted: boolean) => void;
  setIsApplyingReminderSettings: (applying: boolean) => void;
  
  updateReminderSetting: <K extends keyof HydrationReminderSettings>(
    key: K,
    value: HydrationReminderSettings[K],
  ) => void;
  handleApplyReminderSettings: (profileId: string | undefined, waterGoal: number, nickname: string | undefined) => Promise<void>;
  loadReminderSettings: (profileId: string | undefined) => void;
  saveReminderSettingsToLocal: (profileId: string | undefined, settings: HydrationReminderSettings) => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminderSettings: { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
  isReminderPermissionGranted: false,
  isApplyingReminderSettings: false,

  setReminderSettings: (settings) => set({ reminderSettings: settings }),
  setIsReminderPermissionGranted: (granted) => set({ isReminderPermissionGranted: granted }),
  setIsApplyingReminderSettings: (applying) => set({ isApplyingReminderSettings: applying }),

  updateReminderSetting: (key, value) => {
    set((state) => ({
      reminderSettings: { ...state.reminderSettings, [key]: value },
    }));
  },

  loadReminderSettings: (profileId) => {
    if (profileId) {
      const savedReminderSettings = JSON.parse(localStorage.getItem(`digiwell_reminders_${profileId}`) || 'null');
      set({
        reminderSettings: savedReminderSettings
          ? { ...DEFAULT_HYDRATION_REMINDER_SETTINGS, ...savedReminderSettings }
          : { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
      });
    } else {
      set({
        reminderSettings: { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
        isReminderPermissionGranted: false,
      });
    }
  },

  saveReminderSettingsToLocal: (profileId, settings) => {
    if (profileId) {
      localStorage.setItem(`digiwell_reminders_${profileId}`, JSON.stringify(settings));
    }
  },

  handleApplyReminderSettings: async (profileId, waterGoal, nickname) => {
    const { reminderSettings } = get();
    const validationError = validateHydrationReminderSettings(reminderSettings);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    set({ isApplyingReminderSettings: true });

    try {
      if (!supportsNativeHydrationReminders()) {
        toast.success('Đã lưu lịch nhắc. Hãy chạy bản Android/iOS để nhận thông báo nền.');
        return;
      }

      let granted = await checkHydrationReminderPermission();
      if (!granted && reminderSettings.enabled) granted = await requestHydrationReminderPermission();
      set({ isReminderPermissionGranted: granted });
      if (reminderSettings.enabled && !granted) throw new Error('Bạn cần cấp quyền thông báo để DigiWell nhắc uống nước.');

      const result = await scheduleHydrationReminders(reminderSettings, { dailyGoal: waterGoal, nickname: nickname });
      toast.success(result.scheduled ? `Đã lên lịch ${result.count} lời nhắc uống nước mỗi ngày!` : 'Đã tắt lịch nhắc uống nước định kỳ.');
      get().saveReminderSettingsToLocal(profileId, reminderSettings); // Save after successful application
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật lịch nhắc uống nước.');
    } finally {
      set({ isApplyingReminderSettings: false });
    }
  },
}));

// Helper to get preview outside of component
export const getReminderPreview = (settings: HydrationReminderSettings) => getHydrationReminderPreview(settings);
