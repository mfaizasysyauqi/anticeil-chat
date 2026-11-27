import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
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
  UploadCloud,
  Image as ImageIcon,
  Video,
  Crown,
  Gamepad2,
  Palette,
  User,
} from 'lucide-react';
import { AvatarDecorationRenderer } from '@/features/profile/components/avatar-decoration-renderer';
import { NameplateRenderer } from '@/features/profile/components/nameplate-renderer';
import { AnticeilAvatarMannequin } from '@/components/ui/anticeil-avatar-mannequin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { FilterToggleButton } from '@/components/ui/filter-toggle-button';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { InboxPopover } from '@/features/inbox';
import { ShopEmptyState } from './shop-empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppFilterDrawer } from '@/components/ui/app-filter-drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormDropdown,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  CHANNEL_HORIZONTAL_PADDING,
  CHANNEL_VERTICAL_PADDING,
  LAYOUT_PAGE_SPACING,
  TEXT_STYLES,
  BUTTON_STYLES,
  DIALOG_STYLES,
  SURFACE_STYLES,
  PageSectionHeader,
} from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { uploadMediaToR2 } from '@/lib/upload';
import { shopApi, type ShopItem, type ShopCollection, type ShopBalance, FALLBACK_SHOP_ITEMS } from '../api/shop-api';
import { api } from '@/lib/api';
import { loadMidtransSnap } from '@/features/billing/api/subscriptions-api';
import {
  ITEM_TYPE_OPTIONS,
  COLOR_OPTIONS,
  THEME_OPTIONS,
  APP_SHOPS_ITEMS,
} from '../data/shop-constants';
import { ShopItemModal } from './shop-item-modal';
import { ShopWishlistModal } from './shop-wishlist-modal';
import { ShopAddProductModal } from './shop-add-product-modal';

export {
  ITEM_TYPE_OPTIONS,
  COLOR_OPTIONS,
  THEME_OPTIONS,
  APP_SHOPS_ITEMS,
};

export interface ShopViewProps {
  currentUser?: any;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
  onOpenProfile?: () => void;
  onNavigateSection?: (section: string) => void;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
}

