import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  Coins,
  Gem,
  Check,
  Flame,
  ArrowRight,
  X,
  Loader2,
  Plus,
  Trash2,
  Menu,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { TopBarActionButton } from '@/components/ui/top-bar-action-button';
import { EmptyState } from '@/components/ui/empty';
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
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { shopApi, type ShopItem, type ShopCollection, type ShopBalance, FALLBACK_SHOP_ITEMS } from '../api/shop-api';

export interface ShopViewProps {
  currentUser?: any;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  onOpenProfile?: () => void;
  onNavigateSection?: (section: string) => void;
}

export function ShopView({
  currentUser,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  onOpenProfile,
  onNavigateSection,
}: ShopViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle' | 'orbs'>('all');
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
    collection: 'Anticeil Cyber Core',
    category: 'avatar_decoration' as 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle',
    description: '',
    priceIdr: 65000,
    priceOrbs: 500,
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

  // Unified reusable category tabs matching Apps & Colonies pattern
  const CATEGORY_TABS = useMemo(() => [
    { id: 'all', label: t('Semua') },
    { id: 'featured', label: t('Unggulan') },
    { id: 'avatar_decoration', label: t('Dekorasi Avatar') },
    { id: 'profile_effect', label: t('Efek Profil') },
    { id: 'nameplate', label: t('Nameplate') },
    { id: 'bundle', label: t('Bundel') },
    { id: 'orbs', label: t('Orbs Shop') },
  ], [t]);

  // Filtered browse list
  const filteredItems = useMemo(() => {
    let list = [...items];
    if (activeTab === 'orbs') {
      list = list.filter((i) => (i.priceOrbs ?? 0) > 0);
    } else if (activeTab === 'featured') {
      list = list.filter((i) => i.featured);
    } else if (activeTab !== 'all') {
      list = list.filter((i) => i.category === activeTab);
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
  }, [items, activeTab, searchQuery]);

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
          collection: 'Anticeil Cyber Core',
          category: 'avatar_decoration',
          description: '',
          priceIdr: 65000,
          priceOrbs: 500,
          previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
          badge: 'Baru',
          featured: true,
        });
      } else {
        toast.error(res.message || t('Gagal menambahkan produk'));
      }
    } catch {
      toast.error(t('Terjadi kesalahan saat menyimpan produk'));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Delete custom product from database
  const handleDeleteProduct = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      const res = await shopApi.deleteItem(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.info(res.message || t('Item berhasil dihapus dari database Shop'));
      }
    } catch {
      toast.error(t('Gagal menghapus produk'));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── 1. Reusable Top App Bar (h-12) 100% Consistent with Apps & Colonies ── */}
      <div
        className={cn(
          'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
              title={t('Buka Menu Sidebar')}
              aria-label={t('Buka Menu Sidebar')}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Shop')}</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Tab Filter Pills: Matching exact pattern in AppsView & ColoniesView */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none] px-1">
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors shrink-0',
                  active
                    ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Search, Wishlist, Currency Balance, TopBarActionButton */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('Cari di shop...')}
            inputWidth="w-28 sm:w-40 md:w-48"
          />

          {/* Wishlist Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsWishlistDrawerOpen(true)}
            className="relative h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
            title={t('Wishlist Anda')}
          >
            <Heart className={cn('w-4 h-4', wishlist.length > 0 && 'text-pink-500 fill-pink-500')} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Button>

          {/* Currency Pill with quick Top Up */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-7 px-2 rounded-[4px] bg-muted/40 hover:bg-muted border border-border/60 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                title={t('Lihat & Tambah Saldo Orbs')}
              >
                <div className="flex items-center gap-1 text-amber-500">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{(balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
                <span className="text-border text-[10px]">|</span>
                <div className="flex items-center gap-1 text-cyan-500">
                  <Gem className="w-3.5 h-3.5" />
                  <span>{balance?.nectar ?? 0}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground z-[160] p-2 space-y-1 shadow-xl">
              <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground">
                {t('Saldo Dompet Shop')}
              </DropdownMenuLabel>
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

          {/* Reusable TopBarActionButton for adding custom products */}
          <TopBarActionButton
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('Tambah Item')}
            shortLabel={t('Tambah')}
            iconOnlyMobile
            onClick={() => setIsAddProductOpen(true)}
            title={t('Tambah Produk Baru ke Database Shop')}
          />
        </div>
      </div>

      {/* ── 2. Main Scroll Area: 100% Consistent Spacing with Apps & Colonies ── */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto scrollbar-none py-4 sm:py-6 space-y-8', horizontalPadding)}>
        {/* ── Reusable Hero Banner (Matches AppsView YouTube Watch Together layout) ── */}
        {!searchQuery && (activeTab === 'all' || activeTab === 'featured') && heroCollection && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-card to-background border border-primary/20 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-3 h-3" /> {heroCollection.tagline || t('KOLEKSI UNGGULAN')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {heroCollection.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {heroCollection.subtitle}
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setActiveTab('featured')}
              className="font-bold h-10 px-6 gap-2 cursor-pointer z-10 shadow-lg shrink-0"
            >
              <span>{heroCollection.actionLabel || t('Lihat Koleksi')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Subtle radial backdrop */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-primary/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ── Orbs Shop Dedicated Hero Banner ── */}
        {!searchQuery && activeTab === 'orbs' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-card to-background border border-amber-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <Coins className="w-3 h-3" /> {t('ORBS & SALDO POIN')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {t('Tukarkan Orbs dengan Item Eksklusif')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('Dapatkan item kosmetik profil gratis dengan mengumpulkan Orbs komunitas atau klaim saldo harian.')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10 shrink-0">
              <Button
                size="sm"
                onClick={() => handleTopupOrbs(500)}
                className="font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-md"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+500 Orbs Gratis</span>
              </Button>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ── Content by Section: Consistent Header & Cards ── */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 stroke-[1.8] text-primary/80" />}
            title={t('Tidak Ada Item Ditemukan')}
            description={
              searchQuery
                ? `Tidak ada item yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada item yang tersedia di kategori ini.'
            }
            action={
              searchQuery ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="h-8 px-4 text-xs font-semibold cursor-pointer"
                >
                  {t('Reset Pencarian')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3.5">
            {/* Section Header: Matching AppsView Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {activeTab === 'all'
                    ? t('Semua Item Shop')
                    : activeTab === 'featured'
                    ? t('Item Populer & Unggulan')
                    : activeTab === 'orbs'
                    ? t('Item Orbs Shop')
                    : CATEGORY_TABS.find((t) => t.id === activeTab)?.label || t('Katalog Shop')}
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({filteredItems.length})
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Dekorasi avatar, efek kartu profil, dan nameplate eksklusif Anticeil.')}
              </p>
            </div>

            {/* Reusable Cards Grid: Matching ActivityCard Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isOwned = ownedItemIds.has(item.id);
                const isWishlisted = wishlistedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveModalItem(item)}
                    className="rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs group cursor-pointer"
                  >
                    {/* Card Header / Artwork Area */}
                    <div className="h-28 sm:h-32 p-3 relative flex items-center justify-center bg-gradient-to-br from-muted/50 via-card to-background border-b border-border/40 overflow-hidden">
                      {/* Badge on top-left */}
                      {item.badge && (
                        <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
                          {item.badge}
                        </span>
                      )}

                      {/* Wishlist button on top-right */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(e, item)}
                        className="absolute top-2.5 right-2.5 z-10 size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors cursor-pointer shadow-xs"
                        title={isWishlisted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
                      >
                        <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'text-pink-500 fill-pink-500')} />
                      </button>

                      {/* Delete button if custom */}
                      {item.id.startsWith('shop_custom_') && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(e, item.id)}
                          className="absolute bottom-2.5 right-2.5 z-10 size-6 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title={t('Hapus Item ini dari Database Shop')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Preview Avatar Image */}
                      <div className="relative size-16 sm:size-18 rounded-full bg-background border-2 border-border/80 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={item.previewIcon || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-primary block uppercase tracking-wider truncate mb-0.5">
                          {item.collection || 'ANTICEIL NATIVE'}
                        </span>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                            <Coins className="w-3 h-3" />
                            <span>{item.priceOrbs ?? 0} Orbs</span>
                          </div>
                        </div>

                        {isOwned ? (
                          <span className="h-7 px-2.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{t('Dimiliki')}</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalItem(item);
                            }}
                            className="h-7 px-3 text-xs font-semibold cursor-pointer shadow-xs shrink-0"
                          >
                            <span>{t('Buka')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Reusable Secondary Collection Banners ── */}
        {!searchQuery && (activeTab === 'all' || activeTab === 'featured') && collections.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {collections.slice(1).map((col) => (
              <div
                key={col.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group hover:border-primary/50 transition-all"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity pointer-events-none group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${col.bannerUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-transparent pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{col.tagline}</span>
                  <h3 className="text-base font-bold text-foreground uppercase">{col.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{col.subtitle}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                  className="w-fit text-xs font-semibold h-7 px-3 cursor-pointer relative z-10"
                >
                  <span>{col.actionLabel || t('Lihat Koleksi')}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Reusable Dialog: Item Detail & Purchase Modal ── */}
      <Dialog open={Boolean(activeModalItem)} onOpenChange={(open) => !open && setActiveModalItem(null)}>
        {activeModalItem && (
          <DialogContent className="w-[92vw] sm:w-[480px] p-0 overflow-hidden rounded-xl bg-card border border-border shadow-xl z-[150]">
            {/* Header Preview Banner */}
            <div className="relative h-40 bg-muted/60 flex items-center justify-center p-6 border-b border-border overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
                style={{
                  backgroundImage: `url(${activeModalItem.bannerUrl || activeModalItem.previewIcon})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

              {/* Avatar Preview */}
              <div className="relative size-22 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xl z-10">
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
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {activeModalItem.collection || 'ANTICEIL NATIVE'}
                  </span>
                  {activeModalItem.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold uppercase border border-primary/30">
                      {activeModalItem.badge}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-base font-bold text-foreground mt-1">
                  {activeModalItem.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {activeModalItem.description}
                </p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Resmi IDR')}</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">
                    IDR {(activeModalItem?.priceIdr ?? 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Orbs')}</div>
                  <div className="text-xs sm:text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{activeModalItem.priceOrbs ?? 0} Orbs</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                {ownedItemIds.has(activeModalItem.id) ? (
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isEquipping}
                    onClick={() => handleEquip(activeModalItem)}
                    className="w-full h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isEquipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{t('Pasang ke Profil Anda')}</span>
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPurchasing || balance.orbs < activeModalItem.priceOrbs}
                        onClick={() => handlePurchase(activeModalItem, 'orbs')}
                        className="flex-1 h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isPurchasing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5 text-amber-300" />
                            <span>Beli ({activeModalItem.priceOrbs} Orbs)</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPurchasing}
                        onClick={() => handlePurchase(activeModalItem, 'idr')}
                        className="flex-1 h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Beli IDR {(activeModalItem?.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleToggleWishlist(e, activeModalItem)}
                        className="h-9 px-3 cursor-pointer shrink-0"
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
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                        <span>Orbs belum cukup ({balance.orbs} / {activeModalItem.priceOrbs})</span>
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

      {/* ── 4. Reusable Dialog: Wishlist Modal ── */}
      <Dialog open={isWishlistDrawerOpen} onOpenChange={setIsWishlistDrawerOpen}>
        <DialogContent className="w-[92vw] sm:w-[420px] p-0 overflow-hidden rounded-xl bg-card border border-border shadow-xl z-[150]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <DialogTitle className="text-sm font-bold text-foreground">
                {t('Wishlist Shop')} ({wishlist.length})
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
              <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                <Heart className="w-8 h-8 mx-auto opacity-30 text-pink-500" />
                <p>{t('Belum ada item di wishlist Anda.')}</p>
                <p className="text-[11px] text-muted-foreground/70">
                  {t('Klik ikon hati pada item untuk menyimpannya di sini.')}
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
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border hover:border-primary/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.previewIcon} alt={item.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.collection}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}</div>
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

      {/* ── 5. Reusable Dialog: Add Custom Product (Fullstack CRUD) ── */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="w-[92vw] sm:w-[460px] p-5 rounded-xl bg-card border border-border shadow-xl z-[160]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Plus className="w-4 h-4 text-primary" />
              <span>{t('Tambah Produk ke Database Shop')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Nama Produk')}</label>
              <Input
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                placeholder="Contoh: Neon Cyber Shield"
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Kategori')}</label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-muted/40 text-foreground text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="avatar_decoration">Dekorasi Avatar</option>
                  <option value="profile_effect">Efek Profil</option>
                  <option value="nameplate">Nameplate</option>
                  <option value="bundle">Bundel Spesial</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Koleksi Anticeil')}</label>
                <Input
                  value={newProductForm.collection}
                  onChange={(e) => setNewProductForm({ ...newProductForm, collection: e.target.value })}
                  placeholder="Contoh: Anticeil Cyber Core"
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Harga IDR')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceIdr}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceIdr: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Harga Orbs')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceOrbs}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceOrbs: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('URL Ikon / Gambar')}</label>
              <Input
                value={newProductForm.previewIcon}
                onChange={(e) => setNewProductForm({ ...newProductForm, previewIcon: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Deskripsi Singkat')}</label>
              <Input
                value={newProductForm.description}
                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                placeholder="Efek visual neon berkilau untuk kartu profil Anticeil..."
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
                size="sm"
                disabled={isCreatingProduct}
                className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer"
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
