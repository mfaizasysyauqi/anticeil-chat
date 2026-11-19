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
  Plus,
  Trash2,
  Tag,
  RefreshCw,
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

  // Custom product creation modal (Fullstack CRUD)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    collection: 'Komunitas Anticeil',
    category: 'avatar_decoration' as 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle',
    description: '',
    priceIdr: 78000,
    priceOrbs: 600,
    previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    badge: 'Baru',
    featured: true,
  });

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

  // Dynamic collections derived from backend collections and items
  const availableCollections = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => c.name && set.add(c.name));
    items.forEach((i) => i.collection && set.add(i.collection));
    return Array.from(set);
  }, [collections, items]);

  // Dynamic categories
  const categoriesList = useMemo(() => [
    { id: 'all', label: t('Semua Kategori') },
    { id: 'bundle', label: t('Bundel Spesial') },
    { id: 'avatar_decoration', label: t('Dekorasi Avatar') },
    { id: 'profile_effect', label: t('Efek Profil') },
    { id: 'nameplate', label: t('Nameplates') },
  ], [t]);

  // Filtered browse list
  const filteredItems = useMemo(() => {
    let list = [...items];
    if (activeTab === 'orbs') {
      list = list.filter((i) => (i.priceOrbs ?? 0) > 0);
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
          i.name?.toLowerCase().includes(q) ||
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

  // Add custom product to database (Fullstack CRUD)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      toast.error(t('Nama produk tidak boleh kosong'));
      return;
    }
    setIsCreatingProduct(true);
    try {
      const res = await shopApi.createItem(newProductForm);
      if (res.success && res.item) {
        setItems((prev) => [res.item!, ...prev]);
        toast.success(res.message || t('Produk baru berhasil ditambahkan! 🎉'));
        setIsAddProductOpen(false);
        setNewProductForm({
          name: '',
          collection: 'Komunitas Anticeil',
          category: 'avatar_decoration',
          description: '',
          priceIdr: 78000,
          priceOrbs: 600,
          previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
          badge: 'Baru',
          featured: true,
        });
      } else {
        toast.error(res.message || t('Gagal menambahkan produk'));
      }
    } catch {
      toast.error(t('Terjadi kesalahan sistem'));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Delete product from database (Fullstack CRUD)
  const handleDeleteProduct = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!confirm(t('Apakah Anda yakin ingin menghapus produk ini dari Shop?'))) return;
    try {
      const res = await shopApi.deleteItem(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success(res.message || t('Produk berhasil dihapus'));
        if (activeModalItem?.id === itemId) setActiveModalItem(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t('Gagal menghapus produk'));
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background text-foreground select-none overflow-hidden h-full">
      {/* ── 1. Top Header Navigation (Dynamic Theme Compliant) ── */}
      <div className="h-12 border-b border-border bg-card/90 px-4 flex items-center justify-between shrink-0 gap-3 z-20 backdrop-blur-xs">
        {/* Left tabs: Store icon + Featured, Browse, Orbs Shop, Game Shops */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center gap-2 pr-2 border-r border-border shrink-0">
            <div className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
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
                ? 'bg-secondary text-secondary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
                    ? 'bg-secondary text-secondary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span>{t('Browse')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card border-border text-foreground z-[160] shadow-xl">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                {t('Kategori Produk')}
              </DropdownMenuLabel>
              {categoriesList.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => { setActiveTab('browse'); setSelectedCategory(cat.id); }}
                  className={cn(
                    'text-xs cursor-pointer',
                    selectedCategory === cat.id && activeTab === 'browse' && 'font-bold text-primary'
                  )}
                >
                  {cat.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => { setActiveTab('orbs'); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer',
              activeTab === 'orbs'
                ? 'bg-secondary text-secondary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('Orbs Shop')}</span>
          </button>

          {/* Game Shops Dropdown Menu (Fullstack Dynamic from Collections) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer hidden sm:flex',
                  activeTab === 'games'
                    ? 'bg-secondary text-secondary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span>{t('Game Shops')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card border-border text-foreground z-[160] shadow-xl">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                {t('Koleksi Game')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => { setActiveTab('games'); setSelectedCollection('all'); }}
                className={cn('text-xs cursor-pointer', selectedCollection === 'all' && activeTab === 'games' && 'font-bold text-primary')}
              >
                {t('Semua Game Shops')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              {availableCollections.map((colName) => (
                <DropdownMenuItem
                  key={colName}
                  onClick={() => { setActiveTab('games'); setSelectedCollection(colName); }}
                  className={cn('text-xs cursor-pointer', selectedCollection === colName && activeTab === 'games' && 'font-bold text-primary')}
                >
                  {colName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side: Search, Wishlist, Currency Balance, Add Product Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search box */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Shop for items...')}
              className="h-8 pl-8 pr-3 text-xs bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary rounded-lg w-40 lg:w-56 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Add Product Button (Fullstack Dynamic) */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddProductOpen(true)}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-border hover:bg-muted/50 cursor-pointer hidden lg:flex items-center gap-1.5"
            title={t('Tambah Produk Baru ke Database Shop')}
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>{t('Tambah Item')}</span>
          </Button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => setIsWishlistDrawerOpen(true)}
            className="relative size-8 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border flex items-center justify-center transition-colors cursor-pointer"
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
                className="h-8 px-2.5 rounded-lg bg-card hover:bg-muted/50 border border-border flex items-center gap-2 text-xs font-black shadow-2xs cursor-pointer transition-colors"
                title="Lihat & Isi Saldo Orbs"
              >
                <div className="flex items-center gap-1 text-amber-500">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{(balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1 text-cyan-500">
                  <Gem className="w-3.5 h-3.5" />
                  <span>{balance?.nectar ?? 0}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground z-[160] p-2 space-y-1 shadow-xl">
              <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground">{t('Saldo Dompet Shop')}</DropdownMenuLabel>
              <div className="p-2 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-500">🪙 Orbs:</span>
                  <span>{(balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-cyan-500">💎 Nectar:</span>
                  <span>{balance?.nectar ?? 0}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => handleTopupOrbs(500)}
                className="text-xs cursor-pointer text-amber-500 font-bold"
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
        {/* ── Dynamic Hero Banner from Backend heroCollection ── */}
        {activeTab === 'featured' && heroCollection && (
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xl p-6 sm:p-8 min-h-[220px] flex flex-col justify-between group">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none group-hover:scale-102 transition-transform duration-700"
              style={{
                backgroundImage: `url('${heroCollection.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&auto=format&fit=crop&q=80'}')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>{heroCollection.tagline || t('Featured Game Collab')}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight uppercase">
                {heroCollection.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {heroCollection.subtitle}
              </p>
            </div>

            <div className="relative z-10 pt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="teal"
                onClick={() => {
                  setActiveTab('browse');
                  setSelectedCollection(heroCollection.name);
                }}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-md flex items-center gap-2"
              >
                <span>{heroCollection.actionLabel || t('Shop the Collection')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Orbs Shop Hero Banner ── */}
        {activeTab === 'orbs' && (
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-card shadow-xl p-6 sm:p-8 min-h-[190px] flex flex-col justify-between">
            <div className="relative z-10 space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                <Coins className="w-3 h-3" />
                <span>{t('Orbs Shop & Saldo Poin')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">
                {t('TUKARKAN ORBS DENGAN ITEM EKSKLUSIF')}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {t('Kumpulkan Orbs dari partisipasi komunitas atau klaim kuota harian untuk membeli dekorasi avatar dan tema profil tanpa biaya tambahan.')}
              </p>
            </div>

            <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="teal"
                onClick={() => handleTopupOrbs(500)}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-md flex items-center gap-2"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ Klaim 500 Orbs Harian</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleTopupOrbs(1500)}
                className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-md flex items-center gap-2"
              >
                <span>+ Top Up 1.500 Orbs</span>
              </Button>
            </div>
          </div>
        )}

        {/* ── Featured Items Row ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {activeTab === 'featured' ? t('Item Populer & Bundel Terbaru') : t('Daftar Item Shop')}
              </h2>
            </div>
            {activeTab === 'featured' && (
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{t('Lihat Semua')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bar when in Browse / Games */}
          {activeTab !== 'featured' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {categoriesList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer',
                    selectedCategory === c.id
                      ? 'bg-primary/15 border-primary text-primary shadow-xs'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid (Theme Compliant Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(activeTab === 'featured' ? items.filter((i) => i.featured) : filteredItems).map((item) => {
              const isOwned = ownedItemIds.has(item.id);
              const isWishlisted = wishlistedItemIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModalItem(item)}
                  className="group relative rounded-xl border border-border bg-card hover:border-primary/60 transition-all p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xl cursor-pointer"
                >
                  {/* Top Preview Artwork */}
                  <div className="relative w-full aspect-[4/3] rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center p-3 mb-3 border border-border/50 group-hover:scale-[1.02] transition-transform">
                    {/* Badge */}
                    {item.badge && (
                      <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[9px] font-black text-primary uppercase">
                        {item.badge}
                      </span>
                    )}

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="absolute top-2 right-2 z-10 size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors cursor-pointer shadow-xs"
                      title={isWishlisted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
                    >
                      <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'text-pink-500 fill-pink-500')} />
                    </button>

                    {/* Delete item button if custom */}
                    {item.id.startsWith('shop_custom_') && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProduct(e, item.id)}
                        className="absolute bottom-2 right-2 z-10 size-6 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title={t('Hapus Item ini dari Database Shop')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {/* Preview Image / Avatar Mock */}
                    <div className="relative size-20 rounded-full bg-background border-2 border-border flex items-center justify-center overflow-hidden shadow-md">
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
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <span>IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                        {item.discountPercent && (
                          <span className="text-[10px] text-emerald-500 font-extrabold bg-emerald-500/10 px-1 py-0.2 rounded">
                            (-{item.discountPercent}%)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                        <Coins className="w-3 h-3" />
                        <span>{item.priceOrbs ?? 0}</span>
                      </div>
                    </div>

                    {isOwned && (
                      <div className="pt-2">
                        <span className="w-full h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{t('Dimiliki')}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Dynamic Secondary Collections from Backend API ── */}
        {activeTab === 'featured' && collections.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {collections.slice(1).map((col) => (
              <div
                key={col.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-lg relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${col.bannerUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                <div className="space-y-1.5 relative z-10">
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider">{col.tagline}</span>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{col.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{col.subtitle}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('browse');
                    setSelectedCollection(col.name);
                  }}
                  className="w-fit text-xs font-bold rounded-xl h-8 cursor-pointer relative z-10"
                >
                  <span>{col.actionLabel || t('Take me there')}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Discord Item Preview & Purchase Modal (Theme Compliant) ── */}
      <Dialog open={Boolean(activeModalItem)} onOpenChange={(open) => !open && setActiveModalItem(null)}>
        {activeModalItem && (
          <DialogContent className="w-[92vw] sm:w-[480px] p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl z-[150]">
            {/* Header Preview Banner */}
            <div className="relative h-44 bg-muted/60 flex items-center justify-center p-6 border-b border-border overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity"
                style={{
                  backgroundImage: `url(${activeModalItem.bannerUrl || activeModalItem.previewIcon})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

              {/* Avatar Preview with Decoration */}
              <div className="relative size-24 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-2xl z-10">
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
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-black uppercase">
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
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Resmi IDR')}</div>
                  <div className="text-sm font-black text-foreground">
                    IDR {(activeModalItem?.priceIdr ?? 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Orbs / Koin')}</div>
                  <div className="text-sm font-black text-amber-500 flex items-center justify-end gap-1">
                    <Coins className="w-4 h-4" />
                    <span>{activeModalItem.priceOrbs ?? 0} Orbs</span>
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
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
                        <span>Orbs Anda kurang ({balance.orbs} / {activeModalItem.priceOrbs})</span>
                        <button
                          type="button"
                          onClick={() => handleTopupOrbs(500)}
                          className="text-amber-500 hover:underline font-bold cursor-pointer"
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

      {/* ── 4. Wishlist Drawer / Modal (Theme Compliant) ── */}
      <Dialog open={isWishlistDrawerOpen} onOpenChange={setIsWishlistDrawerOpen}>
        <DialogContent className="w-[92vw] sm:w-[420px] p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl z-[150]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <DialogTitle className="text-sm font-bold text-foreground">
                {t('Wishlist Shop Anda')} ({wishlist.length})
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
                <p>{t('Belum ada item di wishlist Anda.')}</p>
                <p className="text-[11px] text-muted-foreground/70">
                  {t('Jelajahi Shop dan klik ikon hati untuk menyimpan item favorit Anda!')}
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border hover:border-primary/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
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
                      <div className="text-[10px] text-amber-500 font-bold">{item.priceOrbs ?? 0} Orbs</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, item)}
                      className="p-1 rounded-md text-pink-500 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title={t('Hapus dari Wishlist')}
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

      {/* ── 5. Add Custom Product Dialog (Fullstack CRUD) ── */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="w-[92vw] sm:w-[480px] p-5 rounded-2xl bg-card border border-border shadow-2xl z-[160]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span>{t('Tambah Produk ke Database Shop')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">{t('Nama Produk')}</label>
              <Input
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                placeholder="Contoh: Cyber Dragon Aura"
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">{t('Kategori')}</label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/40 text-foreground text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="avatar_decoration">Dekorasi Avatar</option>
                  <option value="profile_effect">Efek Profil</option>
                  <option value="nameplate">Nameplate</option>
                  <option value="bundle">Bundel Spesial</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">{t('Koleksi / Game')}</label>
                <Input
                  value={newProductForm.collection}
                  onChange={(e) => setNewProductForm({ ...newProductForm, collection: e.target.value })}
                  placeholder="Contoh: Zenless Zone Zero"
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">{t('Harga IDR')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceIdr}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceIdr: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">{t('Harga Orbs')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceOrbs}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceOrbs: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">{t('URL Gambar / Ikon Avatar')}</label>
              <Input
                value={newProductForm.previewIcon}
                onChange={(e) => setNewProductForm({ ...newProductForm, previewIcon: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">{t('Deskripsi Singkat')}</label>
              <Input
                value={newProductForm.description}
                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                placeholder="Efek visual futuristik untuk kartu profil Anda..."
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddProductOpen(false)}
                className="h-8 text-xs"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                variant="teal"
                size="sm"
                disabled={isCreatingProduct}
                className="h-8 px-4 text-xs font-bold gap-1.5 shadow-md cursor-pointer"
              >
                {isCreatingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{t('Simpan ke Database')}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
