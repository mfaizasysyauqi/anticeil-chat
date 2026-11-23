import React, { useState } from 'react';
import { X, Heart, Zap, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import {
  COLOR_THEME_LIST,
  getColorThemeConfig,
  applyColorTheme,
  revertColorTheme,
} from '../../utils/color-theme-definitions';
import {
  APP_ICON_LIST,
  getAppIconConfig,
  AnticeilAppIcon,
} from '../../utils/app-icon-definitions';

export interface DiscordPreviewPanelProps {
  mode: 'theme' | 'icon';
  currentPreviewId: string;
  onSelectPreview: (id: string) => void;
  onExitPreview: () => void;
  onUnlockNectar: () => void;
}

export function DiscordPreviewPanel({
  mode,
  currentPreviewId,
  onSelectPreview,
  onExitPreview,
  onUnlockNectar,
}: DiscordPreviewPanelProps) {
  const { t } = useTranslation();
  const [isFavorited, setIsFavorited] = useState(false);

  // Separate limited time item and normal items
  const limitedTimeTheme = COLOR_THEME_LIST.find((t) => t.isLimitedTime);
  const normalThemes = COLOR_THEME_LIST.filter((t) => !t.isLimitedTime);

  const limitedTimeIcon = APP_ICON_LIST.find((i) => i.isLimitedTime);
  const normalIcons = APP_ICON_LIST.filter((i) => !i.isLimitedTime);

  return (
    <div
      className={cn(
        'fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#1e1f22]/95 backdrop-blur-md',
        'border-l border-border/70 shadow-2xl z-[150] flex flex-col justify-between',
        'animate-in slide-in-from-right duration-250 select-none text-foreground',
      )}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <h3 className="text-base font-bold text-foreground">
          {mode === 'theme' ? t('Preview Theme') : t('Preview App Icon')}
        </h3>
        <button
          type="button"
          onClick={onExitPreview}
          className="size-7 rounded-full bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          title={t('Close')}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {mode === 'theme' ? (
          <>
            {/* Create your own theme card */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-r from-purple-950/40 via-card to-card p-3.5 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shrink-0 shadow-sm">
                  🎨
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">
                    {t('Create your own theme')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {t('Style your space with endless color combinations.')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onUnlockNectar}
                className="h-7 text-xs font-bold px-3 shrink-0 cursor-pointer bg-white/10 hover:bg-white/20 text-white"
              >
                {t('Try It Out')}
              </Button>
            </div>

            {/* Limited Time Color Theme (Vice City) */}
            {limitedTimeTheme && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {t('Limited Time Color Theme')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold uppercase tracking-wide border border-pink-500/30">
                    ⏱️ 20D LEFT
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'Promoted by Rockstar Games, available to everyone through December 14 and to Nectar members (excluding Pollen) through February 21.',
                  )}{' '}
                  <span className="text-primary hover:underline cursor-pointer">{t('Learn more')}</span>
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectPreview(limitedTimeTheme.id)}
                    className={cn(
                      'relative size-16 rounded-2xl border-2 transition-all cursor-pointer shadow-md group',
                      currentPreviewId === limitedTimeTheme.id
                        ? 'border-white ring-2 ring-primary/80 scale-105'
                        : 'border-white/20 hover:scale-105',
                    )}
                    style={{ background: limitedTimeTheme.gradient }}
                    title={limitedTimeTheme.name}
                  >
                    {currentPreviewId === limitedTimeTheme.id && (
                      <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                  <div className="text-[11px] font-semibold text-muted-foreground mt-1">
                    {limitedTimeTheme.name}
                  </div>
                </div>
              </div>
            )}

            {/* Color Themes Grid */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="text-xs font-bold text-foreground">{t('Color Themes')}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Get Nectar and make Anticeil yours with unique colors.')}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {normalThemes.map((th) => {
                  const isSelected = currentPreviewId === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onSelectPreview(th.id)}
                      className={cn(
                        'relative aspect-square rounded-2xl border-2 transition-all cursor-pointer shadow-sm group',
                        isSelected
                          ? 'border-white ring-2 ring-primary/80 scale-105 shadow-md'
                          : 'border-white/10 hover:border-white/40 hover:scale-105',
                      )}
                      style={{ background: th.gradient }}
                      title={th.name}
                    >
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Live App Icon Showcase */}
            <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-card border border-border/80 shadow-inner">
              <div className="size-24 rounded-2xl p-1 bg-linear-to-tr from-primary/30 to-purple-500/30 border border-primary/40 shadow-lg mb-3">
                <AnticeilAppIcon
                  iconId={currentPreviewId}
                  className="w-full h-full"
                  rounded="rounded-xl"
                />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {getAppIconConfig(currentPreviewId).name}
              </h4>
              <span className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                {t('Live on Mini Rail')}
              </span>
            </div>

            {/* Limited Time App Icon */}
            {limitedTimeIcon && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {t('Limited Time App Icon')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold uppercase tracking-wide border border-pink-500/30">
                    ⏱️ 20D LEFT
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'Promoted by Rockstar Games, available to everyone through December 14 and to Nectar members through February 21.',
                  )}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectPreview(limitedTimeIcon.id)}
                    className={cn(
                      'relative size-16 rounded-2xl border-2 transition-all cursor-pointer shadow-md',
                      currentPreviewId === limitedTimeIcon.id
                        ? 'border-white ring-2 ring-primary/80 scale-105'
                        : 'border-white/20 hover:scale-105',
                    )}
                  >
                    <AnticeilAppIcon
                      iconId={limitedTimeIcon.id}
                      className="w-full h-full"
                      rounded="rounded-2xl"
                    />
                    {currentPreviewId === limitedTimeIcon.id && (
                      <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                  <div className="text-[11px] font-semibold text-muted-foreground mt-1">
                    {limitedTimeIcon.name}
                  </div>
                </div>
              </div>
            )}

            {/* App Icon Grid */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="text-xs font-bold text-foreground">{t('App Icons')}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Change the Anticeil in-app icon, only with Nectar.')}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {normalIcons.map((ic) => {
                  const isSelected = currentPreviewId === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => onSelectPreview(ic.id)}
                      className={cn(
                        'relative aspect-square rounded-2xl border-2 transition-all cursor-pointer shadow-sm group',
                        isSelected
                          ? 'border-white ring-2 ring-primary/80 scale-105 shadow-md'
                          : 'border-white/10 hover:border-white/40 hover:scale-105',
                      )}
                      title={ic.name}
                    >
                      <AnticeilAppIcon
                        iconId={ic.id}
                        className="w-full h-full"
                        rounded="rounded-2xl"
                      />
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Footer Action Bar (Discord Parity) */}
      <div className="p-4 border-t border-white/10 bg-[#17181b] flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            type="button"
            onClick={() => setIsFavorited(!isFavorited)}
            className={cn(
              'size-10 rounded-xl border border-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0',
              isFavorited ? 'text-rose-500 bg-rose-500/10 border-rose-500/40' : 'text-muted-foreground hover:bg-white/5',
            )}
            title={t('Favorite')}
          >
            <Heart className={cn('size-4', isFavorited ? 'fill-rose-500' : '')} />
          </button>

          {/* Unlock with Nectar */}
          <Button
            type="button"
            onClick={onUnlockNectar}
            className="flex-1 h-10 rounded-xl text-xs font-bold bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="size-4 fill-white" />
            <span>{t('Unlock with Nectar')}</span>
          </Button>
        </div>

        {/* Exit Preview Button */}
        <Button
          type="button"
          variant="secondary"
          onClick={onExitPreview}
          className="w-full h-9 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-foreground cursor-pointer"
        >
          {t('Exit Preview')}
        </Button>
      </div>
    </div>
  );
}
