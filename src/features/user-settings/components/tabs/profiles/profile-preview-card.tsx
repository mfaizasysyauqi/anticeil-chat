import React from 'react';
import {
  Palette,
  Sparkles,
  Pencil,
  Smile,
  Heart,
  MessageSquare,
  UserCheck,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface ProfilePreviewCardProps {
  currentUserName: string;
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
}: ProfilePreviewCardProps) {
  const { t } = useTranslation();
  const displayAvatar = profileAvatarUrl || defaultAvatarUrl || null;

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
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden">
        {/* Banner Area */}
        <div
          className="h-28 relative transition-colors bg-cover bg-center"
          style={{
            backgroundColor: profileBannerColor,
            backgroundImage: profileBannerUrl ? `url(${profileBannerUrl})` : undefined,
          }}
        >
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-semibold border border-white/10 shadow-xs">
            <Palette className="w-3 h-3 text-sidebar-primary" />
            <span>{t('Tema Profil')}</span>
          </div>
        </div>

        {/* Avatar & Status Cloud */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 relative">
            <div className="relative">
              <div
                className={`size-20 rounded-full border-4 border-card overflow-hidden bg-muted flex items-center justify-center text-3xl shadow-md transition-all ${getFrameClassName(
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
              <div className="absolute bottom-0 right-0 size-5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
            </div>

            {/* Status Cloud Bubble */}
            <div
              onClick={() => setIsEditingStatusThought(true)}
              className="mb-1 px-3 py-1 rounded-full bg-secondary/90 border border-border/80 text-[11px] text-foreground flex items-center gap-1.5 hover:border-sidebar-primary/60 cursor-pointer shadow-sm group transition-colors"
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
                <span className="truncate max-w-[120px]">{profileStatusThought}</span>
              )}
            </div>
          </div>

          {/* Profile Header Details */}
          <div className="mt-3 space-y-1">
            <div className="text-lg font-bold text-foreground leading-tight">
              {currentUserName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span>{currentUserName.toLowerCase()}</span>
              <span>•</span>
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
                {nameplate && nameplate !== 'none' ? nameplate : 'Server Tag ⌵'}
              </span>
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="teal"
              className="flex-1 text-xs h-8 font-semibold cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {t('Pesan')}
            </Button>
            <Button
              size="sm"
              variant="tealSecondary"
              className="h-8 px-2.5 cursor-pointer"
              title={t('Tambah Teman')}
            >
              <UserCheck className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="tealSecondary"
              className="h-8 px-2.5 cursor-pointer"
              title={t('Opsi Lainnya')}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
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
                className="w-full text-xs text-foreground bg-secondary/80 p-2 rounded-lg border border-sidebar-primary focus:outline-none resize-none"
              />
            ) : (
              <p
                onClick={() => setIsEditingBioText(true)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title={t('Klik untuk mengubah bio')}
              >
                {profileBioText}
              </p>
            )}
          </div>

          {/* Member Since */}
          <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Anggota Sejak')}
            </div>
            <div className="text-xs text-foreground font-medium">
              {memberSince || 'Nov 17, 2026'}
            </div>
          </div>

          {/* Connections */}
          <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Koneksi')}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/80 border border-border/60">
              <div className="size-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-bold shadow-xs">
                🟢
              </div>
              <span className="text-xs font-semibold text-foreground truncate">
                ESTEFANO
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
