import React, { useState, useEffect } from 'react';
import {
  X,
  Hash,
  Volume2,
  MessagesSquare,
  Columns3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import {
  type ColonyChannel,
  type ColonyChannelType,
  type CommunityCustomRole,
  type ColonyMember,
  resolveChannelType,
} from '@/chat/chat-types';
import type { ColonyCategory } from '../api/categories-api';
import { toast } from 'sonner';
import { ChannelOverviewTab } from './channel-settings/channel-overview-tab';
import { ChannelPermissionsTab } from './channel-settings/channel-permissions-tab';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';

interface ChannelSettingsDialogProps {
  channel: ColonyChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateChannel: (channelId: string, updates: Partial<ColonyChannel>) => Promise<void>;
  onDeleteChannel: (channel: ColonyChannel) => void;
  onOpenWebhooks?: (channelId: string) => void;
  categories?: ColonyCategory[];
  roles?: CommunityCustomRole[];
  members?: ColonyMember[];
}

type SettingsTab = 'overview' | 'permissions' | 'invites' | 'integrations';

export function ChannelSettingsDialog({
  channel,
  isOpen,
  onClose,
  onUpdateChannel,
  onDeleteChannel,
  onOpenWebhooks,
  categories = [],
  roles = [],
  members = [],
}: ChannelSettingsDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');

  // Form State
  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<ColonyChannelType>('text');
  const [categoryId, setCategoryId] = useState('');
  const [topic, setTopic] = useState('');
  const [slowmode, setSlowmode] = useState(0);
  const [contentVisibility, setContentVisibility] = useState<'default' | 'spoiler' | 'nsfw'>('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false);

  // Sync state when channel changes
  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setChannelType(resolveChannelType(channel));
      setCategoryId(channel.categoryId || '');
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

  const currentType = resolveChannelType(channel);
  const hasChanges =
    name !== (channel.name || '') ||
    channelType !== currentType ||
    categoryId !== (channel.categoryId || '') ||
    topic !== (channel.description || '') ||
    slowmode !== (channel.slowmode || 0) ||
    contentVisibility !== (channel.contentVisibility || 'default');

  const handleReset = () => {
    setName(channel.name || '');
    setChannelType(resolveChannelType(channel));
    setCategoryId(channel.categoryId || '');
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
      const selectedCat = categories.find((c) => c.id === categoryId);
      await onUpdateChannel(channel.id, {
        name: channelType === 'voice' ? name.trim() : name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: topic.trim(),
        type: channelType,
        slowmode,
        contentVisibility,
        categoryId: categoryId || undefined,
        categoryName: selectedCat ? selectedCat.name : undefined,
      });
      toast.success(t('Pengaturan channel berhasil disimpan!'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan channel.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelTypeLabel =
    channel.type === 'voice'
      ? t('VOICE CHANNELS')
      : channel.type === 'forum'
      ? t('FORUM CHANNELS')
      : channel.type === 'kanban'
      ? t('KANBAN BOARDS')
      : t('TEXT CHANNELS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 p-3 sm:p-4">
      <div className={cn('relative flex overflow-hidden', LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER)}>
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
                ) : channel.type === 'kanban' ? (
                  <Columns3 className="w-4 h-4 text-muted-foreground shrink-0" />
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer group"
              >
                <span>{t('Delete Channel')}</span>
                <Trash2 className="w-3.5 h-3.5 text-destructive/80 group-hover:text-destructive" />
              </button>
            </nav>
          </div>
        </div>

        {/* ── Right Content Area ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-background overflow-hidden relative">
          {/* Top Header Bar matching TwoPaneSettingsDialog */}
          <div className={LAYOUT_DIALOG_SPACING.HEADER_CONTAINER}>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate tracking-tight">
                {activeTab === 'overview'
                  ? t('Overview')
                  : activeTab === 'permissions'
                  ? t('Permissions')
                  : activeTab === 'invites'
                  ? t('Invites')
                  : t('Integrations')}
              </h1>
            </div>

            {/* Right Suffix: Discord Close (X) Button with ESC Badge */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group"
              title={t('Tutup (ESC)')}
              aria-label={t('Tutup')}
            >
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase opacity-60 group-hover:opacity-100 border border-border/80 px-1.5 py-0.5 rounded">
                ESC
              </span>
              <X className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Main Content Body */}
          <div className={cn(LAYOUT_DIALOG_SPACING.BODY_PADDING, 'space-y-6')}>
            {activeTab === 'overview' && (
              <ChannelOverviewTab
                channel={channel}
                name={name}
                setName={setName}
                channelType={channelType}
                setChannelType={setChannelType}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                categories={categories}
                topic={topic}
                setTopic={setTopic}
                slowmode={slowmode}
                setSlowmode={setSlowmode}
                contentVisibility={contentVisibility}
                setContentVisibility={setContentVisibility}
              />
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <ChannelPermissionsTab
                channel={channel}
                roles={roles}
                members={members}
                onUpdateChannel={onUpdateChannel}
                t={t}
              />
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <div className="w-full space-y-6">
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
              <div className="w-full space-y-6">
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
                  variant="teal"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="font-bold text-xs shadow-md"
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
