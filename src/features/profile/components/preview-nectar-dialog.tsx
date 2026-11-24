import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Dices,
  Zap,
  Shield,
  Crown,
  Gamepad2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import {
  parseDisplayNameStyle,
  getDisplayNameInlineStyles,
} from '../data/display-name-styles';

export interface PreviewNectarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserName: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bannerColor?: string;
  themePrimary?: string;
  themeAccent?: string;
  displayNameStyle?: string;
  avatarDecoration?: string;
  bioText?: string;
  onOpenChangeNameStyle: () => void;
  onOpenSelectBanner: () => void;
  onOpenSelectAvatar: () => void;
  onOpenThemeColorPicker: (type: 'primary' | 'accent') => void;
  onOpenUpgradePlan: () => void;
  onRandomizeAll?: () => void;
}

export function PreviewNectarDialog({
  open,
  onOpenChange,
  currentUserName,
  avatarUrl,
  bannerUrl,
  bannerColor = '#3b37af',
  themePrimary = '#3b37af',
  themeAccent = '#ad3e3a',
  displayNameStyle = 'default',
  avatarDecoration = 'none',
  bioText,
  onOpenChangeNameStyle,
  onOpenSelectBanner,
  onOpenSelectAvatar,
  onOpenThemeColorPicker,
  onOpenUpgradePlan,
  onRandomizeAll,
}: PreviewNectarDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'board' | 'activity' | 'wishlist'>('board');

  const styleConfig = parseDisplayNameStyle(displayNameStyle);
  const inlineStyles = getDisplayNameInlineStyles(styleConfig);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-5xl p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px] max-h-[82vh] overflow-hidden">
          {/* LEFT SIDEBAR: CONTROLS & PREVIEW SWITCHERS */}
          <div className="md:col-span-4 p-5 bg-muted/30 border-r border-border/70 flex flex-col justify-between overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-4">
              {/* Back / Close button */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>{t('Preview Nectar')}</span>
              </button>

              <p className="text-xs text-muted-foreground leading-snug">
                {t("You're previewing what your profile could look like with Nectar")}
              </p>

              {/* Surprise Me Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={onRandomizeAll}
                className="w-full h-8 text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border flex items-center justify-center gap-2 rounded-xl cursor-pointer"
              >
                <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>{t('Surprise Me!')}</span>
              </Button>

              {/* 1. Display Name Style Card */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Display Name Style')}
                </span>
                <button
                  type="button"
                  onClick={onOpenChangeNameStyle}
                  className="w-full h-11 px-3 rounded-xl bg-card border border-border hover:border-primary flex items-center justify-center transition-all cursor-pointer group shadow-xs"
                >
                  <span
                    className="text-base font-black truncate drop-shadow-sm group-hover:scale-105 transition-transform"
                    style={inlineStyles}
                  >
                    {currentUserName}
                  </span>
                </button>
              </div>

              {/* 2. Profile Theme Card (Dual color gradient box) */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Profile Theme')}
                </span>
                <div
                  className="w-full h-16 rounded-xl border border-border p-2 flex flex-col justify-between relative shadow-xs overflow-hidden"
                  style={{
                    background: `linear-gradient(to bottom, ${themePrimary}, ${themeAccent})`,
                  }}
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenThemeColorPicker('primary')}
                      title={t('Ubah Warna Utama')}
                      className="size-5 rounded-md border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: themePrimary }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenThemeColorPicker('accent')}
                      title={t('Ubah Warna Aksen')}
                      className="size-5 rounded-md border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: themeAccent }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Profile Banner Card */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Profile Banner')}
                </span>
                <button
                  type="button"
                  onClick={onOpenSelectBanner}
                  className="w-full h-14 rounded-xl border border-border hover:border-primary bg-cover bg-center overflow-hidden transition-all cursor-pointer shadow-xs relative group flex items-center justify-center"
                  style={{
                    backgroundColor: bannerColor,
                    backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full">
                      {t('Ubah Banner')}
                    </span>
                  </div>
                </button>
              </div>

              {/* 4. Animated Avatar Card */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Animated Avatar')}
                </span>
                <button
                  type="button"
                  onClick={onOpenSelectAvatar}
                  className="w-full h-14 rounded-xl bg-card border border-border hover:border-primary flex items-center justify-center transition-all cursor-pointer group shadow-xs"
                >
                  <div className="size-10 rounded-full border-2 border-border overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center font-bold text-foreground text-xs bg-muted">
                        {currentUserName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Unlock Button in Sidebar */}
            <Button
              type="button"
              onClick={onOpenUpgradePlan}
              className="w-full h-9 rounded-xl font-bold text-xs bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{t('Get Nectar')}</span>
            </Button>
          </div>

          {/* RIGHT SHOWCASE: LIVE PROFILE CARD */}
          <div
            className="md:col-span-8 p-6 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar relative"
            style={{
              background: `radial-gradient(ellipse at top, ${themePrimary}33, var(--card) 70%)`,
            }}
          >
            {/* Live Profile Card Container */}
            <div className="w-full max-w-[420px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Banner */}
              <div
                className="h-28 bg-cover bg-center relative"
                style={{
                  backgroundColor: bannerColor,
                  backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Profile Card Header with Avatar & Styled Display Name */}
              <div className="px-5 pb-4 -mt-10 relative z-10 space-y-3">
                <div className="flex items-end justify-between">
                  {/* Avatar */}
                  <div className="relative">
                    <AvatarDecorationRenderer decorationId={avatarDecoration} />
                    <div className="size-20 rounded-full border-4 border-card bg-muted overflow-hidden shadow-xl">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center font-bold text-xl text-foreground">
                          {currentUserName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Status indicator */}
                    <div className="absolute bottom-1 right-1 size-4 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-full shadow-xs">
                    <span title="Enterprise"><Crown className="w-3.5 h-3.5 text-amber-400" /></span>
                    <span title="Nectar"><Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400" /></span>
                    <span title="Verified"><Shield className="w-3.5 h-3.5 text-emerald-400" /></span>
                    <span title="Gamer"><Gamepad2 className="w-3.5 h-3.5 text-cyan-400" /></span>
                  </div>
                </div>

                {/* Display Name & Username */}
                <div>
                  <div
                    className="text-xl font-black truncate leading-tight tracking-tight"
                    style={inlineStyles}
                  >
                    {currentUserName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    @{currentUserName.toLowerCase().replace(/\s+/g, '')}
                  </div>
                </div>

                {/* Profile Tabs (Board, Activity, Wishlist) */}
                <div className="flex items-center gap-4 border-b border-border text-xs font-bold pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('board')}
                    className={cn(
                      'pb-2 border-b-2 transition-colors cursor-pointer',
                      activeTab === 'board'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('Board')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={cn(
                      'pb-2 border-b-2 transition-colors cursor-pointer',
                      activeTab === 'activity'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('Activity')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wishlist')}
                    className={cn(
                      'pb-2 border-b-2 transition-colors cursor-pointer',
                      activeTab === 'wishlist'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('Wishlist')}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="pt-2 space-y-3">
                  {/* Rich Activity Subcard */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          Neverness to Everness
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          58 Hunter Lv. • 276 Achievements
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">SEA</span>
                  </div>

                  {/* About Me */}
                  {bioText && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('About Me')}
                      </div>
                      <p className="text-xs text-foreground leading-snug line-clamp-3">
                        {bioText}
                      </p>
                    </div>
                  )}

                  {/* Member Since & Connected platforms */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{t('Member Since Jun 16, 2026')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-emerald-500">● Spotify</span>
                      <span className="text-sky-500">● GitHub</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM STICKY BAR */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-muted/40 border-t border-border text-xs">
          <span className="text-muted-foreground">
            {t("You're previewing what your profile could look like with Nectar")}
          </span>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              {t('Exit Preview')}
            </Button>
            <Button
              type="button"
              onClick={onOpenUpgradePlan}
              className="h-8 px-5 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{t('Get Nectar')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
