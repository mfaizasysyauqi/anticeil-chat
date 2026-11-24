import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Zap,
  Search,
  Check,
  Store,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { shopApi, type ShopItem } from '@/features/shop/api/shop-api';

export interface SelectImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'avatar' | 'banner';
  currentImageUrl?: string | null;
  onSelectImage: (dataUrlOrHttpUrl: string) => void;
  onOpenNectarUpgrade?: () => void;
  onOpenShop?: (category?: string) => void;
}

// Curated high quality animated GIF presets
const CURATED_GIFS = [
  {
    category: 'Cyberpunk & Sci-Fi',
    items: [
      { id: 'cb1', title: 'Cyber Rain City', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
      { id: 'cb2', title: 'Neon Highway', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80' },
      { id: 'cb3', title: 'Glitch Synthwave', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    category: 'Anime & Gaming',
    items: [
      { id: 'an1', title: 'Pixel Lofi Room', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
      { id: 'an2', title: 'Sunset Chill Rooftop', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80' },
      { id: 'an3', title: 'Neon Arcade Player', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    category: 'Memes & Cats',
    items: [
      { id: 'mc1', title: 'Tactical Helmet Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
      { id: 'mc2', title: 'Laser Eyes Vibe', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80' },
      { id: 'mc3', title: 'Coffee Chill Frog', url: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80' },
    ],
  },
];

// Curated 6 slots for recent avatar / banner uploads
const PRESET_RECENT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
];

const PRESET_RECENT_BANNERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
];

export function SelectImageDialog({
  open,
  onOpenChange,
  mode,
  currentImageUrl,
  onSelectImage,
  onOpenNectarUpgrade,
  onOpenShop,
}: SelectImageDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'gif' | 'shop'>('picker');
  const [searchQuery, setSearchQuery] = useState('');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<ShopItem[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(false);

  const isAvatar = mode === 'avatar';
  const shopCategory = isAvatar ? 'animated_avatar' : 'profile_banner';
  const recentPresets = isAvatar ? PRESET_RECENT_AVATARS : PRESET_RECENT_BANNERS;

  useEffect(() => {
    if (!open) return;

    setIsLoadingShop(true);
    Promise.all([
      shopApi.getItems(shopCategory),
      shopApi.getInventory(),
    ])
      .then(([items, inv]) => {
        if (Array.isArray(items)) {
          setShopItems(items);
        }
        if (Array.isArray(inv)) {
          setOwnedItems(inv.filter((i) => i.category === shopCategory));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingShop(false);
      });
  }, [open, shopCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectImage(reader.result);
        onOpenChange(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    onSelectImage(url);
    onOpenChange(false);
  };

  const getItemImageUrl = (item: ShopItem): string => {
    return item.bannerUrl || item.previewIcon || item.gifUrl || '';
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-lg p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {isAvatar ? t('Select Avatar Image') : t('Select Profile Banner')}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {isAvatar
                ? t('Unggah foto, pilih animated GIF, atau gunakan item dari Toko.')
                : t('Unggah banner kustom, pilih animated GIF, atau pilih banner dari Toko.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={() => setActiveTab('picker')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer',
              activeTab === 'picker'
                ? 'border-primary text-foreground bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t('Upload & Presets')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5',
              activeTab === 'gif'
                ? 'border-primary text-foreground bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{t('GIF Gallery')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5',
              activeTab === 'shop'
                ? 'border-primary text-foreground bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('Katalog Toko')}</span>
            {ownedItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-primary/20 text-primary border border-primary/30">
                {ownedItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.gif"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: PICKER */}
          {activeTab === 'picker' && (
            <>
              {/* Action Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Upload Image Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-28 rounded-xl bg-card border border-border/80 hover:border-primary/60 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t('Upload File')}
                  </span>
                </button>

                {/* Choose GIF Card */}
                <button
                  type="button"
                  onClick={() => setActiveTab('gif')}
                  className="h-28 rounded-xl bg-card border border-border/80 hover:border-primary/60 relative flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-xs"
                >
                  <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GIF
                  </span>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t('Pilih GIF')}
                  </span>
                </button>

                {/* Shop Items Card */}
                <button
                  type="button"
                  onClick={() => setActiveTab('shop')}
                  className="h-28 rounded-xl bg-card border border-border/80 hover:border-primary/60 relative flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-xs"
                >
                  <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    SHOP
                  </span>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t('Dari Toko')}
                  </span>
                </button>
              </div>

              {/* Recent Avatars / Banners Section */}
              <div className="space-y-2 pt-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {isAvatar ? t('Recent Avatars') : t('Recent Banners')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isAvatar
                      ? t('Access your 6 most recent avatar uploads.')
                      : t('Access your 6 most recent banner uploads.')}
                  </p>
                </div>

                {/* 6 Preview Slots */}
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {recentPresets.map((url, idx) => {
                    const isCurrent = currentImageUrl === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(url)}
                        className={cn(
                          'relative aspect-square border overflow-hidden transition-all hover:scale-105 cursor-pointer bg-muted/40 shadow-xs',
                          isAvatar ? 'rounded-full' : 'rounded-lg',
                          isCurrent
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'border-border/70 hover:border-border'
                        )}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: GIF GALLERY */}
          {activeTab === 'gif' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Cari GIF anime, lofi, gaming...')}
                  className="w-full h-8 pl-8 pr-3 bg-muted/30 border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Curated Categories */}
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {CURATED_GIFS.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {cat.items
                        .filter(
                          (it) =>
                            !searchQuery ||
                            it.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => handleSelectPreset(it.url)}
                            className={cn(
                              'relative aspect-video rounded-lg overflow-hidden border border-border/70 hover:border-primary hover:scale-105 transition-all cursor-pointer group shadow-xs',
                              isAvatar && 'aspect-square rounded-full'
                            )}
                            title={it.title}
                          >
                            <img
                              src={it.url}
                              alt={it.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white text-center px-1 truncate">
                                {it.title}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHOP COLLECTION (Connected to Database) */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              {/* Owned Items */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('Koleksi Kamu')}
                </h3>
                {ownedItems.length === 0 ? (
                  <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/70 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t('Kamu belum memiliki item ini dari Shop.')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {ownedItems.map((item) => {
                      const imgUrl = getItemImageUrl(item);
                      const isCurrent = currentImageUrl === imgUrl;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectPreset(imgUrl)}
                          className={cn(
                            'p-2 rounded-xl border bg-card hover:bg-muted/50 transition-all text-left flex flex-col gap-1.5 cursor-pointer shadow-xs',
                            isCurrent
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border/70'
                          )}
                        >
                          <div
                            className={cn(
                              'relative overflow-hidden bg-muted/60',
                              isAvatar ? 'aspect-square rounded-full mx-auto w-16' : 'aspect-video rounded-lg w-full'
                            )}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={item.name} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {item.name.slice(0, 2)}
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500 text-white">
                              {t('Dimiliki')}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-foreground truncate w-full">
                            {item.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shop Catalog from Database */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Tersedia di Shop')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenShop) {
                        onOpenShop(shopCategory);
                        onOpenChange(false);
                      }
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Store className="w-3 h-3" />
                    <span>{t('Buka Toko Lengkap')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {shopItems.map((item) => {
                    const imgUrl = getItemImageUrl(item);
                    const isOwned = ownedItems.some((o) => o.id === item.id);
                    const isCurrent = currentImageUrl === imgUrl;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-2.5 rounded-xl border bg-card transition-all flex flex-col justify-between gap-2 shadow-xs',
                          isCurrent ? 'border-primary' : 'border-border/70'
                        )}
                      >
                        <div
                          className={cn(
                            'relative overflow-hidden bg-muted/60',
                            isAvatar ? 'aspect-square rounded-full mx-auto w-16' : 'aspect-video rounded-lg w-full'
                          )}
                        >
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.name} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {item.name.slice(0, 2)}
                            </div>
                          )}

                          {!isOwned && (
                            <span className="absolute top-1 right-1 size-5 rounded-full bg-black/70 flex items-center justify-center text-muted-foreground">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-foreground truncate">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {item.description || item.collection}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {item.priceDew ? `${item.priceDew} Dew` : `Rp ${item.priceIdr?.toLocaleString('id-ID')}`}
                          </span>

                          {isOwned ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectPreset(imgUrl)}
                              className="h-6 text-[10px] px-2 font-bold cursor-pointer"
                            >
                              {t('Gunakan')}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (onOpenShop) {
                                  onOpenShop(shopCategory);
                                  onOpenChange(false);
                                }
                              }}
                              className="h-6 text-[10px] px-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 cursor-pointer"
                            >
                              <ShoppingBag className="w-2.5 h-2.5" />
                              <span>{t('Beli')}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Callout Banner (Nectar CTA) */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/15 via-purple-600/15 to-pink-600/15 border border-primary/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {isAvatar
                  ? t('Animate your avatar with Nectar')
                  : t('Animate your profile banner with Nectar')}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenNectarUpgrade?.();
              }}
              className="h-7 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg shadow-xs cursor-pointer"
            >
              {t('Get Nectar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
