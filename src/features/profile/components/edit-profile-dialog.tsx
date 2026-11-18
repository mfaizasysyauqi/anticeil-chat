import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Pencil,
  Sparkles,
  Eye,
  Palette,
  X,
  Plus,
  Gamepad2,
  ExternalLink,
  Check,
  Upload,
  Trash2,
  Image as ImageIcon,
  Shield,
  Layers,
  Heart,
  PlusCircle,
  Link as LinkIcon,
  Crown,
  RotateCcw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { ProfilePreviewCard } from '@/features/user-settings/components/tabs/profiles/profile-preview-card';
import {
  profileApi,
  type UserProfileWidgets,
  type FavoriteGameWidget,
  type WishlistItem,
  type ColonyUserProfile,
} from '../api/profile-api';
import {
  gamesAppsApi,
  type UserConnectionItem,
  type RegisteredGame,
} from '@/features/user-settings/api/games-apps-api';
import { availablePlatforms } from '@/features/user-settings/data/platforms';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import type { Colony } from '@/chat/chat-types';

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  colonies?: Colony[];
  onNavigateSection?: (section: string) => void;
  onOpenUserSettings?: (section?: string) => void;
}

const NAMEPLATE_OPTIONS = [
  { id: 'none', label: 'Default (Tanpa Nameplate)', icon: '🏷️' },
  { id: 'Cyber Teal', label: '⚡ Cyber Teal', icon: '⚡' },
  { id: 'Pixel Hive', label: '👾 Pixel Hive', icon: '👾' },
  { id: 'Midnight Void', label: '🌌 Midnight Void', icon: '🌌' },
  { id: 'Golden Honey', label: '🍯 Golden Honey', icon: '🍯' },
  { id: 'Crimson Neon', label: '🔴 Crimson Neon', icon: '🔴' },
];

const FRAME_OPTIONS = [
  { id: 'none', label: 'Tanpa Frame' },
  { id: 'teal_ring', label: 'Teal Ring' },
  { id: 'gold_bee', label: 'Gold Bee' },
  { id: 'cyber_matrix', label: 'Cyber Matrix' },
  { id: 'sakura_blossom', label: 'Sakura Blossom' },
  { id: 'dark_void', label: 'Dark Void' },
];

const EFFECT_OPTIONS = [
  { id: 'none', label: 'Tanpa Efek' },
  { id: 'teal_sparkles', label: 'Teal Sparkles ✨' },
  { id: 'fireflies', label: 'Fireflies 🌟' },
  { id: 'aurora_glow', label: 'Aurora Glow 🌌' },
];

const THEME_OPTIONS = [
  { id: 'teal', label: 'Teal Mint', gradient: 'from-sidebar-primary/80 to-emerald-600/80' },
  { id: 'charcoal', label: 'Charcoal Dark', gradient: 'from-zinc-700/80 to-zinc-900/80' },
  { id: 'cyber', label: 'Cyber Neon', gradient: 'from-cyan-600/80 to-blue-700/80' },
  { id: 'emerald', label: 'Emerald Forest', gradient: 'from-emerald-600/80 to-teal-800/80' },
  { id: 'purple', label: 'Midnight Purple', gradient: 'from-purple-600/80 to-indigo-800/80' },
  { id: 'amber', label: 'Sunset Amber', gradient: 'from-amber-600/80 to-rose-700/80' },
];

const AVATAR_DECORATION_OPTIONS = [
  { id: 'none', label: 'Tanpa Dekorasi', icon: '🚫' },
  { id: 'sakura', label: 'Sakura Petals Aura', icon: '🌸' },
  { id: 'cyber_crown', label: 'Cyberpunk Crown', icon: '👑' },
  { id: 'flame_aura', label: 'Inferno Flame Aura', icon: '🔥' },
  { id: 'gold_bee', label: 'Golden Hive Halo', icon: '🍯' },
  { id: 'dark_smoke', label: 'Midnight Dark Smoke', icon: '🌫️' },
  { id: 'angel_wings', label: 'Celestial Wings', icon: '🪽' },
];

const DISPLAY_NAME_STYLE_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'cyber', label: 'Cyberpunk Neon' },
  { id: 'retro', label: 'Retro Serif' },
  { id: 'gradient', label: 'Teal Gradient' },
  { id: 'mono', label: 'Terminal Mono' },
];

const SHOP_SUGGESTED_ITEMS: WishlistItem[] = [
  {
    id: 'nectar_vip',
    title: 'Nectar VIP Pass',
    category: 'Perks',
    icon: '🍯',
  },
  {
    id: 'dec_cyber_skull',
    title: 'Cyber Void Skull',
    category: 'Avatar Decoration',
    icon: '💀',
  },
  {
    id: 'frame_sakura',
    title: 'Sakura Blossom Ring',
    category: 'Avatar Frame',
    icon: '🌸',
  },
  {
    id: 'eff_aurora',
    title: 'Aurora Neon Glow',
    category: 'Profile Effect',
    icon: '🌌',
  },
  {
    id: 'eff_fireflies',
    title: 'Fireflies Aura',
    category: 'Profile Effect',
    icon: '🌟',
  },
  {
    id: 'nameplate_pixel',
    title: 'Pixel Hive Crown',
    category: 'Nameplate',
    icon: '👑',
  },
];

