import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Webhook as WebhookIcon,
  Radio,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Check,
  Trash2,
  Camera,
  AlertTriangle,
  Info,
  ExternalLink,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import { webhooksApi, type ColonyWebhook } from '@/features/webhooks/api/webhooks-api';

export interface ChannelIntegrationsTabProps {
  channel: ColonyChannel;
  activeColony?: Colony | null;
  channels?: ColonyChannel[];
}

// Discord Clyde SVG Icon
function DiscordClydeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.02.02.04.03.07.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
    </svg>
  );
}

export function ChannelIntegrationsTab({
  channel,
  activeColony,
  channels = [],
}: ChannelIntegrationsTabProps) {
  const { t } = useTranslation();
  const colonyId = activeColony?.id || channel.colonyId || 'anticeil';
  const authorName = activeColony?.name
    ? `_${activeColony.name.toLowerCase().replace(/\s+/g, '_')}_`
    : '_zmsta_';

  // Navigation Subview
  const [subView, setSubView] = useState<'root' | 'webhooks'>('root');

  // Webhooks State
  const [webhooks, setWebhooks] = useState<ColonyWebhook[]>([]);
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);
  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);

  // Unsaved Webhook draft edits
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<ColonyWebhook>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isLearnMoreFollowedOpen, setIsLearnMoreFollowedOpen] = useState(false);
  const [isLearnMoreIntegrationsOpen, setIsLearnMoreIntegrationsOpen] = useState(false);

  // File input ref for avatar uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadWebhookId, setActiveUploadWebhookId] = useState<string | null>(null);

  // Channels list for dropdown
  const availableChannels = useMemo(() => {
    if (channels && channels.length > 0) return channels;
    return [channel];
  }, [channels, channel]);

  // Load webhooks from API & local cache
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `colony_webhooks_${colonyId}`;
    const cached = localStorage.getItem(cacheKey);
    let initialList: ColonyWebhook[] = [];

    if (cached) {
      try {
        initialList = JSON.parse(cached);
        if (Array.isArray(initialList) && initialList.length > 0) {
          setWebhooks(initialList);
        }
      } catch {
        // ignore parse error
      }
    }

    webhooksApi.getColonyWebhooks(colonyId).then((res) => {
      if (!isMounted) return;
      if (Array.isArray(res) && res.length > 0) {
        setWebhooks(res);
        localStorage.setItem(cacheKey, JSON.stringify(res));
      } else if (initialList.length === 0) {
        // Create an initial default webhook (Spidey Bot) for this channel
        const defaultHook: ColonyWebhook = {
          id: `wh_${Date.now()}`,
          colonyId,
          channelId: channel.id,
          channelName: channel.name,
          name: 'Spidey Bot',
          avatarUrl: null,
          token: `tok_${Math.random().toString(36).substring(2, 10)}`,
          url: `${typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com'}/api/v1/community/webhook?channelId=${channel.id}`,
          createdAt: new Date().toISOString(),
        };
        setWebhooks([defaultHook]);
        localStorage.setItem(cacheKey, JSON.stringify([defaultHook]));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [colonyId, channel.id, channel.name]);

  // Helper to persist webhooks locally
  const saveLocalWebhooks = (newList: ColonyWebhook[]) => {
    setWebhooks(newList);
    localStorage.setItem(`colony_webhooks_${colonyId}`, JSON.stringify(newList));
  };

  // Format date helper: "Nov 21, 2026"
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Nov 21, 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Nov 21, 2026';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Create new webhook
  const handleCreateWebhook = async () => {
    const newId = `wh_${Date.now()}`;
    const defaultName = webhooks.length === 0 ? 'Spidey Bot' : `Captain Hook ${webhooks.length + 1}`;
    const token = `tok_${Math.random().toString(36).substring(2, 10)}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com';
    const newHook: ColonyWebhook = {
      id: newId,
      colonyId,
      channelId: channel.id,
      channelName: channel.name,
      name: defaultName,
      avatarUrl: null,
      token,
      url: `${origin}/api/v1/community/webhook?channelId=${channel.id}&token=${token}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newHook, ...webhooks];
    saveLocalWebhooks(updated);
    setExpandedWebhookId(newId);
    setSubView('webhooks');

    toast.success(t('Webhook berhasil dibuat! 🎉'));

    // Attempt API save
    try {
      await webhooksApi.createColonyWebhook(colonyId, {
        name: defaultName,
        channelId: channel.id,
      });
    } catch {
      // Offline fallback already handled
    }
  };

  // Copy webhook URL
  const handleCopyWebhookUrl = (hook: ColonyWebhook) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com';
    const targetUrl = hook.url || `${origin}/api/v1/community/webhook?channelId=${hook.channelId}&token=${hook.token}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedWebhookId(hook.id);
    toast.success(t('URL Webhook berhasil disalin! 📋'));
    setTimeout(() => {
      setCopiedWebhookId(null);
    }, 2000);
  };

  // Delete webhook
  const handleDeleteWebhook = async (hookId: string) => {
    const updated = webhooks.filter((w) => w.id !== hookId);
    saveLocalWebhooks(updated);
    if (expandedWebhookId === hookId) {
      setExpandedWebhookId(null);
    }
    // Clean draft edits if any
    if (draftEdits[hookId]) {
      const nextEdits = { ...draftEdits };
      delete nextEdits[hookId];
      setDraftEdits(nextEdits);
    }
    toast.success(t('Webhook telah dihapus.'));

    try {
      await webhooksApi.deleteColonyWebhook(colonyId, hookId);
    } catch {
      // Handled
    }
  };

  // Update webhook field draft
  const handleDraftChange = (hookId: string, field: keyof ColonyWebhook, value: any) => {
    setDraftEdits((prev) => ({
      ...prev,
      [hookId]: {
        ...(prev[hookId] || {}),
        [field]: value,
      },
    }));
  };

  // Save changes to webhook
  const handleSaveWebhook = async (hookId: string) => {
    const edits = draftEdits[hookId];
    if (!edits) return;

    setIsSaving(true);
    const updated = webhooks.map((w) => {
      if (w.id === hookId) {
        return { ...w, ...edits };
      }
      return w;
    });

    saveLocalWebhooks(updated);

    const nextEdits = { ...draftEdits };
    delete nextEdits[hookId];
    setDraftEdits(nextEdits);
    setIsSaving(false);

    toast.success(t('Pengaturan webhook berhasil disimpan!'));

    try {
      await webhooksApi.updateColonyWebhook(colonyId, hookId, edits);
    } catch {
      // Handled
    }
  };

  // Reset draft edits for a webhook
  const handleResetDraft = (hookId: string) => {
    const nextEdits = { ...draftEdits };
    delete nextEdits[hookId];
    setDraftEdits(nextEdits);
  };

  // Trigger avatar upload
  const handleUploadAvatarClick = (hookId: string) => {
    setActiveUploadWebhookId(hookId);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
      avatarInputRef.current.click();
    }
  };

  // Handle avatar file selection
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadWebhookId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('Ukuran avatar terlalu besar! Maksimal 2MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        handleDraftChange(activeUploadWebhookId, 'avatarUrl', dataUrl);
        toast.success(t('Avatar webhook diperbarui. Klik Simpan untuk menerapkan.'));
      }
    };
    reader.readAsDataURL(file);
  };

  // Current active webhook edits for bottom save bar
  const activeDraft = expandedWebhookId ? draftEdits[expandedWebhookId] : null;
  const hasUnsavedChanges = !!activeDraft && Object.keys(activeDraft).length > 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. ROOT VIEW: Integrations Overview                               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {subView === 'root' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {t('Integrations')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xl">
              {t('Customize your server with integrations. Manage webhooks and followed channels that post into this channel.')}{' '}
              <button
                type="button"
                onClick={() => setIsLearnMoreIntegrationsOpen(true)}
                className="text-[#00a8fc] hover:underline font-medium inline cursor-pointer"
              >
                {t('Learn more about managing integrations.')}
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 my-4" />

          {/* Integrations Cards */}
          <div className="space-y-4">
            {/* Card 1: Webhooks */}
            <div
              onClick={() => setSubView('webhooks')}
              className="p-4 rounded-xl border border-border/50 bg-[#2b2d31]/50 hover:bg-[#2b2d31]/80 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-border/30 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                  {/* Discord-style Webhook branching icon */}
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {t('Webhooks')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('{{count}} webhooks', { count: webhooks.length })}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (webhooks.length === 0) {
                    handleCreateWebhook();
                  } else {
                    setSubView('webhooks');
                    if (!expandedWebhookId && webhooks.length > 0) {
                      setExpandedWebhookId(webhooks[0].id);
                    }
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 h-8 rounded-lg shrink-0 cursor-pointer shadow-xs transition-all"
              >
                {t('Create Webhook')}
              </Button>
            </div>

            {/* Card 2: Channels Followed */}
            <div className="p-4 rounded-xl border border-border/50 bg-[#2b2d31]/50 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-border/30 flex items-center justify-center shrink-0 text-muted-foreground">
                  {/* Channels Followed icon */}
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M7 7h.01" />
                    <path d="m17 7-6 6" />
                    <path d="M12 7h5v5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Channels Followed')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('0 channels')}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setIsLearnMoreFollowedOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 h-8 rounded-lg shrink-0 cursor-pointer shadow-xs transition-all"
              >
                {t('Learn More')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. SUBVIEW: Integrations > Webhooks                               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {subView === 'webhooks' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div>
            <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
              <button
                type="button"
                onClick={() => setSubView('root')}
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
              >
                {t('Integrations')}
              </button>
              <span className="text-muted-foreground font-normal">{'>'}</span>
              <span className="text-foreground">{t('Webhooks')}</span>
            </div>

            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xl">
              {t('Webhooks are a simple way to post messages from other apps and websites into Discord using internet magic.')}{' '}
              <button
                type="button"
                onClick={() => setIsLearnMoreIntegrationsOpen(true)}
                className="text-[#00a8fc] hover:underline font-medium inline cursor-pointer"
              >
                {t('Learn more')}
              </button>
              {', '}{t('or try')}{' '}
              <button
                type="button"
                onClick={() => {
                  window.open('https://discord.com/developers/docs/resources/webhook', '_blank');
                }}
                className="text-[#00a8fc] hover:underline font-medium inline cursor-pointer"
              >
                {t('building one yourself.')}
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 my-4" />

          {/* Action Row */}
          <div>
            <Button
              size="sm"
              onClick={handleCreateWebhook}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 h-8 rounded-lg cursor-pointer shadow-xs"
            >
              {t('New Webhook')}
            </Button>
          </div>

          {/* Section Heading */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
              {t('Posting to #{{name}}', { name: channel.name })}
            </h4>
          </div>

          {/* Webhooks Accordion List */}
          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border/60 text-center space-y-2 bg-card/20">
                <p className="text-sm font-semibold text-foreground">
                  {t('Belum ada webhook untuk saluran ini')}
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {t('Klik tombol "New Webhook" di atas untuk membuat integrasi webhook otomatis pertama Anda.')}
                </p>
              </div>
            ) : (
              webhooks.map((hook) => {
                const isExpanded = expandedWebhookId === hook.id;
                const edits = draftEdits[hook.id] || {};
                const currentName = edits.name !== undefined ? edits.name : hook.name;
                const currentChannelId = edits.channelId !== undefined ? edits.channelId : hook.channelId;
                const currentAvatarUrl = edits.avatarUrl !== undefined ? edits.avatarUrl : hook.avatarUrl;
                const isCopied = copiedWebhookId === hook.id;

                return (
                  <div
                    key={hook.id}
                    className="border border-border/50 rounded-xl bg-[#2b2d31]/50 overflow-hidden shadow-sm transition-all"
                  >
                    {/* Collapsed Header Bar */}
                    <div
                      onClick={() => setExpandedWebhookId(isExpanded ? null : hook.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Bot Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[#f23f43] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          {currentAvatarUrl ? (
                            <img
                              src={currentAvatarUrl}
                              alt={currentName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <DiscordClydeIcon className="w-5 h-5 text-white" />
                          )}
                        </div>

                        {/* Name & Meta */}
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-foreground block truncate">
                            {currentName || 'Spidey Bot'}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            {t('Created on {{date}} by {{author}}', {
                              date: formatDate(hook.createdAt),
                              author: authorName,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="text-muted-foreground p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Body Form */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-border/30 space-y-5 animate-in slide-in-from-top-2 duration-150">
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          {/* Avatar Box */}
                          <div className="flex flex-col items-center sm:items-start shrink-0">
                            <div
                              onClick={() => handleUploadAvatarClick(hook.id)}
                              className="w-24 h-24 rounded-2xl bg-[#f23f43] relative flex items-center justify-center cursor-pointer group shadow-md overflow-hidden hover:opacity-90 transition-opacity"
                              title={t('Ubah Avatar Webhook')}
                            >
                              {currentAvatarUrl ? (
                                <img
                                  src={currentAvatarUrl}
                                  alt={currentName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <DiscordClydeIcon className="w-12 h-12 text-white" />
                              )}

                              {/* Upload badge in top right */}
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center shadow backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                              {t('Minimum Size: 128x128')}
                            </span>
                          </div>

                          {/* Inputs: Name & Channel */}
                          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* NAME */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {t('Name')}
                              </label>
                              <Input
                                value={currentName}
                                onChange={(e) => handleDraftChange(hook.id, 'name', e.target.value)}
                                placeholder="Spidey Bot"
                                className="bg-[#1e1f22] border-border/50 text-foreground text-xs h-9 focus-visible:ring-1 focus-visible:ring-primary rounded-md"
                              />
                            </div>

                            {/* CHANNEL */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {t('Channel')}
                              </label>
                              <Select
                                value={currentChannelId}
                                onValueChange={(val) => handleDraftChange(hook.id, 'channelId', val)}
                              >
                                <SelectTrigger className="bg-[#1e1f22] border-border/50 text-foreground text-xs h-9 rounded-md">
                                  <SelectValue placeholder={`#${channel.name}`} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {availableChannels.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span>{c.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyWebhookUrl(hook)}
                            className="bg-white/[0.08] hover:bg-white/[0.12] text-foreground text-xs font-semibold px-4 h-8 rounded-md cursor-pointer transition-colors flex items-center gap-2"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            {isCopied ? t('Tersalin!') : t('Copy Webhook URL')}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteWebhook(hook.id)}
                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold h-8 px-3 rounded-md cursor-pointer transition-colors"
                          >
                            {t('Delete Webhook')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. FLOATING SAVE BAR (Discord Style)                             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {hasUnsavedChanges && expandedWebhookId && (
        <div className="sticky bottom-2 z-30 p-3 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200 mt-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0 mr-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              {t('Perhatian — Anda memiliki perubahan yang belum disimpan!')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleResetDraft(expandedWebhookId)}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer"
            >
              {t('Reset')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveWebhook(expandedWebhookId)}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 rounded-lg cursor-pointer shadow-xs"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}
            </Button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: Channels Followed Learn More                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <Dialog open={isLearnMoreFollowedOpen} onOpenChange={setIsLearnMoreFollowedOpen}>
        <DialogContent size="md" className="bg-card border-border text-foreground p-6 rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              {t('Channels Followed')}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              {t(
                'Fitur Mengikuti Saluran memungkinkan Anda menerima pembaruan dari saluran Pengumuman (Announcement) server lain secara otomatis dan langsung dipublikasikan ke dalam saluran #{{name}} ini.',
                { name: channel.name },
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>{t('Cara Mengikuti Saluran')}</span>
            </div>
            <p>
              {t(
                'Buka saluran pengumuman publik di server lain, klik tombol "Follow" (Ikuti) di bagian atas, lalu pilih server dan saluran ini sebagai tujuannya.',
              )}
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 rounded-lg cursor-pointer shadow-xs"
              onClick={() => setIsLearnMoreFollowedOpen(false)}
            >
              {t('Mengerti')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. MODAL: Integrations Learn More                                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <Dialog open={isLearnMoreIntegrationsOpen} onOpenChange={setIsLearnMoreIntegrationsOpen}>
        <DialogContent size="md" className="bg-card border-border text-foreground p-6 rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <WebhookIcon className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              {t('Tentang Integrasi & Webhook')}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              {t(
                'Webhook adalah cara termudah dan tercepat untuk menghubungkan sistem otomatisasi eksternal (GitHub, GitLab, Zapier, bot buatan sendiri) untuk mengirim pesan berformat indah ke saluran chat tanpa memerlukan bot penuh.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <span className="font-semibold text-foreground block">
                {t('URL Webhook Khusus')}
              </span>
              <span>
                {t('Setiap webhook memiliki endpoint HTTP POST unik dengan token aman.')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <span className="font-semibold text-foreground block">
                {t('Kustomisasi Tampilan')}
              </span>
              <span>
                {t('Anda dapat menentukan nama dan avatar khusus untuk setiap webhook bot.')}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 rounded-lg cursor-pointer shadow-xs"
              onClick={() => setIsLearnMoreIntegrationsOpen(false)}
            >
              {t('Tutup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
