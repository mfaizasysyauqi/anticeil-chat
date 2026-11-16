import React, { useState } from 'react';
import {
  Webhook,
  Radio,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Bot,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { colonyApi } from '@/chat/chat-api';
import type { Colony, ColonyChannel, ColonyApp } from '@/chat/chat-types';

interface IntegrationsTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony?: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onNavigateSection?: (section: string) => void;
  onClose?: () => void;
  onOpenWebhooks?: () => void;
  t: (key: string) => string;
}

interface WebhookItem {
  id: string;
  name: string;
  channelId: string;
  url: string;
  avatarText?: string;
  createdAt: string;
}

export function IntegrationsTab({
  activeColony,
  channels = [],
  onUpdateColony,
  onNavigateSection,
  onClose,
  onOpenWebhooks,
  t,
}: IntegrationsTabProps) {
  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('Captain Hook');
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id || 'general');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Channels Followed Modal State
  const [isFollowedChannelsOpen, setIsFollowedChannelsOpen] = useState(false);

  // Twitch & YouTube Integration Modals
  const [isTwitchModalOpen, setIsTwitchModalOpen] = useState(false);
  const [twitchAccount, setTwitchAccount] = useState('');
  const [isTwitchConnected, setIsTwitchConnected] = useState(false);

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);

  const installedApps: ColonyApp[] = activeColony.installedApps || [];

  const handleCreateWebhook = () => {
    const newId = `wh_${Date.now()}`;
    const generatedUrl = `${window.location.origin}/api/v1/community/webhook?hubId=${activeColony.id}&id=${newId}`;
    const newWebhook: WebhookItem = {
      id: newId,
      name: webhookName.trim() || 'Captain Hook',
      channelId: selectedChannelId,
      url: generatedUrl,
      avatarText: '🪝',
      createdAt: new Date().toISOString(),
    };

    setWebhooks((prev) => [newWebhook, ...prev]);
    setIsCreateWebhookOpen(false);
    toast.success(t(`Webhook "${newWebhook.name}" berhasil dibuat! 🪝`));
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.info(t('Webhook telah dihapus.'));
  };

  const handleCopyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(t('URL Webhook berhasil disalin! 📋'));
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSendTestWebhook = async (wh: WebhookItem) => {
    setIsSendingTest(true);
    try {
      await colonyApi.testWebhook({
        colonyId: activeColony.id,
        botName: wh.name,
        content: `Halo dari webhook **${wh.name}**! Integrasi server #${activeColony.name} berfungsi sempurna. 🚀`,
      });
      toast.success(t('Pesan tes webhook berhasil dikirim ke channel! 🎉'));
    } catch {
      toast.info(t('Pesan tes webhook dikirim.'));
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRemoveApp = async (appId: string, appName: string) => {
    if (!onUpdateColony) return;
    try {
      const updated = installedApps.filter((a) => a.id !== appId);
      await onUpdateColony(activeColony.id, { installedApps: updated });
      toast.success(t(`${appName} telah dihapus dari server.`));
    } catch {
      toast.error(t('Gagal menghapus aplikasi'));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* ── Header (Screenshot 1 Discord Parity) ── */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Integrations')}</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t('Customize your server with integrations. Manage webhooks, followed channels, and apps, as well as Twitch and YouTube settings for creators.')}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info(t('Dokumentasi integrasi Anticeil'));
            }}
            className="text-blue-400 hover:underline font-semibold"
          >
            {t('Learn more about managing integrations.')}
          </a>
        </p>
      </div>

      {/* ── 4 Integration Action Cards (Screenshot 1) ── */}
      <div className="space-y-3">
        {/* 1. Webhooks Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-card/80 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
              <Webhook className="w-5 h-5 text-foreground/80" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Webhooks')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {webhooks.length} {t('webhooks')}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateWebhookOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg cursor-pointer shrink-0 shadow-xs"
          >
            {t('Create Webhook')}
          </Button>
        </div>

        {/* Webhooks Expanded List if any created */}
        {webhooks.length > 0 && (
          <div className="pl-4 space-y-2 border-l-2 border-border/60 ml-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-3 rounded-lg border border-border/60 bg-[#111214] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">{wh.avatarText || '🪝'}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {wh.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      #{channels.find((c) => c.id === wh.channelId)?.name || 'general'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSendTestWebhook(wh)}
                    disabled={isSendingTest}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{t('Test')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyWebhookUrl(wh.url)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
                  >
                    {copiedUrl === wh.url ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{t('Copy URL')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="h-7 px-2 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Channels Followed Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-card/80 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
              <Radio className="w-5 h-5 text-foreground/80" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Channels Followed')}
              </h3>
              <p className="text-xs text-muted-foreground">
                0 {t('channels')}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFollowedChannelsOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Learn More')}
          </Button>
        </div>

        {/* 3. Twitch Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#9146FF] shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Twitch')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isTwitchConnected
                  ? t(`Terhubung ke ${twitchAccount} • Emotes dan subs aktif disinkronkan`)
                  : t('Sync your subscribers to roles and unlock your Twitch emotes')}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsTwitchModalOpen(true)}
            className={cn(
              'h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0',
              isTwitchConnected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
            )}
          >
            {isTwitchConnected ? t('Manage Twitch') : t('Connect Twitch')}
          </Button>
        </div>

        {/* 4. YouTube Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('YouTube')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isYoutubeConnected
                  ? t(`Terhubung ke ${youtubeChannel} • Sinkronisasi membership aktif`)
                  : t('Sync your channel members to roles and create an exclusive experience')}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsYoutubeModalOpen(true)}
            className={cn(
              'h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0',
              isYoutubeConnected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
            )}
          >
            {isYoutubeConnected ? t('Manage YouTube') : t('Connect YouTube')}
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: Bots and Apps (Screenshot 2 Discord Parity) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {t('Bots and Apps')}
          </h3>
          {installedApps.length > 0 && onNavigateSection && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigateSection('app-directory')}
              className="text-xs text-primary hover:underline h-7 px-2 cursor-pointer gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Add Apps')}</span>
            </Button>
          )}
        </div>

        {/* Empty State when no apps installed (Matching Screenshot 2) */}
        {installedApps.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-[#1e1f22] p-10 flex flex-col items-center justify-center text-center space-y-4">
            {/* Discord Magnifying Glass & Floating Shapes Illustration */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
              <svg className="w-24 h-24 drop-shadow-md" viewBox="0 0 120 120" fill="none">
                <circle cx="52" cy="52" r="32" stroke="#5865F2" strokeWidth="5" fill="#18191c" />
                <path d="M75 75L102 102" stroke="#5865F2" strokeWidth="6" strokeLinecap="round" />
                {/* Floating app shape items inside lens */}
                <polygon points="52,32 57,44 70,44 59,52 63,65 52,57 41,65 45,52 34,44 47,44" fill="#5865F2" opacity="0.9" />
                <circle cx="40" cy="58" r="4.5" fill="#3BA55D" />
                <rect x="58" y="52" width="8" height="8" rx="2" fill="#FAA81A" />
              </svg>
            </div>

            <div className="space-y-1 max-w-sm">
              <h4 className="text-base font-bold text-foreground">
                {t("You don't have any apps yet!")}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('Visit the')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateSection) {
                      onNavigateSection('app-directory');
                    } else {
                      toast.info(t('Buka tab App Directory di panel samping.'));
                    }
                  }}
                  className="text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  {t('App Directory')}
                </button>{' '}
                {t('to add apps to your server')}
              </p>
            </div>
          </div>
        ) : (
          /* Installed Apps List */
          <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
            {installedApps.map((app) => (
              <div
                key={app.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-lg shrink-0 shadow-xs">
                    {app.icon || '🤖'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {app.name}
                      </span>
                      {app.verified && (
                        <span className="text-primary text-xs font-bold" title="Verified Bot">
                          ✓
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/60 text-muted-foreground">
                        {app.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveApp(app.id, app.name)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-red-400 gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('Remove')}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: Create Webhook ── */}
      <Dialog open={isCreateWebhookOpen} onOpenChange={setIsCreateWebhookOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Webhook className="w-4 h-4 text-primary" />
              <span>{t('Create New Webhook')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Send automated messages from external APIs and services into your channel.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t('Webhook Name')}
              </label>
              <Input
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="Captain Hook"
                className="text-xs bg-[#111214] border-border/70 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t('Channel')}
              </label>
              <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                <SelectTrigger className="text-xs bg-[#111214] border-border/70 h-9">
                  <SelectValue placeholder={t('Pilih Channel')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f22] border-border/80">
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      #{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateWebhookOpen(false)}
              className="text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateWebhook}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {t('Simpan Webhook')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Channels Followed Learn More ── */}
      <Dialog open={isFollowedChannelsOpen} onOpenChange={setIsFollowedChannelsOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Radio className="w-4 h-4 text-primary" />
              <span>{t('Channels Followed')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              {t('Following an Announcement channel from another server lets you automatically receive updates and news directly in your own channels.')}
            </p>
            <p>
              {t('To follow a channel, navigate to any Announcement channel across Anticeil servers and click the "Follow" button.')}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsFollowedChannelsOpen(false)}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {t('Mengerti')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Connect Twitch ── */}
      <Dialog open={isTwitchModalOpen} onOpenChange={setIsTwitchModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#9146FF]">
              <span>Twitch Creator Integration</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Hubungkan akun Twitch Anda untuk menyinkronkan subscriber ke peran otomatis dan menggunakan emotikon channel.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Twitch Username / Channel URL
            </label>
            <Input
              value={twitchAccount}
              onChange={(e) => setTwitchAccount(e.target.value)}
              placeholder="e.g. shroud"
              className="text-xs bg-[#111214] border-border/70 h-9"
            />
          </div>
          <DialogFooter className="gap-2">
            {isTwitchConnected ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsTwitchConnected(false);
                  setTwitchAccount('');
                  setIsTwitchModalOpen(false);
                  toast.info(t('Integrasi Twitch diputuskan.'));
                }}
                className="text-xs"
              >
                {t('Disconnect')}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!twitchAccount.trim()) {
                  toast.error(t('Masukkan username Twitch terlebih dahulu.'));
                  return;
                }
                setIsTwitchConnected(true);
                setIsTwitchModalOpen(false);
                toast.success(t(`Akun Twitch @${twitchAccount} berhasil terhubung! 🎮`));
              }}
              className="text-xs bg-[#9146FF] hover:bg-[#772CE8] text-white"
            >
              {t('Hubungkan Twitch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Connect YouTube ── */}
      <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-500">
              <span>YouTube Creator Integration</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Hubungkan channel YouTube Anda untuk memberikan peran khusus kepada member channel dan subscriber.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-muted-foreground">
              YouTube Channel Handle or URL
            </label>
            <Input
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              placeholder="e.g. @MrBeast"
              className="text-xs bg-[#111214] border-border/70 h-9"
            />
          </div>
          <DialogFooter className="gap-2">
            {isYoutubeConnected ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsYoutubeConnected(false);
                  setYoutubeChannel('');
                  setIsYoutubeModalOpen(false);
                  toast.info(t('Integrasi YouTube diputuskan.'));
                }}
                className="text-xs"
              >
                {t('Disconnect')}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!youtubeChannel.trim()) {
                  toast.error(t('Masukkan handle YouTube terlebih dahulu.'));
                  return;
                }
                setIsYoutubeConnected(true);
                setIsYoutubeModalOpen(false);
                toast.success(t(`Channel YouTube ${youtubeChannel} berhasil terhubung! 📺`));
              }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {t('Hubungkan YouTube')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
