import React, { useState, useEffect } from 'react';
import {
  Palette, Sun, Moon, Sparkles, Check, ChevronDown, Radio, Info, Eye, Zap, SlidersHorizontal, ChevronRight, Lock
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { StreamerModeSection } from './appearance/streamer-mode-section';
import { ChatBoxAppearanceSection } from './appearance/chat-box-appearance-section';
import { userSettingsApi, AppearanceSettings, DEFAULT_USER_SETTINGS } from '../../api/user-settings-api';
import {
  COLOR_THEME_LIST,
  getColorThemeConfig,
  applyColorTheme,
  revertColorTheme,
  getSavedColorTheme,
} from '../../utils/color-theme-definitions';
import {
  APP_ICON_LIST,
  getAppIconConfig,
  AnticeilAppIcon,
} from '../../utils/app-icon-definitions';
import { DiscordPreviewPanel } from '../appearance/discord-preview-panel';
import { getAiCreditsStatus } from '@/features/atlas-agent/services/ai-credits-service';

export interface AppearanceTabProps {
  theme: any;
  setTheme: (theme: any) => void;
  onNavigateSection?: (section: string) => void;
}

function loadInitialAppearance(): AppearanceSettings {
  try {
    const raw = localStorage.getItem('anticeil_user_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.appearance) {
        return { ...DEFAULT_USER_SETTINGS.appearance, ...parsed.appearance };
      }
    }
  } catch {}
  return DEFAULT_USER_SETTINGS.appearance;
}

