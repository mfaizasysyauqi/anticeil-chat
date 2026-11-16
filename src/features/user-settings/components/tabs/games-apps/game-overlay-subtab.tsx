import React, { useState } from 'react';
import {
  Users,
  Pin,
  Mic,
  Headphones,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export function GameOverlaySubtab() {
  const { t } = useTranslation();

  // Overview
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [enableLegacyOverlay, setEnableLegacyOverlay] = useState(true);
  const [overlayLockKeybind, setOverlayLockKeybind] = useState("SHIFT + '");
  const [isEditingOverlayKeybind, setIsEditingOverlayKeybind] = useState(false);
  const [tempOverlayKeybind, setTempOverlayKeybind] = useState("SHIFT + '");
  const [enableClickableRegions, setEnableClickableRegions] = useState(true);

  // Widgets
  const [widgetVoice, setWidgetVoice] = useState(true);
  const [widgetQuickActions, setWidgetQuickActions] = useState(true);
  const [widgetNotifications, setWidgetNotifications] = useState(true);
  const [widgetChat, setWidgetChat] = useState(true);
  const [widgetActivity, setWidgetActivity] = useState(true);
  const [widgetVideo, setWidgetVideo] = useState(true);
  const [widgetStreams, setWidgetStreams] = useState(true);

  // Voice Widget
  const [overlayAvatarSize, setOverlayAvatarSize] = useState<'Large' | 'Small'>(
    'Large',
  );
  const [overlayDisplayNames, setOverlayDisplayNames] = useState<
    'Always' | 'Only While Speaking' | 'Never'
  >('Always');
  const [overlayDisplayUsers, setOverlayDisplayUsers] = useState<
    'Always' | 'Only While Speaking'
  >('Always');
  const [isVoiceWidgetPinned, setIsVoiceWidgetPinned] = useState(true);

  // Notifications
  const [overlayNotifMessages, setOverlayNotifMessages] = useState(true);
  const [overlayNotifWelcome, setOverlayNotifWelcome] = useState(true);
  const [overlayNotifGoLive, setOverlayNotifGoLive] = useState(true);
  const [overlayNotifGameActivity, setOverlayNotifGameActivity] = useState(true);
  const [overlayNotifNowPlaying, setOverlayNotifNowPlaying] = useState(true);

  const handleResetOverlayWidgets = () => {
    setWidgetVoice(true);
    setWidgetQuickActions(true);
    setWidgetNotifications(true);
    setWidgetChat(true);
    setWidgetActivity(true);
    setWidgetVideo(true);
    setWidgetStreams(true);
    toast.success(t('Tata letak widget overlay dikembalikan ke default!'));
  };

  return (
    <div className="space-y-8 divide-y divide-border/50 pb-8">
      {/* SUB-SECTION 1: OVERVIEW */}
      <div id="overlay-overview" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Game Overlay')}
          </h2>
        </div>

        {/* Card 1: Enable Overlay */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
          <div className="space-y-1 pr-4">
            <div className="text-sm font-semibold text-foreground">
              {t('Enable Overlay')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(
                'Lighter, faster, and more customizable. Requires Borderless display setting.',
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              checked={enableOverlay}
              onCheckedChange={(checked) => {
                setEnableOverlay(checked);
                toast.success(
                  checked ? t('Overlay diaktifkan') : t('Overlay dinonaktifkan'),
                );
              }}
            />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Card 2: Enable Legacy Overlay */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
          <div className="space-y-1 pr-4">
            <div className="text-sm font-semibold text-foreground">
              {t('Enable Legacy Overlay')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Legacy Overlay available for all supported games.')}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              checked={enableLegacyOverlay}
              onCheckedChange={(checked) => {
                setEnableLegacyOverlay(checked);
                toast.success(
                  checked
                    ? t('Legacy Overlay diaktifkan')
                    : t('Legacy Overlay dinonaktifkan'),
                );
              }}
            />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Card 3: Report a Problem */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
          <div className="space-y-1 pr-4">
            <div className="text-sm font-semibold text-foreground">
              {t('Report a Problem')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(
                "If Overlay isn't working as expected, let us know so we can fix it.",
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              toast.success(
                t(
                  'Terima kasih! Laporan masalah overlay telah dikirim ke tim pengembang.',
                ),
              )
            }
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-5 h-9 rounded-lg font-semibold shrink-0 cursor-pointer"
          >
            {t('Report')}
          </Button>
        </div>

        <div className="pt-2 border-t border-border/40 space-y-4">
          {/* Toggle Overlay Lock */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="text-xs font-semibold text-foreground">
              {t('Toggle Overlay Lock')}
            </div>
            <div className="flex items-center gap-2">
              {isEditingOverlayKeybind ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={tempOverlayKeybind}
                    onChange={(e) =>
                      setTempOverlayKeybind(e.target.value.toUpperCase())
                    }
                    className="h-8 w-32 text-xs font-mono bg-[#2b2d31] border-[#5865F2] text-foreground text-center"
                    autoFocus
                    placeholder="Tekan shortcut..."
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    onClick={() => {
                      if (tempOverlayKeybind.trim()) {
                        setOverlayLockKeybind(tempOverlayKeybind.trim());
                      }
                      setIsEditingOverlayKeybind(false);
                      toast.success(t('Shortcut lock overlay diperbarui!'));
                    }}
                  >
                    {t('Simpan')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-border/70 text-xs font-mono font-bold text-foreground tracking-wider">
                    {overlayLockKeybind}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTempOverlayKeybind(overlayLockKeybind);
                      setIsEditingOverlayKeybind(true);
                    }}
                    className="h-8 px-3 text-xs bg-[#2b2d31] hover:bg-[#35373c] text-foreground font-semibold rounded-lg cursor-pointer"
                  >
                    {t('Edit Keybind')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Enable overlay clickable regions */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">
                {t('Enable overlay clickable regions')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t(
                  'Allows areas of the overlay (ie notifications) to be clickable while the overlay is locked.',
                )}
              </div>
            </div>
            <Switch
              checked={enableClickableRegions}
              onCheckedChange={(checked) => {
                setEnableClickableRegions(checked);
                toast.success(
                  checked
                    ? t('Clickable regions overlay aktif')
                    : t('Clickable regions overlay nonaktif'),
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* SUB-SECTION 2: WIDGETS */}
      <div id="overlay-widgets" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Widgets')}
          </h2>
          <div className="text-xs text-muted-foreground mt-1">
            {t('Choose what shows up in your overlay.')}
          </div>
        </div>

        {/* 7 Switches */}
        <div className="space-y-4">
          {[
            {
              id: 'voice',
              label: t('Voice'),
              desc: t("Who's talking in your call"),
              checked: widgetVoice,
              setter: setWidgetVoice,
            },
            {
              id: 'quick-actions',
              label: t('Quick Actions'),
              desc: t('Mute, deafen and more'),
              checked: widgetQuickActions,
              setter: setWidgetQuickActions,
            },
            {
              id: 'notifications',
              label: t('Notifications'),
              desc: t('Messages, calls and invites'),
              checked: widgetNotifications,
              setter: setWidgetNotifications,
            },
            {
              id: 'chat',
              label: t('Chat'),
              desc: t('Chat without leaving your game'),
              checked: widgetChat,
              setter: setWidgetChat,
            },
            {
              id: 'activity',
              label: t('Activity'),
              desc: t('What friends are playing'),
              checked: widgetActivity,
              setter: setWidgetActivity,
            },
            {
              id: 'video',
              label: t('Video'),
              desc: t('Cameras in your call'),
              checked: widgetVideo,
              setter: setWidgetVideo,
            },
            {
              id: 'streams',
              label: t('Streams'),
              desc: t('Streams in your call'),
              checked: widgetStreams,
              setter: setWidgetStreams,
            },
          ].map((w, idx) => (
            <div
              key={w.id}
              className={cn(
                'flex items-center justify-between gap-4 py-2',
                idx < 6 && 'border-b border-border/40',
              )}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">
                  {w.label}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {w.desc}
                </div>
              </div>
              <Switch
                checked={w.checked}
                onCheckedChange={(checked) => {
                  w.setter(checked);
                  toast.success(
                    checked
                      ? t(`Widget ${w.label} diaktifkan`)
                      : t(`Widget ${w.label} dinonaktifkan`),
                  );
                }}
              />
            </div>
          ))}
        </div>

        {/* Reset Default Layout Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <span className="text-xs font-semibold text-foreground">
            {t('Reset Default Layout')}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetOverlayWidgets}
            className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
          >
            {t('Reset')}
          </Button>
        </div>
      </div>

      {/* SUB-SECTION 3: VOICE WIDGET */}
      <div id="overlay-voice-widget" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Voice Widget')}
          </h2>
        </div>

        {/* Voice Widget Interactive Live Preview Container */}
        <div className="rounded-2xl border border-border/80 bg-[#1e1f22] p-8 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
          <div className="w-64 rounded-2xl bg-[#111214]/90 backdrop-blur-md border border-white/10 p-3.5 space-y-2.5 shadow-2xl">
            {/* Participant 1: zmsta */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'rounded-full bg-[#2b2d31] flex items-center justify-center text-xs overflow-hidden shrink-0 border border-border/60',
                  overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                )}
              >
                🐱
              </div>
              {overlayDisplayNames !== 'Never' && (
                <span className="text-xs font-semibold text-white/90 truncate">
                  zmsta
                </span>
              )}
            </div>

            {/* Participant 2: Acetaminophen (Speaking state) */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0 ring-2 ring-emerald-500 shadow-sm shadow-emerald-500/50',
                  overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                )}
              >
                <Users className="w-3.5 h-3.5" />
              </div>
              {overlayDisplayNames !== 'Never' && (
                <span className="text-xs font-bold text-emerald-400 truncate">
                  Acetaminophen
                </span>
              )}
              <Mic className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
            </div>

            {/* Participant 3: Kovanth */}
            {overlayDisplayUsers === 'Always' && (
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                    overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                </div>
                {overlayDisplayNames !== 'Never' && (
                  <span className="text-xs font-semibold text-white/90 truncate">
                    Kovanth
                  </span>
                )}
              </div>
            )}

            {/* Participant 4: Scynder (Deafened state) */}
            {overlayDisplayUsers === 'Always' && (
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                    overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                </div>
                {overlayDisplayNames !== 'Never' && (
                  <span className="text-xs font-semibold text-white/90 truncate">
                    Scynder
                  </span>
                )}
                <Headphones className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />
              </div>
            )}

            {/* Bottom Pill: Voice Channel & Pin */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
                {t('Voice Channel')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsVoiceWidgetPinned(!isVoiceWidgetPinned);
                  toast.success(
                    isVoiceWidgetPinned
                      ? t('Widget suara di-unpin')
                      : t('Widget suara di-pin ke overlay'),
                  );
                }}
                className={cn(
                  'size-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                  isVoiceWidgetPinned
                    ? 'bg-[#5865F2] text-white shadow-sm'
                    : 'bg-white/10 text-muted-foreground hover:bg-white/20',
                )}
                title={isVoiceWidgetPinned ? t('Pinned') : t('Unpinned')}
              >
                <Pin className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="space-y-4 pt-2">
          {/* Avatar Size */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground">
              {t('Avatar Size')}
            </span>
            <Select
              value={overlayAvatarSize}
              onValueChange={(val: 'Large' | 'Small') => {
                setOverlayAvatarSize(val);
                toast.success(t(`Ukuran avatar diubah ke ${val}`));
              }}
            >
              <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                <SelectItem value="Large">{t('Large')}</SelectItem>
                <SelectItem value="Small">{t('Small')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Names */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground">
              {t('Display Names')}
            </span>
            <Select
              value={overlayDisplayNames}
              onValueChange={(val: any) => {
                setOverlayDisplayNames(val);
                toast.success(t(`Tampilan nama diubah ke ${val}`));
              }}
            >
              <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                <SelectItem value="Always">{t('Always')}</SelectItem>
                <SelectItem value="Only While Speaking">
                  {t('Only While Speaking')}
                </SelectItem>
                <SelectItem value="Never">{t('Never')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Users */}
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-xs font-semibold text-foreground">
              {t('Display Users')}
            </span>
            <Select
              value={overlayDisplayUsers}
              onValueChange={(val: any) => {
                setOverlayDisplayUsers(val);
                toast.success(t(`Tampilan user diubah ke ${val}`));
              }}
            >
              <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                <SelectItem value="Always">{t('Always')}</SelectItem>
                <SelectItem value="Only While Speaking">
                  {t('Only While Speaking')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SUB-SECTION 4: NOTIFICATIONS */}
      <div id="overlay-notifications" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Notifications')}
          </h2>
          <div className="text-xs text-muted-foreground mt-1">
            {t('Manage how and when overlay notifications show up.')}
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 'messages',
              label: t('Messages'),
              desc: t('Show text messages from open channels and DMs.'),
              checked: overlayNotifMessages,
              setter: setOverlayNotifMessages,
            },
            {
              id: 'welcome',
              label: t('Welcome Messages'),
              desc: t('Notifies you when someone joins the server.'),
              checked: overlayNotifWelcome,
              setter: setOverlayNotifWelcome,
            },
            {
              id: 'go-live',
              label: t('Go Live'),
              desc: t('Notifies you when a friend starts streaming.'),
              checked: overlayNotifGoLive,
              setter: setOverlayNotifGoLive,
            },
            {
              id: 'game-activity',
              label: t('Game Activity'),
              desc: t(
                'Shows friends who are currently playing, or have recently played the game you’re currently playing.',
              ),
              checked: overlayNotifGameActivity,
              setter: setOverlayNotifGameActivity,
            },
            {
              id: 'now-playing',
              label: t('Now Playing'),
              desc: t(
                'Notifies you when a friend starts playing the game you are currently playing.',
              ),
              checked: overlayNotifNowPlaying,
              setter: setOverlayNotifNowPlaying,
            },
          ].map((n, idx) => (
            <div
              key={n.id}
              className={cn(
                'flex items-center justify-between gap-4 py-2',
                idx < 4 && 'border-b border-border/40',
              )}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">
                  {n.label}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {n.desc}
                </div>
              </div>
              <Switch
                checked={n.checked}
                onCheckedChange={(checked) => {
                  n.setter(checked);
                  toast.success(
                    checked
                      ? t(`Notifikasi overlay ${n.label} diaktifkan`)
                      : t(`Notifikasi overlay ${n.label} dinonaktifkan`),
                  );
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
