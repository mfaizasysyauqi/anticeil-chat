import React, { useState } from 'react';
import { Bell, Play, ChevronDown, Check, Mic, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface NotificationsTabProps {
  onNavigateSection?: (section: string) => void;
}

export function NotificationsTab({ onNavigateSection }: NotificationsTabProps) {
  const { t } = useTranslation();
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(true);
  const [enableTaskbarFlashing, setEnableTaskbarFlashing] = useState(true);
  const [notifyStreaming, setNotifyStreaming] = useState(true);
  const [notifyAnniversary, setNotifyAnniversary] = useState(true);
  const [notifyFriendsOnline, setNotifyFriendsOnline] = useState(true);
  const [notifyProfileUpdates, setNotifyProfileUpdates] = useState(true);
  const [notifyReactions, setNotifyReactions] = useState<'all' | 'my-messages' | 'never'>('all');

  const [soundNewMessage, setSoundNewMessage] = useState(true);
  const [soundCurrentChannel, setSoundCurrentChannel] = useState(false);
  const [soundIncomingRing, setSoundIncomingRing] = useState(true);
  const [disableAllSounds, setDisableAllSounds] = useState(false);

  const [enableUnreadBadges, setEnableUnreadBadges] = useState(true);

  const [emailCommunication, setEmailCommunication] = useState(true);
  const [emailSocial, setEmailSocial] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(false);
  const [emailTips, setEmailTips] = useState(false);
  const [emailRecommendations, setEmailRecommendations] = useState(false);

  const [showAdvancedNotifications, setShowAdvancedNotifications] = useState(false);
  const [mobileTimeout, setMobileTimeout] = useState('10m');
  const [ttsNotifications, setTtsNotifications] = useState('never');
  const [allowTtsCommand, setAllowTtsCommand] = useState(true);

  const playPreviewSound = (type: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'ring') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'deafen') {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'undeafen') {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'mute') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'unmute') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'quack') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'airhorn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(466.16, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
      toast.success(t('Efek suara diputar'));
    } catch {
      toast.info(t('Efek suara preview'));
    }
  };


  return (
          <div className="space-y-8 pb-8">
            {/* ── 1. OVERVIEW ── */}
            <div id="notifications-overview" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Overview')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable Desktop Notifications')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t("If you're looking for per-channel or per-server notifications, right-click the desired server icon and select Notification Settings.")}
                    </div>
                  </div>
                  <Switch
                    checked={enableDesktopNotifications}
                    onCheckedChange={setEnableDesktopNotifications}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable Taskbar Flashing')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Flashes the app in your taskbar when you have new notifications.')}
                    </div>
                  </div>
                  <Switch
                    checked={enableTaskbarFlashing}
                    onCheckedChange={setEnableTaskbarFlashing}
                  />
                </div>
              </div>

              {/* Notify me when... */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Notify me when...')}
                </div>

                <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('People I know start streaming in small servers')}
                    </span>
                    <Switch
                      checked={notifyStreaming}
                      onCheckedChange={setNotifyStreaming}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('A friend and I reach a friendship anniversary')}
                    </span>
                    <Switch
                      checked={notifyAnniversary}
                      onCheckedChange={setNotifyAnniversary}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Friends come online')}
                    </span>
                    <Switch
                      checked={notifyFriendsOnline}
                      onCheckedChange={setNotifyFriendsOnline}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Friends update their profile')}
                    </span>
                    <Switch
                      checked={notifyProfileUpdates}
                      onCheckedChange={setNotifyProfileUpdates}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Someone reacts to my messages')}
                    </span>
                    <div className="w-40 shrink-0">
                      <Select
                        value={notifyReactions}
                        onValueChange={(val: any) => setNotifyReactions(val)}
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span>{t('All Messages')}</span>
                          </SelectItem>
                          <SelectItem value="my-messages">
                            <span>{t('Only for Messages I Send')}</span>
                          </SelectItem>
                          <SelectItem value="never">
                            <span>{t('Never')}</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 2. SOUNDS ── */}
            <div id="notifications-sounds" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Sounds')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t('New Message')}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('message')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundNewMessage}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundNewMessage}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t("New Message in the channel I'm currently reading")}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('message')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundCurrentChannel}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundCurrentChannel}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Incoming Ring')}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('ring')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundIncomingRing}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundIncomingRing}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable All Notification Sounds')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Disables all notification sounds, including voice & video sound effects. Your individual sound preferences will be saved and restored if you turn this on.')}
                    </div>
                  </div>
                  <Switch
                    checked={disableAllSounds}
                    onCheckedChange={setDisableAllSounds}
                  />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.('voice')}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Voice & Video')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("Enable/disable sounds that play when you're in a call, like Mute, Unmute, Deafen, and more.")}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 3. BADGES ── */}
            <div id="notifications-badges" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Badges')}
              </h2>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Enable Unread Message Badge')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Shows a red badge on the app icon when you have unread messages.')}
                  </div>
                </div>
                <Switch
                  checked={enableUnreadBadges}
                  onCheckedChange={setEnableUnreadBadges}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 4. EMAIL ── */}
            <div id="notifications-email" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Email')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Communication Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails for missed calls, messages, and message digests.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailCommunication}
                    onCheckedChange={setEmailCommunication}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Social Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails for friend requests, new friend suggestions, and events in your server.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailSocial}
                    onCheckedChange={setEmailSocial}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Announcements and Update Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails about product updates, our newest features, improvements and bug fixes.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailAnnouncements}
                    onCheckedChange={setEmailAnnouncements}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Tip Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails with helpful advice on how to use Anticeil and information on lesser known features.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailTips}
                    onCheckedChange={setEmailTips}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Recommendations Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails with recommended servers and suggested events.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailRecommendations}
                    onCheckedChange={setEmailRecommendations}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4 bg-muted/10">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Unsubscribe from all marketing emails')}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border border-border cursor-pointer"
                    onClick={() => {
                      setEmailAnnouncements(false);
                      setEmailTips(false);
                      setEmailRecommendations(false);
                      toast.success(t('Berhasil berhenti berlangganan dari semua email pemasaran.'));
                    }}
                  >
                    {t('Unsubscribe')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 5. ADVANCED ── */}
            <div id="notifications-advanced" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Advanced')}
              </h2>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowAdvancedNotifications((prev) => !prev)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Show Advanced Notification Settings')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Mobile notification delay, allow playback and usage of /tts command, and more')}
                    </div>
                  </div>
                  <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        showAdvancedNotifications && 'rotate-180'
                      )}
                    />
                  </div>
                </button>

                {showAdvancedNotifications && (
                  <div className="border-t border-border/60 divide-y divide-border/60 bg-muted/10">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Push Notification Inactive Timeout')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Anticeil delays push notifications to your mobile device when you are active on desktop.')}
                        </div>
                      </div>
                      <div className="w-36 shrink-0">
                        <Select
                          value={mobileTimeout}
                          onValueChange={(val: any) => setMobileTimeout(val)}
                        >
                          <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1m">{t('1 Minute')}</SelectItem>
                            <SelectItem value="2m">{t('2 Minutes')}</SelectItem>
                            <SelectItem value="5m">{t('5 Minutes')}</SelectItem>
                            <SelectItem value="10m">{t('10 Minutes')}</SelectItem>
                            <SelectItem value="never">{t('Never')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Text-to-Speech (TTS) Notifications')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Choose when Anticeil should read out incoming messages using speech synthesis.')}
                        </div>
                      </div>
                      <div className="w-48 shrink-0">
                        <Select
                          value={ttsNotifications}
                          onValueChange={(val: any) => setTtsNotifications(val)}
                        >
                          <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">{t('Never')}</SelectItem>
                            <SelectItem value="all-channels">{t('For all channels')}</SelectItem>
                            <SelectItem value="current-channel">{t('For current selected channel')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Allow playback and usage of /tts command')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Allows server members and friends to trigger speech playback using /tts.')}
                        </div>
                      </div>
                      <Switch
                        checked={allowTtsCommand}
                        onCheckedChange={setAllowTtsCommand}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}