export function AppearanceTab({
  theme,
  setTheme,
  onNavigateSection,
}: AppearanceTabProps) {
  const { t } = useTranslation();
  const [initial] = useState<AppearanceSettings>(loadInitialAppearance);

  // ==========================================
  // APPEARANCE STATES (Discord Parity)
  // ==========================================
  const [sameAsDeviceTheme, setSameAsDeviceTheme] = useState(initial.sameAsDeviceTheme ?? false);
  const [selectedDefaultTheme, setSelectedDefaultTheme] = useState<string>(initial.selectedDefaultTheme || 'navy');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>(() => {
    return getSavedColorTheme() || initial.selectedColorTheme || 'default_dark';
  });
  const [syncThemeDevices, setSyncThemeDevices] = useState(initial.syncThemeDevices ?? true);
  const [applyThemeToProfiles, setApplyThemeToProfiles] = useState(initial.applyThemeToProfiles ?? false);
  const [selectedAppIcon, setSelectedAppIcon] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('anticeil_app_icon');
      if (stored && stored !== 'blurple') return stored;
    } catch {}
    if (initial.selectedAppIcon && initial.selectedAppIcon !== 'blurple') {
      return initial.selectedAppIcon;
    }
    return 'default';
  });

  // Discord-style Floating Preview Panel state
  const [previewMode, setPreviewMode] = useState<'theme' | 'icon' | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string>('');

  const creditsStatus = getAiCreditsStatus();
  const currentPlan = creditsStatus.planId; // 'free' | 'nectar_basic' | 'nectar_boost' | 'royal_enterprise'

  const canUseTier = (tier: 'free' | 'pollen' | 'nectar' | 'royal') => {
    if (tier === 'free') return true;
    if (currentPlan === 'royal_enterprise') return true;
    if (currentPlan === 'nectar_boost') return tier === 'pollen' || tier === 'nectar';
    if (currentPlan === 'nectar_basic') return tier === 'pollen';
    return false;
  };

  // Messages appearance states
  const [showMediaFromLinks, setShowMediaFromLinks] = useState(initial.showMediaFromLinks ?? true);
  const [showMediaUploaded, setShowMediaUploaded] = useState(initial.showMediaUploaded ?? true);
  const [showEmbedsPreviews, setShowEmbedsPreviews] = useState(initial.showEmbedsPreviews ?? true);
  const [showEmojiReactions, setShowEmojiReactions] = useState(initial.showEmojiReactions ?? true);
  const [spoilerDisplay, setSpoilerDisplay] = useState<'click' | 'mod' | 'always'>(initial.spoilerDisplay || 'click');
  const [openThreadsSplitView, setOpenThreadsSplitView] = useState(initial.openThreadsSplitView ?? true);
  const [showUserAvatars, setShowUserAvatars] = useState(initial.showUserAvatars ?? true);
  const [showFavoritesServer, setShowFavoritesServer] = useState(initial.showFavoritesServer ?? false);

  // Chat Box states
  const [previewMarkdownAsType, setPreviewMarkdownAsType] = useState(initial.previewMarkdownAsType ?? true);
  const [convertEmoticonsToEmoji, setConvertEmoticonsToEmoji] = useState(initial.convertEmoticonsToEmoji ?? true);
  const [showStickersAutocomplete, setShowStickersAutocomplete] = useState(initial.showStickersAutocomplete ?? false);
  const [showGamesAutocomplete, setShowGamesAutocomplete] = useState(initial.showGamesAutocomplete ?? true);
  const [showSendMessageButton, setShowSendMessageButton] = useState(initial.showSendMessageButton ?? false);

  // Search scope state
  const [dmSearchScope, setDmSearchScope] = useState<'single' | 'all'>(initial.dmSearchScope || 'single');

  // Streamer Mode states
  const [streamerModeEnabled, setStreamerModeEnabled] = useState(initial.streamerModeEnabled ?? false);
  const [autoStreamerModeObs, setAutoStreamerModeObs] = useState(initial.autoStreamerModeObs ?? true);
  const [streamerHidePersonalInfo, setStreamerHidePersonalInfo] = useState(initial.streamerHidePersonalInfo ?? true);
  const [streamerHideInviteLinks, setStreamerHideInviteLinks] = useState(initial.streamerHideInviteLinks ?? true);
  const [streamerDisableSounds, setStreamerDisableSounds] = useState(initial.streamerDisableSounds ?? true);
  const [streamerDisableNotifications, setStreamerDisableNotifications] = useState(initial.streamerDisableNotifications ?? true);
  const [streamerHideWindowCapture, setStreamerHideWindowCapture] = useState(initial.streamerHideWindowCapture ?? false);

  useEffect(() => {
    userSettingsApi.getSettings().then((s) => {
      if (s?.appearance) {
        const app = s.appearance;
        if (app.sameAsDeviceTheme !== undefined) setSameAsDeviceTheme(app.sameAsDeviceTheme);
        if (app.selectedDefaultTheme) setSelectedDefaultTheme(app.selectedDefaultTheme);
        if (app.selectedColorTheme) setSelectedColorTheme(app.selectedColorTheme);
        if (app.syncThemeDevices !== undefined) setSyncThemeDevices(app.syncThemeDevices);
        if (app.applyThemeToProfiles !== undefined) setApplyThemeToProfiles(app.applyThemeToProfiles);
        if (app.selectedAppIcon) {
          setSelectedAppIcon(app.selectedAppIcon === 'blurple' ? 'default' : app.selectedAppIcon);
        }
        if (app.showMediaFromLinks !== undefined) setShowMediaFromLinks(app.showMediaFromLinks);
        if (app.showMediaUploaded !== undefined) setShowMediaUploaded(app.showMediaUploaded);
        if (app.showEmbedsPreviews !== undefined) setShowEmbedsPreviews(app.showEmbedsPreviews);
        if (app.showEmojiReactions !== undefined) setShowEmojiReactions(app.showEmojiReactions);
        if (app.spoilerDisplay) setSpoilerDisplay(app.spoilerDisplay);
        if (app.openThreadsSplitView !== undefined) setOpenThreadsSplitView(app.openThreadsSplitView);
        if (app.showUserAvatars !== undefined) setShowUserAvatars(app.showUserAvatars);
        if (app.showFavoritesServer !== undefined) setShowFavoritesServer(app.showFavoritesServer);
        if (app.previewMarkdownAsType !== undefined) setPreviewMarkdownAsType(app.previewMarkdownAsType);
        if (app.convertEmoticonsToEmoji !== undefined) setConvertEmoticonsToEmoji(app.convertEmoticonsToEmoji);
        if (app.showStickersAutocomplete !== undefined) setShowStickersAutocomplete(app.showStickersAutocomplete);
        if (app.showGamesAutocomplete !== undefined) setShowGamesAutocomplete(app.showGamesAutocomplete);
        if (app.showSendMessageButton !== undefined) setShowSendMessageButton(app.showSendMessageButton);
        if (app.dmSearchScope) setDmSearchScope(app.dmSearchScope);
        if (app.streamerModeEnabled !== undefined) setStreamerModeEnabled(app.streamerModeEnabled);
        if (app.autoStreamerModeObs !== undefined) setAutoStreamerModeObs(app.autoStreamerModeObs);
        if (app.streamerHidePersonalInfo !== undefined) setStreamerHidePersonalInfo(app.streamerHidePersonalInfo);
        if (app.streamerHideInviteLinks !== undefined) setStreamerHideInviteLinks(app.streamerHideInviteLinks);
        if (app.streamerDisableSounds !== undefined) setStreamerDisableSounds(app.streamerDisableSounds);
        if (app.streamerDisableNotifications !== undefined) setStreamerDisableNotifications(app.streamerDisableNotifications);
        if (app.streamerHideWindowCapture !== undefined) setStreamerHideWindowCapture(app.streamerHideWindowCapture);
      }
    });
  }, []);

  const persistAppearance = (partial: Partial<AppearanceSettings>) => {
    userSettingsApi.updateSettings({
      appearance: partial as any,
    });
  };



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
                    persistAppearance({ sameAsDeviceTheme: val });
                    if (val) {
                      setTheme('system');
                      setSelectedDefaultTheme('system');
                      persistAppearance({ sameAsDeviceTheme: val, theme: 'system', selectedDefaultTheme: 'system' });
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
                          persistAppearance({ selectedDefaultTheme: item.id, theme: item.themeVal as any });
                          toast.success(t(`Tema diubah ke ${item.label}`));
                        }}
                        className={cn(
                          'relative size-12 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-xs',
                          item.bg,
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 scale-105'
                            : 'border-border/60 hover:scale-105',
                        )}
                        title={item.label}
                      >
                        {item.icon ? (
                          <span className="text-sm font-bold text-muted-foreground">{item.icon}</span>
                        ) : null}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-xs">
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 h-8 rounded-md shrink-0 cursor-pointer shadow-xs"
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
                      onClick={() => {
                        setPreviewMode('theme');
                        setPreviewItemId(selectedColorTheme);
                        applyColorTheme(selectedColorTheme, true);
                      }}
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
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 p-3.5 rounded-2xl border border-border/70 bg-[#1e1f22]">
                  {COLOR_THEME_LIST.map((sw) => {
                    const isSelected = selectedColorTheme === sw.id;
                    const isUnlocked = canUseTier(sw.tier);

                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedColorTheme(sw.id);
                            applyColorTheme(sw.id, false);
                            persistAppearance({ selectedColorTheme: sw.id });
                            toast.success(t(`Tema warna diubah ke ${sw.name}`));
                          } else {
                            setPreviewMode('theme');
                            setPreviewItemId(sw.id);
                            applyColorTheme(sw.id, true);
                            toast.info(t(`Melihat pratinjau tema ${sw.name}`));
                          }
                        }}
                        className={cn(
                          'relative aspect-square rounded-2xl border-2 transition-all cursor-pointer shadow-sm group overflow-hidden',
                          isSelected
                            ? 'border-primary ring-2 ring-primary/50 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/40 hover:scale-105',
                        )}
                        style={{ background: sw.gradient }}
                        title={`${sw.name} (${sw.tier.toUpperCase()})`}
                      >
                        {/* Lock badge if locked */}
                        {!isUnlocked && (
                          <div className="absolute top-1 left-1 size-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/80">
                            <Lock className="size-2.5" />
                          </div>
                        )}

                        {/* Selected checkmark */}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                            ✓
                          </span>
                        )}
                      </button>
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
                    onClick={() => {
                      setPreviewMode('icon');
                      setPreviewItemId(selectedAppIcon);
                      window.dispatchEvent(
                        new CustomEvent('anticeil_app_icon_preview', {
                          detail: { icon: selectedAppIcon },
                        }),
                      );
                    }}
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

              {/* Grid of Styled Anticeil App Icons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {APP_ICON_LIST.map((ic) => {
                  const isSelected = selectedAppIcon === ic.id;
                  const isUnlocked = canUseTier(ic.tier);

                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedAppIcon(ic.id);
                          try {
                            localStorage.setItem('anticeil_app_icon', ic.id);
                          } catch {}
                          persistAppearance({ selectedAppIcon: ic.id });
                          window.dispatchEvent(
                            new CustomEvent('anticeil_app_icon_changed', {
                              detail: { icon: ic.id },
                            }),
                          );
                          toast.success(t(`App Icon diubah ke ${ic.name}`));
                        } else {
                          setPreviewMode('icon');
                          setPreviewItemId(ic.id);
                          window.dispatchEvent(
                            new CustomEvent('anticeil_app_icon_preview', {
                              detail: { icon: ic.id },
                            }),
                          );
                          toast.info(t(`Melihat pratinjau icon ${ic.name}`));
                        }
                      }}
                      className={cn(
                        'relative aspect-square rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-xs overflow-hidden group',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 scale-105'
                          : 'border-border/60 hover:scale-105',
                      )}
                      title={`${ic.name} (${ic.tier.toUpperCase()})`}
                    >
                      <AnticeilAppIcon
                        iconId={ic.id}
                        className="w-full h-full"
                        rounded="rounded-2xl"
                      />

                      {/* Lock badge if locked */}
                      {!isUnlocked && (
                        <div className="absolute top-1 left-1 size-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/80 z-20">
                          <Lock className="size-2.5" />
                        </div>
                      )}

                      {/* Selected checkmark */}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-xs z-20">
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
                    <Switch
                      checked={showMediaFromLinks}
                      onCheckedChange={(val) => {
                        setShowMediaFromLinks(val);
                        persistAppearance({ showMediaFromLinks: val });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">{t('When uploaded directly to Anticeil')}</div>
                    <Switch
                      checked={showMediaUploaded}
                      onCheckedChange={(val) => {
                        setShowMediaUploaded(val);
                        persistAppearance({ showMediaUploaded: val });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Link previews & emoji reactions */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show embeds and link previews')}</div>
                  <Switch
                    checked={showEmbedsPreviews}
                    onCheckedChange={(val) => {
                      setShowEmbedsPreviews(val);
                      persistAppearance({ showEmbedsPreviews: val });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show emoji reactions')}</div>
                  <Switch
                    checked={showEmojiReactions}
                    onCheckedChange={(val) => {
                      setShowEmojiReactions(val);
                      persistAppearance({ showEmojiReactions: val });
                    }}
                  />
                </div>
              </div>

              {/* Show spoiler content select */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border/50">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">{t('Show spoiler content')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('Pilih kapan konten spoiler disembunyikan')}</div>
                </div>
                <div className="w-full sm:w-56 shrink-0">
                  <FormDropdown
                    size="sm"
                    value={spoilerDisplay}
                    onChange={(val) => setSpoilerDisplay(val as any)}
                    options={[
                      { value: 'click', label: 'On click' },
                      { value: 'mod', label: 'On servers I moderate' },
                      { value: 'always', label: 'Always' },
                    ]}
                  />
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
                      <span className="text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shadow-xs">
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
            <ChatBoxAppearanceSection
              previewMarkdownAsType={previewMarkdownAsType}
              setPreviewMarkdownAsType={setPreviewMarkdownAsType}
              convertEmoticonsToEmoji={convertEmoticonsToEmoji}
              setConvertEmoticonsToEmoji={setConvertEmoticonsToEmoji}
              showStickersAutocomplete={showStickersAutocomplete}
              setShowStickersAutocomplete={setShowStickersAutocomplete}
              showGamesAutocomplete={showGamesAutocomplete}
              setShowGamesAutocomplete={setShowGamesAutocomplete}
              showSendMessageButton={showSendMessageButton}
              setShowSendMessageButton={setShowSendMessageButton}
            />

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
                            ? 'bg-primary/5 border-primary'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-primary' : 'border-muted-foreground/50',
                          )}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{sc.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 6: STREAMER MODE */}
            <StreamerModeSection
              streamerModeEnabled={streamerModeEnabled}
              setStreamerModeEnabled={setStreamerModeEnabled}
              autoStreamerModeObs={autoStreamerModeObs}
              setAutoStreamerModeObs={setAutoStreamerModeObs}
              streamerHidePersonalInfo={streamerHidePersonalInfo}
              setStreamerHidePersonalInfo={setStreamerHidePersonalInfo}
              streamerHideInviteLinks={streamerHideInviteLinks}
              setStreamerHideInviteLinks={setStreamerHideInviteLinks}
              streamerDisableSounds={streamerDisableSounds}
              setStreamerDisableSounds={setStreamerDisableSounds}
              streamerDisableNotifications={streamerDisableNotifications}
              setStreamerDisableNotifications={setStreamerDisableNotifications}
              streamerHideWindowCapture={streamerHideWindowCapture}
              setStreamerHideWindowCapture={setStreamerHideWindowCapture}
            />

            {/* Discord-style Floating Preview Panel */}
            {previewMode && (
              <DiscordPreviewPanel
                mode={previewMode}
                currentPreviewId={previewItemId}
                onSelectPreview={(id) => {
                  setPreviewItemId(id);
                  if (previewMode === 'theme') {
                    applyColorTheme(id, true);
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('anticeil_app_icon_preview', {
                        detail: { icon: id },
                      }),
                    );
                  }
                }}
                onExitPreview={() => {
                  if (previewMode === 'theme') {
                    revertColorTheme();
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('anticeil_app_icon_changed', {
                        detail: { icon: selectedAppIcon },
                      }),
                    );
                  }
                  setPreviewMode(null);
                }}
                onUnlockNectar={() => {
                  if (previewMode === 'theme') {
                    revertColorTheme();
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('anticeil_app_icon_changed', {
                        detail: { icon: selectedAppIcon },
                      }),
                    );
                  }
                  setPreviewMode(null);
                  onNavigateSection?.('nitro');
                  window.dispatchEvent(
                    new CustomEvent('anticeil_open_user_settings', {
                      detail: { section: 'nitro' },
                    }),
                  );
                }}
              />
            )}
          </div>
  );
}
