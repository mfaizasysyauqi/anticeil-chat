import React, { useState } from 'react';
import {
  Palette, Sun, Moon, Sparkles, Check, ChevronDown, Radio, Info, Eye, Zap, SlidersHorizontal, ChevronRight
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface AppearanceTabProps {
  theme: any;
  setTheme: (theme: any) => void;
  onNavigateSection?: (section: string) => void;
}

export function AppearanceTab({
  theme,
  setTheme,
  onNavigateSection,
}: AppearanceTabProps) {
  const { t } = useTranslation();
  // ==========================================
  // APPEARANCE STATES (Discord Parity)
  // ==========================================
  const [sameAsDeviceTheme, setSameAsDeviceTheme] = useState(false);
  const [selectedDefaultTheme, setSelectedDefaultTheme] = useState<string>('navy');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('custom');
  const [syncThemeDevices, setSyncThemeDevices] = useState(true);
  const [applyThemeToProfiles, setApplyThemeToProfiles] = useState(false);
  const [selectedAppIcon, setSelectedAppIcon] = useState('blurple');

  // Messages appearance states
  const [showMediaFromLinks, setShowMediaFromLinks] = useState(true);
  const [showMediaUploaded, setShowMediaUploaded] = useState(true);
  const [showEmbedsPreviews, setShowEmbedsPreviews] = useState(true);
  const [showEmojiReactions, setShowEmojiReactions] = useState(true);
  const [spoilerDisplay, setSpoilerDisplay] = useState<'click' | 'mod' | 'always'>('click');
  const [openThreadsSplitView, setOpenThreadsSplitView] = useState(true);
  const [showUserAvatars, setShowUserAvatars] = useState(true);
  const [showFavoritesServer, setShowFavoritesServer] = useState(false);

  // Chat Box states
  const [previewMarkdownAsType, setPreviewMarkdownAsType] = useState(true);
  const [convertEmoticonsToEmoji, setConvertEmoticonsToEmoji] = useState(true);
  const [showStickersAutocomplete, setShowStickersAutocomplete] = useState(false);
  const [showGamesAutocomplete, setShowGamesAutocomplete] = useState(true);
  const [showSendMessageButton, setShowSendMessageButton] = useState(false);

  // Search scope state
  const [dmSearchScope, setDmSearchScope] = useState<'single' | 'all'>('single');

  // Streamer Mode states
  const [streamerModeEnabled, setStreamerModeEnabled] = useState(false);
  const [autoStreamerModeObs, setAutoStreamerModeObs] = useState(true);
  const [streamerHidePersonalInfo, setStreamerHidePersonalInfo] = useState(true);
  const [streamerHideInviteLinks, setStreamerHideInviteLinks] = useState(true);
  const [streamerDisableSounds, setStreamerDisableSounds] = useState(true);
  const [streamerDisableNotifications, setStreamerDisableNotifications] = useState(true);
  const [streamerHideWindowCapture, setStreamerHideWindowCapture] = useState(false);



  return (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: THEME */}
            <div id="appearance-theme" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Theme')}</h2>
              </div>

              {/* Same as Device Theme */}
              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Same as Device Theme')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Match your device's light or dark mode.")}
                  </div>
                </div>
                <Switch
                  checked={sameAsDeviceTheme}
                  onCheckedChange={(val) => {
                    setSameAsDeviceTheme(val);
                    if (val) {
                      setTheme('system');
                      setSelectedDefaultTheme('system');
                      toast.success(t('Tema disinkronkan dengan tema perangkat'));
                    }
                  }}
                />
              </div>

              {/* Default Themes */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Default Themes')}
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'light', label: 'Light', bg: 'bg-white border-zinc-300', themeVal: 'light' },
                    { id: 'dark', label: 'Dark', bg: 'bg-[#313338] border-zinc-700', themeVal: 'dark' },
                    { id: 'midnight', label: 'Midnight', bg: 'bg-[#111214] border-zinc-800', themeVal: 'dark' },
                    { id: 'navy', label: 'Darker', bg: 'bg-[#1e1f22] border-zinc-800', themeVal: 'dark' },
                    { id: 'system', label: 'Sync', bg: 'bg-[#232428] border-zinc-700', icon: '🔄', themeVal: 'system' },
                  ].map((item) => {
                    const isSelected = selectedDefaultTheme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedDefaultTheme(item.id);
                          setTheme(item.themeVal);
                          toast.success(t(`Tema diubah ke ${item.label}`));
                        }}
                        className={cn(
                          'relative size-12 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-xs',
                          item.bg,
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                            : 'border-border/60 hover:scale-105',
                        )}
                        title={item.label}
                      >
                        {item.icon ? (
                          <span className="text-sm font-bold text-muted-foreground">{item.icon}</span>
                        ) : null}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promo Card: Make your Discord look *juuusst* right */}
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-r from-purple-950/40 via-card to-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-md shrink-0">
                    🎨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {t('Make your Anticeil look *juuusst* right')}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                      {t('Create your own custom theme to make Anticeil uniquely yours. Only with Nectar.')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onNavigateSection?.('nitro');
                    toast.info(t('Tema kustom tersedia dengan Nectar & Pollen!'));
                  }}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-4 h-8 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {t('Try It out')}
                </Button>
              </div>

              {/* Color Themes */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{t('Color Themes')}</span>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Unlock more themes with')}{' '}
                      <span className="text-primary font-semibold">Nectar</span>.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info(t('Preview tema warna aktif selama 15 detik'))}
                      className="h-8 text-xs font-semibold px-3 border-border/80 text-foreground cursor-pointer"
                    >
                      {t('Preview Theme')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onNavigateSection?.('nitro');
                      }}
                      className="h-8 text-xs font-bold px-3 bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{t('Unlock with Nectar')}</span>
                    </Button>
                  </div>
                </div>

                {/* Swatches Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 p-3 rounded-2xl border border-border/70 bg-[#1e1f22]">
                  {/* Swatch 1: Custom Palette */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColorTheme('custom');
                      toast.info(t('Custom color theme selected'));
                    }}
                    className={cn(
                      'aspect-square rounded-xl border flex items-center justify-center text-sm cursor-pointer transition-all',
                      selectedColorTheme === 'custom'
                        ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 bg-muted/40'
                        : 'border-border/60 hover:bg-muted/20',
                    )}
                    title="Custom Palette"
                  >
                    🎨
                  </button>

                  {/* 16 Preset Swatches */}
                  {[
                    { id: 'mint', grad: 'from-emerald-300 to-teal-400', name: 'Mint Breeze' },
                    { id: 'peach', grad: 'from-amber-200 to-orange-300', name: 'Peach Sunrise' },
                    { id: 'lavender', grad: 'from-indigo-200 to-purple-300', name: 'Lavender Mist' },
                    { id: 'sky', grad: 'from-sky-200 to-indigo-300', name: 'Soft Horizon' },
                    { id: 'cream', grad: 'from-amber-100 to-stone-200', name: 'Cream Linen' },
                    { id: 'rose', grad: 'from-pink-200 to-rose-300', name: 'Rose Blossom' },
                    { id: 'sunset', grad: 'from-rose-500 via-purple-600 to-amber-500', name: 'Sunset Glow' },
                    { id: 'violet', grad: 'from-purple-600 to-indigo-600', name: 'Violet Nebula' },
                    { id: 'pine', grad: 'from-emerald-900 to-teal-950', name: 'Deep Pine' },
                    { id: 'velvet', grad: 'from-red-950 to-rose-900', name: 'Velvet Wine' },
                    { id: 'midnight', grad: 'from-blue-950 to-slate-900', name: 'Midnight Ocean' },
                    { id: 'void', grad: 'from-purple-950 to-slate-950', name: 'Cosmic Void' },
                    { id: 'cyber', grad: 'from-teal-800 to-purple-900', name: 'Neon Cyber' },
                    { id: 'gold', grad: 'from-amber-700 to-yellow-900', name: 'Golden Hour' },
                    { id: 'aurora', grad: 'from-teal-600 to-emerald-900', name: 'Aurora Borealis' },
                    { id: 'magma', grad: 'from-orange-950 to-red-950', name: 'Dark Magma' },
                  ].map((sw) => {
                    const isSelected = selectedColorTheme === sw.id;
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => {
                          setSelectedColorTheme(sw.id);
                          toast.success(t(`Tema warna diubah ke ${sw.name}`));
                        }}
                        className={cn(
                          'aspect-square rounded-xl border transition-all cursor-pointer bg-linear-to-br',
                          sw.grad,
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                            : 'border-white/10 hover:scale-105',
                        )}
                        title={sw.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Theme Sync Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Sync theme across my devices')}
                  </div>
                  <Switch checked={syncThemeDevices} onCheckedChange={setSyncThemeDevices} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t("Apply theme to other users' profiles")}
                  </div>
                  <Switch checked={applyThemeToProfiles} onCheckedChange={setApplyThemeToProfiles} />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    onNavigateSection?.('accessibility');
                    setTimeout(() => {
                      document.getElementById('accessibility-color-contrast')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Accessibility')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Change saturation of colors, enable high-contrast mode, and more')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: APP ICON */}
            <div id="appearance-app-icon" className="scroll-mt-6 space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('App Icon')}</h2>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Change the Anticeil in-app icon, only with Nectar.')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(t('Icon preview mode active'))}
                    className="h-8 text-xs font-semibold px-3 border-border/80 text-foreground cursor-pointer"
                  >
                    {t('Preview Icon')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onNavigateSection?.('nitro')}
                    className="h-8 text-xs font-bold px-3 bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{t('Unlock with Nectar')}</span>
                  </Button>
                </div>
              </div>

              {/* Grid of 23 App Icons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {[
                  { id: 'blurple', label: 'Default Blurple', bg: 'bg-[#5865F2]', icon: '💬', active: true },
                  { id: 'dark', label: 'Dark Charcoal', bg: 'bg-[#1e1f22]', icon: '⚡' },
                  { id: 'crt', label: 'CRT Glitch', bg: 'bg-zinc-900 border-green-500/40', icon: '📺' },
                  { id: 'slate', label: 'Monochrome', bg: 'bg-zinc-800', icon: '🌑' },
                  { id: 'white', label: 'Clean White', bg: 'bg-zinc-100 text-zinc-900', icon: '✨' },
                  { id: 'pastel', label: 'Pastel Rainbow', bg: 'bg-linear-to-br from-pink-300 via-purple-300 to-indigo-300', icon: '🌸' },
                  { id: 'pirate', label: 'Pirate Skull', bg: 'bg-linear-to-br from-amber-700 to-stone-900', icon: '🏴‍☠️' },
                  { id: 'camo', label: 'Army Camo', bg: 'bg-linear-to-br from-emerald-800 to-stone-800', icon: '🪖' },
                  { id: 'vaporwave', label: '80s Synthwave', bg: 'bg-linear-to-br from-purple-700 via-pink-600 to-amber-500', icon: '🌇' },
                  { id: 'galaxy', label: 'Cosmic Nebula', bg: 'bg-linear-to-br from-indigo-950 via-purple-900 to-pink-900', icon: '🌌' },
                  { id: 'plushie', label: 'Cute Plushie', bg: 'bg-linear-to-br from-purple-400 to-indigo-400', icon: '🧸' },
                  { id: 'sakura', label: 'Sakura Blossom', bg: 'bg-linear-to-br from-pink-400 via-rose-300 to-pink-500', icon: '🌺' },
                  { id: 'chrome', label: 'Holo Chrome', bg: 'bg-linear-to-br from-slate-300 via-zinc-400 to-slate-200 text-black', icon: '💿' },
                  { id: 'cyber', label: 'Neon Cyber', bg: 'bg-linear-to-br from-emerald-500 via-teal-600 to-black', icon: '🎮' },
                  { id: 'matrix', label: 'Matrix Rain', bg: 'bg-black border-green-500', icon: '📟' },
                  { id: 'spiral', label: 'Hypnotic Spiral', bg: 'bg-linear-to-br from-stone-900 to-zinc-700', icon: '🌀' },
                  { id: 'magma', label: 'Magma Flame', bg: 'bg-linear-to-br from-red-600 via-orange-600 to-yellow-500', icon: '🔥' },
                  { id: 'demon', label: 'Crimson Demon', bg: 'bg-linear-to-br from-red-950 to-rose-900', icon: '😈' },
                  { id: 'classic', label: 'Classic 2015', bg: 'bg-[#7289da]', icon: '🕹️' },
                  { id: 'mecha', label: 'Robot Mecha', bg: 'bg-linear-to-br from-sky-600 to-indigo-900', icon: '🤖' },
                  { id: 'sunset', label: 'Sunset Neon', bg: 'bg-linear-to-br from-amber-500 via-rose-600 to-purple-800', icon: '🌅' },
                  { id: 'pride', label: 'Rainbow Pride', bg: 'bg-linear-to-br from-red-500 via-green-500 to-violet-600', icon: '🌈' },
                  { id: 'trans', label: 'Trans Pastel', bg: 'bg-linear-to-br from-sky-300 via-pink-300 to-white', icon: '🏳️‍⚧️' },
                  { id: 'prestige', label: 'Gold Prestige', bg: 'bg-linear-to-br from-amber-400 via-yellow-500 to-amber-700', icon: '👑' },
                ].map((ic) => {
                  const isSelected = selectedAppIcon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => {
                        setSelectedAppIcon(ic.id);
                        toast.success(t(`App Icon diubah ke ${ic.label}`));
                      }}
                      className={cn(
                        'relative aspect-square rounded-2xl border-2 flex items-center justify-center text-xl transition-all cursor-pointer shadow-xs',
                        ic.bg,
                        isSelected
                          ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                          : 'border-border/60 hover:scale-105',
                      )}
                      title={ic.label}
                    >
                      <span>{ic.icon}</span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUB-SECTION 3: MESSAGES */}
            <div id="appearance-messages" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Messages')}</h2>
              </div>

              {/* Media display options */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Show images, videos, and lolcats...')}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">{t('When posted as links to chat')}</div>
                    <Switch checked={showMediaFromLinks} onCheckedChange={setShowMediaFromLinks} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">{t('When uploaded directly to Discord')}</div>
                    <Switch checked={showMediaUploaded} onCheckedChange={setShowMediaUploaded} />
                  </div>
                </div>
              </div>

              {/* Link previews & emoji reactions */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show embeds and link previews')}</div>
                  <Switch checked={showEmbedsPreviews} onCheckedChange={setShowEmbedsPreviews} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show emoji reactions')}</div>
                  <Switch checked={showEmojiReactions} onCheckedChange={setShowEmojiReactions} />
                </div>
              </div>

              {/* Show spoiler content select */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-semibold text-foreground">{t('Show spoiler content')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('Pilih kapan konten spoiler disembunyikan')}</div>
                </div>
                <div className="relative">
                  <select
                    value={spoilerDisplay}
                    onChange={(e) => setSpoilerDisplay(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="click" className="bg-[#2b2d31]">On click</option>
                    <option value="mod" className="bg-[#2b2d31]">On servers I moderate</option>
                    <option value="always" className="bg-[#2b2d31]">Always</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Split view & user avatars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Open threads in split view')}</div>
                  <Switch checked={openThreadsSplitView} onCheckedChange={setOpenThreadsSplitView} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Show user avatars')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('To hide avatars, go to Accessibility and select Compact under Chat Message Display.')}
                    </div>
                  </div>
                  <Switch checked={showUserAvatars} onCheckedChange={setShowUserAvatars} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{t('Show Favorites server')}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#5865F2] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                        BETA
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Your Favorites stay saved, even if you toggle this off. Learn more.')}
                    </div>
                  </div>
                  <Switch checked={showFavoritesServer} onCheckedChange={setShowFavoritesServer} />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    onNavigateSection?.('accessibility');
                    setTimeout(() => {
                      document.getElementById('accessibility-visual-density')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Accessibility')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Adjust the visual density of chat messages and UI')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: CHAT BOX */}
            <div id="appearance-chat-box" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Chat Box')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Preview emoji, mentions, and markdown syntax as you type')}
                  </div>
                  <Switch checked={previewMarkdownAsType} onCheckedChange={setPreviewMarkdownAsType} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Automatically convert emoticons in your messages to emoji')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('For example, when you type :) Discord will convert it to 🙂')}
                    </div>
                  </div>
                  <Switch checked={convertEmoticonsToEmoji} onCheckedChange={setConvertEmoticonsToEmoji} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show stickers in autocomplete results')}
                  </div>
                  <Switch checked={showStickersAutocomplete} onCheckedChange={setShowStickersAutocomplete} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show games in autocomplete results')}
                  </div>
                  <Switch checked={showGamesAutocomplete} onCheckedChange={setShowGamesAutocomplete} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show send message button')}
                  </div>
                  <Switch checked={showSendMessageButton} onCheckedChange={setShowSendMessageButton} />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 5: SEARCH */}
            <div id="appearance-search" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Search')}</h2>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('By default, searching in DMs...')}
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'single', title: 'Searches only in the selected DM' },
                    { id: 'all', title: 'Searches across all my DMs' },
                  ].map((sc) => {
                    const isSelected = dmSearchScope === sc.id;
                    return (
                      <div
                        key={sc.id}
                        onClick={() => setDmSearchScope(sc.id as any)}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2]'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                          )}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{sc.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 6: STREAMER MODE */}
            <div id="appearance-streamer-mode" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Streamer Mode')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Enable Streamer Mode')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t("Streamer Mode hides your personal info so others watching your stream can't see it.")}
                    </div>
                  </div>
                  <Switch checked={streamerModeEnabled} onCheckedChange={setStreamerModeEnabled} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Automatically enable Streamer Mode if OBS or XSplit are running')}
                  </div>
                  <Switch checked={autoStreamerModeObs} onCheckedChange={setAutoStreamerModeObs} />
                </div>
              </div>

              {/* If Streamer Mode is enabled... */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('If Streamer Mode is enabled...')}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Hide my personal information, such as email, connected accounts, and notes')}
                    </div>
                    <Switch checked={streamerHidePersonalInfo} onCheckedChange={setStreamerHidePersonalInfo} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Hide invite links to my Discord servers')}
                    </div>
                    <Switch checked={streamerHideInviteLinks} onCheckedChange={setStreamerHideInviteLinks} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable all sound effects')}
                    </div>
                    <Switch checked={streamerDisableSounds} onCheckedChange={setStreamerDisableSounds} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable notifications')}
                    </div>
                    <Switch checked={streamerDisableNotifications} onCheckedChange={setStreamerDisableNotifications} />
                  </div>
                </div>
              </div>

              {/* Hide window from screen capture */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Hide Discord Window from Screen Capture')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Hides most Discord windows from most screen capture software.')}
                  </div>
                </div>
                <Switch checked={streamerHideWindowCapture} onCheckedChange={setStreamerHideWindowCapture} />
              </div>
            </div>
          </div>

  );
}
