import React, { useState, useEffect } from 'react';
import {
  Eye,
  Sun,
  Moon,
  Pipette,
  Clock,
  Dices,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { SplitPaneDialog } from '@/components/ui/split-pane-dialog';
import {
  FONT_OPTIONS,
  LIMITED_TIME_FONT,
  EFFECT_OPTIONS,
  COLOR_SWATCHES,
  parseDisplayNameStyle,
  serializeDisplayNameStyle,
  getDisplayNameInlineStyles,
  type DisplayNameStyleConfig,
} from '../data/display-name-styles';

export interface ChangeDisplayNameStyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserName: string;
  avatarUrl?: string | null;
  bannerColor?: string;
  bannerUrl?: string | null;
  initialStyle?: string;
  onApply: (styleString: string) => void;
}

export function ChangeDisplayNameStyleDialog({
  open,
  onOpenChange,
  currentUserName,
  avatarUrl,
  bannerColor = '#3b37af',
  bannerUrl,
  initialStyle,
  onApply,
}: ChangeDisplayNameStyleDialogProps) {
  const { t } = useTranslation();

  const [config, setConfig] = useState<DisplayNameStyleConfig>(() =>
    parseDisplayNameStyle(initialStyle)
  );
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (open) {
      setConfig(parseDisplayNameStyle(initialStyle));
    }
  }, [open, initialStyle]);

  const handleSurpriseMe = () => {
    const allFonts = [...FONT_OPTIONS, LIMITED_TIME_FONT];
    const randomFont = allFonts[Math.floor(Math.random() * allFonts.length)];
    const randomEffect = EFFECT_OPTIONS[Math.floor(Math.random() * EFFECT_OPTIONS.length)];
    const randomColor = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];

    setConfig({
      fontId: randomFont.id,
      effectId: randomEffect.id,
      color: randomColor,
    });
  };

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          setConfig((prev) => ({ ...prev, color: result.sRGBHex }));
        }
      } catch {}
    }
  };

  const handleApply = () => {
    onApply(serializeDisplayNameStyle(config));
    onOpenChange(false);
  };

  const inlineStyles = getDisplayNameInlineStyles(config);

  const previewContent = (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div
        className={cn(
          'p-3.5 rounded-xl border transition-colors space-y-3.5',
          previewTheme === 'dark'
            ? 'bg-background/90 border-border text-foreground'
            : 'bg-zinc-100 border-zinc-300 text-zinc-900'
        )}
      >
        {/* Profile Card Mini Preview */}
        <div className="rounded-xl overflow-hidden border border-border/70 bg-card shadow-md">
          <div
            className="h-18 bg-cover bg-center relative"
            style={{
              backgroundColor: bannerColor,
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="px-3.5 pb-3 -mt-7 relative z-10 flex items-end gap-2.5">
            <div className="size-14 rounded-full border-2 border-background bg-muted overflow-hidden shrink-0 shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center font-bold text-sm text-foreground">
                  {currentUserName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <div
                className="text-base font-black truncate leading-tight tracking-tight"
                style={inlineStyles}
              >
                {currentUserName}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                @{currentUserName.toLowerCase().replace(/\s+/g, '')}
              </div>
            </div>
          </div>
        </div>

        {/* Simulated Chat Message Bubbles */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-[10px] font-bold text-foreground">
                  {currentUserName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xs font-bold truncate leading-none"
                  style={inlineStyles}
                >
                  {currentUserName}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">10:49</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {t('does anyone read this?')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-10.5">
            <span
              className="text-xs font-bold truncate"
              style={inlineStyles}
            >
              {currentUserName}
            </span>
          </div>
        </div>
      </div>

      {/* Note & Theme Toggle */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <p className="max-w-[80%] leading-tight text-[10px]">
          {t(
            'Note: Display name colors and effects will not appear in servers. Styles may also look different across Anticeil and light/dark mode.'
          )}
        </p>
        <button
          type="button"
          onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={t('Toggle Light/Dark Preview')}
        >
          {previewTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-foreground" />
          )}
        </button>
      </div>
    </div>
  );

  const footerActions = (
    <div className="w-full flex items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={handleSurpriseMe}
        className="text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 cursor-pointer h-8"
      >
        <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
        <span>{t('Surprise Me')}</span>
      </Button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 rounded-lg font-semibold text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {t('Cancel')}
        </button>
        <Button
          type="button"
          onClick={handleApply}
          className="h-8 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
        >
          {t('Apply')}
        </Button>
      </div>
    </div>
  );

  return (
    <SplitPaneDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('Change Display Name Style')}
      size="3xl"
      previewWidth="wide"
      preview={previewContent}
      footerActions={footerActions}
    >
      {/* 1. Choose Font */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>{t('Choose Font')}</span>
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {/* 4x3 Font Grid */}
        <div className="grid grid-cols-4 gap-2">
          {FONT_OPTIONS.map((f) => {
            const isSelected = config.fontId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, fontId: f.id }))}
                className={cn(
                  'h-13 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-card',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                    : 'border-border/70 hover:border-border text-foreground'
                )}
                title={f.name}
              >
                <span
                  className="text-lg select-none"
                  style={{ fontFamily: f.fontFamily }}
                >
                  {f.sample}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Limited Time Font */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>{t('Limited Time Font')}</span>
          <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold">
            <Clock className="w-3 h-3" />
            20D LEFT
          </span>
        </div>

        <button
          type="button"
          onClick={() => setConfig((prev) => ({ ...prev, fontId: LIMITED_TIME_FONT.id }))}
          className={cn(
            'w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer bg-gradient-to-r from-purple-950/40 via-card to-pink-950/40 text-left',
            config.fontId === LIMITED_TIME_FONT.id
              ? 'border-primary ring-2 ring-primary/40 shadow-xs'
              : 'border-border/70 hover:border-border'
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black tracking-widest text-pink-400 bg-pink-500/20 px-1.5 py-0.5 rounded">
              VICE CITY
            </span>
            <span
              className="text-sm font-black italic tracking-widest text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
              style={{ fontFamily: LIMITED_TIME_FONT.fontFamily }}
            >
              {currentUserName.toUpperCase()}
            </span>
          </div>
        </button>
        <p className="text-[10px] text-muted-foreground leading-tight">
          {t(
            'Promoted by Rockstar Games, available to everyone through December 14 and to Nectar members through February 21.'
          )}
        </p>
      </div>

      {/* 3. Choose Effect */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>{t('Choose Effect')}</span>
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {EFFECT_OPTIONS.map((eff) => {
            const isSelected = config.effectId === eff.id;
            return (
              <button
                key={eff.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, effectId: eff.id }))}
                className={cn(
                  'py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-card text-center',
                  isSelected
                    ? 'border-primary text-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                    : 'border-border/70 hover:border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {t(eff.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Choose Color */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>{t('Choose Color')}</span>
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {'EyeDropper' in window && (
            <button
              type="button"
              onClick={handleEyedropper}
              title={t('Ambil Warna Layar')}
              className="size-7 rounded-lg bg-card border border-border/80 hover:border-primary text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
            >
              <Pipette className="w-3.5 h-3.5" />
            </button>
          )}

          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = config.color.toLowerCase() === swatch.toLowerCase();
            return (
              <button
                key={swatch}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, color: swatch }))}
                className={cn(
                  'size-7 rounded-lg border border-black/40 transition-transform cursor-pointer',
                  isSelected
                    ? 'ring-2 ring-primary scale-110 shadow-xs'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: swatch }}
              />
            );
          })}
        </div>
      </div>
    </SplitPaneDialog>
  );
}
