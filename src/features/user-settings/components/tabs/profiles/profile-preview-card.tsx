import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Pencil,
  Smile,
  Heart,
  MessageSquare,
  Store,
  Share2,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { ShareProfileDialog } from '@/features/profile/components/share-profile-dialog';
import {
  parseDisplayNameStyle,
  getDisplayNameInlineStyles,
} from '@/features/profile/data/display-name-styles';

import type { UserConnectionItem } from '@/features/user-settings/api/games-apps-api';

export interface ProfilePreviewCardProps {
  currentUserName: string;
  userId?: string;
  onOpenShop?: () => void;
  profileBannerColor: string;
  profileBannerUrl?: string | null;
  profileAvatarUrl?: string | null;
  defaultAvatarUrl?: string | null;
  profileStatusThought: string;
  setProfileStatusThought: (s: string) => void;
  isEditingStatusThought: boolean;
  setIsEditingStatusThought: (b: boolean) => void;
  profilePronouns: string;
  setProfilePronouns: (s: string) => void;
  isEditingPronouns: boolean;
  setIsEditingPronouns: (b: boolean) => void;
  profileBioText: string;
  setProfileBioText: (s: string) => void;
  isEditingBioText: boolean;
  setIsEditingBioText: (b: boolean) => void;
  onNavigateSection?: (section: string) => void;
  nameplate?: string;
  profileFrame?: string;
  profileEffect?: string;
  profileTheme?: string;
  memberSince?: string;
  isNectarSubscriber?: boolean;
  avatarDecoration?: string;
  displayNameStyle?: string;
  connections?: UserConnectionItem[];
  colonyName?: string;
}

