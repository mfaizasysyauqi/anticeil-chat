import React, { useState, useEffect, useMemo } from 'react';
import {
  Hash,
  Volume2,
  MessagesSquare,
  Columns3,
  Megaphone,
  Podcast,
  Trash2,
  Shield,
  UserPlus,
  Webhook,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
import { useTranslation } from '@/core/i18n';
import {
  type Colony,
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
import { ChannelInvitesTab } from './channel-settings/channel-invites-tab';
import { ChannelIntegrationsTab } from './channel-settings/channel-integrations-tab';

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
  activeColony?: Colony | null;
  channels?: ColonyChannel[];
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
  activeColony,
  channels = [],
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
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [defaultAutoArchiveDuration, setDefaultAutoArchiveDuration] = useState(4320); // 3 Days
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false);

  // Baseline state representing saved values to accurately detect changes
  const [baseline, setBaseline] = useState(() => ({
    name: channel ? (channel.name || '') : '',
    channelType: channel ? resolveChannelType(channel) : ('text' as ColonyChannelType),
    categoryId: channel ? (channel.categoryId || '') : '',
    topic: channel ? (channel.description || '') : '',
    slowmode: channel ? (channel.slowmode || 0) : 0,
    contentVisibility: channel ? (channel.contentVisibility || 'default') : ('default' as 'default' | 'spoiler' | 'nsfw'),
    isAnnouncement: channel ? Boolean(channel.isAnnouncement) : false,
    defaultAutoArchiveDuration: channel?.defaultAutoArchiveDuration ?? 4320,
  }));

  // Sync state when channel changes or dialog opens
  useEffect(() => {
    if (channel && isOpen) {
      const initialType = resolveChannelType(channel);
      const initial = {
        name: channel.name || '',
        channelType: initialType,
        categoryId: channel.categoryId || '',
        topic: channel.description || '',
        slowmode: channel.slowmode || 0,
        contentVisibility: channel.contentVisibility || 'default',
        isAnnouncement: Boolean(channel.isAnnouncement),
        defaultAutoArchiveDuration: channel.defaultAutoArchiveDuration ?? 4320,
      };
      setName(initial.name);
      setChannelType(initial.channelType);
      setCategoryId(initial.categoryId);
      setTopic(initial.topic);
      setSlowmode(initial.slowmode);
      setContentVisibility(initial.contentVisibility);
      setIsAnnouncement(initial.isAnnouncement);
      setDefaultAutoArchiveDuration(initial.defaultAutoArchiveDuration);
      setBaseline(initial);
      setActiveTab('overview');
    }
  }, [channel?.id, isOpen]);

  if (!channel) return null;

  const hasChanges =
    name !== baseline.name ||
    channelType !== baseline.channelType ||
    categoryId !== baseline.categoryId ||
    topic !== baseline.topic ||
    slowmode !== baseline.slowmode ||
    contentVisibility !== baseline.contentVisibility ||
    isAnnouncement !== baseline.isAnnouncement ||
    defaultAutoArchiveDuration !== baseline.defaultAutoArchiveDuration;

  const handleReset = () => {
    setName(baseline.name);
    setChannelType(baseline.channelType);
    setCategoryId(baseline.categoryId);
    setTopic(baseline.topic);
    setSlowmode(baseline.slowmode);
    setContentVisibility(baseline.contentVisibility);
    setIsAnnouncement(baseline.isAnnouncement);
    setDefaultAutoArchiveDuration(baseline.defaultAutoArchiveDuration);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('Nama channel tidak boleh kosong.'));
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const finalName = channelType === 'voice' ? name.trim() : name.trim().toLowerCase().replace(/\s+/g, '-');
      const cleanTopic = topic.trim();
      const newSaved = {
        name: finalName,
        channelType,
        categoryId,
        topic: cleanTopic,
        slowmode,
        contentVisibility,
        isAnnouncement,
        defaultAutoArchiveDuration,
      };

      await onUpdateChannel(channel.id, {
        name: newSaved.name,
        description: newSaved.topic,
        type: newSaved.channelType,
        slowmode: newSaved.slowmode,
        contentVisibility: newSaved.contentVisibility,
        categoryId: newSaved.categoryId || undefined,
        categoryName: selectedCat ? selectedCat.name : undefined,
        isAnnouncement: newSaved.isAnnouncement,
        defaultAutoArchiveDuration: newSaved.defaultAutoArchiveDuration,
      });

      setName(finalName);
      setTopic(cleanTopic);
      setBaseline(newSaved);
    } catch {
      toast.error(t('Gagal menyimpan pengaturan channel.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnnouncementCh = channel.type === 'announcement' || channel.isAnnouncement;

  const channelTypeLabel =
    channel.type === 'voice'
      ? t('VOICE CHANNELS')
      : channel.type === 'forum'
      ? t('FORUM CHANNELS')
      : channel.type === 'kanban'
      ? t('KANBAN BOARDS')
      : isAnnouncementCh
      ? t('ANNOUNCEMENT CHANNELS')
      : channel.type === 'stage'
      ? t('STAGE CHANNELS')
      : t('TEXT CHANNELS');

  const channelTitle = channel?.name
    ? isAnnouncementCh
      ? `📢 ${channel.name}`
      : `# ${channel.name}`
    : t('Pengaturan Channel');

  const channelGroups: SettingsNavGroup[] = useMemo(
    () => [
      {
        key: 'CHANNEL_SETTINGS',
        title: channelTitle,
        items: [
          {
            id: 'overview',
            label: t('Ringkasan'),
            icon:
              channel?.type === 'voice' ? (
                <Volume2 className="w-4 h-4 shrink-0" />
              ) : channel?.type === 'forum' ? (
                <MessagesSquare className="w-4 h-4 shrink-0" />
              ) : channel?.type === 'kanban' ? (
                <Columns3 className="w-4 h-4 shrink-0" />
              ) : isAnnouncementCh ? (
                <Megaphone className="w-4 h-4 shrink-0" />
              ) : channel?.type === 'stage' ? (
                <Podcast className="w-4 h-4 shrink-0" />
              ) : (
                <Hash className="w-4 h-4 shrink-0" />
              ),
          },
          {
            id: 'permissions',
            label: t('Izin Keamanan'),
            icon: <Shield className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'invites',
            label: t('Tautan Undangan'),
            icon: <UserPlus className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'integrations',
            label: t('Integrasi Webhook'),
            icon: <Webhook className="w-4 h-4 shrink-0" />,
          },
        ],
      },
    ],
    [channel?.name, channel?.type, channel?.isAnnouncement, isAnnouncementCh, channelTitle, t],
  );

  return (
    <TwoPaneSettingsDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={t('Pengaturan Channel')}
      groups={channelGroups}
      activeSection={activeTab}
      onSectionChange={(id) => setActiveTab(id as SettingsTab)}
      initialMobileView="menu"
      sidebarHeader={
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="size-8 rounded-[10px] bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs font-semibold text-xs text-foreground">
            {channel.type === 'voice' ? (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            ) : channel.type === 'forum' ? (
              <MessagesSquare className="w-4 h-4 text-muted-foreground" />
            ) : channel.type === 'kanban' ? (
              <Columns3 className="w-4 h-4 text-muted-foreground" />
            ) : isAnnouncementCh ? (
              <Megaphone className="w-4 h-4 text-muted-foreground" />
            ) : channel.type === 'stage' ? (
              <Podcast className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Hash className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-foreground truncate">
              {channel.name}
            </div>
            <div className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
              {channelTypeLabel}
            </div>
          </div>
        </div>
      }
      footerAction={
        <button
          type="button"
          onClick={() => {
            onClose();
            onDeleteChannel(channel);
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer group"
        >
          <span>{t('Hapus Channel')}</span>
          <Trash2 className="w-3.5 h-3.5 text-destructive/80 group-hover:text-destructive shrink-0" />
        </button>
      }
    >
      <div className="w-full space-y-6 pb-6">
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
            isAnnouncement={isAnnouncement}
            setIsAnnouncement={setIsAnnouncement}
            defaultAutoArchiveDuration={defaultAutoArchiveDuration}
            setDefaultAutoArchiveDuration={setDefaultAutoArchiveDuration}
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

        {/* Invites Tab (Discord 1:1 Parity) */}
        {activeTab === 'invites' && (
          <ChannelInvitesTab
            channel={channel}
            activeColony={activeColony}
            members={members}
          />
        )}

        {/* Integrations Tab (Discord 1:1 Parity) */}
        {activeTab === 'integrations' && (
          <ChannelIntegrationsTab
            channel={channel}
            activeColony={activeColony}
            channels={channels}
          />
        )}

        {/* ── Discord Floating Save Bar at Bottom (Overview Tab) ─────────────────────────── */}
        {hasChanges && activeTab === 'overview' && (
          <div className="sticky bottom-2 z-30 p-3 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200 mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0 mr-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline truncate">{t('Perhatian — Anda memiliki perubahan yang belum disimpan!')}</span>
              <span className="sm:hidden truncate">{t('Perubahan belum disimpan!')}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                disabled={isSubmitting}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t('Reset')}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={isSubmitting}
                className="font-bold text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? t('Menyimpan...') : t('Simpan Perubahan')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </TwoPaneSettingsDialog>
  );
}
