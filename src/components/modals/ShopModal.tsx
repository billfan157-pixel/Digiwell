import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, Sparkles, Palette, Frame, Droplets, Coins, Loader2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import CountUp from '../CountUp';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'theme' | 'frame' | 'bottle';
  meta_value: string;
  image_url?: string;
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
        <div className="w-16 h-16 rounded-full mb-3 border-2 border-slate-700 shadow-inner flex items-center justify-center" style={{ backgroundColor: item.meta_value }}>
          <Palette size={20} className="text-white/50" />
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
}: { isOpen: boolean; onClose: () => void; profile: any; onSpendCoins?: (amount: number) => Promise<boolean> }) {
  const [activeCategory, setActiveCategory] = useState<'theme' | 'frame' | 'bottle'>('theme');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [equippedBottleId, setEquippedBottleId] = useState<string | null>(profile?.equipped_bottle_id || null);

  useEffect(() => {
    setEquippedBottleId(profile?.equipped_bottle_id || null);
  }, [profile?.equipped_bottle_id]);

  useEffect(() => {
    if (!profile?.id || !isOpen) return;

    const fetchData = async () => {
      try {
        // Fetch shop items
        const { data: shopItems, error: itemsError } = await supabase
          .from('shop_items')
          .select('id, name, description, price, rarity, category, meta_value, image_url')
          .eq('is_active', true);

        if (itemsError) throw itemsError;
        setItems(shopItems || []);

        // Fetch user purchases
        const { data: purchases, error: purchasesError } = await supabase
          .from('user_purchases')
          .select('item_id')
          .eq('user_id', profile.id);

        if (purchasesError) throw purchasesError;
        setOwnedItems(new Set(purchases?.map((p: any) => p.item_id) || []));
      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast.error('Không thể tải dữ liệu cửa hàng');
      }
    };

    fetchData();
  }, [profile?.id, isOpen]);

  // --- DEV ONLY: Chức năng gieo dữ liệu mẫu cho cửa hàng ---
  const handleSeedData = async () => {
    const toastId = toast.loading("Đang gieo dữ liệu mẫu cho cửa hàng...");
    try {
        const sampleItems = [
            // Themes
            { name: 'Xanh Cyan', description: 'Giao diện mặc định', price: 0, rarity: 'common', category: 'theme', meta_value: '#06b6d4', is_active: true },
            { name: 'Đỏ Thẫm', description: 'Giao diện màu đỏ thẫm', price: 100, rarity: 'common', category: 'theme', meta_value: '#dc2626', is_active: true },
            { name: 'Vàng Chanh', description: 'Giao diện màu vàng chanh', price: 100, rarity: 'common', category: 'theme', meta_value: '#f59e0b', is_active: true },
            // Frames
            { name: 'Khung Bạc', description: 'Khung avatar bạc', price: 250, rarity: 'rare', category: 'frame', meta_value: 'silver-frame.png', is_active: true },
            // Bottle Skins
            { name: 'Cyberpunk Neon', description: 'Skin bình nước phong cách Cyberpunk', price: 500, rarity: 'epic', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png', meta_value: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png', is_active: true },
            { name: 'Gấu Trúc', description: 'Skin bình nước hình gấu trúc', price: 300, rarity: 'rare', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png', meta_value: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png', is_active: true },
        ];

        const { error } = await supabase.from('shop_items').insert(sampleItems);

        if (error) throw error;

        toast.success("Gieo dữ liệu thành công! Vui lòng đóng và mở lại cửa hàng.", { id: toastId });
    } catch (error: any) {
        toast.error("Lỗi gieo dữ liệu: " + error.message, { id: toastId });
    }
  };

  const handleBuy = async (item: ShopItem) => {
    if (ownedItems.has(item.id)) return;

    if ((profile?.coins || 0) < item.price) {
      toast.error('Không đủ xu để mua!');
      return;
    }

    setProcessingId(item.id);
    try {
      // BÁO CÁO: Đã thay thế logic trừ tiền Client-side bằng RPC Backend để tránh thất thoát dữ liệu!
      const { data, error } = await supabase.rpc('purchase_item', {
        p_user_id: profile.id,
        p_item_id: item.id,
        p_price: item.price
      });

      if (error) throw error;

      // Update local state
      setOwnedItems(prev => new Set([...prev, item.id]));
      
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
    if (!ownedItems.has(item.id)) return;
    setProcessingId(item.id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ equipped_bottle_id: item.id })
        .eq('id', profile.id);

      if (error) throw error;

      setEquippedBottleId(item.id);
      // Dispatch event to update HomeTab
      window.dispatchEvent(new CustomEvent('bottleEquipped', { detail: { equipped_bottle_id: item.id } }));
      toast.success(`Đã trang bị ${item.name}!`);
    } catch (error) {
      console.error('Equip error:', error);
      toast.error('Trang bị thất bại!');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = items.filter(item => item.category === activeCategory);

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
            <h2 className="text-xl font-black text-white leading-tight">Cửa Hàng Độc Quyền</h2>
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
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {filteredItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                isOwned={ownedItems.has(item.id)}
                isEquipped={equippedBottleId === item.id}
                isProcessing={processingId === item.id}
                onBuy={handleBuy}
                onEquip={handleEquip}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* DEV ONLY: Nút để seed data */}
        {filteredItems.length === 0 && (
          <div className="mt-6 text-center p-4 border border-dashed border-slate-700 rounded-2xl">
            <p className="text-slate-500 text-sm mb-3">Cửa hàng trống trơn. Sếp có muốn gieo dữ liệu mẫu không?</p>
            <button onClick={handleSeedData} className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto">
              <Database size={14} /> Gieo Data Mẫu
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}