export function ShopView({
  currentUser,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
  onOpenProfile,
  onNavigateSection,
  requireAuth,
}: ShopViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'featured' | 'browse' | 'dew' | 'app_shops' | 'all'>('featured');
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [isAppShopsOpen, setIsAppShopsOpen] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [expandedMoreSubmenu, setExpandedMoreSubmenu] = useState<'browse' | 'app_shops' | null>(null);

  // Responsive dynamic tabs container (collapse overflowing tabs to the left of More into More)
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabWidthsRef = useRef<{ [key: string]: number }>({
    featured: 78,
    browse: 88,
    dew: 88,
    app_shops: 110,
    more: 74,
  });
  const [collapsedCount, setCollapsedCount] = useState<number>(0);

  // Measure and compute collapsed tabs based on available container width
  const updateTabsLayout = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    // 1. Update cached widths from currently rendered tab elements
    const children = Array.from(el.children) as HTMLElement[];
    for (const child of children) {
      const tabId = child.getAttribute('data-tab-id');
      if (tabId && child.offsetWidth > 0) {
        tabWidthsRef.current[tabId] = child.offsetWidth;
      }
    }

    const availableWidth = el.clientWidth;
    if (availableWidth <= 0) return;

    const gap = 4; // gap-1 (4px)
    const hysteresis = 4; // Small margin to prevent boundary oscillation
    const wFeatured = tabWidthsRef.current.featured || 78;
    const wBrowse = tabWidthsRef.current.browse || 88;
    const wDew = tabWidthsRef.current.dew || 88;
    const wAppShops = tabWidthsRef.current.app_shops || 110;
    const wMore = tabWidthsRef.current.more || 74;

    // Width needed for all 4 tabs without More button:
    const widthAll = wFeatured + gap + wBrowse + gap + wDew + gap + wAppShops + hysteresis;

    // Width needed for 3 tabs + More (App Shops collapsed into More):
    const width3PlusMore = wFeatured + gap + wBrowse + gap + wDew + gap + wMore + hysteresis;

    // Width needed for 2 tabs + More (Dew Shop & App Shops collapsed into More):
    const width2PlusMore = wFeatured + gap + wBrowse + gap + wMore + hysteresis;

    let targetCollapsed = 0;
    if (availableWidth >= widthAll) {
      targetCollapsed = 0;
    } else if (availableWidth >= width3PlusMore) {
      targetCollapsed = 1;
    } else if (availableWidth >= width2PlusMore) {
      targetCollapsed = 2;
    } else {
      targetCollapsed = 3;
    }

    setCollapsedCount(targetCollapsed);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    updateTabsLayout();

    const observer = new ResizeObserver(() => {
      updateTabsLayout();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateTabsLayout]);

  // Safety check: if More button still overflows (scrollWidth > clientWidth),
  // collapse the next tab to the left into More until More does not overflow.
  useLayoutEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth + 1 && collapsedCount < 3) {
      setCollapsedCount((prev) => Math.min(3, prev + 1));
    }
  });

  const showAppShops = collapsedCount < 1;
  const showDewShop = collapsedCount < 2;
  const showBrowse = collapsedCount < 3;
  const hasOverflow = collapsedCount > 0;

  const isMoreActive =
    (!showAppShops && activeTab === 'app_shops') ||
    (!showDewShop && activeTab === 'dew') ||
    (!showBrowse && (activeTab === 'browse' || activeTab === 'all'));
  
  // Backend data states with resilient fallbacks
  const [items, setItems] = useState<ShopItem[]>([]);
  const [collections, setCollections] = useState<ShopCollection[]>([]);
  const [heroCollection, setHeroCollection] = useState<ShopCollection | null>(null);
  const [balance, setBalance] = useState<ShopBalance>({ dew: 0, currencyCode: 'IDR' });
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
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>('');
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    collection: 'Anticeil Cyber Core',
    category: 'avatar_decoration' as ShopItem['category'],
    description: '',
    priceIdr: 65000,
    priceDew: 500,
    allowDew: true,
    previewIcon: '',
    badge: 'Baru',
    featured: true,
  });

  const isAdmin = currentUser?.email?.toLowerCase() === 'anticeil.official@gmail.com';

  const handleOpenCreateProduct = () => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenCreateProduct(),
        t('Tambah Produk'),
        t('Masuk ke Anticeil untuk menambahkan produk baru ke Database Shop.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat menambahkan produk'));
      return;
    }
    setEditingProduct(null);
    setProductImageFile(null);
    setProductImagePreview('');
    setNewProductForm({
      name: '',
      collection: 'Anticeil Cyber Core',
      category: 'avatar_decoration',
      description: '',
      priceIdr: 65000,
      priceDew: 500,
      allowDew: true,
      previewIcon: '',
      badge: 'Baru',
      featured: true,
    });
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (item: ShopItem) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenEditProduct(item),
        t('Edit Produk'),
        t('Masuk ke Anticeil untuk mengedit item di Database Shop.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat mengedit produk'));
      return;
    }
    setEditingProduct(item);
    setProductImageFile(null);
    const existingMedia = item.previewIcon || item.gifUrl || '';
    setProductImagePreview(existingMedia);
    const itemCanUseDew = item.allowDew !== false && (item.priceDew !== 0);
    setNewProductForm({
      name: item.name,
      collection: item.collection,
      category: item.category,
      description: item.description,
      priceIdr: item.priceIdr || 65000,
      priceDew: itemCanUseDew ? (item.priceDew || item.priceOrbs || 500) : 0,
      allowDew: itemCanUseDew,
      previewIcon: existingMedia,
      badge: item.badge || 'Baru',
      featured: Boolean(item.featured),
    });
    setIsAddProductOpen(true);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('Hanya file animasi GIF atau gambar (GIF, PNG, WebP) yang diperbolehkan'));
      return;
    }
    setProductImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setProductImagePreview(objectUrl);
  };

  const handleRemoveProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview('');
    setNewProductForm((f) => ({ ...f, previewIcon: '' }));
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
  };

  // Load Shop data from fullstack backend
  const fetchShopData = async () => {
    setIsLoading(true);
    try {
      const isAuth = Boolean(currentUser && (currentUser.id || currentUser.email));
      const [allItems, featuredRes, userBal, userInv, userWish] = await Promise.all([
        shopApi.getItems(),
        shopApi.getFeatured(),
        isAuth ? shopApi.getBalance() : Promise.resolve({ dew: 0, currencyCode: 'IDR' }),
        isAuth ? shopApi.getInventory() : Promise.resolve([]),
        isAuth ? shopApi.getWishlist() : Promise.resolve([]),
      ]);
      if (Array.isArray(allItems)) {
        setItems(allItems);
      }
      if (featuredRes && featuredRes.heroCollection) {
        setHeroCollection(featuredRes.heroCollection);
        setCollections(featuredRes.collections || []);
      }
      if (userBal && typeof (userBal as any).dew === 'number') {
        setBalance(userBal as any);
      } else if (!isAuth) {
        setBalance({ dew: 0, currencyCode: 'IDR' });
      }
      if (Array.isArray(userInv)) {
        setInventory(isAuth ? userInv : []);
      }
      if (Array.isArray(userWish)) {
        setWishlist(isAuth ? userWish : []);
      } else if (!isAuth) {
        setWishlist([]);
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
      } else if (currentUser) {
        shopApi.getBalance().then((b) => b && setBalance(b));
      }
    };
    window.addEventListener('anticeil_balance_changed', handleBalanceChanged);
    return () => window.removeEventListener('anticeil_balance_changed', handleBalanceChanged);
  }, [currentUser?.id, Boolean(currentUser)]);

  const ownedItemIds = useMemo(() => new Set(inventory.map((i) => i.id)), [inventory]);
  const wishlistedItemIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(wishlist.map((i) => i.id));
  }, [currentUser, wishlist]);

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

  // Filter Drawer State (Sheet Drawer ensures 100% Symmetrical Page Layout)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name_asc'>('recent');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showOnlyDew, setShowOnlyDew] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      const cat = typeof e.detail === 'string' ? e.detail : e.detail?.category;
      if (cat) {
        setActiveTab('browse');
        setBrowseCategory(cat);
        setSelectedTypes([cat]);
      }
    };
    window.addEventListener('anticeil:shop-category', handleCategoryEvent);
    return () => window.removeEventListener('anticeil:shop-category', handleCategoryEvent);
  }, []);
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
      const targetApp = APP_SHOPS_ITEMS.find((a) => a.name === selectedApp);
      const q = (targetApp?.query || selectedApp).toLowerCase();
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
    if (!currentUser) {
      if (requireAuth) {
        requireAuth(
          () => handleToggleWishlist(e, item),
          t('Wishlist Shop'),
          t('Masuk ke Anticeil untuk menambahkan item ke wishlist Anda.'),
        );
      } else {
        toast.info(t('Masuk ke Anticeil untuk menambahkan item ke wishlist Anda.'));
      }
      return;
    }
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

  // Purchase item action (Supports Dew F2P or Midtrans Sandbox IDR)
  const handlePurchase = async (item: ShopItem, currency: 'dew' | 'idr') => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handlePurchase(item, currency),
        t('Beli Item Shop'),
        t('Masuk ke Anticeil untuk membeli avatar deco dan kosmetik.'),
      );
      return;
    }
    setIsPurchasing(true);
    try {
      if (currency === 'idr') {
        toast.loading(t('Menghubungkan ke Midtrans Sandbox...'), { id: 'midtrans-shop-init' });
        const tokenRes = await api.post<{ snapToken: string; orderId: string; clientKey?: string }>(
          '/v1/billing/midtrans-token',
          { isShop: true, itemId: item.id, itemName: item.name, price: item.priceIdr },
        );
        toast.dismiss('midtrans-shop-init');

        if (tokenRes?.snapToken) {
          await loadMidtransSnap(tokenRes.clientKey);
          if ((window as any).snap) {
            (window as any).snap.pay(tokenRes.snapToken, {
              onSuccess: async () => {
                toast.loading(t('Memverifikasi transaksi Midtrans Sandbox...'), { id: 'midtrans-shop-verify' });
                await api.post('/v1/billing/midtrans-verify', { orderId: tokenRes.orderId });
                toast.dismiss('midtrans-shop-verify');
                const res = await shopApi.purchaseItem(item.id, 'idr');
                if (res.success) {
                  toast.success(res.message || t('Pembelian IDR via Midtrans Sandbox berhasil! 🎉'));
                  if (res.item) {
                    setInventory((prev) => [...prev.filter((i) => i.id !== res.item!.id), res.item!]);
                  }
                  setActiveModalItem(null);
                }
              },
              onError: (err: any) => {
                toast.error(t('Pembayaran Midtrans dibatalkan atau terjadi kesalahan'));
                console.error(err);
              },
            });
            return;
          }
        }
      }

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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleEquip(item),
        t('Pasang Item'),
        t('Masuk ke Anticeil untuk memasang item ke profil Anda.'),
      );
      return;
    }
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
    if (!productImageFile && !productImagePreview.trim()) {
      toast.error(t('Silakan unggah file animasi GIF atau gambar produk'));
      return;
    }

    setIsCreatingProduct(true);
    try {
      let finalPreviewUrl = newProductForm.previewIcon || productImagePreview;

      // Jika ada file lokal baru, upload ke Cloudflare R2 sekarang saat tombol simpan diklik
      if (productImageFile) {
        const uploadRes = await uploadMediaToR2(productImageFile, `shop_${Date.now()}`);
        if (uploadRes.url) {
          finalPreviewUrl = uploadRes.url;
        }
      }

      const payload = {
        ...newProductForm,
        allowDew: newProductForm.allowDew,
        priceDew: newProductForm.allowDew ? newProductForm.priceDew : 0,
        priceOrbs: newProductForm.allowDew ? newProductForm.priceDew : 0,
        previewIcon: finalPreviewUrl,
        gifUrl: finalPreviewUrl,
      };

      if (editingProduct) {
        const res = await shopApi.updateItem(editingProduct.id, payload);
        if (res.success && res.item) {
          setItems((prev) => prev.map((i) => (i.id === editingProduct.id ? res.item! : i)));
          toast.success(res.message || t('Produk berhasil diperbarui! ✨'));
          setIsAddProductOpen(false);
          setEditingProduct(null);
          setProductImageFile(null);
          setProductImagePreview('');
          if (activeModalItem?.id === editingProduct.id) {
            setActiveModalItem(res.item);
          }
        } else {
          toast.error(res.message || t('Gagal memperbarui produk'));
        }
      } else {
        const res = await shopApi.createItem(payload);
        if (res.success && res.item) {
          setItems((prev) => [res.item!, ...prev]);
          toast.success(res.message || t('Produk baru berhasil ditambahkan! 🎉'));
          setIsAddProductOpen(false);
          setEditingProduct(null);
          setProductImageFile(null);
          setProductImagePreview('');
          setNewProductForm({
            name: '',
            collection: 'Anticeil Cyber Core',
            category: 'avatar_decoration',
            description: '',
            priceIdr: 65000,
            priceDew: 500,
            allowDew: true,
            previewIcon: '',
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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleDeleteProduct(e, itemId),
        t('Hapus Produk'),
        t('Masuk ke Anticeil untuk menghapus item dari Database Shop.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat menghapus produk'));
      return;
    }
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

  // Open item detail with authentication guard
  const handleOpenItemDetail = (item: ShopItem) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenItemDetail(item),
        t('Buka Detail Produk'),
        t('Masuk ke Anticeil untuk melihat dan membeli item di Shop.'),
      );
      return;
    }
    setActiveModalItem(item);
  };

  // Discord-style 1:1 Right Filter Panel Renderer
  const renderFilterContent = () => {
    return (
      <div className="space-y-6">
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
                  title={t(col.label)}
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
                  <span className="truncate">{t(th.label)}</span>
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
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Avatar Base Silhouette with Live Avatar Decoration */}
          <div className="relative size-16 sm:size-18 rounded-full bg-secondary border-2 border-border/70 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              <User className="size-8 text-muted-foreground/40" />
            )}

            {/* Layered Animated Frame GIF or Vector/SVG Renderer */}
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute -inset-3.5 size-[calc(100%+28px)] object-contain pointer-events-none select-none z-10 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
                loading="lazy"
              />
            ) : (
              <AvatarDecorationRenderer decorationId={item.id} />
            )}
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            DECORATION
          </span>
        </div>
      );
    }

    if (item.category === 'nameplate') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Discord/Anticeil Chat Row Preview */}
          <div className="w-[92%] h-13 rounded-xl bg-card border border-border/60 p-2 flex items-center gap-2.5 relative overflow-hidden shadow-lg group-hover:border-primary/50 transition-colors">
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute inset-0 size-full object-cover opacity-80 mix-blend-screen pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <NameplateRenderer nameplateId={item.id} imageUrl={item.previewIcon} />
            )}

            <AnticeilAvatarMannequin
              size="sm"
              avatarUrl={currentUser?.avatarUrl}
              statusDot
              statusColor="#23a55a"
            />

            <div className="min-w-0 z-10 space-y-0.5">
              <div className="text-[11px] font-bold text-foreground drop-shadow-sm flex items-center gap-1.5 leading-none">
                <span className="truncate">{currentUser?.username || 'Username'}</span>
                {item.badge && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="w-16 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            NAMEPLATE
          </span>
        </div>
      );
    }

    if (item.category === 'profile_banner') {
      const bannerUrl = (item as any).bannerUrl || gifUrl;
      return (
        <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={item.name}
              className="absolute inset-0 size-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-foreground/80 bg-background/70 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wider z-10 border border-border/40">
            BANNER
          </span>
        </div>
      );
    }

    if (item.category === 'animated_avatar') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative size-16 sm:size-18 rounded-full bg-secondary border-2 border-border/70 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="size-8 text-muted-foreground/40" />
            )}
          </div>
          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            ANIMATED AVATAR
          </span>
        </div>
      );
    }

    if (item.category === 'profile_effect') {
      return (
        <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40">
          {gifUrl && (
            <img
              src={gifUrl}
              alt={item.name}
              className="absolute inset-0 size-full object-cover opacity-85 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent pointer-events-none" />

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2 z-10 opacity-75">
            <div className="size-7 rounded-full bg-muted border border-border backdrop-blur-xs shrink-0" />
            <div className="space-y-1 min-w-0">
              <div className="w-16 h-2 rounded bg-muted-foreground/40" />
              <div className="w-10 h-1.5 rounded bg-muted-foreground/20" />
            </div>
          </div>

          <span className="absolute bottom-2.5 left-3 text-[8px] font-bold text-foreground/80 bg-background/70 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wider z-10 border border-border/40">
            OVERLAY .GIF
          </span>
        </div>
      );
    }

    // Bundle
    return (
      <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40 flex items-center justify-center p-3">
        {gifUrl && (
          <img
            src={gifUrl}
            alt={item.name}
            className="absolute inset-0 size-full object-cover opacity-40 mix-blend-screen pointer-events-none select-none"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

        <div className="relative size-14 rounded-full bg-card border border-border/60 flex items-center justify-center z-10 shadow-lg">
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
          'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden',
          horizontalPadding
        )}
      >
        <SidebarNavToggle onClick={onOpenSidebar} />

        {/* Tab Filter Pills: Responsive dynamic tabs container (overflowing tabs move to 'More' like Discord) */}
        <div ref={tabsContainerRef} className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden touch-pan-x">
          {/* 1. Featured Tab */}
          <TopBarTabButton
            data-tab-id="featured"
            active={activeTab === 'featured'}
            onClick={() => {
              setActiveTab('featured');
              setBrowseCategory(null);
              setSelectedApp(null);
            }}
          >
            {t('Featured')}
          </TopBarTabButton>

          {/* 2. Browse Tab with Dropdown (Visible if width permits) */}
          {showBrowse && (
            <DropdownMenu open={isBrowseOpen} onOpenChange={setIsBrowseOpen}>
              <DropdownMenuTrigger asChild>
                <TopBarTabButton data-tab-id="browse" active={activeTab === 'browse' || activeTab === 'all'}>
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
          )}

          {/* 3. Dew Shop Tab (Visible if width permits) */}
          {showDewShop && (
            <TopBarTabButton
              data-tab-id="dew"
              active={activeTab === 'dew'}
              onClick={() => {
                setActiveTab('dew');
                setBrowseCategory(null);
                setSelectedApp(null);
              }}
            >
              <span className={cn(activeTab === 'dew' && 'text-cyan-400')}>{t('Dew Shop')}</span>
            </TopBarTabButton>
          )}

          {/* 4. App Shops Tab with Dropdown (Visible if width permits) */}
          {showAppShops && (
            <DropdownMenu open={isAppShopsOpen} onOpenChange={setIsAppShopsOpen}>
              <DropdownMenuTrigger asChild>
                <TopBarTabButton data-tab-id="app_shops" active={activeTab === 'app_shops'}>
                  <span>{selectedApp ? `${selectedApp}` : t('App Shops')}</span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200 opacity-70',
                      isAppShopsOpen && 'rotate-180'
                    )}
                  />
                </TopBarTabButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 sm:w-80 bg-card/95 backdrop-blur-md border-border text-foreground z-[160] p-1.5 space-y-1 shadow-2xl">
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
                    <div className={cn('size-6 rounded-md border flex items-center justify-center text-xs shrink-0 shadow-xs p-1', app.iconBg)}>
                      <app.icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold text-foreground">{app.name}</div>
                    </div>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0', app.tagColor)}>
                      {app.tag}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 5. More Tab with Dropdown (Discord-style: displayed when tabs overflow) */}
          {hasOverflow && (
            <DropdownMenu
              open={isMoreOpen}
              onOpenChange={(open) => {
                setIsMoreOpen(open);
                if (!open) setExpandedMoreSubmenu(null);
              }}
            >
              <DropdownMenuTrigger asChild>
                <TopBarTabButton data-tab-id="more" active={isMoreActive}>
                  <span>{t('More')}</span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200 opacity-70',
                      isMoreOpen && 'rotate-180'
                    )}
                  />
                </TopBarTabButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 max-w-[calc(100vw-24px)] max-h-[80vh] overflow-y-auto custom-scrollbar bg-card/95 backdrop-blur-md border border-border text-foreground z-[160] p-1.5 space-y-1 shadow-2xl rounded-xl"
              >
                {/* A. Collapsed Browse Submenu (Accordion to prevent mobile flyout horizontal overflow) */}
                {!showBrowse && (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedMoreSubmenu((prev) => (prev === 'browse' ? null : 'browse'));
                      }}
                      className={cn(
                        'w-full flex items-center justify-between text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted transition-colors text-left',
                        (activeTab === 'browse' || activeTab === 'all') && 'text-primary font-bold bg-primary/10'
                      )}
                    >
                      <span>{t('Browse')}</span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200 opacity-70',
                          expandedMoreSubmenu === 'browse' && 'rotate-180'
                        )}
                      />
                    </button>
                    {expandedMoreSubmenu === 'browse' && (
                      <div className="pl-2 pr-1 py-1 space-y-0.5 border-l-2 border-primary/30 ml-2 my-0.5">
                        <DropdownMenuItem
                          onClick={() => {
                            setActiveTab('browse');
                            setBrowseCategory('avatar_decoration');
                            setSelectedTypes(['avatar_decoration']);
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
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
                            setIsMoreOpen(false);
                          }}
                          className="text-xs cursor-pointer py-1.5 px-2.5 font-semibold text-primary rounded-md hover:bg-primary/10"
                        >
                          {t('Shop All')}
                        </DropdownMenuItem>
                      </div>
                    )}
                  </div>
                )}

                {/* B. Collapsed Dew Shop */}
                {!showDewShop && (
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab('dew');
                      setBrowseCategory(null);
                      setSelectedApp(null);
                      setIsMoreOpen(false);
                    }}
                    className={cn(
                      'text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted flex items-center justify-between',
                      activeTab === 'dew' && 'text-cyan-400 font-bold bg-cyan-500/10'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>💧</span>
                      <span>{t('Dew Shop')}</span>
                    </div>
                  </DropdownMenuItem>
                )}

                {/* C. Collapsed App Shops Submenu (Accordion to prevent mobile flyout horizontal overflow) */}
                {!showAppShops && (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedMoreSubmenu((prev) => (prev === 'app_shops' ? null : 'app_shops'));
                      }}
                      className={cn(
                        'w-full flex items-center justify-between text-xs cursor-pointer py-1.5 px-2.5 font-medium rounded-md hover:bg-muted transition-colors text-left',
                        activeTab === 'app_shops' && 'text-primary font-bold bg-primary/10'
                      )}
                    >
                      <span>{selectedApp ? `${selectedApp}` : t('App Shops')}</span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200 opacity-70',
                          expandedMoreSubmenu === 'app_shops' && 'rotate-180'
                        )}
                      />
                    </button>
                    {expandedMoreSubmenu === 'app_shops' && (
                      <div className="pl-2 pr-1 py-1 space-y-0.5 border-l-2 border-primary/30 ml-2 my-0.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                          {t('Aplikasi & Aktivitas Anticeil')}
                        </div>
                        {APP_SHOPS_ITEMS.map((app) => (
                          <DropdownMenuItem
                            key={app.id}
                            onClick={() => {
                              setActiveTab('app_shops');
                              setSelectedApp(app.name);
                              setSearchQuery(app.query);
                              setIsMoreOpen(false);
                            }}
                            className="flex items-center gap-2.5 px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-muted font-medium transition-colors"
                          >
                            <div className={cn('size-6 rounded-md border flex items-center justify-center text-xs shrink-0 shadow-xs p-1', app.iconBg)}>
                              <app.icon className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-xs font-semibold text-foreground">{app.name}</div>
                            </div>
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0', app.tagColor)}>
                              {app.tag}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side: Wishlist, Search, Currency Balance, TopBarActionButton */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wishlist Button (placed to the left of search form) */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsWishlistDrawerOpen(true)}
            className="relative h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
            title={t('Wishlist Anda')}
          >
            <Heart className={cn('w-4 h-4', currentUser && wishlist.length > 0 && 'text-pink-500 fill-pink-500')} />
            {Boolean(currentUser && wishlist.length > 0) && (
              <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Button>

          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('Cari di shop...')}
            inputWidth="w-28 sm:w-40 md:w-48"
          />

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
                  <span>{(balance?.dew ?? balance?.orbs ?? 0).toLocaleString()}</span>
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
        </div>
      </div>

      {/* ── 2. Main Scrollable Body (100% Symmetrical with AppsView, CallsView, ColoniesView) ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, LAYOUT_PAGE_SPACING.SECTION_SPACING, verticalPadding)}>
          {/* Top Catalog Toolbar: PageSectionHeader */}
          <PageSectionHeader
            icon={ShoppingBag}
            title={t('Katalog')}
            count={filteredItems.length}
            countLabel={t('item')}
          >
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger size="xs" className="w-auto min-w-[7.5rem] px-2.5 sm:px-3 h-7 text-xs bg-muted/40 border-border/60 gap-1.5 whitespace-nowrap shrink-0">
                <SelectValue placeholder={t('Recently Added')} />
              </SelectTrigger>
              <SelectContent align="end" className="w-auto min-w-[var(--radix-select-trigger-width)] bg-card border-border z-[160]">
                <SelectItem value="recent">{t('Recently Added')}</SelectItem>
                <SelectItem value="price_asc">{t('Price: Low to High')}</SelectItem>
                <SelectItem value="price_desc">{t('Price: High to Low')}</SelectItem>
                <SelectItem value="name_asc">{t('Name (A-Z)')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Sheet Trigger (100% Symmetrical layout on all screen sizes) */}
            <FilterToggleButton
              isOpen={isFilterDrawerOpen}
              label={t('Filter')}
              activeCount={activeFilterCount}
              onClick={() => setIsFilterDrawerOpen(true)}
            />

            {/* Tambah Item button - to the right of filter button, matching Quests */}
            {isAdmin && (
              <Button
                size="sm"
                onClick={handleOpenCreateProduct}
                className={cn(BUTTON_STYLES.TOOLBAR_ACTION, 'px-2 sm:px-3 h-7')}
                title={t('Tambah Produk Baru ke Database Shop')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Tambah Item')}</span>
              </Button>
            )}
          </PageSectionHeader>
        {/* ── Reusable Hero Banner (Matches AppsView YouTube Watch Together layout) ── */}
        {!searchQuery && (activeTab === 'all' || activeTab === 'featured') && heroCollection && items.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-card to-background border border-primary/20 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-xl">
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
              className="w-full sm:w-auto font-bold h-10 px-6 gap-2 cursor-pointer z-10 shadow-lg shrink-0 justify-center"
            >
              <span>{heroCollection.actionLabel || t('Lihat Koleksi')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Subtle radial backdrop */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-primary/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ── Dew Shop Dedicated Hero Banner ── */}
        {!searchQuery && activeTab === 'dew' && items.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/20 via-card to-background border border-cyan-500/30 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-xl">
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

            <div className="flex items-center gap-2.5 z-10 shrink-0 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => {
                  if (onNavigateSection) {
                    onNavigateSection('quests');
                  } else {
                    window.location.pathname = '/quests';
                  }
                }}
                className="w-full sm:w-auto font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-md bg-cyan-600 hover:bg-cyan-500 text-white justify-center"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Dapatkan Dew dari Quests')}</span>
              </Button>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ── Content by Section: Consistent Header & Cards ── */}
        {filteredItems.length === 0 ? (
          <ShopEmptyState
            variant={
              searchQuery
                ? 'search'
                : activeFilterCount > 0
                ? 'filter'
                : (activeTab as any)
            }
            searchQuery={searchQuery}
            selectedApp={selectedApp || undefined}
            hasActiveFilters={activeFilterCount > 0}
            isAdmin={isAdmin}
            onResetSearch={() => setSearchQuery('')}
            onResetFilters={handleResetFilters}
            onOpenAddProduct={handleOpenCreateProduct}
          />
        ) : (
          <div className="space-y-4">
            {/* Section Header: Matching AppsView Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50">
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

            {/* Reusable Cards Grid: Matching ActivityCard Layout (4 desktop, 3 tablet, 2 mobile) */}
            <div className={SURFACE_STYLES.CARD_GRID}>
              {filteredItems.map((item) => {
                const isOwned = ownedItemIds.has(item.id);
                const isWishlisted = wishlistedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItemDetail(item)}
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
                      {isAdmin && (
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
                            className="size-6 rounded-md bg-background/90 hover:bg-red-600 border border-border/80 hover:border-red-600 text-red-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs backdrop-blur-md"
                            title={t('Hapus Item ini dari Database Shop')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Dedicated Cosmetic Artwork Renderer */}
                      {renderCardArtwork(item)}
                    </div>

                    {/* Card Body */}
                    <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-primary block uppercase tracking-wider truncate mb-0.5">
                          {item.collection || 'ANTICEIL NATIVE'}
                        </span>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5 sm:gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">
                            IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}
                          </div>
                          {item.allowDew !== false && (item.priceDew ?? item.priceOrbs ?? 0) > 0 ? (
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-cyan-400">
                              <span>💧</span>
                              <span>{item.priceDew ?? item.priceOrbs ?? 0} Dew</span>
                            </div>
                          ) : (
                            <div className="text-[9px] sm:text-[10px] font-semibold text-amber-400/90 flex items-center gap-1">
                              <span>💵</span>
                              <span>{t('Hanya Uang Asli')}</span>
                            </div>
                          )}
                        </div>

                        {isOwned ? (
                          <span className="h-7 px-2 sm:px-2.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{t('Dimiliki')}</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItemDetail(item);
                            }}
                            className="h-7 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shadow-xs shrink-0"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </ScrollArea>

      {/* Reusable Filter Sheet Drawer (Tightened width, eliminating empty right gap) */}
      <AppFilterDrawer
        open={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        title={t('Filter Shop')}
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        {renderFilterContent()}
      </AppFilterDrawer>

      {/* ── 3. Reusable Dialog: Item Detail & Purchase Modal ── */}
      <ShopItemModal
        open={Boolean(activeModalItem)}
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        currentUser={currentUser}
        balance={balance}
        ownedItemIds={ownedItemIds}
        wishlistedItemIds={wishlistedItemIds}
        isPurchasing={isPurchasing}
        isEquipping={isEquipping}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
        onToggleWishlist={handleToggleWishlist}
        onOpenEditProduct={handleOpenEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onTopupDew={handleTopupDew}
      />

      {/* ── 4. Reusable Dialog: Wishlist Modal ── */}
      <ShopWishlistModal
        open={isWishlistDrawerOpen}
        onOpenChange={setIsWishlistDrawerOpen}
        wishlist={wishlist}
        currentUser={currentUser}
        onSelectItem={(item) => handleOpenItemDetail(item)}
        onToggleWishlist={handleToggleWishlist}
        onRequireAuth={() => {
          if (requireAuth) {
            requireAuth(
              () => setIsWishlistDrawerOpen(true),
              t('Wishlist Shop'),
              t('Masuk ke Anticeil untuk melihat wishlist Anda.'),
            );
          }
        }}
      />

      {/* ── 5. Reusable Dialog: Add or Edit Product (Fullstack CRUD) ── */}
      <ShopAddProductModal
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        editingProduct={editingProduct}
        newProductForm={newProductForm}
        setNewProductForm={setNewProductForm}
        productImagePreview={productImagePreview}
        productImageFile={productImageFile}
        isCreatingProduct={isCreatingProduct}
        onSaveProduct={handleSaveProduct}
        onProductFileChange={handleProductFileChange}
        onRemoveProductImage={handleRemoveProductImage}
        productFileInputRef={productFileInputRef}
      />
    </div>
  );
}
