import React, { useState, useEffect, useRef } from 'react';
import { uploadMediaToR2 } from '@/lib/upload';
import {
  ChevronDown,
  Pencil,
  Sparkles,
  Zap,
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
  Tag,
  BookOpen,
  Code2,
  Activity as ActivityIcon,
  Smile,
  Compass,
  MessageSquare,
  Bookmark,
  Flame,
  Globe,
  Radio,
  Share2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FormDropdown } from '@/components/ui/form-dropdown';
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
  type CustomNoteWidget,
  type InterestsWidget,
  type SocialLinkItem,
  type SocialLinksWidget,
  type FeaturedColonyWidget,
} from '../api/profile-api';
import {
  gamesAppsApi,
  type UserConnectionItem,
  type RegisteredGame,
} from '@/features/user-settings/api/games-apps-api';
import { availablePlatforms } from '@/features/user-settings/data/platforms';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import { shopApi, type ShopItem } from '@/features/shop/api/shop-api';
import type { Colony } from '@/chat/chat-types';
import {
  NAMEPLATE_OPTIONS,
  FRAME_OPTIONS,
  EFFECT_OPTIONS,
  THEME_OPTIONS,
  AVATAR_DECORATION_OPTIONS,
  DISPLAY_NAME_STYLE_OPTIONS,
} from '../data/profile-constants';
import { ProfileConnectedPlatformsSection } from './profile-connected-platforms-section';
import { ProfileWishlistSubtab } from './profile-wishlist-subtab';
import { ChangeDisplayNameStyleDialog } from './change-display-name-style-dialog';
import { SelectImageDialog } from './select-image-dialog';
import { PreviewNectarDialog } from './preview-nectar-dialog';
import { ProfileThemeColorPicker } from './profile-theme-color-picker';
import { ChangeAvatarDecorationDialog } from './change-avatar-decoration-dialog';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import { ChangeNameplateDialog } from './change-nameplate-dialog';
import { NameplateRenderer } from './nameplate-renderer';
import { NAMEPLATES_LIST } from '../data/nameplates';
import {
  parseDisplayNameStyle,
  getDisplayNameInlineStyles,
  serializeDisplayNameStyle,
  FONT_OPTIONS,
  LIMITED_TIME_FONT,
  EFFECT_OPTIONS as DISPLAY_EFFECT_OPTIONS,
  COLOR_SWATCHES,
} from '../data/display-name-styles';

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  colonies?: Colony[];
  onNavigateSection?: (section: string) => void;
  onOpenUserSettings?: (section?: string) => void;
}

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
  const [activeViewMode, setActiveViewMode] = useState<'edit' | 'preview' | 'widgets'>('edit');

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

  // Discord-style Profile Customization States
  const [themePrimary, setThemePrimary] = useState('#3b37af');
  const [themeAccent, setThemeAccent] = useState('#ad3e3a');
  const [isNameStyleDialogOpen, setIsNameStyleDialogOpen] = useState(false);
  const [isPreviewNectarOpen, setIsPreviewNectarOpen] = useState(false);
  const [isSelectImageOpen, setIsSelectImageOpen] = useState(false);
  const [selectImageMode, setSelectImageMode] = useState<'avatar' | 'banner'>('banner');
  const [isThemeColorPickerOpen, setIsThemeColorPickerOpen] = useState(false);
  const [themeColorPickerTarget, setThemeColorPickerTarget] = useState<'primary' | 'accent'>('primary');

  // Standalone Avatar Decoration & Nameplate Dialog states
  const [isAvatarDecorationDialogOpen, setIsAvatarDecorationDialogOpen] = useState(false);
  const [isNameplateDialogOpen, setIsNameplateDialogOpen] = useState(false);

  // Widgets State
  const [profileWidgets, setProfileWidgets] = useState<UserProfileWidgets>({
    customNote: null,
    interests: null,
    socialLinks: null,
    featuredColony: null,
    activity: null,
    showActivity: true,
    showConnections: true,
    dismissedSuggested: false,
  });

  // Active Widget Creator: 'note' | 'interests' | 'links' | 'colony' | null
  const [activeWidgetCreator, setActiveWidgetCreator] = useState<'note' | 'interests' | 'links' | 'colony' | null>(null);

  // Widget Inputs
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteContentInput, setNoteContentInput] = useState('');
  const [noteEmojiInput, setNoteEmojiInput] = useState('📌');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [interestTitleInput, setInterestTitleInput] = useState('Minat & Keahlian');
  const [newTagInput, setNewTagInput] = useState('');

  const [linkTitleInput, setLinkTitleInput] = useState('Tautan & Jejaring');
  const [newLinkLabelInput, setNewLinkLabelInput] = useState('');
  const [newLinkUrlInput, setNewLinkUrlInput] = useState('');

  const [userColoniesList, setUserColoniesList] = useState<Colony[]>(initialColonies || []);

  // Activity Editor State
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [activityTitleInput, setActivityTitleInput] = useState('');
  const [activitySubtitleInput, setActivitySubtitleInput] = useState('');
  const [activityIconInput, setActivityIconInput] = useState('💻');

  // Real Wishlist & Shop Catalog State
  const [wishlistItems, setWishlistItems] = useState<ShopItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<ShopItem[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [newCustomWishlistInput, setNewCustomWishlistInput] = useState('');

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

        // Upload to Cloudflare R2 and upgrade url if available
        uploadMediaToR2(file).then((remote) => {
          if (remote.isRemote && remote.url) {
            onSuccess(remote.url);
          }
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Helper to persist widgets changes immediately to backend
  const persistWidgets = async (updatedWidgets: UserProfileWidgets) => {
    setProfileWidgets(updatedWidgets);
    try {
      await profileApi.updateProfile({
        widgets: {
          ...updatedWidgets,
          nameplate: profileNameplate,
          profileFrame: profileFrame,
          profileEffect: profileEffect,
          profileTheme: profileTheme,
          avatarDecoration: profileAvatarDecoration,
          displayNameStyle: displayNameStyle,
        },
      });
    } catch {}
  };

  // Load Profile, Connections, Colonies, Wishlist & Catalog
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
      if (data.theme) {
        setProfileTheme(data.theme);
        if (data.theme.startsWith('custom:')) {
          const parts = data.theme.replace('custom:', '').split(',');
          if (parts[0]) setThemePrimary(parts[0]);
          if (parts[1]) setThemeAccent(parts[1]);
        }
      }
      if (data.displayNameStyle) setDisplayNameStyle(data.displayNameStyle);

      if (data.widgets) {
        setProfileWidgets((prev) => ({ ...prev, ...data.widgets }));
        if (data.widgets.customNote) {
          setNoteTitleInput(data.widgets.customNote.title || '');
          setNoteContentInput(data.widgets.customNote.content || '');
          setNoteEmojiInput(data.widgets.customNote.emoji || '📌');
        }
        if (data.widgets.interests) {
          setInterestTitleInput(data.widgets.interests.title || 'Minat & Keahlian');
        }
        if (data.widgets.socialLinks) {
          setLinkTitleInput(data.widgets.socialLinks.title || 'Tautan & Jejaring');
        }
        if (data.widgets.activity) {
          setActivityTitleInput(data.widgets.activity.title || '');
          setActivitySubtitleInput(data.widgets.activity.subtitle || '');
          setActivityIconInput(data.widgets.activity.icon || '💻');
        }
      }
    });

    // Load real user connections
    gamesAppsApi.getUserConnections().then(setUserConnections);

    // Load real user wishlist and catalog items
    setIsLoadingWishlist(true);
    Promise.all([shopApi.getWishlist(), shopApi.getItems()])
      .then(([wList, cList]) => {
        setWishlistItems(wList || []);
        setCatalogItems(cList || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingWishlist(false));

    // Load colonies if not passed
    if (!initialColonies || initialColonies.length === 0) {
      coloniesApi.getColonies().then((cols) => {
        if (cols && cols.length > 0) setUserColoniesList(cols);
      }).catch(() => {});
    } else {
      setUserColoniesList(initialColonies);
    }
  }, [open, currentUser, defaultAvatar, initialColonies]);

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

  const handleThemeColorChange = (newColor: string) => {
    if (themeColorPickerTarget === 'primary') {
      setThemePrimary(newColor);
      setProfileTheme(`custom:${newColor},${themeAccent}`);
    } else {
      setThemeAccent(newColor);
      setProfileTheme(`custom:${themePrimary},${newColor}`);
    }
  };

  const handleRandomizeNectarProfile = () => {
    const allFonts = [...FONT_OPTIONS, LIMITED_TIME_FONT];
    const randomFont = allFonts[Math.floor(Math.random() * allFonts.length)];
    const randomEffect = DISPLAY_EFFECT_OPTIONS[Math.floor(Math.random() * DISPLAY_EFFECT_OPTIONS.length)];
    const randomColor = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    const randomStyle = serializeDisplayNameStyle({
      fontId: randomFont.id,
      effectId: randomEffect.id,
      color: randomColor,
    });
    setDisplayNameStyle(randomStyle);

    const randomPrimary = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    const randomAccent = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    setThemePrimary(randomPrimary);
    setThemeAccent(randomAccent);
    setProfileTheme(`custom:${randomPrimary},${randomAccent}`);
  };

  // Custom Note Widget Handlers
  const handleSaveCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitleInput.trim() && !noteContentInput.trim()) {
      toast.error(t('Judul atau isi catatan diperlukan'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      customNote: {
        title: noteTitleInput.trim() || 'Catatan Profil',
        content: noteContentInput.trim() || 'Sedang fokus mengerjakan projek.',
        emoji: noteEmojiInput || '📌',
      },
    };
    persistWidgets(updated);
    setIsEditingNote(false);
    setActiveWidgetCreator(null);
    toast.success(t('Widget Catatan berhasil disimpan! 🎉'));
  };

  const handleDeleteCustomNote = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, customNote: null };
    persistWidgets(updated);
    toast.info(t('Widget Catatan dihapus'));
  };

  // Interests / Minat Widget Handlers
  const handleAddInterestTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    const currentTags = profileWidgets.interests?.tags || [];
    if (currentTags.includes(tag)) {
      toast.info(t('Tag sudah ada di daftar!'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      interests: {
        title: profileWidgets.interests?.title || 'Minat & Keahlian',
        tags: [...currentTags, tag],
      },
    };
    setNewTagInput('');
    persistWidgets(updated);
    toast.success(t('Tag berhasil ditambahkan!'));
  };

  const handleRemoveInterestTag = (tag: string) => {
    const currentTags = profileWidgets.interests?.tags || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      interests: {
        title: profileWidgets.interests?.title || 'Minat & Keahlian',
        tags: currentTags.filter((t) => t !== tag),
      },
    };
    persistWidgets(updated);
  };

  const handleDeleteInterestsWidget = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, interests: null };
    persistWidgets(updated);
    toast.info(t('Widget Minat & Keahlian dihapus'));
  };

  // Social Links Widget Handlers
  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabelInput.trim() || !newLinkUrlInput.trim()) {
      toast.error(t('Label dan alamat tautan diperlukan'));
      return;
    }
    let cleanUrl = newLinkUrlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const newLink: SocialLinkItem = {
      id: `link_${Date.now()}`,
      label: newLinkLabelInput.trim(),
      url: cleanUrl,
    };
    const currentLinks = profileWidgets.socialLinks?.links || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      socialLinks: {
        title: profileWidgets.socialLinks?.title || 'Tautan & Jejaring',
        links: [...currentLinks, newLink],
      },
    };
    setNewLinkLabelInput('');
    setNewLinkUrlInput('');
    persistWidgets(updated);
    setActiveWidgetCreator(null);
    toast.success(t('Tautan berhasil ditambahkan! 🔗'));
  };

  const handleRemoveSocialLink = (linkId: string) => {
    const currentLinks = profileWidgets.socialLinks?.links || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      socialLinks: {
        title: profileWidgets.socialLinks?.title || 'Tautan & Jejaring',
        links: currentLinks.filter((l) => l.id !== linkId),
      },
    };
    persistWidgets(updated);
  };

  const handleDeleteSocialLinksWidget = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, socialLinks: null };
    persistWidgets(updated);
    toast.info(t('Widget Tautan dihapus'));
  };

  // Featured Colony Widget Handlers
  const handleSelectFeaturedColony = (colony: Colony) => {
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      featuredColony: {
        colonyId: colony.id,
        colonyName: colony.name,
        icon: colony.iconUrl || undefined,
        role: 'Anggota',
      },
    };
    persistWidgets(updated);
    setActiveWidgetCreator(null);
    toast.success(t(`Komunitas "${colony.name}" dijadikan unggulan! 🏰`));
  };

  const handleDeleteFeaturedColony = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, featuredColony: null };
    persistWidgets(updated);
    toast.info(t('Widget Komunitas Unggulan dihapus'));
  };

  // Activity Handlers
  const handleSaveActivity = () => {
    if (!activityTitleInput.trim()) {
      toast.error(t('Nama aktivitas diperlukan'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      activity: {
        title: activityTitleInput.trim(),
        subtitle: activitySubtitleInput.trim() || t('Aktif sekarang'),
        icon: activityIconInput || '💻',
        timeAgo: t('Baru saja'),
      },
    };
    persistWidgets(updated);
    setIsEditingActivity(false);
    toast.success(t('Status aktivitas berhasil diperbarui! 🎉'));
  };

  const handleClearActivity = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, activity: null };
    persistWidgets(updated);
    toast.info(t('Aktivitas dibersihkan'));
  };

  // Real Wishlist Handlers
  const handleToggleWishlist = async (itemId: string, itemTitle?: string) => {
    try {
      const res = await shopApi.toggleWishlist(itemId);
      if (res.success) {
        if (res.wishlist) {
          setWishlistItems(res.wishlist);
        } else {
          const fresh = await shopApi.getWishlist();
          setWishlistItems(fresh);
        }
        if (res.isWishlisted) {
          toast.success(t(`${itemTitle || 'Item'} ditambahkan ke Wishlist! ❤️`));
        } else {
          toast.info(t(`${itemTitle || 'Item'} dihapus dari Wishlist`));
        }
      }
    } catch {
      toast.error(t('Gagal memperbarui Wishlist'));
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      const res = await shopApi.toggleWishlist(itemId);
      if (res.success) {
        if (res.wishlist) {
          setWishlistItems(res.wishlist);
        } else {
          const fresh = await shopApi.getWishlist();
          setWishlistItems(fresh);
        }
        toast.info(t('Item dihapus dari Wishlist'));
      }
    } catch {
      toast.error(t('Gagal menghapus item dari Wishlist'));
    }
  };

  const handleAddCustomWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomWishlistInput.trim()) return;
    const name = newCustomWishlistInput.trim();
    try {
      const res = await shopApi.createItem({
        name,
        category: 'avatar_decoration',
        collection: 'Kustom Anticeil',
        description: `Item kustom wishlist: ${name}`,
        priceDew: 250,
        priceOrbs: 250,
        priceIdr: 35000,
        previewIcon: '✨',
      });
      if (res && res.item) {
        const toggleRes = await shopApi.toggleWishlist(res.item.id);
        if (toggleRes.wishlist) {
          setWishlistItems(toggleRes.wishlist);
        } else {
          const fresh = await shopApi.getWishlist();
          setWishlistItems(fresh);
        }
        const freshCatalog = await shopApi.getItems();
        setCatalogItems(freshCatalog);
        setNewCustomWishlistInput('');
        toast.success(t(`Item "${name}" berhasil ditambahkan ke Wishlist! 🎁`));
      }
    } catch {
      toast.error(t('Gagal menambahkan item kustom'));
    }
  };

  const handlePreviewShopItem = (item: ShopItem) => {
    if (item.category === 'avatar_decoration' || (item.itemTypes && item.itemTypes.includes('avatar_decoration'))) {
      setProfileAvatarDecoration('cyber_crown');
    }
    if (item.category === 'nameplate' || (item.itemTypes && item.itemTypes.includes('nameplate'))) {
      setProfileNameplate('Pixel Hive');
    }
    if (item.category === 'profile_effect' || (item.itemTypes && item.itemTypes.includes('profile_effect'))) {
      setProfileEffect('aurora_glow');
    }
    if (item.id.includes('sakura')) {
      setProfileFrame('sakura_blossom');
      setProfileAvatarDecoration('sakura');
    } else if (item.id.includes('cyber')) {
      setProfileNameplate('Cyber Teal');
      setProfileEffect('teal_sparkles');
    } else if (item.id.includes('cosmic') || item.id.includes('aurora')) {
      setProfileEffect('aurora_glow');
      setProfileNameplate('Midnight Void');
    }
    toast.success(t(`Preview "${item.name}" ditampilkan di kartu profil!`));
  };

  const handleOpenShop = (category?: string) => {
    setIsAvatarDecorationDialogOpen(false);
    setIsNameplateDialogOpen(false);
    setIsSelectImageOpen(false);
    setIsNameStyleDialogOpen(false);
    setIsPreviewNectarOpen(false);
    setIsThemeColorPickerOpen(false);
    setActiveWidgetCreator(null);
    setIsConnectModalOpen(false);
    onOpenChange(false);
    window.history.pushState({}, '', '/shop');
    window.dispatchEvent(new CustomEvent('anticeil:navigate-home', { detail: 'shop' }));
    window.dispatchEvent(new CustomEvent('anticeil:close-all-modals'));
    if (category) {
      window.dispatchEvent(new CustomEvent('anticeil:shop-category', { detail: category }));
    }
    toast.success(t('Membuka Shop Katalog! 🏪'));
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
        size="two-pane"
        showCloseButton={false}
        className={cn(LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER, 'bg-card z-[70]')}
        overlayClassName="z-[70]"
      >
        <DialogTitle className="sr-only">{t('Edit Profiles')}</DialogTitle>

        {/* Mobile Header (< md) */}
        <div className="flex md:hidden items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{t('Edit Profil')}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t('Tutup')}
            aria-label={t('Tutup')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile 3-Way Navigation Tab Switcher (< md) */}
        <div className="flex md:hidden items-center px-3 py-2 bg-muted/40 border-b border-border/60 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveViewMode('edit')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeViewMode === 'edit'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{t('Edit')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode('preview')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeViewMode === 'preview'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('Pratinjau')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode('widgets')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeViewMode === 'widgets'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('Widget')}</span>
          </button>
        </div>

        {/* Close Button Top-Right (>= md) */}
        <div className="hidden md:flex absolute top-3.5 right-4 z-50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t('Tutup')}
            aria-label={t('Tutup')}
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Main Profile Editor Body (Responsive: Mobile 1-Col | Tablet 2-Col | Desktop 3-Col) */}
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col md:flex-row">
          {/* COLUMN 1: LEFT AREA (Edit Form) */}
          <div
            className={cn(
              'shrink-0 bg-background/30 p-4 sm:p-5 overflow-y-auto custom-scrollbar overflow-x-hidden space-y-4 flex-col',
              activeViewMode === 'edit' || (activeViewMode !== 'widgets' && activeViewMode !== 'preview') ? 'flex' : 'hidden',
              activeViewMode !== 'widgets' ? 'md:flex' : 'md:hidden',
              'xl:flex',
              'w-full md:w-1/2 xl:w-[320px] 2xl:w-[360px]',
              'border-b-0 md:border-r border-border/60'
            )}
          >
            {/* Tablet 2-Way Tab Switcher (md to < xl) */}
            <div className="hidden md:flex xl:hidden items-center p-1 bg-muted/60 rounded-xl gap-1 border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveViewMode('edit')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeViewMode !== 'widgets'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{t('Edit Profil')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('widgets')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeViewMode === 'widgets'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('Widget & Tab')}</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Nameplate Card matching Discord */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Nameplate')}
                </span>
                <div
                  onClick={() => setIsNameplateDialogOpen(true)}
                  className="h-14 rounded-2xl border border-border/70 bg-[#1e1f22]/70 hover:bg-[#2b2d31] hover:border-sidebar-primary/60 px-4 flex items-center justify-between cursor-pointer group transition-all relative overflow-hidden"
                  title={t('Change Nameplate')}
                >
                  {/* Nameplate background if active */}
                  {profileNameplate && profileNameplate !== 'none' && (
                    <NameplateRenderer nameplateId={profileNameplate} />
                  )}

                  {/* Left avatar placeholder & pill bar */}
                  <div className="flex items-center gap-3 relative z-10 pointer-events-none">
                    <div className="size-8 rounded-full bg-zinc-800/90 border border-white/20 flex items-center justify-center relative">
                      <Gamepad2 className="w-4 h-4 text-zinc-400" />
                      <div className="absolute bottom-0 right-0 size-2 rounded-full bg-zinc-500 border border-zinc-900" />
                    </div>
                    {profileNameplate && profileNameplate !== 'none' ? (
                      <span className="font-bold text-xs text-white drop-shadow-sm">
                        {NAMEPLATES_LIST.find((n) => n.id === profileNameplate)?.name || profileNameplate}
                      </span>
                    ) : (
                      <div className="w-24 sm:w-32 h-3 rounded-full bg-zinc-700/60" />
                    )}
                  </div>

                  {/* Right circle plus icon */}
                  <div className="size-7 rounded-full bg-zinc-700/80 text-white flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-[#5865f2] transition-all relative z-10">
                    <Plus className="w-4 h-4" />
                  </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    {/* Left Card: Avatar */}
                    <div
                      onClick={() => {
                        setSelectImageMode('avatar');
                        setIsSelectImageOpen(true);
                      }}
                      className="h-28 rounded-2xl border border-border/70 bg-[#1e1f22]/70 hover:bg-[#2b2d31] hover:border-sidebar-primary/60 flex items-center justify-center cursor-pointer group relative transition-all"
                      title={t('Pilih Avatar')}
                    >
                      <div className="size-16 sm:size-18 rounded-full overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center text-xl shadow-inner relative group-hover:scale-105 transition-transform">
                        {activeAvatar ? (
                          <img
                            src={activeAvatar}
                            alt="Avatar"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-sidebar-primary/20 text-sidebar-primary font-bold text-base select-none">
                            {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Card: Decoration with smoky ring & (+) badge */}
                    <div
                      onClick={() => setIsAvatarDecorationDialogOpen(true)}
                      className="h-28 rounded-2xl border border-border/70 bg-[#1e1f22]/70 hover:bg-[#2b2d31] hover:border-sidebar-primary/60 flex items-center justify-center cursor-pointer group relative transition-all"
                      title={t('Pilih Dekorasi Avatar')}
                    >
                      <div className="relative size-16 sm:size-18 rounded-full flex items-center justify-center">
                        {profileAvatarDecoration && profileAvatarDecoration !== 'none' ? (
                          <>
                            <div className="size-full rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center">
                              <Gamepad2 className="w-6 h-6 text-zinc-500/80" />
                            </div>
                            <AvatarDecorationRenderer decorationId={profileAvatarDecoration} />
                          </>
                        ) : (
                          <div className="relative size-full rounded-full flex items-center justify-center">
                            {/* Ethereal smoky ring SVG matching Discord */}
                            <svg
                              viewBox="0 0 100 100"
                              className="absolute -inset-2.5 size-[calc(100%+20px)] animate-pulse pointer-events-none"
                              style={{ animationDuration: '4s' }}
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="42"
                                stroke="rgba(255, 255, 255, 0.25)"
                                strokeWidth="3"
                                strokeDasharray="12 8 20 6"
                                strokeLinecap="round"
                                filter="blur(1px) drop-shadow(0 0 8px rgba(255,255,255,0.3))"
                                className="animate-spin"
                                style={{ animationDuration: '18s' }}
                              />
                            </svg>
                            <div className="size-full rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center">
                              <Gamepad2 className="w-6 h-6 text-zinc-500/80" />
                            </div>

                            {/* Plus badge in the center only when no decoration */}
                            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                              <div className="size-7 rounded-full bg-zinc-700/90 border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#5865f2] transition-all">
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                      onClick={() => {
                        setSelectImageMode('banner');
                        setIsSelectImageOpen(true);
                      }}
                      className="flex-1 text-xs h-8 font-semibold cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1" />
                      {t('Pilih Banner')}
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
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormDropdown
                      label={<span className="text-[10px] text-muted-foreground">{t('Avatar Frame')}</span>}
                      value={profileFrame}
                      onChange={(val) => setProfileFrame(val)}
                      size="sm"
                      options={FRAME_OPTIONS.map((frm) => ({ value: frm.id, label: frm.label }))}
                    />
                    <FormDropdown
                      label={<span className="text-[10px] text-muted-foreground">{t('Visual Effect')}</span>}
                      value={profileEffect}
                      onChange={(val) => setProfileEffect(val)}
                      size="sm"
                      options={EFFECT_OPTIONS.map((eff) => ({ value: eff.id, label: eff.label }))}
                    />
                  </div>
                </div>

                {/* Discord-style Nectar & Customization Sections */}

                {/* 1. Nectar Promo Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#5865F2]/25 via-purple-600/20 to-pink-600/20 border border-[#5865F2]/40 space-y-2.5 shadow-sm">
                  <div className="text-xs font-bold text-foreground leading-snug">
                    {t('Level up your look, only with Nectar')}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsPreviewNectarOpen(true)}
                    className="w-full text-xs h-8 font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white cursor-pointer shadow-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('Preview Nectar')}</span>
                  </Button>
                </div>

                {/* 2. Display Name Style */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Display Name Style')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNameStyleDialogOpen(true)}
                    className="w-full h-12 px-3 rounded-xl bg-[#111214] border border-border/80 hover:border-[#5865F2] flex items-center justify-center transition-all cursor-pointer group shadow-xs"
                  >
                    <span
                      className="text-base font-black truncate group-hover:scale-105 transition-transform"
                      style={getDisplayNameInlineStyles(parseDisplayNameStyle(displayNameStyle))}
                    >
                      {currentUserName}
                    </span>
                  </button>
                </div>

                {/* 3. Profile Theme (Dual Color Gradient Box) */}
                <div className="space-y-1.5 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Profile Theme')}
                  </span>
                  <div
                    className="w-full h-24 rounded-xl border border-border/80 p-2.5 flex flex-col justify-between relative shadow-xs overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom, ${themePrimary}, ${themeAccent})`,
                    }}
                  >
                    {/* Top Color Box (Primary) */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setThemeColorPickerTarget('primary');
                          setIsThemeColorPickerOpen(true);
                        }}
                        title={t('Pilih Warna Utama')}
                        className="size-6 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: themePrimary }}
                      />
                    </div>
                    {/* Bottom Color Box (Accent) */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setThemeColorPickerTarget('accent');
                          setIsThemeColorPickerOpen(true);
                        }}
                        title={t('Pilih Warna Aksen')}
                        className="size-6 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: themeAccent }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Profile Banner */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Profile Banner')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectImageMode('banner');
                      setIsSelectImageOpen(true);
                    }}
                    className="w-full h-16 rounded-xl border border-border/80 hover:border-[#5865F2] bg-cover bg-center overflow-hidden transition-all cursor-pointer shadow-xs relative group flex items-center justify-center bg-[#111214]"
                    style={{
                      backgroundColor: profileBannerColor,
                      backgroundImage: profileBannerUrl ? `url(${profileBannerUrl})` : undefined,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                        {t('Ubah Banner')}
                      </span>
                    </div>
                  </button>
                </div>

                {/* 5. Animated Avatar */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Animated Avatar')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectImageMode('avatar');
                      setIsSelectImageOpen(true);
                    }}
                    className="w-full h-16 rounded-xl bg-[#111214] border border-border/80 hover:border-[#5865F2] flex items-center justify-center transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="size-11 rounded-full border-2 border-white/20 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                      {profileAvatarUrl ? (
                        <img
                          src={profileAvatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs bg-[#2b2d31]">
                          {currentUserName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* 6. Unlock / Get Nectar button */}
                <Button
                  type="button"
                  onClick={handleNectarCta}
                  className="w-full h-9 rounded-xl font-bold text-xs bg-gradient-to-r from-[#5865F2] via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{t('Get Nectar')}</span>
                </Button>
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

          {/* COLUMN 2: MIDDLE AREA LIVE PROFILE CARD PREVIEW */}
          <div
            className={cn(
              'shrink-0 bg-muted/20 px-3 sm:px-4 py-4 sm:py-5 items-center justify-center overflow-y-auto custom-scrollbar overflow-x-hidden flex-col',
              activeViewMode === 'preview' ? 'flex' : 'hidden',
              'md:flex md:order-2 xl:order-none',
              'w-full md:w-1/2 xl:w-[380px] 2xl:w-[420px]',
              'border-b-0 xl:border-r border-border/60'
            )}
          >
            <div className="w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[380px] my-auto">
              <ProfilePreviewCard
                userId={currentUser?.id}
                onOpenShop={handleOpenShop}
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

          {/* COLUMN 3: RIGHT AREA PROFILE TABS (BOARD | ACTIVITY | WISHLIST) */}
          <div
            className={cn(
              'flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden space-y-4 flex-col',
              activeViewMode === 'widgets' ? 'flex' : 'hidden',
              activeViewMode === 'widgets' ? 'md:flex md:order-1 xl:order-none' : 'md:hidden',
              'xl:flex',
              'w-full md:w-1/2 xl:flex-1',
              'border-b-0 md:border-r xl:border-r-0 border-border/60'
            )}
          >
            {/* Tablet 2-Way Tab Switcher (md to < xl) */}
            <div className="hidden md:flex xl:hidden items-center p-1 bg-muted/60 rounded-xl gap-1 border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveViewMode('edit')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeViewMode !== 'widgets'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{t('Edit Profil')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('widgets')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeViewMode === 'widgets'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('Widget & Tab')}</span>
              </button>
            </div>

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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{t('Your Widgets')}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                      {[
                        profileWidgets.customNote ? 1 : 0,
                        profileWidgets.interests ? 1 : 0,
                        profileWidgets.socialLinks ? 1 : 0,
                        profileWidgets.featuredColony ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}{' '}
                      {t('Aktif')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="teal"
                      onClick={() => {
                        if (!profileWidgets.customNote) {
                          setActiveWidgetCreator('note');
                        } else if (!profileWidgets.interests) {
                          setActiveWidgetCreator('interests');
                        } else if (!profileWidgets.socialLinks) {
                          setActiveWidgetCreator('links');
                        } else if (!profileWidgets.featuredColony) {
                          setActiveWidgetCreator('colony');
                        } else {
                          setActiveWidgetCreator('note');
                        }
                      }}
                      className="text-xs px-3 h-8 font-semibold cursor-pointer"
                    >
                      + {t('Add Widget')}
                    </Button>
                  </div>
                </div>

                {/* Suggested for you (Clean Anticeil Widgets) */}
                {!profileWidgets.dismissedSuggested && (
                  <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3 relative shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t('Suggested for you')}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          persistWidgets({ ...profileWidgets, dismissedSuggested: true })
                        }
                        className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer transition-colors"
                        title={t('Tutup')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Suggestion 1: Minat & Keahlian */}
                      <div
                        onClick={() => {
                          if (!profileWidgets.interests) {
                            persistWidgets({
                              ...profileWidgets,
                              interests: {
                                title: 'Minat & Keahlian',
                                tags: ['UI/UX Design', 'Fullstack Dev'],
                              },
                            });
                            toast.success(t('Widget Minat & Keahlian ditambahkan!'));
                          } else {
                            toast.info(t('Widget Minat & Keahlian sudah aktif'));
                          }
                        }}
                        className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {t('Minat & Keahlian')}
                        </span>
                      </div>

                      {/* Suggestion 2: Catatan Profil */}
                      <div
                        onClick={() => {
                          if (!profileWidgets.customNote) {
                            setActiveWidgetCreator('note');
                            setIsEditingNote(true);
                          } else {
                            setIsEditingNote(true);
                          }
                        }}
                        className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                            <Bookmark className="w-3.5 h-3.5" />
                          </div>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {t('Catatan / Highlight')}
                        </span>
                      </div>

                      {/* Suggestion 3: Tautan Sosial */}
                      <div
                        onClick={() => {
                          if (!profileWidgets.socialLinks) {
                            setActiveWidgetCreator('links');
                          } else {
                            toast.info(t('Widget Tautan sudah aktif'));
                          }
                        }}
                        className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </div>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {t('Tautan & Jejaring')}
                        </span>
                      </div>

                      {/* Suggestion 4: Komunitas Unggulan */}
                      <div
                        onClick={() => {
                          if (userColoniesList.length > 0) {
                            handleSelectFeaturedColony(userColoniesList[0]);
                          } else {
                            setActiveWidgetCreator('colony');
                          }
                        }}
                        className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {t('Komunitas Unggulan')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Creator: Custom Note */}
                {(activeWidgetCreator === 'note' || isEditingNote) && (
                  <form onSubmit={handleSaveCustomNote} className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-sidebar-primary" />
                        {t('Atur Widget Catatan')}
                      </span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setActiveWidgetCreator(null);
                          setIsEditingNote(false);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <label className="text-[10px] text-muted-foreground block mb-1">
                            {t('Emoji')}
                          </label>
                          <Input
                            type="text"
                            value={noteEmojiInput}
                            onChange={(e) => setNoteEmojiInput(e.target.value)}
                            className="text-center text-sm h-8"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground block mb-1">
                            {t('Judul Catatan')}
                          </label>
                          <Input
                            type="text"
                            value={noteTitleInput}
                            onChange={(e) => setNoteTitleInput(e.target.value)}
                            placeholder={t('e.g. Focus Goal / About Me')}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Isi Catatan')}
                        </label>
                        <Input
                          type="text"
                          value={noteContentInput}
                          onChange={(e) => setNoteContentInput(e.target.value)}
                          placeholder={t('Tulis catatan singkat atau status yang ingin Anda tampilkan...')}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => {
                          setActiveWidgetCreator(null);
                          setIsEditingNote(false);
                        }}
                        className="h-7 text-xs"
                      >
                        {t('Batal')}
                      </Button>
                      <Button type="submit" size="sm" variant="teal" className="h-7 text-xs font-bold">
                        {t('Simpan Catatan')}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Inline Creator: Social Link */}
                {activeWidgetCreator === 'links' && !profileWidgets.socialLinks && (
                  <form onSubmit={handleAddSocialLink} className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-sidebar-primary" />
                        {t('Tambah Tautan Baru')}
                      </span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => setActiveWidgetCreator(null)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Nama Label')}
                        </label>
                        <Input
                          type="text"
                          value={newLinkLabelInput}
                          onChange={(e) => setNewLinkLabelInput(e.target.value)}
                          placeholder="e.g. GitHub / Portfolio"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('URL Tautan')}
                        </label>
                        <Input
                          type="text"
                          value={newLinkUrlInput}
                          onChange={(e) => setNewLinkUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => setActiveWidgetCreator(null)}
                        className="h-7 text-xs"
                      >
                        {t('Batal')}
                      </Button>
                      <Button type="submit" size="sm" variant="teal" className="h-7 text-xs font-bold">
                        {t('Tambah Tautan')}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Inline Creator: Featured Colony */}
                {activeWidgetCreator === 'colony' && !profileWidgets.featuredColony && (
                  <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-sidebar-primary" />
                        {t('Pilih Komunitas Unggulan')}
                      </span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => setActiveWidgetCreator(null)}
                      />
                    </div>
                    {userColoniesList.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {userColoniesList.map((col) => (
                          <div
                            key={col.id}
                            onClick={() => handleSelectFeaturedColony(col)}
                            className="p-2.5 rounded-lg border border-border/70 hover:border-sidebar-primary bg-secondary/30 hover:bg-secondary/60 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-7 rounded-lg bg-sidebar-primary/20 flex items-center justify-center font-bold text-xs text-sidebar-primary overflow-hidden">
                                {col.iconUrl ? (
                                  <img src={col.iconUrl} alt={col.name} className="size-full object-cover" />
                                ) : (
                                  col.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="text-xs font-semibold text-foreground truncate">
                                {col.name}
                              </span>
                            </div>
                            <Button size="sm" variant="tealGhost" className="h-6 text-[11px] px-2">
                              {t('Pilih')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t('Anda belum bergabung dengan komunitas apapun.')}
                      </p>
                    )}
                  </div>
                )}

                {/* WIDGET 1: Custom Note Card (Active) */}
                {profileWidgets.customNote && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs relative group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-sidebar-primary/10 border border-sidebar-primary/30 flex items-center justify-center text-lg shrink-0">
                          {profileWidgets.customNote.emoji || '📌'}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground">
                            {profileWidgets.customNote.title}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {profileWidgets.customNote.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="tealGhost"
                          onClick={() => {
                            setNoteTitleInput(profileWidgets.customNote?.title || '');
                            setNoteContentInput(profileWidgets.customNote?.content || '');
                            setNoteEmojiInput(profileWidgets.customNote?.emoji || '📌');
                            setIsEditingNote(true);
                          }}
                          className="h-7 px-2 text-xs cursor-pointer"
                          title={t('Edit Catatan')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDeleteCustomNote}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={t('Hapus Widget')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* WIDGET 2: Interests / Minat & Keahlian Chips */}
                {profileWidgets.interests && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-sidebar-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {profileWidgets.interests.title || t('Minat & Keahlian')}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {profileWidgets.interests.tags.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeleteInterestsWidget}
                        className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
                        title={t('Hapus Widget')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {profileWidgets.interests.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium border border-border/70 group"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterestTag(tag)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title={t('Hapus tag')}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddInterestTag} className="flex items-center gap-2 pt-1">
                      <Input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder={t('Tambah keahlian (e.g. React, UI/UX, Anticeil)...')}
                        className="flex-1 text-xs h-8"
                      />
                      <Button type="submit" size="sm" variant="teal" className="h-8 text-xs font-semibold">
                        + {t('Tambah')}
                      </Button>
                    </form>
                  </div>
                )}

                {/* WIDGET 3: Social & Web Links */}
                {profileWidgets.socialLinks && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-sidebar-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {profileWidgets.socialLinks.title || t('Tautan & Jejaring')}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {profileWidgets.socialLinks.links.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeleteSocialLinksWidget}
                        className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
                        title={t('Hapus Widget')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      {profileWidgets.socialLinks.links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/60 hover:border-sidebar-primary/40 transition-colors"
                        >
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-sidebar-primary truncate"
                          >
                            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{link.label}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialLink(link.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded"
                            title={t('Hapus tautan')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddSocialLink} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <Input
                        type="text"
                        value={newLinkLabelInput}
                        onChange={(e) => setNewLinkLabelInput(e.target.value)}
                        placeholder={t('Label (e.g. GitHub)')}
                        className="text-xs h-8"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={newLinkUrlInput}
                          onChange={(e) => setNewLinkUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 text-xs h-8"
                        />
                        <Button type="submit" size="sm" variant="teal" className="h-8 text-xs font-semibold">
                          + {t('Tambah')}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* WIDGET 4: Featured Colony Card */}
                {profileWidgets.featuredColony && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center font-bold text-xs text-sidebar-primary overflow-hidden">
                          {profileWidgets.featuredColony.icon ? (
                            <img
                              src={profileWidgets.featuredColony.icon}
                              alt={profileWidgets.featuredColony.colonyName}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {t('Komunitas Unggulan')}
                          </div>
                          <div className="text-xs font-bold text-foreground">
                            {profileWidgets.featuredColony.colonyName}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeleteFeaturedColony}
                        className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
                        title={t('Hapus Widget')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State when no widgets on board */}
                {!profileWidgets.customNote &&
                  !profileWidgets.interests &&
                  !profileWidgets.socialLinks &&
                  !profileWidgets.featuredColony && (
                    <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
                      <div className="size-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-xl mx-auto text-sidebar-primary">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-foreground">
                          {t('Belum ada widget di Board')}
                        </div>
                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {t(
                            'Tambahkan catatan kustom, daftar minat & keahlian, atau tautan profil Anda untuk mempercantik kartu profil Anticeil.',
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={() => setActiveWidgetCreator('note')}
                        className="text-xs font-bold h-8 px-4"
                      >
                        + {t('Tambah Widget Pertama')}
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {/* TAB 2: ACTIVITY */}
            {profileSubTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card">
                  <div className="space-y-0.5 pr-3">
                    <div className="text-xs font-bold text-foreground">
                      {t('Tampilkan Aktivitas Saat Ini')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {t('Tampilkan status aktivitas Anda (seperti coding, fokus, atau audio) pada profil secara otomatis.')}
                    </div>
                  </div>
                  <Switch
                    checked={profileWidgets.showActivity !== false}
                    onCheckedChange={(checked) =>
                      persistWidgets({ ...profileWidgets, showActivity: checked })
                    }
                  />
                </div>

                {/* Active Activity Card (if set) */}
                {profileWidgets.activity ? (
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-xl text-sidebar-primary">
                          {profileWidgets.activity.icon || '💻'}
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
                            setActivityIconInput(profileWidgets.activity?.icon || '💻');
                            setIsEditingActivity(true);
                          }}
                          className="text-xs h-7 px-2 cursor-pointer"
                          title={t('Edit Aktivitas')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearActivity}
                          className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={t('Hapus Aktivitas')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Clean Empty State */
                  <div className="p-6 rounded-2xl border border-border/70 bg-card text-center space-y-4 shadow-xs">
                    <div className="size-11 rounded-2xl bg-secondary/80 flex items-center justify-center text-xl mx-auto text-sidebar-primary">
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground">
                        {t('Belum ada aktivitas aktif')}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {t(
                          'Bagikan apa yang sedang Anda kerjakan (seperti coding, riset, atau mendengarkan audio) kepada kawan satu komunitas.',
                        )}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="teal"
                      onClick={() => setIsEditingActivity(true)}
                      className="text-xs h-8 px-4 font-bold cursor-pointer"
                    >
                      + {t('Atur Aktivitas Sekarang')}
                    </Button>
                  </div>
                )}

                {/* Inline Activity Editor Form */}
                {isEditingActivity && (
                  <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ActivityIcon className="w-3.5 h-3.5 text-sidebar-primary" />
                        {t('Atur Status Aktivitas')}
                      </span>
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditingActivity(false)}
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {t('Preset Cepat')}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '💻 Coding', title: 'Coding & Dev', subtitle: 'Mengerjakan fitur baru', icon: '💻' },
                          { label: '🎨 UI Design', title: 'UI/UX Design', subtitle: 'Merapikan komponen antarmuka', icon: '🎨' },
                          { label: '🎧 Audio', title: 'Mendengarkan Musik', subtitle: 'Lo-Fi Chill Beats', icon: '🎧' },
                          { label: '🚀 Focus', title: 'Focus Sprint', subtitle: 'Mohon tidak diganggu', icon: '🚀' },
                          { label: '☕ Rehat', title: 'Rehat Santai', subtitle: 'Menikmati kopi', icon: '☕' },
                          { label: '📚 Riset', title: 'Riset & Belajar', subtitle: 'Mempelajari dokumentasi', icon: '📚' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setActivityTitleInput(preset.title);
                              setActivitySubtitleInput(preset.subtitle);
                              setActivityIconInput(preset.icon);
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-secondary hover:bg-secondary/80 border border-border/60 text-foreground transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <label className="text-[10px] text-muted-foreground block mb-1">
                            {t('Ikon')}
                          </label>
                          <Input
                            type="text"
                            value={activityIconInput}
                            onChange={(e) => setActivityIconInput(e.target.value)}
                            className="text-center text-sm h-8"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground block mb-1">
                            {t('Judul Aktivitas')}
                          </label>
                          <Input
                            type="text"
                            value={activityTitleInput}
                            onChange={(e) => setActivityTitleInput(e.target.value)}
                            placeholder={t('e.g. Coding / UI Design / Focus Mode')}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          {t('Detail / Status')}
                        </label>
                        <Input
                          type="text"
                          value={activitySubtitleInput}
                          onChange={(e) => setActivitySubtitleInput(e.target.value)}
                          placeholder={t('e.g. Sprint 2 Frontend / Lo-Fi Chill')}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => setIsEditingActivity(false)}
                        className="h-7 text-xs"
                      >
                        {t('Batal')}
                      </Button>
                      <Button
                        type="button"
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

                {/* Connected Platforms Section */}
                <ProfileConnectedPlatformsSection
                  userConnections={userConnections}
                  onOpenConnectModal={(p) => {
                    if (p) setSelectedPlatformToConnect(p);
                    setIsConnectModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* TAB 3: WISHLIST (Fullstack Shop Integration) */}
            {profileSubTab === 'wishlist' && (
              <ProfileWishlistSubtab
                wishlistItems={wishlistItems}
                catalogItems={catalogItems}
                newCustomWishlistInput={newCustomWishlistInput}
                setNewCustomWishlistInput={setNewCustomWishlistInput}
                onPreviewShopItem={handlePreviewShopItem}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                onToggleWishlist={handleToggleWishlist}
                onAddCustomWishlist={handleAddCustomWishlist}
                onOpenShop={handleOpenShop}
              />
            )}
          </div>
        </div>

        {/* Sticky Mobile & Tablet Bottom Action Bar (< xl) */}
        <div className="xl:hidden p-3 border-t border-border/60 bg-card/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              {t('Perubahan akan langsung disimpan ke profil publik Anda.')}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 px-3 cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="teal"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="text-xs font-bold h-8 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}</span>
            </Button>
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
              <FormDropdown
                label={<span className="text-[10px] font-bold uppercase text-muted-foreground">{t('Pilih Platform')}</span>}
                value={selectedPlatformToConnect.id}
                onChange={(val) => {
                  const found = availablePlatforms.find((p) => p.id === val);
                  if (found) setSelectedPlatformToConnect(found);
                }}
                size="sm"
                options={availablePlatforms.map((p) => ({ value: p.id, label: p.name }))}
              />

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

        {/* 1. Change Display Name Style Dialog */}
        <ChangeDisplayNameStyleDialog
          open={isNameStyleDialogOpen}
          onOpenChange={setIsNameStyleDialogOpen}
          currentUserName={currentUserName}
          avatarUrl={profileAvatarUrl}
          bannerColor={profileBannerColor}
          bannerUrl={profileBannerUrl}
          initialStyle={displayNameStyle}
          onApply={(newStyle) => setDisplayNameStyle(newStyle)}
        />

        {/* 2. Select an Image Dialog (Avatar & Banner) */}
        <SelectImageDialog
          open={isSelectImageOpen}
          onOpenChange={setIsSelectImageOpen}
          mode={selectImageMode}
          currentImageUrl={selectImageMode === 'avatar' ? profileAvatarUrl : profileBannerUrl}
          onSelectImage={(url) => {
            if (selectImageMode === 'avatar') {
              setProfileAvatarUrl(url);
            } else {
              setProfileBannerUrl(url);
            }
          }}
          onOpenNectarUpgrade={handleNectarCta}
          onOpenShop={handleOpenShop}
        />

        {/* 3. Full Preview Nectar Dialog */}
        <PreviewNectarDialog
          open={isPreviewNectarOpen}
          onOpenChange={setIsPreviewNectarOpen}
          currentUserName={currentUserName}
          avatarUrl={profileAvatarUrl}
          bannerUrl={profileBannerUrl}
          bannerColor={profileBannerColor}
          themePrimary={themePrimary}
          themeAccent={themeAccent}
          displayNameStyle={displayNameStyle}
          avatarDecoration={profileAvatarDecoration}
          bioText={profileBioText}
          onOpenChangeNameStyle={() => setIsNameStyleDialogOpen(true)}
          onOpenSelectBanner={() => {
            setSelectImageMode('banner');
            setIsSelectImageOpen(true);
          }}
          onOpenSelectAvatar={() => {
            setSelectImageMode('avatar');
            setIsSelectImageOpen(true);
          }}
          onOpenThemeColorPicker={(target) => {
            setThemeColorPickerTarget(target);
            setIsThemeColorPickerOpen(true);
          }}
          onOpenUpgradePlan={handleNectarCta}
          onRandomizeAll={handleRandomizeNectarProfile}
        />

        {/* 4. Profile Theme Color Picker Overlay */}
        {isThemeColorPickerOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
            onClick={() => setIsThemeColorPickerOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ProfileThemeColorPicker
                color={themeColorPickerTarget === 'primary' ? themePrimary : themeAccent}
                title={
                  themeColorPickerTarget === 'primary'
                    ? t('Warna Utama')
                    : t('Warna Aksen')
                }
                onChange={handleThemeColorChange}
                onClose={() => setIsThemeColorPickerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* 5. Standalone Discord-Parity Change Avatar Decoration Dialog */}
        <ChangeAvatarDecorationDialog
          open={isAvatarDecorationDialogOpen}
          onClose={() => setIsAvatarDecorationDialogOpen(false)}
          currentDecoration={profileAvatarDecoration}
          onApply={(newDec) => setProfileAvatarDecoration(newDec)}
          avatarUrl={activeAvatar}
          userName={activeName}
          onOpenShop={handleOpenShop}
        />

        {/* 6. Standalone Discord-Parity Change Nameplate Dialog */}
        <ChangeNameplateDialog
          open={isNameplateDialogOpen}
          onClose={() => setIsNameplateDialogOpen(false)}
          currentNameplate={profileNameplate}
          onApply={(newPlate) => setProfileNameplate(newPlate)}
          avatarUrl={activeAvatar}
          userName={activeName}
          avatarDecoration={profileAvatarDecoration}
          onOpenShop={handleOpenShop}
        />
      </DialogContent>
    </Dialog>
  );
}
