import React from 'react';
import { Plus, X } from 'lucide-react';
import { type DrinkPreset, renderIcon, presetStyles } from '../../tabs/HomeTab';

interface PresetManagerModalProps {
  showPresetManager: boolean;
  setShowPresetManager: (show: boolean) => void;
  editingPresets: DrinkPreset[];
  setEditingPresets: (presets: DrinkPreset[]) => void;
  handleUpdatePreset: (index: number, field: string, value: any) => void;
  savePresets: () => void;
}

export default function PresetManagerModal({
  showPresetManager, setShowPresetManager, editingPresets, setEditingPresets, handleUpdatePreset, savePresets
}: PresetManagerModalProps) {
  if (!showPresetManager) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowPresetManager(false)}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-white">Menu đồ uống</h3>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingPresets([...editingPresets, { id: Date.now().toString(), name: 'Đồ uống mới', amount: 200, factor: 1.0, icon: 'Droplet', color: 'cyan' }])} className="text-cyan-400 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20 active:scale-95 transition-all"><Plus size={18} /></button>
            <button onClick={() => setShowPresetManager(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
          </div>
        </div>

        <div className="space-y-3 mb-6 max-h-[55vh] overflow-y-auto pr-1">
          {editingPresets.map((p, idx) => (
            <div key={p.id || `preset-item-${idx}`} className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center gap-3">
                {renderIcon(p.icon, { size: 18, className: presetStyles[p.color as keyof typeof presetStyles]?.text || 'text-cyan-400' })}
                <input type="text" value={p.name} onChange={e => handleUpdatePreset(idx, 'name', e.target.value)} className="flex-1 bg-transparent border-b border-slate-700 text-white text-sm font-bold outline-none focus:border-cyan-500 pb-1" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-[10px] text-slate-500 uppercase mb-1 block font-semibold">Dung tích (ml)</label><input type="number" value={p.amount} onChange={e => handleUpdatePreset(idx, 'amount', Number(e.target.value))} className="w-full bg-slate-800 p-2.5 rounded-lg text-white text-xs border border-slate-700 outline-none focus:border-cyan-500" /></div>
                <div className="flex-1"><label className="text-[10px] text-slate-500 uppercase mb-1 block font-semibold">Hệ số BHI</label><select value={p.factor} onChange={e => handleUpdatePreset(idx, 'factor', Number(e.target.value))} className="w-full bg-slate-800 p-2.5 rounded-lg text-white text-xs border border-slate-700 outline-none focus:border-cyan-500"><option value={1.0}>Nước (100%)</option><option value={1.1}>Bù khoáng (110%)</option><option value={0.8}>Cà phê (80%)</option><option value={-0.5}>Cồn (-50%)</option></select></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowPresetManager(false)} className="flex-1 py-3 rounded-xl text-slate-400 font-bold text-sm border border-slate-700 bg-slate-800 active:scale-95 transition-all">Huỷ</button>
          <button onClick={savePresets} className="flex-1 py-3 rounded-xl font-bold text-slate-900 text-sm active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>Lưu cấu hình</button>
        </div>
      </div>
    </div>
  );
}