export function ProfilePreviewCard({
  currentUserName,
  profileBannerColor,
  profileBannerUrl,
  profileAvatarUrl,
  defaultAvatarUrl,
  profileStatusThought,
  setProfileStatusThought,
  isEditingStatusThought,
  setIsEditingStatusThought,
  profilePronouns,
  setProfilePronouns,
  isEditingPronouns,
  setIsEditingPronouns,
  profileBioText,
  setProfileBioText,
  isEditingBioText,
  setIsEditingBioText,
  onNavigateSection,
  nameplate,
  profileFrame,
  profileEffect,
  profileTheme,
  memberSince,
  isNectarSubscriber = false,
  avatarDecoration,
  displayNameStyle = 'default',
  connections = [],
  colonyName,
  userId,
  onOpenShop,
}: ProfilePreviewCardProps) {
  const { t } = useTranslation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const displayAvatar = profileAvatarUrl || defaultAvatarUrl || null;

  const handleShareProfile = () => {
    setIsShareModalOpen(true);
  };

  const handleCopyUserId = () => {
    const idToCopy = userId || 'usr_20261119_anticeil';
    navigator.clipboard?.writeText(idToCopy);
    toast.success(t('ID Pengguna berhasil disalin!'));
  };

  const getFrameClassName = (frame?: string) => {
    switch (frame) {
      case 'teal_ring':
        return 'ring-4 ring-sidebar-primary ring-offset-2 ring-offset-card';
      case 'gold_bee':
        return 'ring-4 ring-amber-400 ring-offset-2 ring-offset-card';
      case 'cyber_matrix':
        return 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-card animate-pulse';
      case 'sakura_blossom':
        return 'ring-4 ring-pink-400 ring-offset-2 ring-offset-card';
      case 'dark_void':
        return 'ring-4 ring-violet-600 ring-offset-2 ring-offset-card';
      default:
        return '';
    }
  };

  const getDisplayNameStyleClass = (style?: string) => {
    switch (style) {
      case 'cyber':
        return 'font-mono tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]';
      case 'retro':
        return 'font-serif italic text-amber-300 tracking-wide';
      case 'gradient':
        return 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent font-black';
      case 'mono':
        return 'font-mono font-bold tracking-tight text-emerald-400';
      default:
        return 'text-foreground';
    }
  };

  const getDecorationBadge = (dec?: string) => {
    switch (dec) {
      case 'sakura':
        return { icon: '🌸', tooltip: 'Sakura Petals Aura' };
      case 'cyber_crown':
        return { icon: '👑', tooltip: 'Cyberpunk Crown' };
      case 'flame_aura':
        return { icon: '🔥', tooltip: 'Inferno Flame Aura' };
      case 'gold_bee':
        return { icon: '🍯', tooltip: 'Golden Hive Halo' };
      case 'dark_smoke':
        return { icon: '🌫️', tooltip: 'Midnight Dark Smoke' };
      case 'angel_wings':
        return { icon: '🪽', tooltip: 'Celestial Wings' };
      default:
        return null;
    }
  };

  const visibleConnections = (connections || []).filter((c) => c.displayOnProfile !== false);
  const decoration = getDecorationBadge(avatarDecoration);

  const isJsonStyle = displayNameStyle?.startsWith('{');
  const parsedStyle = isJsonStyle ? parseDisplayNameStyle(displayNameStyle) : null;
  const inlineStyles = parsedStyle ? getDisplayNameInlineStyles(parsedStyle) : undefined;

  const isCustomGradient =
    Boolean(profileTheme?.startsWith('custom:') || profileTheme?.startsWith('linear-gradient'));
  const customCardStyle = isCustomGradient
    ? {
        background: profileTheme?.startsWith('custom:')
          ? `linear-gradient(to bottom, ${profileTheme.replace('custom:', '')})`
          : profileTheme,
      }
    : undefined;

  return (
    <div className="w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[380px] mx-auto overflow-hidden">
      <div
        className="rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden transition-all"
        style={customCardStyle}
      >
        {/* Banner Area (TikTok Style with Gradient & Overlay Content) */}
        <div
          className="h-36 sm:h-40 relative transition-colors bg-cover bg-center overflow-hidden flex flex-col justify-end"
          style={{
            backgroundColor: profileBannerColor || '#1e1f22',
            backgroundImage: profileBannerUrl ? `url(${profileBannerUrl})` : undefined,
          }}
        >
          {/* Animated Profile Effect Overlay */}
          {profileEffect && profileEffect !== 'none' && profileEffect.startsWith('http') && (
            <img
              src={profileEffect}
              alt="Profile Effect"
              className="absolute inset-0 size-full object-cover opacity-80 mix-blend-screen pointer-events-none select-none z-10"
            />
          )}

          {/* Theme Gradient Overlay (TikTok style fade-to-bottom) */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 via-40% to-transparent pointer-events-none z-10" />

          {/* Top-Right Tag: Tema Profil */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-semibold border border-white/10 shadow-xs z-20">
            <Palette className="w-3 h-3 text-sidebar-primary" />
            <span>{t('Tema Profil')}</span>
          </div>

          {/* Content Over Banner: Name & Username on Left, Avatar on Right */}
          <div className="relative z-20 px-4 pb-3 flex items-end justify-between gap-3">
            {/* Left: Name and Username sitting directly on top of banner */}
            <div className="min-w-0 flex-1 drop-shadow-md">
              <div
                className={cn(
                  "text-lg sm:text-xl font-black text-white leading-tight transition-all truncate tracking-tight drop-shadow-sm",
                  !isJsonStyle && getDisplayNameStyleClass(displayNameStyle)
                )}
                style={inlineStyles}
              >
                {currentUserName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-mono mt-0.5 truncate drop-shadow-xs">
                <span>@{currentUserName.toLowerCase().replace(/\s+/g, '')}</span>
              </div>
            </div>

            {/* Right: Avatar on the right overlapping banner */}
            <div className="relative shrink-0">
              {/* Avatar Decoration / Animated Frame Overlay */}
              {avatarDecoration && avatarDecoration !== 'none' && (
                avatarDecoration.startsWith('http') ? (
                  <img
                    src={avatarDecoration}
                    alt="Frame"
                    className="absolute -inset-3.5 size-[calc(100%+28px)] object-contain pointer-events-none select-none z-20 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                  />
                ) : decoration ? (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 text-2xl filter drop-shadow-lg pointer-events-none select-none animate-pulse"
                    title={decoration.tooltip}
                  >
                    {decoration.icon}
                  </div>
                ) : null
              )}
              <div
                className={`size-18 sm:size-20 rounded-full border-[3px] border-card overflow-hidden bg-muted flex items-center justify-center text-3xl shadow-2xl transition-all relative ${getFrameClassName(
                  profileFrame,
                )}`}
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={currentUserName}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center bg-sidebar-primary/20 text-sidebar-primary font-bold text-xl select-none">
                    {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                {/* Visual Effect Overlay */}
                {profileEffect && profileEffect !== 'none' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {profileEffect === 'teal_sparkles' && (
                      <span className="text-xs animate-bounce">✨</span>
                    )}
                    {profileEffect === 'fireflies' && (
                      <span className="text-xs animate-pulse">🌟</span>
                    )}
                    {profileEffect === 'aurora_glow' && (
                      <div className="absolute inset-0 bg-sidebar-primary/20 backdrop-blur-[1px] animate-pulse" />
                    )}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 size-4 sm:size-5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Card Body below banner */}
        <div className="px-4 py-3 space-y-3 relative">
          {/* Status Cloud & Pronouns / Tag Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Pronouns & Tag */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              {isEditingPronouns ? (
                <input
                  type="text"
                  value={profilePronouns}
                  onChange={(e) => setProfilePronouns(e.target.value)}
                  onBlur={() => setIsEditingPronouns(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingPronouns(false)}
                  autoFocus
                  placeholder="e.g. they/them"
                  className="w-20 bg-transparent border-b border-sidebar-primary text-xs text-foreground focus:outline-none"
                />
              ) : (
                <span
                  onClick={() => setIsEditingPronouns(true)}
                  className="hover:underline cursor-pointer"
                >
                  {profilePronouns || t('Tambah kata ganti')}
                </span>
              )}
              <span>•</span>
              <span className="text-[11px] bg-sidebar-primary/15 text-sidebar-primary px-1.5 py-0.5 rounded border border-sidebar-primary/30 font-medium">
                {colonyName ? `@${colonyName}` : (nameplate && nameplate !== 'none' ? nameplate : 'Server Tag ⌵')}
              </span>
            </div>

            {/* Status Cloud Bubble */}
            <div
              onClick={() => setIsEditingStatusThought(true)}
              className="px-3 py-1 rounded-full bg-secondary/90 border border-border/80 text-[11px] text-foreground flex items-center gap-1.5 hover:border-sidebar-primary/60 cursor-pointer shadow-sm group transition-colors"
              title={t('Klik untuk mengubah status')}
            >
              <span>💭</span>
              {isEditingStatusThought ? (
                <input
                  type="text"
                  value={profileStatusThought}
                  onChange={(e) => setProfileStatusThought(e.target.value)}
                  onBlur={() => setIsEditingStatusThought(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatusThought(false)}
                  autoFocus
                  className="w-24 bg-transparent border-b border-sidebar-primary text-[11px] text-foreground focus:outline-none"
                />
              ) : (
                <span className={cn('truncate max-w-[140px]', !profileStatusThought && 'text-muted-foreground/70 italic')}>
                  {profileStatusThought || t('Tambah status...')}
                </span>
              )}
            </div>
          </div>

            {/* Badges Row */}
            <div className="flex items-center gap-1.5 pt-1.5">
              <span
                className="size-5 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs"
                title="HypeSquad"
              >
                🛡️
              </span>
              <span
                className="size-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs"
                title="Active Developer"
              >
                🌐
              </span>
              <span
                className="size-5 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/50 text-sidebar-primary flex items-center justify-center text-xs"
                title="Nectar Subscriber"
              >
                💎
              </span>
              <span
                className="size-5 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-xs"
                title="Early Supporter"
              >
                ⚔️
              </span>
            </div>

          {/* Action Buttons (Live Preview) */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="teal"
              onClick={() => toast.info(t('Pratinjau profil: Tombol ini memungkinkan pengguna lain mengirim pesan langsung ke akun Anda.'))}
              className="flex-1 text-xs h-8 font-semibold cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {t('Pesan')}
            </Button>

            {/* Shop Button */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="tealSecondary"
                  onClick={() => {
                    if (onOpenShop) {
                      onOpenShop();
                    } else {
                      window.history.pushState({}, '', '/shop');
                      window.dispatchEvent(new CustomEvent('anticeil:navigate-home', { detail: 'shop' }));
                    }
                    toast.success(t('Membuka Shop & Aksesori Profil! 🏪'));
                  }}
                  className="h-8 px-2.5 cursor-pointer rounded-lg hover:bg-secondary transition-all"
                  aria-label={t('Shop')}
                >
                  <Store className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {t('Shop')}
              </TooltipContent>
            </Tooltip>

            {/* Three Dots More Menu Button */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="tealSecondary"
                  className="h-8 px-2.5 cursor-pointer rounded-lg hover:bg-secondary transition-all data-[state=open]:bg-secondary"
                  aria-label={t('Opsi Lainnya')}
                  title={t('Opsi Lainnya')}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={6}
                className="w-48 p-1.5 rounded-xl border border-border/80 bg-popover shadow-2xl z-[150]"
              >
                <DropdownMenuItem
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-accent transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{t('Bagikan Profil')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border/60" />

                <DropdownMenuItem
                  onClick={handleCopyUserId}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="size-4 rounded-[4px] bg-muted/80 text-[9px] font-black flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                    ID
                  </span>
                  <span>{t('Salin ID Pengguna')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share Profile Modal Dialog (1:1 Discord fullstack) */}
            <ShareProfileDialog
              open={isShareModalOpen}
              onOpenChange={setIsShareModalOpen}
              profileUser={{
                id: userId,
                name: currentUserName,
                username: currentUserName.toLowerCase().replace(/\s+/g, '_'),
                avatar: displayAvatar,
              }}
            />
          </div>

          {/* Amp up your profile Promo banner */}
          <div className="mt-4 p-3 rounded-xl bg-sidebar-primary/10 border border-sidebar-primary/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-sidebar-primary" />
              <span>{t('Tingkatkan Tampilan Profil Anda')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('Buka lencana profil khusus, tema kustom, banner animasi, dan avatar dinamis dengan Nectar.')}
            </p>
            <Button
              size="sm"
              variant="teal"
              onClick={() => {
                onNavigateSection?.('nitro');
                toast.success(t('Navigasi ke Nectar Showcase!'));
              }}
              className="w-full text-[11px] h-7 font-bold cursor-pointer mt-1"
            >
              {t('Dapatkan Nectar')}
            </Button>
          </div>

          {/* Bio / About me preview */}
          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>{t('Tentang Saya')}</span>
              <Pencil
                className="w-3 h-3 hover:text-sidebar-primary cursor-pointer transition-colors"
                onClick={() => setIsEditingBioText(true)}
              />
            </div>
            {isEditingBioText ? (
              <textarea
                value={profileBioText}
                onChange={(e) => setProfileBioText(e.target.value)}
                onBlur={() => setIsEditingBioText(false)}
                rows={2}
                autoFocus
                placeholder={t('Tulis sesuatu tentang diri Anda...')}
                className="w-full text-xs text-foreground bg-secondary/80 p-2 rounded-lg border border-sidebar-primary focus:outline-none resize-none"
              />
            ) : (
              <p
                onClick={() => setIsEditingBioText(true)}
                className={cn(
                  'text-xs cursor-pointer transition-colors',
                  profileBioText
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/60 italic hover:text-sidebar-primary',
                )}
                title={t('Klik untuk mengubah bio')}
              >
                {profileBioText || t('(Belum ada bio - klik untuk menambahkan)')}
              </p>
            )}
          </div>

          {/* Member Since */}
          <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Anggota Sejak')}
            </div>
            <div className="text-xs text-foreground font-medium">
              {memberSince || '17 Nov 2026'}
            </div>
          </div>

          {/* Connections (Real connected accounts from user-settings) */}
          {visibleConnections.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Koneksi')}
              </div>
              <div className="space-y-1.5">
                {visibleConnections.map((conn) => (
                  <div
                    key={conn.id || conn.platformId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/80 border border-border/60"
                  >
                    <div className="size-5 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center text-xs font-bold shadow-xs">
                      {conn.icon || '🔗'}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {conn.accountName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {conn.platformName}
                      </span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Koneksi')}
              </div>
              <p className="text-[11px] text-muted-foreground/60 italic">
                {t('Belum ada akun eksternal yang dihubungkan.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
