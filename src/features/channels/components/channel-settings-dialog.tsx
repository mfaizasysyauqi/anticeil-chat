import React, { useState, useEffect } from 'react';
import {
  X,
  Hash,
  Volume2,
  MessagesSquare,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  Smile,
  Shield,
  UserPlus,
  Webhook,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { CommunityChannel } from '@/chat/messages-types';
import { toast } from 'sonner';

interface ChannelSettingsDialogProps {
  channel: CommunityChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateChannel: (channelId: string, updates: Partial<CommunityChannel>) => Promise<void>;
  onDeleteChannel: (channel: CommunityChannel) => void;
  onOpenWebhooks?: (channelId: string) => void;
}

type SettingsTab = 'overview' | 'permissions' | 'invites' | 'integrations';

const SLOWMODE_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '2h', value: 7200 },
  { label: '6h', value: 21600 },
];

export function ChannelSettingsDialog({
  channel,
  isOpen,
  onClose,
  onUpdateChannel,
  onDeleteChannel,
  onOpenWebhooks,
}: ChannelSettingsDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');

  // Form State
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [slowmode, setSlowmode] = useState(0);
  const [contentVisibility, setContentVisibility] = useState<'default' | 'spoiler' | 'nsfw'>('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false);

  // Sync state when channel changes
  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setTopic(channel.description || '');
      setSlowmode(channel.slowmode || 0);
      setContentVisibility(channel.contentVisibility || 'default');
      setActiveTab('overview');
    }
  }, [channel, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !channel) return null;

  const hasChanges =
    name !== (channel.name || '') ||
    topic !== (channel.description || '') ||
    slowmode !== (channel.slowmode || 0) ||
    contentVisibility !== (channel.contentVisibility || 'default');

  const handleReset = () => {
    setName(channel.name || '');
    setTopic(channel.description || '');
    setSlowmode(channel.slowmode || 0);
    setContentVisibility(channel.contentVisibility || 'default');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('Nama channel tidak boleh kosong.'));
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateChannel(channel.id, {
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: topic.trim(),
        slowmode,
        contentVisibility,
      });
      toast.success(t('Pengaturan channel berhasil disimpan!'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan channel.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('channel-topic-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      setTopic((prev) => prev + prefix + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = topic.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;
    const nextTopic = topic.substring(0, start) + replacement + topic.substring(end);
    setTopic(nextTopic);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  const channelTypeLabel =
    channel.type === 'voice'
      ? t('VOICE CHANNELS')
      : channel.type === 'forum'
      ? t('FORUM CHANNELS')
      : t('TEXT CHANNELS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full h-full max-w-5xl md:h-[88vh] md:max-h-[780px] bg-background border border-border md:rounded-2xl shadow-2xl flex overflow-hidden">
        {/* ── Left Navigation Sidebar (Discord Style) ──────────────────────── */}
        <div className="w-56 sm:w-60 bg-muted/40 border-r border-border flex flex-col justify-between p-4 shrink-0 select-none">
          <div>
            {/* Header info */}
            <div className="px-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                {channelTypeLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 text-foreground font-bold text-sm truncate">
                {channel.type === 'voice' ? (
                  <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : channel.type === 'forum' ? (
                  <MessagesSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{channel.name}</span>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer',
                  activeTab === 'overview'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span>{t('Overview')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer',
                  activeTab === 'permissions'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('Permissions')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invites')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer',
                  activeTab === 'invites'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('Invites')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('integrations')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer',
                  activeTab === 'integrations'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Webhook className="w-3.5 h-3.5" />
                <span>{t('Integrations')}</span>
              </button>

              <div className="pt-3 my-2 border-t border-border" />

              {/* Delete Channel Option */}
              <button
                type="button"
                onClick={() => {
                  onDeleteChannel(channel);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer group"
              >
                <span>{t('Delete Channel')}</span>
                <Trash2 className="w-3.5 h-3.5 text-red-500/80 group-hover:text-red-400" />
              </button>
            </nav>
          </div>
        </div>

        {/* ── Right Content Area ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-background overflow-hidden relative">
          {/* Top Close Button (Discord ESC Pill) */}
          <div className="absolute right-5 top-5 z-20">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-col items-center gap-1 group text-muted-foreground hover:text-foreground cursor-pointer select-none"
              title="Close (ESC)"
            >
              <div className="w-8 h-8 rounded-full border border-border group-hover:border-foreground/80 flex items-center justify-center transition-colors bg-card shadow-xs">
                <X className="w-4 h-4 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 group-hover:text-foreground">
                ESC
              </span>
            </button>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 lg:p-10 space-y-7 [scrollbar-width:thin]">
            {activeTab === 'overview' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Overview')}</h2>
                </div>

                {/* 1. Channel Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Channel Name')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-muted-foreground font-semibold">
                      {channel.type === 'voice' ? (
                        <Volume2 className="w-4 h-4" />
                      ) : channel.type === 'forum' ? (
                        <MessagesSquare className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="new-channel"
                      className="w-full bg-muted/40 border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => insertMarkdown('🎉')}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      title="Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Channel Topic */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Channel Topic')}
                  </label>
                  <div className="border border-border rounded-lg bg-muted/40 overflow-hidden focus-within:border-primary transition-colors">
                    {/* Markdown formatting toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b border-border bg-card/60">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**')}
                        title="Bold"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*')}
                        title="Italic"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('__')}
                        title="Underline"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('~~')}
                        title="Strikethrough"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('||')}
                        title="Spoiler"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('✨')}
                        title="Emoji"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted ml-auto"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      id="channel-topic-textarea"
                      rows={4}
                      maxLength={1024}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={t('Let everyone know how to use this channel!')}
                      className="w-full bg-transparent p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="px-3 pb-2 flex justify-end">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {1024 - topic.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Slowmode */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Slowmode')}
                  </label>
                  <select
                    value={slowmode}
                    onChange={(e) => setSlowmode(Number(e.target.value))}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    {SLOWMODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {t('Members will be restricted to sending one message and creating one thread per this interval, unless they have the Bypass Slowmode permission.')}
                  </p>
                </div>

                {/* 4. Content Visibility */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Content Visibility')}
                  </label>
                  <div className="space-y-2">
                    {/* Default */}
                    <label
                      onClick={() => setContentVisibility('default')}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                        contentVisibility === 'default'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card/40 hover:bg-muted/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="content-visibility"
                        checked={contentVisibility === 'default'}
                        onChange={() => setContentVisibility('default')}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground">{t('Default')}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">
                          {t('Channel content is always visible.')}
                        </div>
                      </div>
                    </label>

                    {/* Spoiler */}
                    <label
                      onClick={() => setContentVisibility('spoiler')}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                        contentVisibility === 'spoiler'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card/40 hover:bg-muted/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="content-visibility"
                        checked={contentVisibility === 'spoiler'}
                        onChange={() => setContentVisibility('spoiler')}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground">{t('Spoiler Channel')}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">
                          {t('Mark this channel as containing spoilers, so that plot twists, heavy topics, or other sensitive discussions are hidden until users choose to view.')}
                        </div>
                      </div>
                    </label>

                    {/* Age-Restricted */}
                    <label
                      onClick={() => setContentVisibility('nsfw')}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                        contentVisibility === 'nsfw'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card/40 hover:bg-muted/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="content-visibility"
                        checked={contentVisibility === 'nsfw'}
                        onChange={() => setContentVisibility('nsfw')}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground">{t('Age-Restricted Channel')}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">
                          {t('Users will need to confirm they are of age to view the content in this channel.')}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Permissions')}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('Kelola hak akses pengiriman pesan dan visibilitas channel.')}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <span className="text-xs font-bold text-foreground">@everyone</span>
                      <p className="text-[11px] text-muted-foreground">Peran default untuk seluruh anggota</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Melihat Channel</span>
                      <span className="text-emerald-400 font-bold">✓ Diizinkan</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kirim Pesan</span>
                      <span className="text-emerald-400 font-bold">✓ Diizinkan</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sematkan Tautan & Lampiran</span>
                      <span className="text-emerald-400 font-bold">✓ Diizinkan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Invites')}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('Tautan undangan aktif langsung ke channel ini.')}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground truncate block">
                        {`${window.location.origin}/messages?channel=${channel.id}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Berlaku tanpa batas waktu</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/messages?channel=${channel.id}`;
                        navigator.clipboard.writeText(url);
                        setHasCopiedInvite(true);
                        toast.success(t('Tautan undangan channel disalin! 📋'));
                        setTimeout(() => setHasCopiedInvite(false), 2000);
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5"
                    >
                      {hasCopiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {hasCopiedInvite ? t('Tersalin') : t('Salin')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Integrations')}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('Kelola Webhook dan bot otomatisasi yang terhubung dengan channel ini.')}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">Webhook Otomatisasi</span>
                      <span className="text-[11px] text-muted-foreground">Kirim pesan otomatis via HTTP POST</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onOpenWebhooks?.(channel.id);
                    }}
                    className="text-xs font-semibold"
                  >
                    Buka Webhook
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Discord Floating Save Bar at Bottom ─────────────────────────── */}
          {hasChanges && (
            <div className="absolute bottom-4 left-6 right-6 z-30 p-3 rounded-xl bg-card border border-border shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('Perhatian — Anda memiliki perubahan yang belum disimpan!')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {t('Reset')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
                >
                  {isSubmitting ? t('Menyimpan...') : t('Simpan Perubahan')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
