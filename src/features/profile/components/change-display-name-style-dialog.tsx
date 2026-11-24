import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Eye,
  Sun,
  Moon,
  Pipette,
  Clock,
  Dices,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
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

  // Handle Surprise Me randomizer
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#18191c] text-white border border-[#27272a] shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Change Display Name Style</DialogTitle>

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {t('Change Display Name Style')}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 pb-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* LEFT COLUMN: FONT, EFFECT, COLOR */}
          <div className="md:col-span-7 space-y-5">
            {/* 1. Choose Font */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <span>{t('Choose Font')}</span>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
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
                        'h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-[#111214]',
                        isSelected
                          ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 bg-[#1e1f22]'
                          : 'border-white/10 hover:border-white/30 text-zinc-300'
                      )}
                      title={f.name}
                    >
                      <span
                        className="text-xl select-none"
                        style={{ fontFamily: f.fontFamily }}
                      >
                        {f.sample}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Limited Time Font (Vice City 2026) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <span>{t('Limited Time Font')}</span>
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  <Clock className="w-3 h-3" />
                  20D LEFT
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, fontId: LIMITED_TIME_FONT.id }))}
                className={cn(
                  'w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer bg-gradient-to-r from-purple-950/60 via-zinc-900 to-pink-950/60 text-left',
                  config.fontId === LIMITED_TIME_FONT.id
                    ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40'
                    : 'border-white/10 hover:border-white/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black tracking-widest text-pink-400 bg-pink-500/20 px-2 py-1 rounded">
                    VICE CITY
                  </span>
                  <span
                    className="text-base font-black italic tracking-widest text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                    style={{ fontFamily: LIMITED_TIME_FONT.fontFamily }}
                  >
                    {currentUserName.toUpperCase()}
                  </span>
                </div>
              </button>
              <p className="text-[10px] text-zinc-500 leading-tight">
                {t(
                  'Promoted by Rockstar Games, available to everyone through December 14 and to Nectar members through February 21.'
                )}
              </p>
            </div>

            {/* 3. Choose Effect */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <span>{t('Choose Effect')}</span>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
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
                        'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-[#111214] text-center',
                        isSelected
                          ? 'border-[#5865F2] text-white bg-[#5865F2]/20 ring-1 ring-[#5865F2]'
                          : 'border-white/10 hover:border-white/30 text-zinc-400 hover:text-white'
                      )}
                    >
                      {eff.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Choose Color */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <span>{t('Choose Color')}</span>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {'EyeDropper' in window && (
                  <button
                    type="button"
                    onClick={handleEyedropper}
                    title={t('Ambil Warna Layar')}
                    className="size-8 rounded-lg bg-[#111214] border border-white/20 hover:border-white text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Pipette className="w-4 h-4" />
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
                        'size-8 rounded-lg border border-black/40 transition-transform cursor-pointer',
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-md'
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE PROFILE & CHAT MESSAGE PREVIEW */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div
              className={cn(
                'p-4 rounded-2xl border transition-colors space-y-4',
                previewTheme === 'dark'
                  ? 'bg-[#1e1f22] border-white/10 text-white'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-900'
              )}
            >
              {/* Profile Card Mini Preview */}
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#111214] shadow-lg">
                <div
                  className="h-20 bg-cover bg-center relative"
                  style={{
                    backgroundColor: bannerColor,
                    backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-transparent to-transparent" />
                </div>
                <div className="px-4 pb-4 -mt-8 relative z-10 flex items-end gap-3">
                  <div className="size-16 rounded-full border-4 border-[#111214] bg-[#2b2d31] overflow-hidden shrink-0 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white">
                        {currentUserName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div
                      className="text-lg font-black truncate leading-tight tracking-tight"
                      style={inlineStyles}
                    >
                      {currentUserName}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      @{currentUserName.toLowerCase().replace(/\s+/g, '')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated Chat Message Bubbles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-full bg-[#2b2d31] overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                        {currentUserName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-sm font-bold truncate leading-none"
                        style={inlineStyles}
                      >
                        {currentUserName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">10:49</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                      does anyone read this?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-12">
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
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2">
              <p className="max-w-[80%] leading-tight">
                {t(
                  'Note: Display name colors and effects will not appear in servers. Styles may also look different across Anticeil and light/dark mode.'
                )}
              </p>
              <button
                type="button"
                onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title={t('Toggle Light/Dark Preview')}
              >
                {previewTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-200" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#111214] border-t border-[#27272a]">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSurpriseMe}
            className="text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer"
          >
            <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>{t('Surprise Me')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            className="h-9 px-6 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all hover:scale-105"
          >
            {t('Apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
