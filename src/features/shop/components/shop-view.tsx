import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Search,
  Heart,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Coins,
  Gem,
  Check,
  Flame,
  ArrowRight,
  X,
  Share2,
  Gift,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { shopApi, type ShopItem, type ShopCollection, type ShopBalance, FALLBACK_SHOP_ITEMS } from '../api/shop-api';

export interface ShopViewProps {
  currentUser?: any;
  onOpenProfile?: () => void;
  onNavigateSection?: (section: string) => void;
}

export function ShopView({
  currentUser,
  onOpenProfile,
  onNavigateSection,
}: ShopViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'featured' | 'browse' | 'orbs' | 'games'>('featured');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Backend data states with resilient fallbacks
  const [items, setItems] = useState<ShopItem[]>(FALLBACK_SHOP_ITEMS);
  const [collections, setCollections] = useState<ShopCollection[]>([]);
  const [heroCollection, setHeroCollection] = useState<ShopCollection | null>(null);
  const [balance, setBalance] = useState<ShopBalance>({ orbs: 1500, nectar: 250, currencyCode: 'IDR' });
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [wishlist, setWishlist] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected item modal preview & purchase
  const [activeModalItem, setActiveModalItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);

  // Load Shop data from fullstack backend
  const fetchShopData = async () => {
    setIsLoading(true);
    try {
      const [allItems, featuredRes, userBal, userInv, userWish] = await Promise.all([
        shopApi.getItems(),
        shopApi.getFeatured(),
        shopApi.getBalance(),
        shopApi.getInventory(),
        shopApi.getWishlist(),
      ]);
      if (Array.isArray(allItems) && allItems.length > 0) {
        setItems(allItems);
      }
      if (featuredRes && featuredRes.heroCollection) {
        setHeroCollection(featuredRes.heroCollection);
        setCollections(featuredRes.collections || []);
      }
      if (userBal && typeof userBal.orbs === 'number') {
        setBalance(userBal);
      }
      if (Array.isArray(userInv)) {
        setInventory(userInv);
      }
      if (Array.isArray(userWish)) {
        setWishlist(userWish);
      }
    } catch (err) {
      console.warn('Failed to fetch shop data from API', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const ownedItemIds = useMemo(() => new Set(inventory.map((i) => i.id)), [inventory]);
  const wishlistedItemIds = useMemo(() => new Set(wishlist.map((i) => i.id)), [wishlist]);

  // Filtered browse list
  const filteredItems = useMemo(() => {
    let list = [...items];
    if (activeTab === 'orbs') {
      list = list.filter((i) => i.priceOrbs > 0);
    }
    if (activeTab === 'games' && selectedCollection === 'all') {
      list = list.filter((i) => Boolean(i.collection));
    }
    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    if (selectedCollection !== 'all') {
      list = list.filter((i) => i.collection?.toLowerCase() === selectedCollection.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.collection?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeTab, selectedCategory, selectedCollection, searchQuery]);

  // Top Up / Klaim Orbs Poin
  const handleTopupOrbs = async (amount: number = 500) => {
    try {
      const res = await shopApi.topupOrbs(amount);
      if (res.success && res.balance) {
        setBalance(res.balance);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menambahkan Orbs');
    }
  };

  // Wishlist toggle action
  const handleToggleWishlist = async (e: React.MouseEvent, item: ShopItem) => {
    e.stopPropagation();
    try {
      const res = await shopApi.toggleWishlist(item.id);
      if (res.success) {
        if (res.isWishlisted) {
          setWishlist((prev) => [...prev.filter((i) => i.id !== item.id), item]);
          toast.success(t('Item ditambahkan ke Wishlist! ❤️'));
        } else {
          setWishlist((prev) => prev.filter((i) => i.id !== item.id));
          toast.info(t('Item dihapus dari Wishlist.'));
        }
      }
    } catch {
      toast.error(t('Gagal mengubah wishlist'));
    }
  };

  // Purchase item action
  const handlePurchase = async (item: ShopItem, currency: 'orbs' | 'idr') => {
    setIsPurchasing(true);
    try {
      const res = await shopApi.purchaseItem(item.id, currency);
      if (res.success) {
        toast.success(res.message || t('Pembelian berhasil! 🎉'));
        if (res.item) {
          setInventory((prev) => [...prev.filter((i) => i.id !== res.item!.id), res.item!]);
        }
        if (res.newBalance) {
          setBalance(res.newBalance);
        }
        setActiveModalItem(null);
      } else {
        toast.error(res.message || t('Gagal melakukan pembelian'));
      }
    } catch {
      toast.error(t('Terjadi kesalahan saat memproses pembelian'));
    } finally {
      setIsPurchasing(false);
    }
  };

  // Equip item to user profile
  const handleEquip = async (item: ShopItem) => {
    setIsEquipping(true);
    try {
      const slot =
        item.category === 'avatar_decoration'
          ? 'avatarDecoration'
          : item.category === 'profile_effect'
          ? 'profileEffect'
          : item.category === 'nameplate'
          ? 'nameplate'
          : 'profileTheme';
      const res = await shopApi.equipItem(item.id, slot);
      if (res.success) {
        toast.success(t('Item berhasil dipasang ke profil Anda! ✨'));
        setActiveModalItem(null);
      } else {
        toast.error(t('Gagal memasang item'));
      }
    } catch {
      toast.error(t('Gagal memasang item'));
    } finally {
      setIsEquipping(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#111214] text-foreground select-none overflow-hidden h-full">
      {/* ── 1. Discord Top Header Navigation ── */}
      <div className="h-12 border-b border-border/60 bg-[#1e1f22] px-4 flex items-center justify-between shrink-0 gap-3 z-20">
        {/* Left tabs: Store icon + Featured, Browse, Orbs Shop, Game Shops */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center gap-2 pr-2 border-r border-border/40 shrink-0">
            <div className="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight text-foreground hidden md:inline">Shop</span>
          </div>

          <button
            type="button"
            onClick={() => { setActiveTab('featured'); setSelectedCategory('all'); setSelectedCollection('all'); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'featured'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            )}
          >
            {t('Featured')}
          </button>

          {/* Browse Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer',
                  activeTab === 'browse'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                )}
              >
                <span>{t('Browse')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#1e1f22] border-border/70 text-foreground z-[160]">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Kategori</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => { setActiveTab('browse'); setSelectedCategory('all'); }}
                className="text-xs cursor-pointer"
              >
                Semua Item
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('browse'); setSelectedCategory('bundle'); }}
                className="text-xs cursor-pointer"
              >
                Bundel Spesial
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('browse'); setSelectedCategory('avatar_decoration'); }}
                className="text-xs cursor-pointer"
              >
                Dekorasi Avatar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('browse'); setSelectedCategory('profile_effect'); }}
                className="text-xs cursor-pointer"
              >
                Efek Profil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('browse'); setSelectedCategory('nameplate'); }}
                className="text-xs cursor-pointer"
              >
                Nameplates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => { setActiveTab('orbs'); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer',
              activeTab === 'orbs'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            )}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('Orbs Shop')}</span>
          </button>

          {/* Game Shops Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer hidden sm:flex',
                  activeTab === 'games'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                )}
              >
                <span>{t('Game Shops')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-[#1e1f22] border-border/70 text-foreground z-[160]">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Koleksi Game</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => { setActiveTab('games'); setSelectedCollection('all'); }}
                className="text-xs cursor-pointer"
              >
                Semua Game Shops
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={() => { setActiveTab('games'); setSelectedCollection('Zenless Zone Zero'); }}
                className="text-xs cursor-pointer"
              >
                Zenless Zone Zero
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('games'); setSelectedCollection('Deadpool & Wolverine'); }}
                className="text-xs cursor-pointer"
              >
                Deadpool & Wolverine
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('games'); setSelectedCollection('Dead by Daylight'); }}
                className="text-xs cursor-pointer"
              >
                Dead by Daylight
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side: Search, Wishlist, Currency Balance */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search box */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Shop for items...')}
              className="h-8 pl-8 pr-3 text-xs bg-[#111214] border-border/50 focus-visible:ring-1 focus-visible:ring-primary rounded-lg w-40 lg:w-56"
            />
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => setIsWishlistDrawerOpen(true)}
            className="relative size-8 rounded-lg bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 flex items-center justify-center transition-colors cursor-pointer"
            title={t('Wishlist Anda')}
          >
            <Heart className={cn('w-4 h-4', wishlist.length > 0 && 'text-pink-500 fill-pink-500')} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Currency Pill with quick Top Up */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 px-2.5 rounded-lg bg-[#111214] hover:bg-[#18191c] border border-border/60 flex items-center gap-2 text-xs font-black shadow-xs cursor-pointer transition-colors"
                title="Lihat & Isi Saldo Orbs"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{(balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1 text-cyan-400">
                  <Gem className="w-3.5 h-3.5" />
                  <span>{balance?.nectar ?? 0}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1e1f22] border-border/70 text-foreground z-[160] p-2 space-y-1">
              <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground">Saldo Dompet Shop</DropdownMenuLabel>
              <div className="p-2 rounded-lg bg-[#111214] border border-border/40 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-400">🪙 Orbs:</span>
                  <span>{(balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-cyan-400">💎 Nectar:</span>
                  <span>{balance?.nectar ?? 0}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={() => handleTopupOrbs(500)}
                className="text-xs cursor-pointer text-amber-400 font-bold"
              >
                + Klaim 500 Orbs Gratis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleTopupOrbs(1500)}
                className="text-xs cursor-pointer font-semibold"
              >
                + Top Up 1.500 Orbs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 2. Main Scrollable Shop Catalog ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 [scrollbar-width:thin]">
        {/* ── Hero Banner (Zenless Zone Zero) ── */}
        {activeTab === 'featured' && (
          <div className="relative rounded-2xl overflow-hidden border border-border/70 bg-gradient-to-r from-neutral-900 via-zinc-900 to-black shadow-2xl p-6 sm:p-8 min-h-[220px] flex flex-col justify-between">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&auto=format&fit=crop&q=80')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Featured Game Collab</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                ZENLESS ZONE ZERO
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Welcome to New Eridu! Dapatkan bundel agen resmi Section 6, dekorasi avatar Bangboo Eous, dan efek profil Hoshimi Miyabi.
              </p>
            </div>

            <div className="relative z-10 pt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="teal"
                onClick={() => {
                  setActiveTab('browse');
                  setSelectedCollection('Zenless Zone Zero');
                }}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>Shop the Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Orbs Shop Hero Banner ── */}
        {activeTab === 'orbs' && (
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-black shadow-2xl p-6 sm:p-8 min-h-[190px] flex flex-col justify-between">
            <div className="relative z-10 space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                <Coins className="w-3 h-3" />
                <span>Orbs Shop & Saldo Poin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                TUKARKAN ORBS DENGAN ITEM EKSKLUSIF
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Kumpulkan Orbs dari partisipasi komunitas atau klaim kuota harian untuk membeli dekorasi avatar dan tema profil tanpa biaya tambahan.
              </p>
            </div>

            <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="teal"
                onClick={() => handleTopupOrbs(500)}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ Klaim 500 Orbs Harian</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleTopupOrbs(1500)}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>+ Top Up 1.500 Orbs</span>
              </Button>
            </div>
          </div>
        )}

        {/* ── Featured Items Row (Discord Style Cards) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {activeTab === 'featured' ? 'Item Populer & Bundel Terbaru' : 'Daftar Item Shop'}
              </h2>
            </div>
            {activeTab === 'featured' && (
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bar when in Browse / Games */}
          {activeTab !== 'featured' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'bundle', label: 'Bundel' },
                { id: 'avatar_decoration', label: 'Dekorasi Avatar' },
                { id: 'profile_effect', label: 'Efek Profil' },
                { id: 'nameplate', label: 'Nameplate' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer',
                    selectedCategory === c.id
                      ? 'bg-primary/20 border-primary text-primary shadow-xs'
                      : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(activeTab === 'featured' ? items.filter((i) => i.featured) : filteredItems).map((item) => {
              const isOwned = ownedItemIds.has(item.id);
              const isWishlisted = wishlistedItemIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModalItem(item)}
                  className="group relative rounded-xl border border-border/70 bg-[#1e1f22] hover:border-primary/60 transition-all p-3.5 flex flex-col justify-between shadow-xs hover:shadow-xl cursor-pointer"
                >
                  {/* Top Preview Artwork */}
                  <div className="relative w-full aspect-[4/3] rounded-lg bg-[#2b2d31] overflow-hidden flex items-center justify-center p-3 mb-3 border border-border/40 group-hover:scale-[1.02] transition-transform">
                    {/* Badge */}
                    {item.badge && (
                      <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[9px] font-black text-primary uppercase">
                        {item.badge}
                      </span>
                    )}

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="absolute top-2 right-2 z-10 size-7 rounded-md bg-black/50 hover:bg-black/80 flex items-center justify-center text-muted-foreground hover:text-pink-400 transition-colors cursor-pointer"
                      title={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
                    >
                      <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'text-pink-500 fill-pink-500')} />
                    </button>

                    {/* Preview Image / Avatar Mock */}
                    <div className="relative size-20 rounded-full bg-[#18191c] border-2 border-border flex items-center justify-center overflow-hidden shadow-md">
                      <img
                        src={item.previewIcon || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Metadata & Price */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                      {item.collection}
                    </div>
                    <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                        {item.discountPercent && (
                          <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1 py-0.2 rounded">
                            (-{item.discountPercent}%)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Coins className="w-3 h-3" />
                        <span>{item.priceOrbs}</span>
                      </div>
                    </div>

                    {isOwned && (
                      <div className="pt-2">
                        <span className="w-full h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Dimiliki</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Secondary Collections (Deadpool & Wolverine + Dead by Daylight) ── */}
        {activeTab === 'featured' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Marvel Collab */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-red-950/40 via-neutral-900 to-black p-5 flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Marvel Exclusive</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  DEADPOOL & WOLVERINE
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Dapatkan set katana kembar Wade Wilson dan cakar adamantium Wolverine.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveTab('browse');
                  setSelectedCollection('Deadpool & Wolverine');
                }}
                className="w-fit text-xs font-bold rounded-xl h-8 cursor-pointer relative z-10"
              >
                <span>Take me there</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            {/* Dead by Daylight Collab */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-black p-5 flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Horror Slasher</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  DEAD BY DAYLIGHT
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Topeng The Trapper dan aura kabut The Entity untuk mempertegas identitas profil Anda.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveTab('browse');
                  setSelectedCollection('Dead by Daylight');
                }}
                className="w-fit text-xs font-bold rounded-xl h-8 cursor-pointer relative z-10"
              >
                <span>Take me there</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Discord Item Preview & Purchase Modal ── */}
      <Dialog open={Boolean(activeModalItem)} onOpenChange={(open) => !open && setActiveModalItem(null)}>
        {activeModalItem && (
          <DialogContent className="w-[92vw] sm:w-[480px] p-0 overflow-hidden rounded-2xl bg-[#1e1f22] border border-border/80 shadow-2xl z-[150]">
            {/* Header Preview Banner */}
            <div className="relative h-44 bg-gradient-to-b from-[#2b2d31] to-[#18191c] flex items-center justify-center p-6 border-b border-border/40 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                style={{
                  backgroundImage: `url(${activeModalItem.bannerUrl || activeModalItem.previewIcon})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f22] via-transparent to-transparent" />

              {/* Avatar Preview with Decoration */}
              <div className="relative size-24 rounded-full bg-[#18191c] border-2 border-primary flex items-center justify-center shadow-2xl z-10">
                <img
                  src={activeModalItem.previewIcon || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'}
                  alt={activeModalItem.name}
                  className="size-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {activeModalItem.collection}
                  </span>
                  {activeModalItem.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase">
                      {activeModalItem.badge}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-lg font-black text-foreground mt-1">
                  {activeModalItem.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {activeModalItem.description}
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#111214] border border-border/60">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold">Harga Resmi IDR</div>
                  <div className="text-sm font-black text-foreground">
                    IDR {(activeModalItem?.priceIdr ?? 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold">Harga Orbs / Koin</div>
                  <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                    <Coins className="w-4 h-4" />
                    <span>{activeModalItem.priceOrbs} Orbs</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {ownedItemIds.has(activeModalItem.id) ? (
                  <Button
                    size="sm"
                    variant="teal"
                    disabled={isEquipping}
                    onClick={() => handleEquip(activeModalItem)}
                    className="w-full h-10 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isEquipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{t('Pasang ke Profil')}</span>
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="teal"
                        disabled={isPurchasing || balance.orbs < activeModalItem.priceOrbs}
                        onClick={() => handlePurchase(activeModalItem, 'orbs')}
                        className="flex-1 h-10 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isPurchasing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            <span>Beli {activeModalItem.priceOrbs} Orbs</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPurchasing}
                        onClick={() => handlePurchase(activeModalItem, 'idr')}
                        className="flex-1 h-10 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Beli IDR {(activeModalItem?.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleToggleWishlist(e, activeModalItem)}
                        className="h-10 px-3 rounded-xl cursor-pointer"
                        title="Wishlist"
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4',
                            wishlistedItemIds.has(activeModalItem.id) && 'text-pink-500 fill-pink-500'
                          )}
                        />
                      </Button>
                    </div>

                    {balance.orbs < activeModalItem.priceOrbs && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-[#111214] p-2.5 rounded-lg border border-border/40">
                        <span>Orbs Anda kurang ({balance.orbs} / {activeModalItem.priceOrbs})</span>
                        <button
                          type="button"
                          onClick={() => handleTopupOrbs(500)}
                          className="text-amber-400 hover:underline font-bold cursor-pointer"
                        >
                          + Klaim 500 Orbs
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── 4. Wishlist Drawer / Modal ── */}
      <Dialog open={isWishlistDrawerOpen} onOpenChange={setIsWishlistDrawerOpen}>
        <DialogContent className="w-[92vw] sm:w-[420px] p-0 overflow-hidden rounded-2xl bg-[#1e1f22] border border-border/80 shadow-2xl z-[150]">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <DialogTitle className="text-sm font-bold text-foreground">
                Wishlist Shop Anda ({wishlist.length})
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => setIsWishlistDrawerOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto p-3 space-y-2 [scrollbar-width:thin]">
            {wishlist.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Heart className="w-8 h-8 mx-auto opacity-30 text-pink-500" />
                <p>Belum ada item di wishlist Anda.</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Jelajahi Shop dan klik ikon hati untuk menyimpan item favorit Anda!
                </p>
              </div>
            ) : (
              wishlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsWishlistDrawerOpen(false);
                    setActiveModalItem(item);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#111214] border border-border/60 hover:border-primary/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-10 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.previewIcon} alt={item.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.collection}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground">IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}</div>
                      <div className="text-[10px] text-amber-400 font-bold">{item.priceOrbs ?? 0} Orbs</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="p-1 rounded-md text-pink-500 hover:text-muted-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      title="Hapus dari Wishlist"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
