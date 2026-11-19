import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Store,
  Coins,
  Gem,
  Droplets,
  Check,
  Flame,
  ArrowRight,
  X,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Menu,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { TopBarActionButton } from '@/components/ui/top-bar-action-button';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { EmptyState } from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Discord-style 1:1 Filter Definitions
export const ITEM_TYPE_OPTIONS = [
  { id: 'avatar_decoration', label: 'Avatar Decorations' },
  { id: 'nameplate', label: 'Nameplates' },
  { id: 'profile_effect', label: 'Profile Effects' },
  { id: 'bundle', label: 'Bundles' },
];

export const COLOR_OPTIONS = [
  { id: 'purple', label: 'Purple', hex: '#8b5cf6', keywords: ['purple', 'violet', 'magenta', 'indigo', 'ungu'] },
  { id: 'blue', label: 'Blue', hex: '#3b82f6', keywords: ['blue', 'cyan', 'azure', 'biru', 'sian', 'neon', 'aurora'] },
  { id: 'green', label: 'Green', hex: '#22c55e', keywords: ['green', 'emerald', 'mint', 'hijau', 'zamrud', 'forest'] },
  { id: 'brown', label: 'Brown', hex: '#92400e', keywords: ['brown', 'amber', 'bronze', 'cokelat', 'wood'] },
  { id: 'yellow', label: 'Yellow', hex: '#eab308', keywords: ['yellow', 'gold', 'kuning', 'emas', 'sun', 'starlight'] },
  { id: 'orange', label: 'Orange', hex: '#f97316', keywords: ['orange', 'sunset', 'oranye', 'fire', 'api'] },
  { id: 'red', label: 'Red', hex: '#ef4444', keywords: ['red', 'crimson', 'ruby', 'merah', 'blood', 'rose'] },
  { id: 'pink', label: 'Pink', hex: '#ec4899', keywords: ['pink', 'sakura', 'merah muda', 'blush', 'cozy'] },
  { id: 'white', label: 'White', hex: '#f8fafc', keywords: ['white', 'putih', 'silver', 'pearl', 'clear', 'light'] },
  { id: 'dark', label: 'Dark / Black', hex: '#18181b', keywords: ['dark', 'black', 'obsidian', 'void', 'gelap', 'hitam', 'shadow', 'matrix', 'cyber'] },
];

export const THEME_OPTIONS = [
  { id: 'anime', label: 'Anime', icon: '🌸', keywords: ['anime', 'sakura', 'zen', 'manga', 'miyabi', 'kawaii'] },
  { id: 'gaming', label: 'Gaming', icon: '🎮', keywords: ['gaming', 'game', 'arcade', 'pixel', 'retro', '8bit'] },
  { id: 'cute_cozy', label: 'Cute & Cozy', icon: '☕', keywords: ['cute', 'cozy', 'sweet', 'warm', 'pastel'] },
  { id: 'sci_fi', label: 'Sci-Fi', icon: '🪐', keywords: ['sci-fi', 'cyber', 'void', 'matrix', 'neon', 'core', 'future'] },
  { id: 'food_drinks', label: 'Food & Drinks', icon: '🍔', keywords: ['food', 'drink', 'tea', 'boba', 'coffee'] },
  { id: 'fantasy', label: 'Fantasy', icon: '🧙', keywords: ['fantasy', 'magic', 'celestial', 'crown', 'astral', 'myth'] },
  { id: 'animals_pets', label: 'Animals & Pets', icon: '🐾', keywords: ['animal', 'pet', 'cat', 'dog', 'fox', 'bunny', 'bear'] },
  { id: 'nature', label: 'Nature', icon: '🍃', keywords: ['nature', 'forest', 'aurora', 'borealis', 'sakura', 'leaf', 'alam'] },
  { id: 'movies_tv', label: 'Movies & TV', icon: '🎬', keywords: ['movie', 'tv', 'cinema', 'show', 'film'] },
  { id: 'dark_moody', label: 'Dark & Moody', icon: '🥀', keywords: ['dark', 'moody', 'void', 'obsidian', 'night', 'shadow', 'gothic'] },
];

