import { create } from 'zustand';
import { toast } from 'sonner';

export interface DrinkPreset {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  color: string;
}

interface DrinkPresetState {
  drinkPresets: DrinkPreset[];
  editingPresets: DrinkPreset[];
  customDrinkForm: { name: string; amount: number | string; factor: number };

  setDrinkPresets: (presets: DrinkPreset[]) => void;
  setEditingPresets: (presets: DrinkPreset[]) => void;
  setCustomDrinkForm: (form: { name: string; amount: number | string; factor: number }) => void;

  loadDrinkPresets: () => void;
  saveDrinkPresets: () => void;
  handleUpdatePreset: (index: number, field: keyof DrinkPreset, value: any) => void;
}

export const useDrinkPresetStore = create<DrinkPresetState>((set, get) => ({
  drinkPresets: [
    { id: '1', name: 'Nước lọc', amount: 250, factor: 1.0, icon: 'Droplet', color: 'cyan' },
    { id: '2', name: 'Cà phê', amount: 200, factor: 0.8, icon: 'Coffee', color: 'orange' },
    { id: '3', name: 'Bù khoáng', amount: 300, factor: 1.1, icon: 'Activity', color: 'emerald' },
    { id: '4', name: 'Bia/Rượu', amount: 330, factor: -0.5, icon: 'Zap', color: 'red' }
  ],
  editingPresets: [],
  customDrinkForm: { name: 'Trà đào', amount: 300, factor: 1.0 },

  setDrinkPresets: (presets) => set({ drinkPresets: presets }),
  setEditingPresets: (presets) => set({ editingPresets: presets }),
  setCustomDrinkForm: (form) => set({ customDrinkForm: form }),

  loadDrinkPresets: () => {
    const saved = localStorage.getItem('digiwell_presets');
    if (saved) {
      try {
        const parsedPresets = JSON.parse(saved);
        // Basic validation to prevent loading corrupted data
        if (Array.isArray(parsedPresets) && parsedPresets.length > 0) {
          set({ drinkPresets: parsedPresets });
        }
      } catch (e) {
        console.error("Lỗi khi tải cấu hình đồ uống:", e);
        localStorage.removeItem('digiwell_presets'); // Clear corrupted data
      }
    }
  },

  saveDrinkPresets: () => {
    const { editingPresets } = get();
    localStorage.setItem('digiwell_presets', JSON.stringify(editingPresets));
    set({ drinkPresets: editingPresets });
    toast.success("Đã lưu cấu hình đồ uống mặc định!");
  },

  handleUpdatePreset: (index, field, value) => {
    set(state => ({
      editingPresets: state.editingPresets.map((preset, i) => i === index ? { ...preset, [field]: value } : preset)
    }));
  },
}));
