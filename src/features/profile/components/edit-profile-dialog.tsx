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
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { ProfilePreviewCard } from '@/features/user-settings/components/tabs/profiles/profile-preview-card';
import {
  profileApi,
  UserProfileWidgets,
  FavoriteGameWidget,
  WishlistItem,
} from '../api/profile-api';

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  onNavigateSection?: (section: string) => void;
  onOpenUserSettings?: (section?: string) => void;
}

const NAMEPLATE_OPTIONS = [
  { id: 'none', label: 'Default (Tanpa Nameplate)', icon: '🏷️' },
  { id: 'Cyber Teal', label: '⚡ Cyber Teal', icon: '⚡' },
  { id: 'Pixel Hive', label: '👾 Pixel Hive', icon: '👾' },
  { id: 'Midnight Void', label: '🌌 Midnight Void', icon: '🌌' },
  { id: 'Golden Honey', label: '🍯 Golden Honey', icon: '🍯' },
];

const FRAME_OPTIONS = [
  { id: 'none', label: 'Tanpa Frame' },
  { id: 'teal_ring', label: 'Teal Ring' },
  { id: 'gold_bee', label: 'Gold Bee' },
  { id: 'cyber_matrix', label: 'Cyber Matrix' },
  { id: 'sakura_blossom', label: 'Sakura Blossom' },
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
  { id: 'gold', label: 'Golden Honey', gradient: 'from-amber-500/80 to-orange-600/80' },
];