// Discord-style App Shops dropdown items (Anticeil Native Ecosystem)
export const APP_SHOPS_ITEMS = [
  { id: 'app_watch_together', name: 'YouTube Watch Together', icon: '🎬', tag: 'Video', query: 'watch together' },
  { id: 'app_jamspace', name: 'Jamspace Whiteboard', icon: '🎨', tag: 'Board', query: 'whiteboard' },
  { id: 'app_chess', name: 'Anticeil Chess', icon: '♟️', tag: 'Game', query: 'chess' },
  { id: 'app_wordle', name: 'Wordle Daily Party', icon: '🔤', tag: 'Game', query: 'wordle' },
  { id: 'app_trivia', name: 'Cyber Trivia Battle', icon: '🧠', tag: 'Game', query: 'trivia' },
  { id: 'app_cyber_core', name: 'Anticeil Cyber Core', icon: '🪐', tag: 'Official', query: 'cyber' },
];

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
  const [activeTab, setActiveTab] = useState<'featured' | 'browse' | 'dew' | 'app_shops' | 'all'>('featured');
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [isAppShopsOpen, setIsAppShopsOpen] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Backend data states with resilient fallbacks
  const [items, setItems] = useState<ShopItem[]>([]);
  const [collections, setCollections] = useState<ShopCollection[]>([]);
  const [heroCollection, setHeroCollection] = useState<ShopCollection | null>(null);
  const [balance, setBalance] = useState<ShopBalance>({ dew: 1500, currencyCode: 'IDR' });
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [wishlist, setWishlist] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected item modal preview & purchase
  const [activeModalItem, setActiveModalItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);

  // Custom product creation & editing modal (Fullstack CRUD)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopItem | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    collection: 'Anticeil Cyber Core',
    category: 'avatar_decoration' as ShopItem['category'],
    description: '',
    priceIdr: 65000,
    priceDew: 500,
    previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    badge: 'Baru',
    featured: true,
  });

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setNewProductForm({
      name: '',
      collection: 'Anticeil Cyber Core',
      category: 'avatar_decoration',
      description: '',
      priceIdr: 65000,
      priceDew: 500,
      previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
      badge: 'Baru',
      featured: true,
    });
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (item: ShopItem) => {
    setEditingProduct(item);
    setNewProductForm({
      name: item.name,
      collection: item.collection,
      category: item.category,
      description: item.description,
      priceIdr: item.priceIdr || 65000,
      priceDew: item.priceDew || item.priceOrbs || 500,
      previewIcon: item.previewIcon || item.gifUrl || '',
      badge: item.badge || 'Baru',
      featured: Boolean(item.featured),
    });
    setIsAddProductOpen(true);
  };

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
      if (Array.isArray(allItems)) {
        setItems(allItems);
      }
      if (featuredRes && featuredRes.heroCollection) {
        setHeroCollection(featuredRes.heroCollection);
        setCollections(featuredRes.collections || []);
      }
      if (userBal && (typeof userBal.dew === 'number' || typeof userBal.orbs === 'number')) {
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
    const handleBalanceChanged = (e: any) => {
      if (e.detail) {
        setBalance(e.detail);
      } else {
        shopApi.getBalance().then((b) => b && setBalance(b));
      }
    };
    window.addEventListener('anticeil_balance_changed', handleBalanceChanged);
    return () => window.removeEventListener('anticeil_balance_changed', handleBalanceChanged);
  }, []);

  const ownedItemIds = useMemo(() => new Set(inventory.map((i) => i.id)), [inventory]);
  const wishlistedItemIds = useMemo(() => new Set(wishlist.map((i) => i.id)), [wishlist]);

  // Unified reusable category tabs matching Apps & Colonies pattern
  const CATEGORY_TABS = useMemo(() => [
    { id: 'all', label: t('Semua') },
    { id: 'featured', label: t('Unggulan') },
    { id: 'avatar_decoration', label: t('Bingkai Profil') },
    { id: 'profile_effect', label: t('Overlay Profil') },
    { id: 'nameplate', label: t('Namecard') },
    { id: 'bundle', label: t('Bundel Animasi') },
    { id: 'dew', label: t('Dew Shop') },
  ], [t]);

  // Discord-grade Right Filter Sidebar States
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name_asc'>('recent');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showOnlyDew, setShowOnlyDew] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [showOnlyDiscount, setShowOnlyDiscount] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((t) => t !== themeId) : [...prev, themeId]
    );
  };

  const toggleColor = (colorId: string) => {
    setSelectedColor((prev) => (prev === colorId ? null : colorId));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += selectedTypes.length;
    if (showOnlyDew) count += 1;
    if (showOnlyFeatured) count += 1;
    if (showOnlyDiscount) count += 1;
    if (selectedColor) count += 1;
    count += selectedThemes.length;
    return count;
  }, [selectedTypes, showOnlyDew, showOnlyFeatured, showOnlyDiscount, selectedColor, selectedThemes]);

  const handleResetFilters = () => {
    setSelectedTypes([]);
    setShowOnlyDew(false);
    setShowOnlyFeatured(false);
    setShowOnlyDiscount(false);
    setSelectedColor(null);
    setSelectedThemes([]);
  };

  // Filtered and sorted browse list
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Discord Top App Bar Navigation Filtering
    if (activeTab === 'dew') {
      list = list.filter((i) => (i.priceDew ?? i.priceOrbs ?? 0) > 0);
    } else if (activeTab === 'featured') {
      list = list.filter((i) => i.featured);
    } else if (activeTab === 'app_shops' && selectedApp) {
      const q = selectedApp.toLowerCase();
      list = list.filter(
        (i) =>
          i.collection?.toLowerCase().includes(q) ||
          i.name?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'browse' && browseCategory && browseCategory !== 'all') {
      if (browseCategory === 'collabs') {
        list = list.filter((i) => i.featured || i.collection?.toLowerCase().includes('anticeil'));
      } else {
        list = list.filter((i) => i.category === browseCategory);
      }
    }

    // Right Filter: Item Types (Multi-select)
    if (selectedTypes.length > 0) {
      list = list.filter((i) => selectedTypes.includes(i.category));
    }

    // Right Filter: Show Only
    if (showOnlyDew) {
      list = list.filter((i) => (i.priceDew ?? i.priceOrbs ?? 0) > 0);
    }
    if (showOnlyFeatured) {
      list = list.filter((i) => Boolean(i.featured));
    }
    if (showOnlyDiscount) {
      list = list.filter((i) =>
        Boolean(
          (i.discountPercent && i.discountPercent > 0) ||
            i.badge?.toLowerCase().includes('diskon') ||
            i.badge?.toLowerCase().includes('promo')
        )
      );
    }

    // Right Filter: Color
    if (selectedColor) {
      const colorOpt = COLOR_OPTIONS.find((c) => c.id === selectedColor);
      if (colorOpt) {
        list = list.filter((i) => {
          const text = `${i.name} ${i.description} ${i.collection} ${i.badge || ''}`.toLowerCase();
          return colorOpt.keywords.some((kw) => text.includes(kw));
        });
      }
    }

    // Right Filter: Theme (Multi-select)
    if (selectedThemes.length > 0) {
      list = list.filter((i) => {
        const text = `${i.name} ${i.description} ${i.collection} ${i.badge || ''}`.toLowerCase();
        return selectedThemes.some((themeId) => {
          const themeOpt = THEME_OPTIONS.find((t) => t.id === themeId);
          return themeOpt ? themeOpt.keywords.some((kw) => text.includes(kw)) : false;
        });
      });
    }

    // Global Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.collection?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.priceIdr || 0) - (b.priceIdr || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.priceIdr || 0) - (a.priceIdr || 0));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [
    items,
    activeTab,
    browseCategory,
    selectedApp,
    selectedTypes,
    showOnlyDew,
    showOnlyFeatured,
    showOnlyDiscount,
    selectedColor,
    selectedThemes,
    searchQuery,
    sortBy,
  ]);

  // Top Up / Klaim Dew Poin
  const handleTopupDew = async (amount: number = 500) => {
    try {
      const res = await shopApi.topupDew(amount);
      if (res.success && res.balance) {
        setBalance(res.balance);
        window.dispatchEvent(new CustomEvent('anticeil_balance_changed', { detail: res.balance }));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menambahkan Dew');
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
  const handlePurchase = async (item: ShopItem, currency: 'dew' | 'idr') => {
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
          window.dispatchEvent(new CustomEvent('anticeil_balance_changed', { detail: res.newBalance }));
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

  // Save product to database (Create or Update Fullstack CRUD)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      toast.error(t('Nama produk tidak boleh kosong'));
      return;
    }
    setIsCreatingProduct(true);
    try {
      if (editingProduct) {
        const res = await shopApi.updateItem(editingProduct.id, newProductForm);
        if (res.success && res.item) {
          setItems((prev) => prev.map((i) => (i.id === editingProduct.id ? res.item! : i)));
          toast.success(res.message || t('Produk berhasil diperbarui! ✨'));
          setIsAddProductOpen(false);
          setEditingProduct(null);
          if (activeModalItem?.id === editingProduct.id) {
            setActiveModalItem(res.item);
          }
        } else {
          toast.error(res.message || t('Gagal memperbarui produk'));
        }
      } else {
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
            priceDew: 500,
            previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
            badge: 'Baru',
            featured: true,
          });
        } else {
          toast.error(res.message || t('Gagal menambahkan produk'));
        }
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

  // Discord-style 1:1 Right Filter Panel Renderer
  const renderFilterContent = () => {
    return (
      <div className="space-y-6">
        {/* Header with Active Count & Reset */}
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>{t('Filter')}</span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold text-primary">({activeFilterCount})</span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('Reset')}</span>
            </button>
          )}
        </div>

        {/* 1. Item Type */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Item Type')}
          </h4>
          <div className="space-y-1.5">
            {ITEM_TYPE_OPTIONS.map((opt) => {
              const isSelected = selectedTypes.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleType(opt.id)}
                  className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
                >
                  <div
                    className={cn(
                      'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Show Only */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Show Only')}
          </h4>
          <div className="space-y-1.5">
            {/* Dew Eligible */}
            <button
              type="button"
              onClick={() => setShowOnlyDew(!showOnlyDew)}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
            >
              <div
                className={cn(
                  'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                  showOnlyDew
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                )}
              >
                {showOnlyDew && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate flex items-center gap-1.5">
                <span>{t('Dew Eligible')}</span>
                <span className="text-[11px]">💧</span>
              </span>
            </button>

            {/* Featured / Collabs */}
            <button
              type="button"
              onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
            >
              <div
                className={cn(
                  'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                  showOnlyFeatured
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                )}
              >
                {showOnlyFeatured && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate">{t('Featured / Unggulan')}</span>
            </button>

            {/* Discount / Promo */}
            <button
              type="button"
              onClick={() => setShowOnlyDiscount(!showOnlyDiscount)}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
            >
              <div
                className={cn(
                  'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                  showOnlyDiscount
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                )}
              >
                {showOnlyDiscount && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate">{t('Diskon / Promo')}</span>
            </button>
          </div>
        </div>

        {/* 3. Color Swatches (2 rows of 5) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('Color')}
            </h4>
            {selectedColor && (
              <button
                type="button"
                onClick={() => setSelectedColor(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t('Clear')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_OPTIONS.map((col) => {
              const isSelected = selectedColor === col.id;
              const isLight = col.id === 'white' || col.id === 'yellow';
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleColor(col.id)}
                  title={col.label}
                  className={cn(
                    'size-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative',
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md'
                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: col.hex,
                    border: col.id === 'dark' || col.id === 'white' ? '1px solid rgba(255,255,255,0.2)' : undefined,
                  }}
                >
                  {isSelected && (
                    <Check
                      className={cn(
                        'w-3.5 h-3.5 stroke-[3]',
                        isLight ? 'text-black' : 'text-white'
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Theme Grid (2 columns) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('Theme')}
            </h4>
            {selectedThemes.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedThemes([])}
                className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t('Clear')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {THEME_OPTIONS.map((th) => {
              const isSelected = selectedThemes.includes(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => toggleTheme(th.id)}
                  className={cn(
                    'h-8 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1.5 truncate transition-all cursor-pointer select-none text-left',
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary font-bold shadow-xs'
                      : 'bg-muted/30 border-border/60 text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <span className="text-xs shrink-0">{th.icon}</span>
                  <span className="truncate">{th.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Discord-grade animated cosmetic card preview (Frame, Namecard, Overlay)
  const renderCardArtwork = (item: ShopItem) => {
    const gifUrl = item.gifUrl || item.previewIcon;

    if (item.category === 'avatar_decoration') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-[#111214] border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Avatar Base Silhouette */}
          <div className="relative size-16 sm:size-18 rounded-full bg-[#1e1f22] border-2 border-[#2b2d31] flex items-center justify-center shadow-lg">
            <div className="size-full rounded-full bg-gradient-to-b from-[#2b2d31] to-[#1e1f22] flex items-center justify-center text-muted-foreground/50 font-black text-xl select-none">
              ❄
            </div>

            {/* Layered Animated Frame GIF */}
            {gifUrl && (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute -inset-3.5 size-[calc(100%+28px)] object-contain pointer-events-none select-none z-10 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            )}
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            FRAME .GIF
          </span>
        </div>
      );
    }

    if (item.category === 'nameplate') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-[#111214] border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Discord/Anticeil Chat Row Preview */}
          <div className="w-[92%] h-13 rounded-lg bg-[#1e1f22] border border-border/60 p-2 flex items-center gap-2.5 relative overflow-hidden shadow-lg group-hover:border-primary/50 transition-colors">
            {gifUrl && (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute inset-0 size-full object-cover opacity-80 mix-blend-screen pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}

            <div className="size-7 rounded-full bg-[#2b2d31] border border-white/10 flex items-center justify-center text-xs text-muted-foreground font-black shrink-0 z-10 shadow-xs">
              ❄
            </div>

            <div className="min-w-0 z-10 space-y-0.5">
              <div className="text-[11px] font-bold text-white drop-shadow-sm flex items-center gap-1.5 leading-none">
                <span className="truncate">Username</span>
                <span className="text-[8px] px-1 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold">NAMECARD</span>
              </div>
              <div className="w-20 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            NAMECARD .GIF
          </span>
        </div>
      );
    }

    if (item.category === 'profile_effect') {
      return (
        <div className="h-32 sm:h-36 relative overflow-hidden bg-[#111214] border-b border-border/40">
          {gifUrl && (
            <img
              src={gifUrl}
              alt={item.name}
              className="absolute inset-0 size-full object-cover opacity-85 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/30 to-transparent pointer-events-none" />

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2 z-10 opacity-75">
            <div className="size-7 rounded-full bg-white/20 border border-white/30 backdrop-blur-xs shrink-0" />
            <div className="space-y-1 min-w-0">
              <div className="w-16 h-2 rounded bg-white/40" />
              <div className="w-10 h-1.5 rounded bg-white/20" />
            </div>
          </div>

          <span className="absolute top-2.5 right-2.5 text-[8px] font-bold text-white/70 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wider z-10">
            OVERLAY .GIF
          </span>
        </div>
      );
    }

    // Bundle
    return (
      <div className="h-32 sm:h-36 relative overflow-hidden bg-[#111214] border-b border-border/40 flex items-center justify-center p-3">
        {gifUrl && (
          <img
            src={gifUrl}
            alt={item.name}
            className="absolute inset-0 size-full object-cover opacity-40 mix-blend-screen pointer-events-none select-none"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-transparent to-transparent pointer-events-none" />

        <div className="relative size-14 rounded-full bg-[#1e1f22] border border-white/10 flex items-center justify-center z-10 shadow-lg">
          <span className="text-muted-foreground/50 text-sm font-bold">❄</span>
          {gifUrl && (
            <img
              src={gifUrl}
              alt={item.name}
              className="absolute -inset-3 size-[calc(100%+24px)] object-contain pointer-events-none select-none z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          )}
        </div>

        <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
          3PC BUNDLE .GIF
        </span>
      </div>
    );
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

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop (100% Consistent with Apps & Colonies) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Store className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Shop')}</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Tab Filter Pills: 100% DRY & Reusable, matching Apps & Colonies pattern */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none] px-1">
          {/* 1. Featured Tab */}
          <TopBarTabButton
            active={activeTab === 'featured'}
            onClick={() => {
              setActiveTab('featured');
              setBrowseCategory(null);
              setSelectedApp(null);
            }}
          >
            {t('Featured')}
          </TopBarTabButton>

          {/* 2. Browse Tab with Dropdown */}
          <DropdownMenu open={isBrowseOpen} onOpenChange={setIsBrowseOpen}>
            <DropdownMenuTrigger asChild>
              <TopBarTabButton active={activeTab === 'browse' || activeTab === 'all'}>
                <span>{t('Browse')}</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-200 opacity-70',
                    isBrowseOpen && 'rotate-180'
                  )}
                />
              </TopBarTabButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card/95 backdrop-blur-md border-border text-foreground z-[160] p-1.5 space-y-0.5 shadow-2xl">
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('avatar_decoration');
                  setSelectedTypes(['avatar_decoration']);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Avatar Decorations')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('nameplate');
                  setSelectedTypes(['nameplate']);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Nameplates')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('profile_effect');
                  setSelectedTypes(['profile_effect']);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Profile Effects')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('avatar_decoration');
                  setSelectedTypes(['avatar_decoration']);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Profile Frames')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('bundle');
                  setSelectedTypes(['bundle']);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Bundles')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('browse');
                  setBrowseCategory('collabs');
                  setShowOnlyFeatured(true);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted"
              >
                {t('Collabs')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab('all');
                  setBrowseCategory(null);
                  setSelectedTypes([]);
                }}
                className="text-xs cursor-pointer py-1.5 px-2.5 font-semibold text-primary rounded-md hover:bg-primary/10"
              >
                {t('Shop All')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Dew Shop Tab */}
          <TopBarTabButton
            active={activeTab === 'dew'}
            onClick={() => {
              setActiveTab('dew');
              setBrowseCategory(null);
              setSelectedApp(null);
            }}
          >
            <span className={cn(activeTab === 'dew' && 'text-cyan-400')}>{t('Dew Shop')}</span>
          </TopBarTabButton>

          {/* 4. App Shops Tab with Dropdown */}
          <DropdownMenu open={isAppShopsOpen} onOpenChange={setIsAppShopsOpen}>
            <DropdownMenuTrigger asChild>
              <TopBarTabButton active={activeTab === 'app_shops'}>
                <span>{selectedApp ? `${selectedApp}` : t('App Shops')}</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-200 opacity-70',
                    isAppShopsOpen && 'rotate-180'
                  )}
                />
              </TopBarTabButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 bg-card/95 backdrop-blur-md border-border text-foreground z-[160] p-1.5 space-y-1 shadow-2xl">
              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                {t('Aplikasi & Aktivitas Anticeil')}
              </DropdownMenuLabel>
              {APP_SHOPS_ITEMS.map((app) => (
                <DropdownMenuItem
                  key={app.id}
                  onClick={() => {
                    setActiveTab('app_shops');
                    setSelectedApp(app.name);
                    setSearchQuery(app.query);
                  }}
                  className="flex items-center gap-2.5 px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-muted font-medium transition-colors"
                >
                  <div className="size-6 rounded-md bg-muted/60 border border-border/80 flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">{app.name}</div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    {app.tag}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

          {/* Currency Pill with quick Top Up (Single Dew Currency) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-7 px-2.5 rounded-[4px] bg-muted/40 hover:bg-muted border border-border/60 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                title={t('Lihat & Tambah Saldo Dew')}
              >
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="text-xs">💧</span>
                  <span>{(balance?.dew ?? balance?.orbs ?? 0).toLocaleString()} Dew</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground z-[160] p-2 space-y-1 shadow-xl">
              <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground">
                {t('Saldo Dew Anda')}
              </DropdownMenuLabel>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-cyan-400 flex items-center gap-1">💧 Saldo Dew:</span>
                  <span>{(balance?.dew ?? balance?.orbs ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="px-2.5 py-1 text-[11px] text-muted-foreground leading-relaxed">
                {t('Dew adalah mata uang F2P eksklusif yang hanya bisa didapatkan dari menyelesaikan Quests.')}
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => {
                  if (onNavigateSection) {
                    onNavigateSection('quests');
                  } else {
                    window.location.pathname = '/quests';
                  }
                }}
                className="text-xs cursor-pointer text-cyan-400 font-bold flex items-center justify-between"
              >
                <span>{t('Dapatkan Dew dari Quests')}</span>
                <span>🎯</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reusable TopBarActionButton for adding custom products */}
          <TopBarActionButton
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('Tambah Item')}
            shortLabel={t('Tambah')}
            iconOnlyMobile
            onClick={handleOpenCreateProduct}
            title={t('Tambah Produk Baru ke Database Shop')}
          />
        </div>
      </div>

      {/* ── 2. Main Content Row: Center Catalog + Discord-style Right Filter Sidebar ── */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Scrollable Center Catalog */}
        <div className={cn('flex-1 min-h-0 overflow-y-auto scrollbar-none py-4 sm:py-6 space-y-6', horizontalPadding)}>
          {/* Top Catalog Toolbar: Sort by + Hide/Show Filters toggle (Discord 1:1) */}
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Katalog')}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                ({filteredItems.length} {t('item')})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort by dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium shrink-0">{t('Sort by')}</span>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger size="xs" className="w-38 h-7 text-xs bg-muted/40 border-border/60">
                    <SelectValue placeholder={t('Sort by')} />
                  </SelectTrigger>
                  <SelectContent align="end" className="bg-card border-border z-[160]">
                    <SelectItem value="recent">{t('Recently Added')}</SelectItem>
                    <SelectItem value="price_asc">{t('Price: Low to High')}</SelectItem>
                    <SelectItem value="price_desc">{t('Price: High to Low')}</SelectItem>
                    <SelectItem value="name_asc">{t('Name (A-Z)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop toggle filter bar */}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <span>{isFilterOpen ? t('Hide Filters') : t('Show Filters')}</span>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFilterCount > 0 && (
                  <span className="size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Mobile filter drawer trigger */}
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold cursor-pointer"
              >
                <span>{t('Filters')}</span>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFilterCount > 0 && (
                  <span className="size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
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

        {/* ── Dew Shop Dedicated Hero Banner ── */}
        {!searchQuery && activeTab === 'dew' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/20 via-card to-background border border-cyan-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Droplets className="w-3 h-3" /> {t('DEW & SALDO POIN')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {t('Tukarkan Dew dengan Item Eksklusif')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('Dew adalah mata uang F2P eksklusif. Selesaikan tantangan dan misi di Quests untuk mengumpulkan Dew gratis!')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  if (onNavigateSection) {
                    onNavigateSection('quests');
                  } else {
                    window.location.pathname = '/quests';
                  }
                }}
                className="font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-md bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <span>🎯</span>
                <span>{t('Dapatkan Dew dari Quests')}</span>
              </Button>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
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
                  {activeTab === 'featured'
                    ? t('Item Populer & Unggulan')
                    : activeTab === 'dew'
                    ? t('Item Dew Shop')
                    : activeTab === 'app_shops' && selectedApp
                    ? `${selectedApp} Shop`
                    : activeTab === 'browse' && browseCategory
                    ? browseCategory === 'avatar_decoration'
                      ? t('Avatar Decorations')
                      : browseCategory === 'nameplate'
                      ? t('Nameplates')
                      : browseCategory === 'profile_effect'
                      ? t('Profile Effects')
                      : browseCategory === 'bundle'
                      ? t('Bundles')
                      : t('Browse Katalog')
                    : t('Semua Item Shop')}
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
                    {/* Card Header / Artwork Area with Real Animated Cosmetic Preview */}
                    <div className="relative overflow-hidden">
                      {/* Badge on top-left */}
                      {item.badge && (
                        <span className="absolute top-2.5 left-2.5 z-20 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
                          {item.badge}
                        </span>
                      )}

                      {/* Wishlist button on top-right */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(e, item)}
                        className="absolute top-2.5 right-2.5 z-20 size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors cursor-pointer shadow-xs"
                        title={isWishlisted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
                      >
                        <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'text-pink-500 fill-pink-500')} />
                      </button>

                      {/* Edit & Delete buttons on card hover */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProduct(item);
                          }}
                          className="size-6 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title={t('Edit Item ini')}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(e, item.id)}
                          className="size-6 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title={t('Hapus Item ini dari Database Shop')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Dedicated Cosmetic Artwork Renderer */}
                      {renderCardArtwork(item)}
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
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400">
                            <span>💧</span>
                            <span>{item.priceDew ?? item.priceOrbs ?? 0} Dew</span>
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

        {/* Desktop Discord-style Right Filter Sidebar */}
        {isFilterOpen && (
          <aside className="hidden lg:flex w-64 shrink-0 flex-col border-l border-border/60 bg-card/25 backdrop-blur-xs overflow-y-auto p-4 [scrollbar-width:thin] select-none">
            {renderFilterContent()}
          </aside>
        )}
      </div>

      {/* Mobile / Tablet Filter Sheet Drawer */}
      <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-xs p-4 overflow-y-auto bg-card border-border z-[170]">
          <SheetHeader className="pb-3 border-b border-border/50 text-left">
            <SheetTitle className="text-sm font-bold flex items-center justify-between">
              <span>{t('Filter Shop')}</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('Reset')}</span>
                </button>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {renderFilterContent()}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 3. Reusable Dialog: Item Detail & Purchase Modal ── */}
      <Dialog open={Boolean(activeModalItem)} onOpenChange={(open) => !open && setActiveModalItem(null)}>
        {activeModalItem && (
          <DialogContent className="w-[92vw] sm:w-[480px] p-0 overflow-hidden rounded-xl bg-card border border-border shadow-xl z-[150]">
            {/* Header Preview Banner with Real Animated Cosmetic in Action */}
            <div className="relative h-44 bg-[#111214] flex items-center justify-center p-6 border-b border-border overflow-hidden">
              {activeModalItem.category === 'avatar_decoration' ? (
                <div className="relative size-22 rounded-full bg-[#1e1f22] border-2 border-[#2b2d31] flex items-center justify-center shadow-2xl z-10">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="User Avatar" className="size-full rounded-full object-cover" />
                  ) : (
                    <div className="size-full rounded-full bg-[#2b2d31] flex items-center justify-center text-muted-foreground/60 font-black text-2xl select-none">
                      ❄
                    </div>
                  )}
                  {(activeModalItem.gifUrl || activeModalItem.previewIcon) && (
                    <img
                      src={activeModalItem.gifUrl || activeModalItem.previewIcon}
                      alt={activeModalItem.name}
                      className="absolute -inset-4.5 size-[calc(100%+36px)] object-contain pointer-events-none select-none z-20 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-300"
                    />
                  )}
                </div>
              ) : activeModalItem.category === 'nameplate' ? (
                <div className="w-[90%] h-14 rounded-xl bg-[#1e1f22] border border-border/80 p-2.5 flex items-center gap-3 relative overflow-hidden shadow-2xl z-10">
                  {(activeModalItem.gifUrl || activeModalItem.previewIcon) && (
                    <img
                      src={activeModalItem.gifUrl || activeModalItem.previewIcon}
                      alt={activeModalItem.name}
                      className="absolute inset-0 size-full object-cover opacity-85 mix-blend-screen pointer-events-none select-none"
                    />
                  )}
                  <div className="size-8 rounded-full bg-[#2b2d31] border border-white/20 flex items-center justify-center text-xs font-black text-muted-foreground z-10 shrink-0">
                    ❄
                  </div>
                  <div className="min-w-0 z-10 space-y-0.5">
                    <div className="text-xs font-bold text-white drop-shadow-md flex items-center gap-2 leading-none">
                      <span>{currentUser?.name || 'Username Anda'}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold">NAMECARD</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-none">Pratinjau tampilan strip namecard animasi di chat</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 size-full overflow-hidden">
                  {(activeModalItem.gifUrl || activeModalItem.previewIcon) && (
                    <img
                      src={activeModalItem.gifUrl || activeModalItem.previewIcon}
                      alt={activeModalItem.name}
                      className="absolute inset-0 size-full object-cover opacity-85 pointer-events-none select-none"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2.5 z-10">
                    <div className="size-9 rounded-full bg-white/20 border border-white/40 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs shrink-0">
                      ❄
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white drop-shadow-md">{activeModalItem.name}</div>
                      <div className="text-[10px] text-white/80">Overlay animasi latar profil</div>
                    </div>
                  </div>
                </div>
              )}
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
                  <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Dew')}</div>
                  <div className="text-xs sm:text-sm font-bold text-cyan-400 flex items-center justify-end gap-1">
                    <span>💧</span>
                    <span>{activeModalItem.priceDew ?? activeModalItem.priceOrbs ?? 0} Dew</span>
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
                        disabled={isPurchasing || (balance.dew ?? balance.orbs ?? 0) < (activeModalItem.priceDew ?? activeModalItem.priceOrbs ?? 0)}
                        onClick={() => handlePurchase(activeModalItem, 'dew')}
                        className="flex-1 h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isPurchasing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>💧</span>
                            <span>Beli ({activeModalItem.priceDew ?? activeModalItem.priceOrbs ?? 0} Dew)</span>
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

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditProduct(activeModalItem);
                        }}
                        className="h-9 px-3 cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
                        title={t('Edit Item')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(e, activeModalItem.id);
                          setActiveModalItem(null);
                        }}
                        className="h-9 px-3 cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                        title={t('Hapus Item')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {(balance.dew ?? balance.orbs ?? 0) < (activeModalItem.priceDew ?? activeModalItem.priceOrbs ?? 0) && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                        <span>Saldo Dew belum cukup ({balance.dew ?? balance.orbs ?? 0} / {activeModalItem.priceDew ?? activeModalItem.priceOrbs ?? 0})</span>
                        <button
                          type="button"
                          onClick={() => handleTopupDew(500)}
                          className="text-cyan-400 hover:underline font-bold cursor-pointer"
                        >
                          + Klaim 500 Dew
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
          <div className="p-4 pr-12 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <DialogTitle className="text-sm font-bold text-foreground">
                {t('Wishlist Shop')} ({wishlist.length})
              </DialogTitle>
            </div>
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
                      <div className="text-[10px] text-cyan-400 font-bold">💧 {item.priceDew ?? item.priceOrbs ?? 0} Dew</div>
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

      {/* ── 5. Reusable Dialog: Add or Edit Product (Fullstack CRUD) ── */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="w-[92vw] sm:w-[460px] p-5 rounded-xl bg-card border border-border shadow-xl z-[160]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              {editingProduct ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              <span>{editingProduct ? t('Edit Item Katalog Shop') : t('Tambah Produk ke Database Shop')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-3 pt-2">
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
                  <option value="avatar_decoration">Bingkai Profil (Animated Frame)</option>
                  <option value="profile_effect">Overlay Profil (Animated Effect)</option>
                  <option value="nameplate">Namecard (Animated Nameplate)</option>
                  <option value="bundle">Bundel Animasi (3pc)</option>
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
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Harga Dew')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceDew}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceDew: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('URL File Animasi GIF (Transparan / Loop)')}</label>
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
