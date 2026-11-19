import React, { useState, useEffect } from 'react';
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
import { webhooksApi, type ColonyWebhook } from '@/features/webhooks';
import type { Colony, ColonyChannel, ColonyApp } from '@/chat/chat-types';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import {
  CreateWebhookDialog,
  FollowedChannelsDialog,
  TwitchIntegrationModal,
  YoutubeIntegrationModal,
} from './integrations/integrations-modals';

interface IntegrationsTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony?: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onNavigateSection?: (section: string) => void;
  onClose?: () => void;
  onOpenWebhooks?: () => void;
  t: (key: string) => string;
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
  const [webhooks, setWebhooks] = useState<ColonyWebhook[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeColony?.id) {
      setIsLoadingWebhooks(true);
      webhooksApi
        .getColonyWebhooks(activeColony.id)
        .then(setWebhooks)
        .finally(() => setIsLoadingWebhooks(false));
    }
  }, [activeColony?.id]);

  // Channels Followed Modal State
  const [isFollowedChannelsOpen, setIsFollowedChannelsOpen] = useState(false);

  // Twitch & YouTube Integration Modals
  const [isTwitchModalOpen, setIsTwitchModalOpen] = useState(false);
  const [isTwitchConnected, setIsTwitchConnected] = useState(false);
  const [twitchAccount, setTwitchAccount] = useState('');

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [youtubeChannel, setYoutubeChannel] = useState('');

  const installedApps: ColonyApp[] = activeColony.installedApps || [];

  const handleCreateWebhook = async (name: string, channelId: string, avatarUrl?: string) => {
    try {
      const created = await webhooksApi.createColonyWebhook(activeColony.id, {
        name,
        channelId,
        avatarUrl,
      });
      if (created) {
        setWebhooks((prev) => [created, ...prev]);
        toast.success(t(`Webhook "${created.name}" berhasil dibuat! 🪝`));
      } else {
        toast.error(t('Gagal membuat webhook'));
      }
    } catch {
      toast.error(t('Gagal membuat webhook'));
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const ok = await webhooksApi.deleteColonyWebhook(activeColony.id, id);
      if (ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        toast.info(t('Webhook telah dihapus.'));
      } else {
        toast.error(t('Gagal menghapus webhook'));
      }
    } catch {
      toast.error(t('Gagal menghapus webhook'));
    }
  };

  const handleCopyWebhookUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    toast.success(t('URL Webhook berhasil disalin! 📋'));
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSendTestWebhook = async (wh: ColonyWebhook) => {
    setIsSendingTest(true);
    try {
      const ok = await webhooksApi.sendTestWebhook(wh.url, {
        content: `Halo dari webhook **${wh.name}**! Integrasi server #${activeColony.name} berfungsi sempurna. 🚀`,
        username: wh.name,
        avatar_url: wh.avatarUrl || undefined,
      });
      if (ok) {
        toast.success(t('Pesan tes webhook berhasil dikirim ke channel! 🎉'));
      } else {
        toast.error(t('Gagal mengirim tes webhook'));
      }
    } catch {
      toast.error(t('Gagal mengirim tes webhook'));
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRemoveApp = async (appId: string, appName: string) => {
    if (!onUpdateColony) return;
    try {
      const updated = installedApps.filter((a) => a.id !== appId);
      await coloniesApi.uninstallColonyApp(activeColony.id, appId);
      await onUpdateColony(activeColony.id, { installedApps: updated });
      toast.success(t(`${appName} telah dihapus dari server.`));
    } catch {
      toast.error(t('Gagal menghapus aplikasi'));
    }
  };

  return (
    <div className="space-y-8 w-full pb-16">
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
            className="text-sidebar-primary hover:underline font-semibold"
          >
            {t('Learn more about managing integrations.')}
          </a>
        </p>
      </div>

      {/* ── 4 Integration Action Cards (Screenshot 1) ── */}
      <div className="space-y-3">
        {/* 1. Webhooks Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-4 transition-colors shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20 flex items-center justify-center text-sidebar-primary shrink-0">
              <Webhook className="w-5 h-5" />
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
            variant="teal"
            onClick={() => setIsCreateWebhookOpen(true)}
            className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer shrink-0 shadow-xs"
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
                className="p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {wh.avatarUrl ? (
                    <img src={wh.avatarUrl} alt={wh.name} className="size-8 rounded-lg object-cover border border-border/60" />
                  ) : (
                    <div className="size-8 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center text-sidebar-primary text-xs font-bold">
                      🪝
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {wh.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block font-mono">
                      #{wh.channelName || channels.find((c) => c.id === wh.channelId)?.name || 'general'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="tealGhost"
                    onClick={() => handleSendTestWebhook(wh)}
                    disabled={isSendingTest}
                    className="h-7 text-xs gap-1 px-2.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{t('Test')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="tealSecondary"
                    onClick={() => handleCopyWebhookUrl(wh.url)}
                    className="h-7 text-xs gap-1 px-2.5 cursor-pointer"
                  >
                    {copiedUrl === wh.url ? (
                      <Check className="w-3 h-3 text-sidebar-primary" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{t('Copy URL')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                    title={t('Hapus Webhook')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Channels Followed Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-4 transition-colors shadow-xs">
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
            className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0"
          >
            {t('Learn More')}
          </Button>
        </div>

        {/* 3. Twitch Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-4 transition-colors shadow-xs">
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
            variant={isTwitchConnected ? 'teal' : 'tealSecondary'}
            onClick={() => setIsTwitchModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0"
          >
            {isTwitchConnected ? t('Manage Twitch') : t('Connect Twitch')}
          </Button>
        </div>

        {/* 4. YouTube Card */}
        <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-4 transition-colors shadow-xs">
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
            variant={isYoutubeConnected ? 'teal' : 'tealSecondary'}
            onClick={() => setIsYoutubeModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0"
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
          <div className="rounded-xl border border-border/70 bg-card p-10 flex flex-col items-center justify-center text-center space-y-4">
            {/* Discord Magnifying Glass & Floating Shapes Illustration */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-sidebar-primary/10 rounded-full blur-xl pointer-events-none" />
              <svg className="w-24 h-24 drop-shadow-md" viewBox="0 0 120 120" fill="none">
                <circle cx="52" cy="52" r="32" stroke="#0d9488" strokeWidth="5" fill="#18191c" />
                <path d="M75 75L102 102" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
                {/* Floating app shape items inside lens */}
                <polygon points="52,32 57,44 70,44 59,52 63,65 52,57 41,65 45,52 34,44 47,44" fill="#0d9488" opacity="0.9" />
                <circle cx="40" cy="58" r="4.5" fill="#3BA55D" />
                <rect x="58" y="52" width="8" height="8" rx="2" fill="#0d9488" />
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
                  className="text-sidebar-primary hover:underline font-semibold cursor-pointer"
                >
                  {t('App Directory')}
                </button>{' '}
                {t('to add apps to your server')}
              </p>
            </div>
          </div>
        ) : (
          /* Installed Apps List */
          <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
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

      <CreateWebhookDialog
        isOpen={isCreateWebhookOpen}
        onOpenChange={setIsCreateWebhookOpen}
        channels={channels}
        onCreateWebhook={handleCreateWebhook}
        t={t}
      />

      <FollowedChannelsDialog
        isOpen={isFollowedChannelsOpen}
        onOpenChange={setIsFollowedChannelsOpen}
        t={t}
      />

      <TwitchIntegrationModal
        isOpen={isTwitchModalOpen}
        onOpenChange={setIsTwitchModalOpen}
        isConnected={isTwitchConnected}
        onConnect={(acc) => {
          setTwitchAccount(acc);
          setIsTwitchConnected(true);
          toast.success(t(`Akun Twitch @${acc} berhasil terhubung! 🎮`));
        }}
        onDisconnect={() => {
          setTwitchAccount('');
          setIsTwitchConnected(false);
          toast.info(t('Integrasi Twitch diputuskan.'));
        }}
        t={t}
      />

      <YoutubeIntegrationModal
        isOpen={isYoutubeModalOpen}
        onOpenChange={setIsYoutubeModalOpen}
        isConnected={isYoutubeConnected}
        onConnect={(ch) => {
          setYoutubeChannel(ch);
          setIsYoutubeConnected(true);
          toast.success(t(`Channel YouTube ${ch} berhasil terhubung! 📺`));
        }}
        onDisconnect={() => {
          setYoutubeChannel('');
          setIsYoutubeConnected(false);
          toast.info(t('Integrasi YouTube diputuskan.'));
        }}
        t={t}
      />
    </div>
  );
}