export function EditProfileDialog({
  open,
  onOpenChange,
  currentUser,
  currentUserName,
  colonies: initialColonies,
  onNavigateSection,
  onOpenUserSettings,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const defaultAvatar = currentUser?.imageUrl || currentUser?.avatar || null;
  const [profileSubTab, setProfileSubTab] = useState<'board' | 'activity' | 'wishlist'>('board');

  // Main Profile Core Fields
  const [profileBannerColor, setProfileBannerColor] = useState('#5c4d44');
  const [profileBannerUrl, setProfileBannerUrl] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(defaultAvatar);
  const [profileAvatarDecoration, setProfileAvatarDecoration] = useState<string>('none');
  const [profileStatusThought, setProfileStatusThought] = useState('');
  const [isEditingStatusThought, setIsEditingStatusThought] = useState(false);
  const [profileBioText, setProfileBioText] = useState('');
  const [isEditingBioText, setIsEditingBioText] = useState(false);
  const [profilePronouns, setProfilePronouns] = useState('');
  const [isEditingPronouns, setIsEditingPronouns] = useState(false);

  // Customization fields
  const [profileNameplate, setProfileNameplate] = useState('none');
  const [profileFrame, setProfileFrame] = useState('none');
  const [profileEffect, setProfileEffect] = useState('none');
  const [profileTheme, setProfileTheme] = useState('teal');
  const [displayNameStyle, setDisplayNameStyle] = useState('default');

  // Decoration picker popover state
  const [isDecorationPickerOpen, setIsDecorationPickerOpen] = useState(false);

  // Widgets State
  const [profileWidgets, setProfileWidgets] = useState<UserProfileWidgets>({
    favoriteGame: null,
    gamesILike: [],
    wishlist: [],
    activity: null,
    showActivity: true,
    showConnections: true,
    dismissedSuggested: false,
  });

  // Favorite Game Editor
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [gameTitleInput, setGameTitleInput] = useState('');
  const [gameAccountInput, setGameAccountInput] = useState('');
  const [gameRegionInput, setGameRegionInput] = useState('');
  const [gameStatsInput, setGameStatsInput] = useState<Array<{ label: string; value: string }>>([]);

  // Games I Like & Wishlist Inputs
  const [newGameInput, setNewGameInput] = useState('');
  const [newWishlistInput, setNewWishlistInput] = useState('');

  // Activity Editor & Connect Modal
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [activityTitleInput, setActivityTitleInput] = useState('');
  const [activitySubtitleInput, setActivitySubtitleInput] = useState('');
  const [activityIconInput, setActivityIconInput] = useState('🎮');

  // Account Connections
  const [userConnections, setUserConnections] = useState<UserConnectionItem[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatformToConnect, setSelectedPlatformToConnect] = useState(availablePlatforms[0]);
  const [platformAccountInput, setPlatformAccountInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const compressAndLoadImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    onSuccess: (dataUrl: string) => void,
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('Silakan pilih file gambar (PNG, JPG, WebP)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          onSuccess(dataUrl);
        } else {
          onSuccess(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Load Profile, Connections, and Colonies
  useEffect(() => {
    if (!open) return;

    if (defaultAvatar && !profileAvatarUrl) {
      setProfileAvatarUrl(defaultAvatar);
    }

    // Load main profile
    profileApi.getProfile().then((data) => {
      if (data.bannerColor) setProfileBannerColor(data.bannerColor);
      if (data.bannerUrl !== undefined) setProfileBannerUrl(data.bannerUrl);
      if (data.avatarUrl) {
        setProfileAvatarUrl(data.avatarUrl);
      } else if (defaultAvatar) {
        setProfileAvatarUrl(defaultAvatar);
      }
      if (data.avatarDecoration) setProfileAvatarDecoration(data.avatarDecoration);
      if (data.statusThought !== undefined) setProfileStatusThought(data.statusThought);
      if (data.bio !== undefined) setProfileBioText(data.bio);
      if (data.pronouns !== undefined) setProfilePronouns(data.pronouns);
      if (data.nameplate) setProfileNameplate(data.nameplate);
      if (data.profileFrame) setProfileFrame(data.profileFrame);
      if (data.profileEffect) setProfileEffect(data.profileEffect);
      if (data.theme) setProfileTheme(data.theme);
      if (data.displayNameStyle) setDisplayNameStyle(data.displayNameStyle);

      if (data.widgets) {
        setProfileWidgets((prev) => ({ ...prev, ...data.widgets }));
        if (data.widgets.favoriteGame) {
          setGameTitleInput(data.widgets.favoriteGame.title || '');
          setGameAccountInput(data.widgets.favoriteGame.accountName || '');
          setGameRegionInput(data.widgets.favoriteGame.region || '');
          setGameStatsInput(data.widgets.favoriteGame.stats || []);
        }
        if (data.widgets.activity) {
          setActivityTitleInput(data.widgets.activity.title || '');
          setActivitySubtitleInput(data.widgets.activity.subtitle || '');
          setActivityIconInput(data.widgets.activity.icon || '🎮');
        }
      }
    });

    // Load real user connections
    gamesAppsApi.getUserConnections().then(setUserConnections);
  }, [open, currentUser, defaultAvatar]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Save Global Main Profile
      const mergedWidgets: UserProfileWidgets = {
        ...profileWidgets,
        nameplate: profileNameplate,
        profileFrame: profileFrame,
        profileEffect: profileEffect,
        profileTheme: profileTheme,
        avatarDecoration: profileAvatarDecoration,
        displayNameStyle: displayNameStyle,
      };

      await profileApi.updateProfile({
        bannerColor: profileBannerColor,
        bannerUrl: profileBannerUrl,
        avatarUrl: profileAvatarUrl === defaultAvatar ? null : profileAvatarUrl,
        avatarDecoration: profileAvatarDecoration,
        statusThought: profileStatusThought,
        bio: profileBioText,
        pronouns: profilePronouns,
        nameplate: profileNameplate,
        profileFrame: profileFrame,
        profileEffect: profileEffect,
        theme: profileTheme,
        displayNameStyle: displayNameStyle,
        widgets: mergedWidgets,
      });
      toast.success(t('Profil berhasil diperbarui dan disimpan! 🎉'));
    } catch {
      toast.error(t('Gagal menyimpan profil'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNectarCta = () => {
    onOpenChange(false);
    if (onOpenUserSettings) {
      onOpenUserSettings('nitro');
    } else if (onNavigateSection) {
      onNavigateSection('nitro');
    }
  };

  // Favorite Game Widget Handlers
  const handleSaveFavoriteGame = () => {
    if (!gameTitleInput.trim()) {
      toast.error(t('Nama game tidak boleh kosong'));
      return;
    }
    const updatedGame: FavoriteGameWidget = {
      title: gameTitleInput.trim(),
      accountName: gameAccountInput.trim() || currentUserName,
      region: gameRegionInput.trim() || 'Global',
      stats: gameStatsInput.filter((s) => s.label.trim() && s.value.trim()),
    };
    setProfileWidgets((prev) => ({ ...prev, favoriteGame: updatedGame }));
    setIsEditingGame(false);
    toast.success(t('Widget Favorite Game berhasil disimpan!'));
  };

  const handleAddStatRow = () => {
    setGameStatsInput((prev) => [...prev, { label: 'Stat', value: '1' }]);
  };

  const handleRemoveStatRow = (index: number) => {
    setGameStatsInput((prev) => prev.filter((_, i) => i !== index));
  };

  // Games I Like Handlers
  const handleAddGameILike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameInput.trim()) return;
    const current = profileWidgets.gamesILike || [];
    if (current.includes(newGameInput.trim())) {
      toast.info(t('Game sudah ada di daftar!'));
      return;
    }
    const updated = [...current, newGameInput.trim()];
    setProfileWidgets((prev) => ({ ...prev, gamesILike: updated }));
    setNewGameInput('');
    toast.success(t('Game ditambahkan ke daftar!'));
  };

  const handleRemoveGameILike = (game: string) => {
    const current = profileWidgets.gamesILike || [];
    const updated = current.filter((g) => g !== game);
    setProfileWidgets((prev) => ({ ...prev, gamesILike: updated }));
  };

  // Wishlist Handlers
  const handleAddWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishlistInput.trim()) return;
    const newItem: WishlistItem = {
      id: `w-${Date.now()}`,
      title: newWishlistInput.trim(),
      category: 'Item',
      icon: '✨',
    };
    const current = profileWidgets.wishlist || [];
    setProfileWidgets((prev) => ({ ...prev, wishlist: [...current, newItem] }));
    setNewWishlistInput('');
    toast.success(t('Item ditambahkan ke Wishlist!'));
  };

  const handleToggleWishlistItem = (item: WishlistItem) => {
    const current = profileWidgets.wishlist || [];
    const exists = current.some((w) => w.id === item.id || w.title === item.title);
    if (exists) {
      setProfileWidgets((prev) => ({
        ...prev,
        wishlist: current.filter((w) => w.id !== item.id && w.title !== item.title),
      }));
      toast.info(t('Item dihapus dari Wishlist'));
    } else {
      setProfileWidgets((prev) => ({
        ...prev,
        wishlist: [...current, item],
      }));
      toast.success(t('Item ditambahkan ke Wishlist! ❤️'));
    }
  };

  const handleRemoveWishlist = (id: string) => {
    const current = profileWidgets.wishlist || [];
    setProfileWidgets((prev) => ({ ...prev, wishlist: current.filter((w) => w.id !== id) }));
  };

  // Activity Handlers
  const handleSaveActivity = () => {
    if (!activityTitleInput.trim()) {
      toast.error(t('Nama aktivitas diperlukan'));
      return;
    }
    setProfileWidgets((prev) => ({
      ...prev,
      activity: {
        title: activityTitleInput.trim(),
        subtitle: activitySubtitleInput.trim() || t('Aktif sekarang'),
        icon: activityIconInput || '🎮',
        timeAgo: t('Baru saja'),
      },
    }));
    setIsEditingActivity(false);
    toast.success(t('Status aktivitas berhasil diperbarui!'));
  };

  const handleClearActivity = () => {
    setProfileWidgets((prev) => ({ ...prev, activity: null }));
    toast.info(t('Aktivitas dibersihkan'));
  };

  // Connect Account Handler
  const handleConnectPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformAccountInput.trim()) {
      toast.error(t('Nama akun / handle diperlukan'));
      return;
    }
    try {
      const newConn = await gamesAppsApi.addConnection({
        platformId: selectedPlatformToConnect.id,
        accountName: platformAccountInput.trim(),
        platformName: selectedPlatformToConnect.name,
        icon: selectedPlatformToConnect.icon,
        displayOnProfile: true,
        displayStatus: true,
      });
      setUserConnections((prev) => [newConn, ...prev]);
      setPlatformAccountInput('');
      setIsConnectModalOpen(false);
      toast.success(t(`Akun ${selectedPlatformToConnect.name} berhasil dihubungkan!`));
    } catch {
      toast.error(t('Gagal menghubungkan akun'));
    }
  };

  // Active display values for Middle Preview Card
  const activeAvatar = profileAvatarUrl || defaultAvatar;
  const activeName = currentUserName;
  const activeBannerColor = profileBannerColor;
  const activeBannerUrl = profileBannerUrl;
  const activeBio = profileBioText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER, 'bg-card z-[70]')}
        overlayClassName="z-[70]"
      >
        <DialogTitle className="sr-only">{t('Edit Profiles')}</DialogTitle>

        {/* Discord-style Close Button Top-Right (with ESC hint) */}
        <div className="absolute top-3.5 right-4 z-50 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-muted-foreground hover:text-sidebar-primary hover:border-sidebar-primary/60 flex items-center justify-center transition-all cursor-pointer shadow-sm group"
            title={t('Tutup (ESC)')}
            aria-label={t('Tutup')}
          >
            <X className="size-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mt-1">
            ESC
          </span>
        </div>

        {/* Main 3-Column Profile Editor Body (20% Left | 40% Middle | 40% Right) */}
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col lg:flex-row">
            {/* COLUMN 1: LEFT AREA (20%) */}
          <div className="w-full lg:w-[22%] lg:min-w-[240px] shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-background/30 p-4 sm:p-5 overflow-y-auto [scrollbar-width:thin] space-y-4">

            <div className="space-y-4">
              {/* 1. Nameplate Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Nameplate')}
                  </span>
                  <select
                    value={profileNameplate}
                    onChange={(e) => setProfileNameplate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border/80 bg-card hover:border-sidebar-primary/50 text-xs font-semibold text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer transition-colors"
                  >
                    {NAMEPLATE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-card text-foreground">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Avatar & Frame Decoration */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Avatar & Decoration')}
                  </span>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        compressAndLoadImage(file, 256, 256, (dataUrl) => {
                          setProfileAvatarUrl(dataUrl);
                          toast.success(t('Foto avatar dipilih!'));
                        });
                      }
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="p-3 rounded-xl border border-border/70 bg-card hover:border-sidebar-primary/60 flex flex-col items-center justify-center cursor-pointer group relative transition-colors gap-1.5"
                      title={t('Upload avatar')}
                    >
                      <div className="size-11 rounded-full overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center text-xl shadow-inner relative">
                        {activeAvatar ? (
                          <img
                            src={activeAvatar}
                            alt="Avatar"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-sidebar-primary/20 text-sidebar-primary font-bold text-xs select-none">
                            {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-sidebar-primary transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        {t('Upload Avatar')}
                      </span>
                    </div>

                    <div
                      onClick={() => setIsDecorationPickerOpen(!isDecorationPickerOpen)}
                      className="p-3 rounded-xl border border-border/70 bg-card hover:border-sidebar-primary/60 flex flex-col items-center justify-center cursor-pointer group relative transition-colors gap-1.5"
                      title={t('Pilih Dekorasi Avatar')}
                    >
                      <div className="size-11 rounded-full border border-dashed border-border/80 bg-muted/20 flex items-center justify-center text-xl">
                        {profileAvatarDecoration !== 'none' ? (
                          <span>
                            {AVATAR_DECORATION_OPTIONS.find((d) => d.id === profileAvatarDecoration)
                              ?.icon || '✨'}
                          </span>
                        ) : (
                          <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-sidebar-primary transition-colors" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-sidebar-primary transition-colors flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {t('Dekorasi')}
                      </span>
                    </div>
                  </div>

                  {/* Decoration Selector Popover */}
                  {isDecorationPickerOpen && (
                    <div className="p-3 rounded-xl border border-sidebar-primary/40 bg-card shadow-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                        <span>{t('Pilih Dekorasi Avatar')}</span>
                        <X
                          className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => setIsDecorationPickerOpen(false)}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto [scrollbar-width:thin]">
                        {AVATAR_DECORATION_OPTIONS.map((dec) => (
                          <button
                            key={dec.id}
                            type="button"
                            onClick={() => {
                              setProfileAvatarDecoration(dec.id);
                              setIsDecorationPickerOpen(false);
                              toast.success(t(`Dekorasi ${dec.label} dipilih!`));
                            }}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer',
                              profileAvatarDecoration === dec.id
                                ? 'bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/40'
                                : 'hover:bg-muted text-foreground',
                            )}
                          >
                            <span className="text-base">{dec.icon}</span>
                            <span className="truncate">{dec.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Banner Color & Image */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Banner Color & Image')}
                  </span>
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        compressAndLoadImage(file, 800, 300, (dataUrl) => {
                          setProfileBannerUrl(dataUrl);
                          toast.success(t('Foto banner dipilih!'));
                        });
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profileBannerColor}
                      onChange={(e) => setProfileBannerColor(e.target.value)}
                      className="size-8 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={profileBannerColor}
                      onChange={(e) => setProfileBannerColor(e.target.value)}
                      className="w-20 text-xs p-1.5 rounded-lg border border-border/80 bg-card text-foreground font-mono"
                    />
                    <Button
                      size="sm"
                      variant="tealOutline"
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex-1 text-xs h-8 font-semibold cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1" />
                      {t('Upload')}
                    </Button>
                    {profileBannerUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProfileBannerUrl(null)}
                        className="h-8 px-2 text-destructive hover:bg-destructive/10"
                        title={t('Hapus Gambar Banner')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 4. Profile Effect & Frame */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Profile Effect & Frame')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        {t('Avatar Frame')}
                      </label>
                      <select
                        value={profileFrame}
                        onChange={(e) => setProfileFrame(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border/70 bg-card text-[11px] text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer"
                      >
                        {FRAME_OPTIONS.map((frm) => (
                          <option key={frm.id} value={frm.id} className="bg-card text-foreground">
                            {frm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        {t('Visual Effect')}
                      </label>
                      <select
                        value={profileEffect}
                        onChange={(e) => setProfileEffect(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border/70 bg-card text-[11px] text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer"
                      >
                        {EFFECT_OPTIONS.map((eff) => (
                          <option key={eff.id} value={eff.id} className="bg-card text-foreground">
                            {eff.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Display Name Style */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Display Name Style')}
                  </span>
                  <select
                    value={displayNameStyle}
                    onChange={(e) => setDisplayNameStyle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border/80 bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer"
                  >
                    {DISPLAY_NAME_STYLE_OPTIONS.map((style) => (
                      <option key={style.id} value={style.id} className="bg-card text-foreground">
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Profile Theme */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Profile Theme')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setProfileTheme(theme.id)}
                        className={cn(
                          'p-2 rounded-lg border text-left text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer',
                          profileTheme === theme.id
                            ? 'border-sidebar-primary bg-sidebar-primary/15 text-sidebar-primary'
                            : 'border-border/70 bg-card hover:border-sidebar-primary/40 text-muted-foreground',
                        )}
                      >
                        <span className="truncate">{theme.label}</span>
                        <span className={cn('size-3 rounded-full shrink-0 bg-gradient-to-r', theme.gradient)} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Nectar Promo Box */}
                <div className="p-3.5 rounded-xl border border-sidebar-primary/40 bg-sidebar-primary/10 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground leading-snug">
                    {t('Level up your look, only with Nectar')}
                  </div>
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={handleNectarCta}
                    className="w-full text-xs h-8 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    {t('Preview Nectar')}
                  </Button>
                </div>
              </div>

            {/* Save Changes Button */}
            <div className="pt-2 border-t border-border/60">
              <Button
                size="sm"
                variant="teal"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full font-bold text-xs h-9 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}</span>
              </Button>
            </div>
          </div>

          {/* COLUMN 2: MIDDLE AREA (40%) LIVE PROFILE CARD PREVIEW */}
          <div className="w-full lg:w-[38%] shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20 px-3 sm:px-4 py-4 sm:py-5 flex items-center justify-center overflow-y-auto [scrollbar-width:thin]">
            <div className="w-full max-w-[420px] 2xl:max-w-[460px] my-auto">
              <ProfilePreviewCard
                currentUserName={activeName}
                profileBannerColor={activeBannerColor}
                profileBannerUrl={activeBannerUrl}
                profileAvatarUrl={activeAvatar}
                defaultAvatarUrl={defaultAvatar}
                profileStatusThought={profileStatusThought}
                setProfileStatusThought={setProfileStatusThought}
                isEditingStatusThought={isEditingStatusThought}
                setIsEditingStatusThought={setIsEditingStatusThought}
                profilePronouns={profilePronouns}
                setProfilePronouns={setProfilePronouns}
                isEditingPronouns={isEditingPronouns}
                setIsEditingPronouns={setIsEditingPronouns}
                profileBioText={profileBioText}
                setProfileBioText={setProfileBioText}
                isEditingBioText={isEditingBioText}
                setIsEditingBioText={setIsEditingBioText}
                onNavigateSection={handleNectarCta}
                nameplate={profileNameplate}
                profileFrame={profileFrame}
                profileEffect={profileEffect}
                profileTheme={profileTheme}
                avatarDecoration={profileAvatarDecoration}
                displayNameStyle={displayNameStyle}
                connections={userConnections}
                memberSince={
                  currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '17 Nov 2026'
                }
              />
            </div>
          </div>

          {/* COLUMN 3: RIGHT AREA (40%) PROFILE TABS (BOARD | ACTIVITY | WISHLIST) */}
          <div className="w-full lg:w-[40%] flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto [scrollbar-width:thin] space-y-4">
            {/* Top Navigation Tabs */}
            <div className="flex items-center border-b border-border/60 gap-6 text-xs font-bold pb-2">
              <button
                type="button"
                onClick={() => setProfileSubTab('board')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'board'
                    ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Board')}
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('activity')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'activity'
                    ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Activity')}
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('wishlist')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'wishlist'
                    ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Wishlist')}
              </button>
            </div>

            {/* TAB 1: BOARD */}
            {profileSubTab === 'board' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{t('Your Widgets')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="teal"
                      onClick={() => {
                        if (!profileWidgets.favoriteGame) {
                          setIsEditingGame(true);
                        } else if (!profileWidgets.gamesILike || profileWidgets.gamesILike.length === 0) {
                          setProfileWidgets((prev) => ({
                            ...prev,
                            gamesILike: ['Valorant'],
                          }));
                          toast.success(t('Widget Games I Like ditambahkan!'));
                        } else {
                          setIsEditingGame(true);
                        }
                      }}
                      className="text-xs px-3 h-8 font-semibold cursor-pointer"
                    >
                      + {t('Add Widget')}
                    </Button>
                  </div>
                </div>

                {/* Suggested for you (Discord Board Image 3) */}
                {!profileWidgets.dismissedSuggested && (
                  <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3 relative shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t('Suggested for you')}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setProfileWidgets((prev) => ({ ...prev, dismissedSuggested: true }))
                        }
                        className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                        title={t('Tutup')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => {
                          setIsEditingGame(true);
                        }}
                        className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-950 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-sm transition-colors"
                      >
                        <div className="size-6 rounded-full bg-white/10 group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground flex items-center justify-center text-xs text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white/90">
                          {t('Favorite Game')}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          const current = profileWidgets.gamesILike || [];
                          if (current.length === 0) {
                            setProfileWidgets((prev) => ({
                              ...prev,
                              gamesILike: ['Valorant'],
                            }));
                            toast.success(t('Widget Games I Like ditambahkan!'));
                          } else {
                            toast.info(t('Widget Games I Like sudah aktif di bawah'));
                          }
                        }}
                        className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-teal-950/40 to-slate-950 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-sm transition-colors"
                      >
                        <div className="size-6 rounded-full bg-white/10 group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground flex items-center justify-center text-xs text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white/90">
                          {t('Games I Like')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Favorite Game Editor Form */}
                {isEditingGame && (
                  <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-sidebar-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t('Konfigurasi Favorite Game')}
                      </span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditingGame(false)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Nama Game')}
                        </label>
                        <input
                          type="text"
                          value={gameTitleInput}
                          onChange={(e) => setGameTitleInput(e.target.value)}
                          placeholder="e.g. Valorant / Dota 2"
                          className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-sidebar-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('IGN / Akun')}
                        </label>
                        <input
                          type="text"
                          value={gameAccountInput}
                          onChange={(e) => setGameAccountInput(e.target.value)}
                          placeholder="e.g. Faiz#1234"
                          className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-sidebar-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Server / Region')}
                        </label>
                        <input
                          type="text"
                          value={gameRegionInput}
                          onChange={(e) => setGameRegionInput(e.target.value)}
                          placeholder="e.g. Asia / SEA / Global"
                          className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-sidebar-primary"
                        />
                      </div>
                    </div>

                    {/* Dynamic Stats Row Editor */}
                    <div className="space-y-2 pt-2 border-t border-sidebar-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">
                          {t('Statistik Pemain (Opsional)')}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="tealGhost"
                          onClick={handleAddStatRow}
                          className="h-6 text-[10px] px-2 cursor-pointer"
                        >
                          + {t('Tambah Stat')}
                        </Button>
                      </div>

                      {gameStatsInput.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={st.label}
                            onChange={(e) => {
                              const updated = [...gameStatsInput];
                              updated[idx].label = e.target.value;
                              setGameStatsInput(updated);
                            }}
                            placeholder="e.g. Rank / Level"
                            className="w-1/2 text-xs p-1.5 rounded border border-border bg-card text-foreground"
                          />
                          <input
                            type="text"
                            value={st.value}
                            onChange={(e) => {
                              const updated = [...gameStatsInput];
                              updated[idx].value = e.target.value;
                              setGameStatsInput(updated);
                            }}
                            placeholder="e.g. Immortal / 120"
                            className="w-1/2 text-xs p-1.5 rounded border border-border bg-card text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStatRow(idx)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => setIsEditingGame(false)}
                        className="h-7 text-xs"
                      >
                        {t('Batal')}
                      </Button>
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={handleSaveFavoriteGame}
                        className="h-7 text-xs font-bold"
                      >
                        {t('Simpan Widget')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Favorite Game Card Widget (Active) */}
                {profileWidgets.favoriteGame && !isEditingGame && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-xl shadow-sm text-sidebar-primary">
                          🎮
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {profileWidgets.favoriteGame.title}
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {profileWidgets.favoriteGame.accountName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {profileWidgets.favoriteGame.region}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="tealGhost"
                          onClick={() => {
                            setGameTitleInput(profileWidgets.favoriteGame?.title || '');
                            setGameAccountInput(profileWidgets.favoriteGame?.accountName || '');
                            setGameRegionInput(profileWidgets.favoriteGame?.region || '');
                            setGameStatsInput(profileWidgets.favoriteGame?.stats || []);
                            setIsEditingGame(true);
                          }}
                          className="h-8 px-2 text-xs cursor-pointer"
                          title={t('Edit Game')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setProfileWidgets((prev) => ({ ...prev, favoriteGame: null }));
                            toast.info(t('Widget Favorite Game disembunyikan'));
                          }}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={t('Hapus Widget')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {profileWidgets.favoriteGame.stats &&
                      profileWidgets.favoriteGame.stats.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-t border-border/50 text-center">
                          {profileWidgets.favoriteGame.stats.map((stat, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-secondary/60">
                              <div className="text-base font-extrabold text-foreground truncate">
                                {stat.value}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Games I Like Chips Widget */}
                {profileWidgets.gamesILike && profileWidgets.gamesILike.length > 0 && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        🎮 {t('Games I Like')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {profileWidgets.gamesILike.length} {t('Game')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setProfileWidgets((prev) => ({ ...prev, gamesILike: [] }))
                          }
                          className="h-6 px-1 text-destructive hover:bg-destructive/10"
                          title={t('Hapus Widget Games I Like')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {profileWidgets.gamesILike.map((game) => (
                        <span
                          key={game}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium border border-border/70 group"
                        >
                          <span>{game}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGameILike(game)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                            title={t('Hapus game')}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddGameILike} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newGameInput}
                        onChange={(e) => setNewGameInput(e.target.value)}
                        placeholder={t('Tambah game favorit (e.g. Valorant, Apex, CS2)...')}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-sidebar-primary"
                      />
                      <Button type="submit" size="sm" variant="teal" className="h-7 text-xs font-semibold">
                        + {t('Tambah')}
                      </Button>
                    </form>
                  </div>
                )}

                {/* Empty State when no widgets on board */}
                {!profileWidgets.favoriteGame &&
                  (!profileWidgets.gamesILike || profileWidgets.gamesILike.length === 0) && (
                    <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
                      <div className="size-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl mx-auto">
                        🎮
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-foreground">
                          {t('Belum ada widget di Board')}
                        </div>
                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {t(
                            'Pilih "Favorite Game" atau "Games I Like" dari saran di atas atau klik "+ Add Widget" untuk mulai memamerkan aktivitas game favorit Anda.',
                          )}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* TAB 2: ACTIVITY (Discord Image 4) */}
            {profileSubTab === 'activity' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card">
                  <div className="space-y-0.5 pr-3">
                    <div className="text-xs font-bold text-foreground">
                      {t('Tampilkan Aktivitas Saat Ini')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {t('Tampilkan aktivitas game atau software Anda sebagai status pesan secara otomatis.')}
                    </div>
                  </div>
                  <Switch
                    checked={profileWidgets.showActivity !== false}
                    onCheckedChange={(checked) =>
                      setProfileWidgets((prev) => ({ ...prev, showActivity: checked }))
                    }
                  />
                </div>

                {/* Active Activity Card (if set) */}
                {profileWidgets.activity ? (
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-xl text-sidebar-primary">
                          {profileWidgets.activity.icon || '🎮'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {profileWidgets.activity.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {profileWidgets.activity.subtitle} • {profileWidgets.activity.timeAgo || t('Aktif sekarang')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="tealGhost"
                          onClick={() => {
                            setActivityTitleInput(profileWidgets.activity?.title || '');
                            setActivitySubtitleInput(profileWidgets.activity?.subtitle || '');
                            setIsEditingActivity(true);
                          }}
                          className="text-xs h-7 px-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearActivity}
                          className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Discord Native Empty State (Image 4) */
                  <div className="p-6 rounded-2xl border border-border/70 bg-card text-center space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-foreground">
                        {t('You don’t have any activity here')}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {t(
                          'Connect your accounts to share your in-game status and activity. You’re in control of what you share.',
                        )}
                      </p>
                    </div>

                    {/* Discord Platform Icons Grid */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-sm mx-auto">
                      {availablePlatforms.slice(0, 12).map((p) => {
                        const isConnected = userConnections.some((c) => c.platformId === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlatformToConnect(p);
                              setIsConnectModalOpen(true);
                            }}
                            className={cn(
                              'size-9 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer relative group',
                              isConnected
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border/80 bg-secondary/80 hover:border-sidebar-primary hover:scale-105',
                            )}
                            title={isConnected ? `${p.name} (Terhubung)` : `Hubungkan ${p.name}`}
                          >
                            <span>{p.icon}</span>
                            {isConnected && (
                              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border border-card" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Buttons: Connect Accounts & Add Game */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => setIsConnectModalOpen(true)}
                        className="text-xs h-9 px-4 font-bold cursor-pointer"
                      >
                        {t('Connect Accounts')}
                      </Button>
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={() => setIsEditingActivity(true)}
                        className="text-xs h-9 px-4 font-bold cursor-pointer"
                      >
                        {t('Add Game')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Activity / Game Editor */}
                {isEditingActivity && (
                  <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-sidebar-primary/10 space-y-3">
                    <span className="text-xs font-bold text-foreground">
                      {t('Atur Aktivitas Game / Software')}
                    </span>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Judul Aktivitas / Nama Game')}
                        </label>
                        <input
                          type="text"
                          value={activityTitleInput}
                          onChange={(e) => setActivityTitleInput(e.target.value)}
                          placeholder="e.g. Playing Valorant / Coding"
                          className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-sidebar-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Detail / Status')}
                        </label>
                        <input
                          type="text"
                          value={activitySubtitleInput}
                          onChange={(e) => setActivitySubtitleInput(e.target.value)}
                          placeholder="e.g. Competitive Match / Ranked"
                          className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-sidebar-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => setIsEditingActivity(false)}
                        className="h-7 text-xs"
                      >
                        {t('Batal')}
                      </Button>
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={handleSaveActivity}
                        className="h-7 text-xs font-bold"
                      >
                        {t('Simpan Aktivitas')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: WISHLIST (Discord Image 2) */}
            {profileSubTab === 'wishlist' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* User's Wishlist Items */}
                {profileWidgets.wishlist && profileWidgets.wishlist.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        🎁 {t('Item Favorit Anda')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {profileWidgets.wishlist.length} {t('Item')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {profileWidgets.wishlist.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between hover:border-sidebar-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon || '🎁'}</span>
                            <div>
                              <div className="text-xs font-bold text-foreground">{item.title}</div>
                              {item.category && (
                                <div className="text-[10px] text-sidebar-primary font-medium">
                                  {item.category}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="tealGhost"
                              onClick={() => {
                                if (item.category === 'Avatar Decoration') {
                                  setProfileAvatarDecoration('sakura');
                                } else if (item.category === 'Avatar Frame') {
                                  setProfileFrame('sakura_blossom');
                                } else if (item.category === 'Profile Effect') {
                                  setProfileEffect('aurora_glow');
                                } else if (item.category === 'Nameplate') {
                                  setProfileNameplate('Pixel Hive');
                                }
                                toast.success(t(`Preview ${item.title} aktif di profil!`));
                              }}
                              className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer"
                            >
                              {t('Preview')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveWishlist(item.id)}
                              className="h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                              title={t('Hapus dari Wishlist')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Discord Native Empty Wishlist (Image 2) */
                  <div className="p-8 rounded-2xl border border-border/70 bg-card text-center space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
                        <span>{t('No hearts yet')}</span>
                        <span>💔</span>
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {t('Browse the Shop and heart the items you love to add them here.')}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="teal"
                      onClick={handleNectarCta}
                      className="text-xs h-9 px-5 font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {t('Explore the Shop')}
                    </Button>
                  </div>
                )}

                {/* Suggested Items for You (Discord Image 2 Shop Grid) */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-foreground">
                    {t('Suggested items for you')}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SHOP_SUGGESTED_ITEMS.map((item) => {
                      const isHearted = (profileWidgets.wishlist || []).some(
                        (w) => w.id === item.id || w.title === item.title,
                      );
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-border/80 bg-card flex flex-col justify-between hover:border-sidebar-primary/60 transition-colors shadow-xs group"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-2xl">{item.icon}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleWishlistItem(item)}
                              className={cn(
                                'p-1 rounded-full transition-colors cursor-pointer',
                                isHearted
                                  ? 'text-rose-500 hover:text-rose-600'
                                  : 'text-muted-foreground hover:text-rose-400',
                              )}
                              title={isHearted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
                            >
                              <Heart
                                className={cn('w-4 h-4', isHearted && 'fill-current')}
                              />
                            </button>
                          </div>
                          <div className="mt-2 space-y-0.5">
                            <div className="text-xs font-bold text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate font-medium">
                              {item.category}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="tealGhost"
                            onClick={() => {
                              if (item.category === 'Avatar Decoration') {
                                setProfileAvatarDecoration('cyber_crown');
                              } else if (item.category === 'Avatar Frame') {
                                setProfileFrame('sakura_blossom');
                              } else if (item.category === 'Profile Effect') {
                                setProfileEffect(item.id === 'eff_aurora' ? 'aurora_glow' : 'fireflies');
                              } else if (item.category === 'Nameplate') {
                                setProfileNameplate('Pixel Hive');
                              }
                              toast.success(t(`Preview ${item.title} dicoba di profil!`));
                            }}
                            className="mt-2 h-7 text-[10px] w-full font-semibold cursor-pointer"
                          >
                            {t('Preview')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Wishlist Item */}
                <form onSubmit={handleAddWishlist} className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <input
                    type="text"
                    value={newWishlistInput}
                    onChange={(e) => setNewWishlistInput(e.target.value)}
                    placeholder={t('Tambah item kustom ke Wishlist...')}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-sidebar-primary"
                  />
                  <Button type="submit" size="sm" variant="teal" className="h-8 text-xs font-bold">
                    + {t('Tambah')}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Quick Connect Account Dialog */}
        {isConnectModalOpen && (
          <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border/80 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedPlatformToConnect.icon}</span>
                  <span className="text-sm font-bold text-foreground">
                    {t('Hubungkan')} {selectedPlatformToConnect.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Platform Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  {t('Pilih Platform')}
                </label>
                <select
                  value={selectedPlatformToConnect.id}
                  onChange={(e) => {
                    const found = availablePlatforms.find((p) => p.id === e.target.value);
                    if (found) setSelectedPlatformToConnect(found);
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-secondary text-foreground"
                >
                  {availablePlatforms.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card text-foreground">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleConnectPlatform} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {t('Nama Akun / Username')}
                  </label>
                  <input
                    type="text"
                    value={platformAccountInput}
                    onChange={(e) => setPlatformAccountInput(e.target.value)}
                    placeholder={`Username di ${selectedPlatformToConnect.name}`}
                    autoFocus
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-sidebar-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="tealSecondary"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="h-8 text-xs"
                  >
                    {t('Batal')}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="teal"
                    className="h-8 text-xs font-bold"
                  >
                    {t('Hubungkan')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
