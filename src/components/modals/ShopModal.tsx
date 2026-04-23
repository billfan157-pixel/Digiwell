import React, { useState, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Check, Sparkles, Palette, Frame, Droplets, Coins, Loader2, Database, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import CountUp from '../CountUp';
import GachaMachine from '../GachaMachine';
import type { Profile } from '../../models';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'theme' | 'frame' | 'bottle';
  meta_value: string;
  image_url?: string;
  preview_color?: string;
  animation_type?: string;
}

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  isProcessing: boolean;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, isOwned, isEquipped, isProcessing, onBuy, onEquip }) => {
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'rare': return 'border-blue-500 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.3)]';
      case 'epic': return 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(147,51,234,0.3)]';
      case 'legendary': return 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      default: return 'border-slate-700 bg-slate-800/50';
    }
  };

  return (
    <motion.div
      layout
      className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${isEquipped ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : getRarityStyles(item.rarity)} hover:scale-105`}
    >
      {item.meta_value && (item.meta_value.startsWith('http') || item.meta_value.startsWith('/')) ? (
        <img src={item.meta_value} alt={item.name} className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-slate-700" />
      ) : item.category === 'theme' && item.meta_value.startsWith('#') ? (
        <div 
          className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center relative transition-transform" 
          style={{ 
            backgroundColor: `${item.preview_color || item.meta_value}15`, 
            border: `1px solid ${item.preview_color || item.meta_value}40`,
            boxShadow: `0 8px 20px -4px ${item.preview_color || item.meta_value}30`
          }}
        >
          <div className="absolute inset-0 opacity-30 rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${item.preview_color || item.meta_value}, transparent 70%)` }} />
          <Palette size={28} style={{ color: item.preview_color || item.meta_value }} className="z-10 relative drop-shadow-sm" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full mb-3 bg-slate-700 flex items-center justify-center">
          {item.category === 'theme' && <Palette size={24} className="text-slate-400" />}
          {item.category === 'frame' && <Frame size={24} className="text-slate-400" />}
          {item.category === 'bottle' && <Droplets size={24} className="text-slate-400" />}
        </div>
      )}
      <p className="text-white font-bold text-sm mb-1">{item.name}</p>
      <p className="text-slate-400 text-xs mb-3">{item.description}</p>
      <button
        disabled={isProcessing}
        onClick={() => isOwned ? onEquip(item) : onBuy(item)}
        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
          isEquipped
            ? 'bg-slate-700 text-slate-400'
            : isOwned
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
        }`}
      >
        {isProcessing ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý</> : isEquipped ? <><Check size={14} /> Đang dùng</> : isOwned ? <><Sparkles size={12} /> Trang bị</> : <><Coins size={12} /> {item.price}</>}
      </button>
    </motion.div>
  );
};

export default function ShopModal({ 
  isOpen, 
  onClose, 
  profile,
  onSpendCoins 
}: { isOpen: boolean; onClose: () => void; profile: Profile | null; onSpendCoins?: (amount: number) => Promise<boolean> }) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<'theme' | 'frame' | 'bottle'>('theme');
    const [viewMode, setViewMode] = useState<'shop' | 'inventory'>('shop');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [equippedBottleId, setEquippedBottleId] = useState<string | null>(profile?.equipped_bottle_id || null);
  const [currentTheme, setCurrentTheme] = useState<string>('');

  useEffect(() => {
    setEquippedBottleId(profile?.equipped_bottle_id || null);
  }, [profile?.equipped_bottle_id]);

  // Đọc theme hiện tại
  useEffect(() => {
    if (profile?.id) {
      const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profile.id}`) || '{}');
      setCurrentTheme(prefs.themeColor || '#06b6d4');
    }
  }, [profile?.id, isOpen]);

  // Hàm nạp Data mẫu dùng chung
  const seedSampleData = async () => {
    const sampleItems = [
        { id: 'theme_cyan', name: 'Cyberpunk (Cyan)', description: 'Màu lục lam Neon mặc định', price: 0, rarity: 'common', category: 'theme', meta_value: '#06b6d4', preview_color: '#06b6d4', is_active: true },
        { id: 'theme_yellow', name: 'Hoàng Kim (Gold)', description: 'Ánh vàng vương giả quyền quý', price: 200, rarity: 'rare', category: 'theme', meta_value: '#f59e0b', preview_color: '#f59e0b', is_active: true },
        { id: 'theme_emerald', name: 'Lục Bảo (Emerald)', description: 'Xanh ngọc bích thiên nhiên tươi mát', price: 250, rarity: 'rare', category: 'theme', meta_value: '#10b981', preview_color: '#10b981', is_active: true },
        { id: 'theme_purple', name: 'Dạ Khúc (Purple)', description: 'Sắc tím neon huyền bí', price: 500, rarity: 'epic', category: 'theme', meta_value: '#a855f7', preview_color: '#a855f7', is_active: true },
        { id: 'theme_red', name: 'Hỏa Ngục (Crimson)', description: 'Màu đỏ thẫm rực lửa', price: 500, rarity: 'epic', category: 'theme', meta_value: '#e11d48', preview_color: '#e11d48', is_active: true },
        { id: 'theme_aurora', name: 'Cực Quang (Aurora)', description: 'Sắc hồng cực quang siêu hiếm', price: 1000, rarity: 'legendary', category: 'theme', meta_value: '#ec4899', preview_color: '#ec4899', is_active: true },
        { id: 'frame_silver', name: 'Khung Bạc', description: 'Khung avatar bạc', price: 250, rarity: 'rare', category: 'frame', meta_value: 'silver-frame.png', is_active: true },
        { id: 'bottle_cyberpunk', name: 'Cyberpunk Neon', description: 'Skin bình nước phong cách Cyberpunk', price: 500, rarity: 'epic', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png', meta_value: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png', is_active: true },
        { id: 'bottle_panda', name: 'Gấu Trúc', description: 'Skin bình nước hình gấu trúc', price: 300, rarity: 'rare', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png', meta_value: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png', is_active: true },
    ];
    const { error } = await supabase.from('shop_items').upsert(sampleItems);
    if (error) throw error;
    return sampleItems as ShopItem[];
  };

  const handleManualSeed = async () => {
    const toastId = toast.loading("Đang nạp kho hàng...");
    try {
        await seedSampleData();
        await queryClient.invalidateQueries({ queryKey: ['shopData', profile?.id] });
        toast.success("Đã nhập hàng mới thành công!", { id: toastId });
    } catch (error: any) {
        toast.error("Lỗi nạp hàng: " + error.message, { id: toastId });
    }
  };

  // --- ÁP DỤNG REACT QUERY GIÚP CACHE DỮ LIỆU CỬA HÀNG ---
  const { data: shopData, isLoading: isShopLoading } = useQuery({
    queryKey: ['shopData', profile?.id],
    queryFn: async () => {
      const { data: shopItems, error: itemsError } = await supabase
        .from('shop_items')
        .select('id, name, description, price, rarity, category, meta_value, image_url, preview_color, animation_type')
        .eq('is_active', true);

      if (itemsError) throw itemsError;

      let finalItems = shopItems;
      if (!shopItems || shopItems.length === 0) {
        finalItems = await seedSampleData();
      }

      const { data: purchases, error: purchasesError } = await supabase
        .from('user_purchases')
        .select('item_id')
        .eq('user_id', profile?.id);

      if (purchasesError) throw purchasesError;

      return {
        items: finalItems as ShopItem[],
        ownedItems: new Set<string>(purchases?.map((p: { item_id: string }) => p.item_id) || [])
      };
    },
    enabled: !!profile?.id && isOpen, // Chỉ tự động Fetch khi modal Đang mở
    staleTime: 1000 * 60 * 60, // Cache siêu tốc giữ dữ liệu trong 1 tiếng
  });

  const items = shopData?.items || [];
  const ownedItems = shopData?.ownedItems || new Set<string>();

  const handleBuy = async (item: ShopItem) => {
    if (!profile) return;
    if (ownedItems.has(item.id)) return;

    if ((profile?.coins || 0) < item.price) {
      toast.error('Không đủ xu để mua!');
      return;
    }

    setProcessingId(item.id);
    try {
      // BÁO CÁO: Đã thay thế logic trừ tiền Client-side bằng RPC Backend để tránh thất thoát dữ liệu!
      const { data, error } = await supabase.rpc('purchase_item', {
        p_user_id: profile?.id,
        p_item_id: item.id,
        p_price: item.price
      });

      if (error) throw error;

      // Cập nhật Cache local ngay lập tức không cần fetch lại
      queryClient.setQueryData(['shopData', profile?.id], (old: { items: ShopItem[], ownedItems: Set<string> } | undefined) => {
        if (!old) return old;
        return { ...old, ownedItems: new Set([...old.ownedItems, item.id]) };
      });
      
      // Cập nhật lại UI số dư tiền vàng trên app
      if (onSpendCoins) {
        await onSpendCoins(item.price);
      }

      toast.success(`🎉 Mua thành công ${item.name}!`);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Mua hàng thất bại!');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (!profile) return;
    if (!ownedItems.has(item.id)) return;
    setProcessingId(item.id);

    try {
      if (item.category === 'bottle') {
        const { error } = await supabase
          .from('profiles')
          .update({ equipped_bottle_id: item.id })
          .eq('id', profile?.id);
        if (error) throw error;
        
        setEquippedBottleId(item.id);
        window.dispatchEvent(new CustomEvent('bottleEquipped', { detail: { equipped_bottle_id: item.id } }));
      } else if (item.category === 'theme') {
        const prefs = JSON.parse(localStorage.getItem(`digiwell_prefs_${profile?.id}`) || '{}');
        prefs.themeColor = item.meta_value;
        localStorage.setItem(`digiwell_prefs_${profile?.id}`, JSON.stringify(prefs));
        setCurrentTheme(item.meta_value);
        // Bắn tín hiệu để ThemeEngine đổi màu ngay lập tức
        window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { themeColor: item.meta_value } }));
      }
      toast.success(`Đã trang bị ${item.name}!`);
    } catch (error) {
      console.error('Equip error:', error);
      toast.error('Trang bị thất bại!');
    } finally {
      setProcessingId(null);
    }
  };

  const isItemEquipped = (item: ShopItem) => {
    if (item.category === 'bottle') return equippedBottleId === item.id;
    if (item.category === 'theme') return currentTheme === item.meta_value;
    return false;
  };

  const filteredItems = items.filter((item: ShopItem) => {
    if (item.category !== activeCategory) return false;
    if (viewMode === 'inventory') return ownedItems.has(item.id);
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-0" onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
      >
        {/* Header & Credit Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5">
              <button onClick={() => setViewMode('shop')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'shop' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>Cửa hàng</button>
              <button onClick={() => setViewMode('inventory')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'inventory' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Kho đồ</button>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><ShoppingBag size={24} /></div>
            <div>
              <p className="text-slate-400 text-xs font-bold">Thẻ Thành Viên</p>
              <p className="text-amber-400 text-2xl font-black flex items-center gap-2">
                <CountUp value={profile?.coins || 0} /> <Coins size={20} className="text-amber-400" />
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory('theme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'theme' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Palette size={16} /> 🎨 Giao Diện
          </button>
          <button
            onClick={() => setActiveCategory('frame')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'frame' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Frame size={16} /> 🖼️ Khung Avatar
          </button>
          <button
            onClick={() => setActiveCategory('bottle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'bottle' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Droplets size={16} /> 💧 Skin Bình
          </button>
        </div>

        {/* Item Grid */}
        <AnimatePresence mode="wait">
          {isShopLoading ? (
            <motion.div key="shop-loading" exit={{ opacity: 0 }} className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-cyan-500" size={32} />
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredItems.map((item: ShopItem) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  isOwned={ownedItems.has(item.id)}
                  isEquipped={isItemEquipped(item)}
                  isProcessing={processingId === item.id}
                  onBuy={handleBuy}
                  onEquip={handleEquip}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DEV ONLY: Nút để seed data */}
        {!isShopLoading && filteredItems.length === 0 && viewMode === 'shop' && (
          <div className="mt-6 text-center p-4 border border-dashed border-slate-700 rounded-2xl">
            <p className="text-slate-500 text-sm mb-3">Cửa hàng trống trơn. Sếp có muốn gieo dữ liệu mẫu không?</p>
            <button onClick={handleManualSeed} className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto">
              <Database size={14} /> Gieo Data Mẫu
            </button>
          </div>
        )}

        {/* Empty Inventory */}
        {!isShopLoading && filteredItems.length === 0 && viewMode === 'inventory' && (
          <div className="mt-6 text-center p-8 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
            <Package size={40} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm font-medium">Kho đồ trống.</p>
            <p className="text-slate-500 text-xs mt-1">Hãy ghé Cửa hàng để săn thêm đồ xịn nhé!</p>
          </div>
        )}

        {viewMode === 'shop' && (
          <GachaMachine 
            profile={profile} 
            onSpendCoins={onSpendCoins || (async () => false)} 
          />
        )}
      </motion.div>
    </div>
  );
}