export function EditProfileDialog({
  open,
  onOpenChange,
  currentUser,
  currentUserName,
  onNavigateSection,
  onOpenUserSettings,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const defaultAvatar = currentUser?.imageUrl || currentUser?.avatar || null;
  const [profileSubTab, setProfileSubTab] = useState<'board' | 'activity' | 'wishlist'>('board');
  const [profileSelectedType, setProfileSelectedType] = useState<'main' | 'server'>('main');

  // Core profile fields
  const [profileBannerColor, setProfileBannerColor] = useState('#5c4d44');
  const [profileBannerUrl, setProfileBannerUrl] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(defaultAvatar);
  const [profileStatusThought, setProfileStatusThought] = useState('Shower thought?');
  const [isEditingStatusThought, setIsEditingStatusThought] = useState(false);
  const [profileBioText, setProfileBioText] = useState('Your life in one sentence');
  const [isEditingBioText, setIsEditingBioText] = useState(false);
  const [profilePronouns, setProfilePronouns] = useState('');
  const [isEditingPronouns, setIsEditingPronouns] = useState(false);

  // Fullstack Customization Fields
  const [profileNameplate, setProfileNameplate] = useState('none');
  const [profileFrame, setProfileFrame] = useState('none');
  const [profileEffect, setProfileEffect] = useState('none');
  const [profileTheme, setProfileTheme] = useState('teal');

  // Widgets State
  const [profileWidgets, setProfileWidgets] = useState<UserProfileWidgets>({
    favoriteGame: {
      title: 'Neverness to Everness',
      accountName: 'DartX',
      region: 'SEA',
      stats: [
        { label: 'Hunter Lv.', value: '58' },
        { label: 'Appraiser Since', value: '2026-04-29' },
        { label: 'Characters', value: '23' },
        { label: 'Vehicles', value: '10' },
        { label: 'Achievements', value: '275' },
        { label: 'City Tycoon Lv.', value: '45' },
      ],
    },
    gamesILike: ['Minecraft', 'Valorant'],
    wishlist: [
      { id: 'w1', title: 'Nectar VIP Subscription', category: 'Perks', icon: '🍯' },
      { id: 'w2', title: 'Neverness to Everness Pass', category: 'Game', icon: '🎮' },
    ],
    activity: {
      title: 'Neverness to Everness',
      subtitle: 'Exploring SEA Server',
      timeAgo: '2 jam yang lalu',
    },
    showActivity: true,
    showConnections: true,
    dismissedSuggested: false,
  });

  const [isEditingGame, setIsEditingGame] = useState(false);
  const [gameTitleInput, setGameTitleInput] = useState('Neverness to Everness');
  const [gameAccountInput, setGameAccountInput] = useState('DartX');
  const [gameRegionInput, setGameRegionInput] = useState('SEA');

  const [newGameInput, setNewGameInput] = useState('');
  const [newWishlistInput, setNewWishlistInput] = useState('');
  const [activityTitleInput, setActivityTitleInput] = useState('');
  const [activitySubtitleInput, setActivitySubtitleInput] = useState('');
  const [isEditingActivity, setIsEditingActivity] = useState(false);

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

  useEffect(() => {
    if (open) {
      if (defaultAvatar && !profileAvatarUrl) {
        setProfileAvatarUrl(defaultAvatar);
      }
      profileApi.getProfile().then((data) => {
        if (data.bannerColor) setProfileBannerColor(data.bannerColor);
        if (data.bannerUrl !== undefined) setProfileBannerUrl(data.bannerUrl);
        if (data.avatarUrl) {
          setProfileAvatarUrl(data.avatarUrl);
        } else if (defaultAvatar) {
          setProfileAvatarUrl(defaultAvatar);
        }
        if (data.statusThought) setProfileStatusThought(data.statusThought);
        if (data.bio) setProfileBioText(data.bio);
        if (data.pronouns) setProfilePronouns(data.pronouns);

        if (data.widgets) {
          setProfileWidgets((prev) => ({ ...prev, ...data.widgets }));
          if (data.widgets.nameplate) setProfileNameplate(data.widgets.nameplate);
          if (data.widgets.profileFrame) setProfileFrame(data.widgets.profileFrame);
          if (data.widgets.profileEffect) setProfileEffect(data.widgets.profileEffect);
          if (data.widgets.profileTheme) setProfileTheme(data.widgets.profileTheme);
          if (data.widgets.favoriteGame) {
            setGameTitleInput(data.widgets.favoriteGame.title);
            setGameAccountInput(data.widgets.favoriteGame.accountName);
            setGameRegionInput(data.widgets.favoriteGame.region);
          }
          if (data.widgets.activity) {
            setActivityTitleInput(data.widgets.activity.title);
            setActivitySubtitleInput(data.widgets.activity.subtitle);
          }
        }
        if (data.nameplate) setProfileNameplate(data.nameplate);
        if (data.profileFrame) setProfileFrame(data.profileFrame);
        if (data.profileEffect) setProfileEffect(data.profileEffect);
        if (data.theme) setProfileTheme(data.theme);
      });
    }
  }, [open, currentUser, defaultAvatar]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const mergedWidgets: UserProfileWidgets = {
        ...profileWidgets,
        nameplate: profileNameplate,
        profileFrame: profileFrame,
        profileEffect: profileEffect,
        profileTheme: profileTheme,
      };

      await profileApi.updateProfile({
        bannerColor: profileBannerColor,
        bannerUrl: profileBannerUrl,
        avatarUrl: profileAvatarUrl === defaultAvatar ? null : profileAvatarUrl,
        statusThought: profileStatusThought,
        bio: profileBioText,
        pronouns: profilePronouns,
        nameplate: profileNameplate,
        profileFrame: profileFrame,
        profileEffect: profileEffect,
        theme: profileTheme,
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

  // Widget management helpers
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

  const handleSaveFavoriteGame = () => {
    const updatedGame: FavoriteGameWidget = {
      title: gameTitleInput.trim() || 'Neverness to Everness',
      accountName: gameAccountInput.trim() || 'Player',
      region: gameRegionInput.trim() || 'Global',
      stats: profileWidgets.favoriteGame?.stats || [
        { label: 'Hunter Lv.', value: '58' },
        { label: 'Appraiser Since', value: '2026-04-29' },
        { label: 'Characters', value: '23' },
        { label: 'Vehicles', value: '10' },
        { label: 'Achievements', value: '275' },
        { label: 'City Tycoon Lv.', value: '45' },
      ],
    };
    setProfileWidgets((prev) => ({ ...prev, favoriteGame: updatedGame }));
    setIsEditingGame(false);
    toast.success(t('Widget Favorite Game berhasil diperbarui!'));
  };

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

  const handleRemoveWishlist = (id: string) => {
    const current = profileWidgets.wishlist || [];
    setProfileWidgets((prev) => ({ ...prev, wishlist: current.filter((w) => w.id !== id) }));
  };

  const handleSaveActivity = () => {
    if (!activityTitleInput.trim()) return;
    setProfileWidgets((prev) => ({
      ...prev,
      activity: {
        title: activityTitleInput.trim(),
        subtitle: activitySubtitleInput.trim() || 'Aktivitas Baru',
        timeAgo: 'Baru saja',
      },
    }));
    setIsEditingActivity(false);
    toast.success(t('Status aktivitas berhasil diperbarui!'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 w-[90vw] max-w-[90vw] h-[90vh] sm:h-[90dvh] max-h-[90vh] sm:max-h-[90dvh] overflow-hidden bg-card border border-border flex flex-col rounded-2xl shadow-2xl gap-0 select-none z-[70]"
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
          <div className="w-full lg:w-[20%] lg:min-w-[220px] shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-background/30 p-4 sm:p-5 overflow-y-auto [scrollbar-width:thin] space-y-4">
            {/* Profile Switcher (Main Profile / Colony Profile) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileSelectedType((prev) => (prev === 'main' ? 'server' : 'main'))
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/60 hover:border-sidebar-primary/40 transition-colors cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {t('Profiles')}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {profileSelectedType === 'main' ? t('Main Profile') : t('Server Profile')}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 1. Nameplate Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Nameplate')}
              </span>
              <div className="space-y-1">
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
                  title={t('Klik untuk upload avatar baru')}
                >
                  <div className="size-12 rounded-full overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center text-xl shadow-inner relative">
                    {profileAvatarUrl || defaultAvatar ? (
                      <img
                        src={(profileAvatarUrl || defaultAvatar)!}
                        alt="Avatar"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-sidebar-primary/20 text-sidebar-primary font-bold text-sm select-none">
                        {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Upload className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold group-hover:text-sidebar-primary">
                    {profileAvatarUrl && profileAvatarUrl !== defaultAvatar
                      ? t('Ganti Avatar')
                      : t('Upload Avatar')}
                  </span>
                </div>
                <div
                  onClick={() => {
                    if (profileAvatarUrl && profileAvatarUrl !== defaultAvatar) {
                      setProfileAvatarUrl(null);
                      toast.info(t('Avatar dikembalikan ke avatar default'));
                    } else {
                      const next =
                        profileFrame === 'none'
                          ? 'teal_ring'
                          : profileFrame === 'teal_ring'
                          ? 'gold_bee'
                          : profileFrame === 'gold_bee'
                          ? 'cyber_matrix'
                          : 'none';
                      setProfileFrame(next);
                      toast.info(t(`Frame diubah: ${next}`));
                    }
                  }}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:border-sidebar-primary/60 flex flex-col items-center justify-center cursor-pointer group transition-colors gap-1.5"
                >
                  {profileAvatarUrl && profileAvatarUrl !== defaultAvatar ? (
                    <>
                      <div className="size-12 rounded-full border border-destructive/40 bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-destructive font-semibold">
                        {t('Hapus Custom')}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="size-12 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground group-hover:text-sidebar-primary group-hover:border-sidebar-primary transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold group-hover:text-sidebar-primary">
                        {profileFrame !== 'none' ? profileFrame : t('Dekorasi')}
                      </span>
                    </>
                  )}
                </div>
              </div>
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
                    compressAndLoadImage(file, 1200, 400, (dataUrl) => {
                      setProfileBannerUrl(dataUrl);
                      toast.success(t('Gambar banner dipilih!'));
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
                <div
                  className="flex-1 h-8 rounded-lg border border-border/70 flex items-center justify-between px-3 text-xs font-mono text-muted-foreground shadow-xs bg-cover bg-center overflow-hidden"
                  style={{
                    backgroundColor: profileBannerColor,
                    backgroundImage: profileBannerUrl ? `url(${profileBannerUrl})` : undefined,
                  }}
                >
                  <span className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">
                    {profileBannerColor}
                  </span>
                  {profileBannerUrl && (
                    <span className="bg-sidebar-primary text-sidebar-primary-foreground px-1.5 py-0.5 rounded font-sans text-[10px] font-bold">
                      {t('Custom Image')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="tealOutline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex-1 h-7 text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{profileBannerUrl ? t('Ganti Banner') : t('Upload Banner')}</span>
                </Button>
                {profileBannerUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfileBannerUrl(null);
                      toast.info(t('Gambar banner dihapus'));
                    }}
                    className="h-7 text-[11px] text-destructive hover:bg-destructive/10 rounded-lg px-2 cursor-pointer"
                    title={t('Hapus Banner')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 4. Profile Effect & Frame Selectors */}
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
                    {FRAME_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-card text-foreground">
                        {f.label}
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

            {/* 5. Nectar Promo Box */}
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

            {/* 6. Display Name Style */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Display Name Style')}
              </span>
              <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-center">
                <span className="text-sm font-extrabold text-sidebar-primary tracking-wide font-mono">
                  {currentUserName}
                </span>
              </div>
            </div>

            {/* 7. Profile Theme */}
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
                    <span>{theme.label}</span>
                    <span className={cn('size-3 rounded-full bg-gradient-to-r', theme.gradient)} />
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Save Changes Action */}
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
          <div className="w-full lg:w-[40%] shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20 px-3 sm:px-4 py-4 sm:py-5 flex items-center justify-center overflow-y-auto [scrollbar-width:thin]">
            <div className="w-full max-w-[420px] 2xl:max-w-[460px] my-auto">
              <ProfilePreviewCard
                currentUserName={currentUserName}
                profileBannerColor={profileBannerColor}
                profileBannerUrl={profileBannerUrl}
                profileAvatarUrl={profileAvatarUrl}
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

          {/* COLUMN 3: RIGHT AREA (40%) PROFILE TABS */}
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
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={() => {
                      if (!profileWidgets.favoriteGame) {
                        setProfileWidgets((prev) => ({
                          ...prev,
                          favoriteGame: {
                            title: 'Neverness to Everness',
                            accountName: 'DartX',
                            region: 'SEA',
                            stats: [
                              { label: 'Hunter Lv.', value: '58' },
                              { label: 'Appraiser Since', value: '2026-04-29' },
                              { label: 'Characters', value: '23' },
                              { label: 'Vehicles', value: '10' },
                              { label: 'Achievements', value: '275' },
                              { label: 'City Tycoon Lv.', value: '45' },
                            ],
                          },
                        }));
                        toast.success(t('Widget Favorite Game ditambahkan ke Board!'));
                      } else {
                        setIsEditingGame(true);
                      }
                    }}
                    className="text-xs px-3 h-8 font-semibold cursor-pointer"
                  >
                    + {t('Add Widget')}
                  </Button>
                </div>

                {/* Suggested for you */}
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
                          setProfileWidgets((prev) => ({
                            ...prev,
                            favoriteGame: prev.favoriteGame || {
                              title: 'Neverness to Everness',
                              accountName: 'DartX',
                              region: 'SEA',
                              stats: [
                                { label: 'Hunter Lv.', value: '58' },
                                { label: 'Appraiser Since', value: '2026-04-29' },
                                { label: 'Characters', value: '23' },
                                { label: 'Vehicles', value: '10' },
                                { label: 'Achievements', value: '275' },
                                { label: 'City Tycoon Lv.', value: '45' },
                              ],
                            },
                          }));
                          toast.success(t('Widget Favorite Game aktif di Board!'));
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
                          if (!current.includes('Genshin Impact')) {
                            setProfileWidgets((prev) => ({
                              ...prev,
                              gamesILike: [...current, 'Genshin Impact'],
                            }));
                          }
                          toast.success(t('Widget Games I Like diperbarui!'));
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

                {/* Connected Game Card Widget */}
                {profileWidgets.favoriteGame && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-lg shadow-sm text-sidebar-primary">
                          🌸
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
                          onClick={() => setIsEditingGame(!isEditingGame)}
                          className="h-8 px-2 text-xs"
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
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                          title={t('Hapus Widget')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isEditingGame && (
                      <div className="p-3 rounded-xl border border-sidebar-primary/40 bg-sidebar-primary/10 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Game</label>
                            <input
                              type="text"
                              value={gameTitleInput}
                              onChange={(e) => setGameTitleInput(e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-border bg-card text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Account</label>
                            <input
                              type="text"
                              value={gameAccountInput}
                              onChange={(e) => setGameAccountInput(e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-border bg-card text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Region</label>
                            <input
                              type="text"
                              value={gameRegionInput}
                              onChange={(e) => setGameRegionInput(e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-border bg-card text-foreground"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
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
                            className="h-7 text-xs"
                          >
                            {t('Simpan')}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-border/50 text-center">
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {profileWidgets.favoriteGame.stats?.[0]?.value || '58'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[0]?.label || 'Hunter Lv.'}
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-foreground font-mono">
                          {profileWidgets.favoriteGame.stats?.[1]?.value || '2026-04-29'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[1]?.label || 'Appraiser Since'}
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {profileWidgets.favoriteGame.stats?.[2]?.value || '23'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[2]?.label || 'Characters'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {profileWidgets.favoriteGame.stats?.[3]?.value || '10'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[3]?.label || 'Vehicles'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {profileWidgets.favoriteGame.stats?.[4]?.value || '275'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[4]?.label || 'Achievements'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {profileWidgets.favoriteGame.stats?.[5]?.value || '45'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profileWidgets.favoriteGame.stats?.[5]?.label || 'City Tycoon Lv.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Games I Like Chips Widget */}
                {profileWidgets.gamesILike && profileWidgets.gamesILike.length > 0 && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        🎮 {t('Games I Like')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {profileWidgets.gamesILike.length} {t('Game')}
                      </span>
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
                        placeholder={t('Tambah game favorit (e.g. Valorant, Apex)...')}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-sidebar-primary"
                      />
                      <Button type="submit" size="sm" variant="teal" className="h-7 text-xs">
                        + {t('Tambah')}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ACTIVITY */}
            {profileSubTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-sidebar-primary">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {profileWidgets.activity?.title || t('Sedang Bermain Game')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {profileWidgets.activity?.subtitle || 'Neverness to Everness'} •{' '}
                          {profileWidgets.activity?.timeAgo || t('Aktif sekarang')}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="tealOutline"
                      onClick={() => setIsEditingActivity(!isEditingActivity)}
                      className="text-xs h-7 cursor-pointer"
                    >
                      {t('Ubah')}
                    </Button>
                  </div>

                  {isEditingActivity && (
                    <div className="p-3 rounded-xl border border-sidebar-primary/30 bg-sidebar-primary/10 space-y-2 mt-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">
                          {t('Judul Aktivitas')}
                        </label>
                        <input
                          type="text"
                          value={activityTitleInput}
                          onChange={(e) => setActivityTitleInput(e.target.value)}
                          placeholder="e.g. Playing Valorant / Coding"
                          className="w-full text-xs p-1.5 rounded border border-border bg-card text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">{t('Detail')}</label>
                        <input
                          type="text"
                          value={activitySubtitleInput}
                          onChange={(e) => setActivitySubtitleInput(e.target.value)}
                          placeholder="e.g. Competitive Match"
                          className="w-full text-xs p-1.5 rounded border border-border bg-card text-foreground"
                        />
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
                          className="h-7 text-xs"
                        >
                          {t('Simpan')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: WISHLIST */}
            {profileSubTab === 'wishlist' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    🎁 {t('Wishlist Profil')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {profileWidgets.wishlist?.length || 0} {t('Item')}
                  </span>
                </div>

                <form onSubmit={handleAddWishlist} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newWishlistInput}
                    onChange={(e) => setNewWishlistInput(e.target.value)}
                    placeholder={t('Tambah keinginan (e.g. Nectar VIP, Game Pass)...')}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-sidebar-primary"
                  />
                  <Button type="submit" size="sm" variant="teal" className="h-8 text-xs font-bold">
                    + {t('Tambah')}
                  </Button>
                </form>

                {profileWidgets.wishlist && profileWidgets.wishlist.length > 0 ? (
                  <div className="space-y-2">
                    {profileWidgets.wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between hover:border-sidebar-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{item.icon || '🎁'}</span>
                          <div>
                            <div className="text-xs font-bold text-foreground">{item.title}</div>
                            {item.category && (
                              <div className="text-[10px] text-sidebar-primary font-medium">
                                {item.category}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveWishlist(item.id)}
                          className="h-7 px-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-border/80 text-center space-y-2">
                    <div className="text-2xl">🎁</div>
                    <div className="text-xs font-bold text-foreground">
                      {t('Wishlist Anda Kosong')}
                    </div>
                    <div className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      {t('Tambahkan game atau dekorasi profil dari Shop ke wishlist Anda!')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
