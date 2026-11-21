import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  User,
  Plus,
  Trash2,
  Check,
  X,
  Slash,
  Users,
  Lock,
  ChevronDown,
  Search,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { channelsApi } from '../../api/channels-api';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import { useTranslation } from '@/core/i18n';
import type {
  ColonyChannel,
  ChannelPermissionOverwrite,
  CommunityCustomRole,
  ColonyMember,
} from '@/chat/chat-types';

export interface ChannelPermissionsTabProps {
  channel: ColonyChannel;
  roles?: CommunityCustomRole[];
  members?: ColonyMember[];
  onUpdateChannel?: (channelId: string, updates: Partial<ColonyChannel>) => Promise<void>;
  t: (key: string) => string;
}

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  title: string;
  permissions: PermissionDefinition[];
}

// ── General Channel Permissions ──────────────────────────────────────────────
const GENERAL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'VIEW_CHANNEL',
    name: 'View Channel',
    description: 'Allows members to view this channel by default. Disabling this for @everyone will make this channel private.',
  },
  {
    key: 'MANAGE_CHANNELS',
    name: 'Manage Channel',
    description: "Allows members to change this channel's name, description, and text settings. They can also delete the channel.",
  },
  {
    key: 'MANAGE_PERMISSIONS',
    name: 'Manage Permissions',
    description: "Allows members to change this channel's permissions.",
  },
  {
    key: 'MANAGE_WEBHOOKS',
    name: 'Manage Webhooks',
    description: 'Allows members to create, edit, or delete webhooks in this channel, which can post messages from other apps or sites.',
  },
];

// ── Membership Permissions ───────────────────────────────────────────────────
const MEMBERSHIP_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'CREATE_INSTANT_INVITE',
    name: 'Create Invite',
    description: 'Allows members to invite new people to this server via a direct invite link to this channel.',
  },
];

// ── Text Channel Permissions ─────────────────────────────────────────────────
const TEXT_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'SEND_MESSAGES',
    name: 'Send Messages',
    description: 'Allows members to send messages in this channel.',
  },
  {
    key: 'SEND_MESSAGES_IN_THREADS',
    name: 'Send Messages in Threads',
    description: 'Allow members to send messages in threads under this channel.',
  },
  {
    key: 'CREATE_PUBLIC_THREADS',
    name: 'Create Public Threads',
    description: 'Allow members to create threads that everyone in this channel can view.',
  },
  {
    key: 'CREATE_PRIVATE_THREADS',
    name: 'Create Private Threads',
    description: 'Allow members to create invite only threads in this channel.',
  },
  {
    key: 'EMBED_LINKS',
    name: 'Embed Links',
    description: 'Allows links that members share to show embedded content in this channel.',
  },
  {
    key: 'ATTACH_FILES',
    name: 'Attach Files',
    description: 'Allows members to upload files or media in this channel.',
  },
  {
    key: 'ADD_REACTIONS',
    name: 'Add Reactions',
    description: 'Allows members to add new emoji reactions to a message in this channel. If this permission is disabled, members can still react using any existing reactions on a message.',
  },
  {
    key: 'USE_EXTERNAL_EMOJIS',
    name: 'Use External Emoji',
    description: "Allows members to use emoji from other servers in this channel, if they're a Discord Nitro member.",
  },
  {
    key: 'USE_EXTERNAL_STICKERS',
    name: 'Use External Stickers',
    description: "Allows members to use stickers from other servers in this channel, if they're a Discord Nitro member.",
  },
  {
    key: 'MENTION_EVERYONE',
    name: 'Mention @everyone, @here, and All Roles',
    description: 'Allows members to use @everyone or @here (only online members) in this channel. They can also @mention all roles in this channel, even if the role\'s "Allow anyone to mention this role" permission is disabled.',
  },
  {
    key: 'MANAGE_MESSAGES',
    name: 'Manage Messages',
    description: 'Allows members to delete or remove embeds from messages by other members in this channel.',
  },
  {
    key: 'PIN_MESSAGES',
    name: 'Pin Messages',
    description: 'Allows members to pin or unpin any message in this channel.',
  },
  {
    key: 'BYPASS_SLOWMODE',
    name: 'Bypass Slowmode',
    description: 'Allows members to send messages in this channel without being affected by slowmode.',
  },
  {
    key: 'MANAGE_THREADS',
    name: 'Manage Threads',
    description: 'Allows members to rename, delete, close, and turn on slow mode for threads in this channel. They can also view private threads.',
  },
  {
    key: 'READ_MESSAGE_HISTORY',
    name: 'Read Message History',
    description: 'Allows members to read previous messages sent in this channel. If this permission is disabled, members only see messages sent when they are online.',
  },
  {
    key: 'SEND_TTS_MESSAGES',
    name: 'Send Text-to-Speech Messages',
    description: 'Allows members to send text-to-speech messages in this channel by starting a message with /tts. These messages can be heard by anyone focused on this channel.',
  },
  {
    key: 'SEND_VOICE_MESSAGES',
    name: 'Send Voice Messages',
    description: 'Allows members to send voice messages in this channel. Requires the "Attach Files" permission as well.',
  },
  {
    key: 'CREATE_POLLS',
    name: 'Create Polls',
    description: 'Allows members to create polls in this channel.',
  },
];

// ── Voice Channel Permissions ────────────────────────────────────────────────
const VOICE_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'CONNECT',
    name: 'Connect',
    description: 'Allows members to join this voice channel and hear others.',
  },
  {
    key: 'SPEAK',
    name: 'Speak',
    description: 'Allows members to speak in this voice channel.',
  },
  {
    key: 'STREAM',
    name: 'Video',
    description: 'Allows members to share their video or screen in this voice channel.',
  },
  {
    key: 'USE_VAD',
    name: 'Use Voice Activity',
    description: 'Allows members to speak without using Push-to-Talk.',
  },
  {
    key: 'PRIORITY_SPEAKER',
    name: 'Priority Speaker',
    description: 'Allows members to be heard more easily in this voice channel when speaking.',
  },
  {
    key: 'MUTE_MEMBERS',
    name: 'Mute Members',
    description: 'Allows members to mute other members in this voice channel.',
  },
  {
    key: 'DEAFEN_MEMBERS',
    name: 'Deafen Members',
    description: 'Allows members to deafen other members in this voice channel.',
  },
  {
    key: 'MOVE_MEMBERS',
    name: 'Move Members',
    description: 'Allows members to move other members between voice channels.',
  },
  {
    key: 'REQUEST_TO_SPEAK',
    name: 'Request to Speak',
    description: 'Allows members to request to speak in this Stage channel.',
  },
];

// ── Apps Permissions ─────────────────────────────────────────────────────────
const APPS_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'USE_APPLICATION_COMMANDS',
    name: 'Use Application Commands',
    description: 'Allows members to use commands from applications in this channel, including slash commands and context menu commands.',
  },
  {
    key: 'USE_ACTIVITIES',
    name: 'Use Activities',
    description: 'Allows members to use Activities in this channel.',
  },
  {
    key: 'USE_EXTERNAL_APPS',
    name: 'Use External Apps',
    description: 'Allows apps that members have added to their account to post messages in this channel. When disabled, the messages will be private.',
  },
];

export function ChannelPermissionsTab({
  channel,
  roles = [],
  members = [],
  onUpdateChannel,
  t,
}: ChannelPermissionsTabProps) {
  // Overwrites & Baseline for unsaved detection
  const [overwrites, setOverwrites] = useState<ChannelPermissionOverwrite[]>(
    channel.permissionOverwrites || [],
  );
  const [savedOverwrites, setSavedOverwrites] = useState<ChannelPermissionOverwrite[]>(
    channel.permissionOverwrites || [],
  );

  // Private channel state
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(channel.isPrivate));
  const [savedIsPrivate, setSavedIsPrivate] = useState<boolean>(Boolean(channel.isPrivate));

  // Selection & UI state
  const [selectedTargetId, setSelectedTargetId] = useState<string>('@everyone');
  const [colonyRoles, setColonyRoles] = useState<CommunityCustomRole[]>(roles);
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing permissions and roles on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const perms = await channelsApi.getChannelPermissions(channel.id);
        if (isMounted && Array.isArray(perms) && perms.length > 0) {
          setOverwrites(perms);
          setSavedOverwrites(perms);
        } else if (isMounted && channel.permissionOverwrites) {
          setOverwrites(channel.permissionOverwrites);
          setSavedOverwrites(channel.permissionOverwrites);
        }

        if (channel.colonyId && colonyRoles.length === 0) {
          const fetchedRoles = await colonyApi.getRoles(channel.colonyId);
          if (isMounted && Array.isArray(fetchedRoles)) {
            setColonyRoles(fetchedRoles);
          }
        }
      } catch (err) {
        console.error('Failed to load channel permissions:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [channel.id, channel.colonyId, channel.permissionOverwrites]);

  // Keep private state in sync
  useEffect(() => {
    setIsPrivate(Boolean(channel.isPrivate));
    setSavedIsPrivate(Boolean(channel.isPrivate));
  }, [channel.isPrivate]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (isPrivate !== savedIsPrivate) return true;
    return JSON.stringify(overwrites) !== JSON.stringify(savedOverwrites);
  }, [isPrivate, savedIsPrivate, overwrites, savedOverwrites]);

  // Selected overwrite or fallback for @everyone
  const activeOverwrite: ChannelPermissionOverwrite = useMemo(() => {
    const existing = overwrites.find((o) => o.id === selectedTargetId);
    if (existing) return existing;
    return {
      id: selectedTargetId,
      type: 'role',
      name: selectedTargetId === '@everyone' ? '@everyone' : selectedTargetId,
      allow: selectedTargetId === '@everyone' && !isPrivate ? ['VIEW_CHANNEL'] : [],
      deny: selectedTargetId === '@everyone' && isPrivate ? ['VIEW_CHANNEL'] : [],
    };
  }, [overwrites, selectedTargetId, isPrivate]);

  // 3-way permission getter: 'allow' | 'deny' | 'inherit'
  const getPermissionState = (permKey: string): 'allow' | 'deny' | 'inherit' => {
    if (activeOverwrite.allow.includes(permKey)) return 'allow';
    if (activeOverwrite.deny.includes(permKey)) return 'deny';
    return 'inherit';
  };

  // Toggle permission value
  const handleSetPermission = (permKey: string, nextState: 'allow' | 'deny' | 'inherit') => {
    const nextAllow = activeOverwrite.allow.filter((k) => k !== permKey);
    const nextDeny = activeOverwrite.deny.filter((k) => k !== permKey);

    if (nextState === 'allow') nextAllow.push(permKey);
    if (nextState === 'deny') nextDeny.push(permKey);

    const updatedOverwrite: ChannelPermissionOverwrite = {
      ...activeOverwrite,
      allow: nextAllow,
      deny: nextDeny,
    };

    const nextOverwrites = [
      ...overwrites.filter((o) => o.id !== selectedTargetId),
      updatedOverwrite,
    ];

    setOverwrites(nextOverwrites);

    // If changing VIEW_CHANNEL for @everyone, sync isPrivate automatically
    if (selectedTargetId === '@everyone' && permKey === 'VIEW_CHANNEL') {
      if (nextState === 'deny') {
        setIsPrivate(true);
      } else if (nextState === 'allow') {
        setIsPrivate(false);
      }
    }
  };

  // Toggle Private Channel switch
  const handleTogglePrivate = (checked: boolean) => {
    setIsPrivate(checked);

    // Sync @everyone overwrite VIEW_CHANNEL
    const everyoneOw = overwrites.find((o) => o.id === '@everyone') || {
      id: '@everyone',
      type: 'role' as const,
      name: '@everyone',
      allow: [],
      deny: [],
    };

    let updatedEveryone: ChannelPermissionOverwrite;
    if (checked) {
      updatedEveryone = {
        ...everyoneOw,
        allow: everyoneOw.allow.filter((k) => k !== 'VIEW_CHANNEL'),
        deny: Array.from(new Set([...everyoneOw.deny, 'VIEW_CHANNEL'])),
      };
    } else {
      updatedEveryone = {
        ...everyoneOw,
        allow: Array.from(new Set([...everyoneOw.allow, 'VIEW_CHANNEL'])),
        deny: everyoneOw.deny.filter((k) => k !== 'VIEW_CHANNEL'),
      };
    }

    setOverwrites([
      ...overwrites.filter((o) => o.id !== '@everyone'),
      updatedEveryone,
    ]);
  };

  // Save changes
  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      // Save all overwrites
      for (const ow of overwrites) {
        await channelsApi.updateChannelPermission(channel.id, ow);
      }

      await onUpdateChannel?.(channel.id, {
        permissionOverwrites: overwrites,
        isPrivate,
      });

      setSavedOverwrites(overwrites);
      setSavedIsPrivate(isPrivate);
      toast.success(t('Pengaturan izin channel berhasil disimpan!'));
    } catch (err) {
      console.error(err);
      toast.error(t('Gagal menyimpan izin channel.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Reset unsaved changes
  const handleResetPermissions = () => {
    setOverwrites(savedOverwrites);
    setIsPrivate(savedIsPrivate);
    toast.info(t('Perubahan izin dibatalkan.'));
  };

  // Add new role or member overwrite
  const handleAddOverwrite = (targetId: string, type: 'role' | 'member', name: string) => {
    if (overwrites.some((o) => o.id === targetId)) {
      setSelectedTargetId(targetId);
      setIsAddTargetOpen(false);
      return;
    }

    const newOverwrite: ChannelPermissionOverwrite = {
      id: targetId,
      type,
      name,
      allow: ['VIEW_CHANNEL'],
      deny: [],
    };

    const nextOverwrites = [...overwrites, newOverwrite];
    setOverwrites(nextOverwrites);
    setSelectedTargetId(targetId);
    setIsAddTargetOpen(false);
  };

  // Delete custom overwrite
  const handleDeleteOverwrite = async (targetId: string) => {
    if (targetId === '@everyone') {
      const resetOverwrite: ChannelPermissionOverwrite = {
        id: '@everyone',
        type: 'role',
        name: '@everyone',
        allow: isPrivate ? [] : ['VIEW_CHANNEL'],
        deny: isPrivate ? ['VIEW_CHANNEL'] : [],
      };
      const nextOverwrites = [
        ...overwrites.filter((o) => o.id !== '@everyone'),
        resetOverwrite,
      ];
      setOverwrites(nextOverwrites);
      return;
    }

    const nextOverwrites = overwrites.filter((o) => o.id !== targetId);
    setOverwrites(nextOverwrites);
    setSelectedTargetId('@everyone');

    try {
      await channelsApi.deleteChannelPermission(channel.id, targetId);
    } catch {}
  };

  const isVoice = channel.type === 'voice' || channel.type === 'stage';
  const isAnnouncement = channel.type === 'announcement' || channel.isAnnouncement;

  // Active channel categories based on channel type
  const categories: PermissionCategory[] = useMemo(() => {
    const textOrVoiceCategory: PermissionCategory = isVoice
      ? {
          title: t('Voice Channel Permissions'),
          permissions: VOICE_PERMISSIONS.filter((p) => {
            if (p.key === 'REQUEST_TO_SPEAK' && channel.type !== 'stage') return false;
            return true;
          }),
        }
      : {
          title: t('Text Channel Permissions'),
          permissions: TEXT_PERMISSIONS.map((perm) => {
            if (perm.key === 'SEND_MESSAGES' && isAnnouncement) {
              return {
                ...perm,
                name: 'Send Messages',
                description:
                  'Allows members to publish their own messages to all servers following this Announcement Channel.',
              };
            }
            return perm;
          }),
        };

    return [
      {
        title: t('General Channel Permissions'),
        permissions: GENERAL_PERMISSIONS,
      },
      {
        title: t('Membership Permissions'),
        permissions: MEMBERSHIP_PERMISSIONS,
      },
      textOrVoiceCategory,
      {
        title: t('Apps Permissions'),
        permissions: APPS_PERMISSIONS,
      },
    ];
  }, [isVoice, isAnnouncement, channel.type, t]);

  // Filter categories and permissions by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        permissions: cat.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {t('Channel Permissions')}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('Use permissions to customize who can do what in this channel.')}
        </p>
      </div>

      {/* Private Channel Card (Discord 1:1) */}
      <div className="rounded-xl bg-card border border-border/70 p-4 flex items-center justify-between shadow-xs">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{t('Private Channel')}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            {t('By making a channel private, only select members and roles will be able to view this channel.')}
          </p>
        </div>
        <Switch
          checked={isPrivate}
          onCheckedChange={handleTogglePrivate}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Advanced Permissions Section Header */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-foreground/80 cursor-pointer select-none transition-colors"
        >
          <span>{t('Advanced permissions')}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              !isAdvancedOpen && '-rotate-90',
            )}
          />
        </button>
      </div>

      {/* Advanced Permissions Body */}
      {isAdvancedOpen && (
        <div className="flex flex-col md:flex-row gap-6 border border-border/70 rounded-2xl bg-card/50 overflow-hidden min-h-[500px]">
          {/* Left Column: Roles / Members */}
          <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border/70 p-3 flex flex-col justify-between bg-secondary/15">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Roles/Members')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddTargetOpen(true)}
                  className="w-5 h-5 rounded-full border border-border/80 hover:border-foreground/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title={t('Add Role or Member')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Roles / Members List */}
              <div className="space-y-1">
                {/* Default @everyone item */}
                <button
                  type="button"
                  onClick={() => setSelectedTargetId('@everyone')}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                    selectedTargetId === '@everyone'
                      ? 'bg-secondary text-foreground font-bold border border-border/60 shadow-xs'
                      : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">@everyone</span>
                  </div>
                </button>

                {/* Custom Overwrites */}
                {overwrites
                  .filter((o) => o.id !== '@everyone')
                  .map((ow) => {
                    const isMember = ow.type === 'member';
                    return (
                      <div
                        key={ow.id}
                        onClick={() => setSelectedTargetId(ow.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left group',
                          selectedTargetId === ow.id
                            ? 'bg-secondary text-foreground font-bold border border-border/60 shadow-xs'
                            : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isMember ? (
                            <User className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{ow.name || ow.id}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOverwrite(ow.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                          title={t('Hapus Overwrite')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bottom Link (Discord 1:1) */}
            <div className="pt-4 px-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer transition-colors text-left font-medium"
              >
                {t('Need help with permissions?')}
              </button>
            </div>
          </div>

          {/* Right Column: Search + Categories + Permissions */}
          <div className="flex-1 p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Search permissions bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search permissions')}
                className="pl-9 pr-8 bg-background border-border/70 text-xs h-9 rounded-lg text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#5865F2]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Target Header Info */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('Mengatur izin untuk')}:
                </span>
                <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                  {activeOverwrite.name || selectedTargetId}
                </span>
              </div>
              {selectedTargetId !== '@everyone' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteOverwrite(selectedTargetId)}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t('Hapus Izin Kustom')}
                </Button>
              )}
            </div>

            {/* Permission Categories List */}
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {t('Tidak ada izin yang cocok dengan')} "{searchQuery}"
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.title} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {category.title}
                  </h3>
                  <div className="divide-y divide-border/40 border border-border/60 rounded-xl bg-background/50 overflow-hidden">
                    {category.permissions.map((perm) => (
                      <PermissionRow
                        key={perm.key}
                        perm={perm}
                        state={getPermissionState(perm.key)}
                        onChange={(s) => handleSetPermission(perm.key, s)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Save Changes Bar (Discord 1:1) */}
      {hasChanges && (
        <div className="sticky bottom-2 z-30 p-3 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200 mt-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0 mr-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline truncate">
              {t('Perhatian — Anda memiliki perubahan yang belum disimpan!')}
            </span>
            <span className="sm:hidden truncate">
              {t('Perubahan belum disimpan!')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetPermissions}
              disabled={isSaving}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Reset')}
            </Button>
            <Button
              size="sm"
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 rounded-lg shadow-xs cursor-pointer transition-all"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}
            </Button>
          </div>
        </div>
      )}

      {/* Add Target Modal (Roles / Members) */}
      <Dialog open={isAddTargetOpen} onOpenChange={setIsAddTargetOpen}>
        <DialogContent size="md" className="bg-card border border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Tambahkan Peran atau Anggota')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pilih peran atau anggota untuk membuat hak akses khusus di channel ini.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Roles Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Peran Server')}
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                {colonyRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleAddOverwrite(role.id, 'role', role.name)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: role.color || '#3b82f6' }}
                      />
                      <span>{role.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {role.permissions?.length || 0} izin
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Members Section */}
            {members.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Anggota')}
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAddOverwrite(member.id, 'member', member.name)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{member.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {member.role || 'Member'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Help Modal */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent size="md" className="bg-card border border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span>{t('Bagaimana Cara Kerja Izin Channel?')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Izin di Discord dihitung berdasarkan hierarki berikut:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-foreground font-medium">
              <li>
                <span className="font-bold text-[#da373c]">Tolak (Deny / ✕)</span>:{' '}
                <span className="text-muted-foreground font-normal">
                  Secara eksplisit menolak hak akses bagi peran atau anggota ini di channel ini.
                </span>
              </li>
              <li>
                <span className="font-bold text-muted-foreground">Netral (Inherit / /)</span>:{' '}
                <span className="text-muted-foreground font-normal">
                  Mengikuti izin server bawaan yang dimiliki peran tersebut.
                </span>
              </li>
              <li>
                <span className="font-bold text-[#23a55a]">Izinkan (Allow / ✓)</span>:{' '}
                <span className="text-muted-foreground font-normal">
                  Memberikan izin langsung di channel ini, mengabaikan batasan server umum.
                </span>
              </li>
            </ol>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 text-[11px] text-muted-foreground mt-2">
              Izin pada tingkat anggota memiliki prioritas tertinggi, diikuti oleh peran kustom, dan terakhir @everyone.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 3-Way Segmented Discord Control Row ──
interface PermissionRowProps {
  perm: PermissionDefinition;
  state: 'allow' | 'deny' | 'inherit';
  onChange: (state: 'allow' | 'deny' | 'inherit') => void;
}

function PermissionRow({ perm, state, onChange }: PermissionRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between p-3.5 gap-4 hover:bg-accent/20 transition-colors">
      <div className="min-w-0 pr-2">
        <span className="text-xs font-bold text-foreground block">
          {t(perm.name)}
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          {t(perm.description)}
        </p>
      </div>

      {/* Discord 3-Way Segmented Control: ✕ (Deny) | / (Inherit) | ✓ (Allow) */}
      <div className="flex items-center bg-[#2b2d31] p-0.5 rounded-md border border-white/5 shrink-0 shadow-xs">
        {/* Deny Button (Red) */}
        <button
          type="button"
          onClick={() => onChange('deny')}
          className={cn(
            'h-7 w-8 rounded flex items-center justify-center transition-all cursor-pointer',
            state === 'deny'
              ? 'bg-[#da373c] text-white shadow-xs font-bold'
              : 'text-[#949ba4] hover:text-[#da373c] hover:bg-[#da373c]/15',
          )}
          title={t('Tolak')}
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Inherit Button (Neutral Gray) */}
        <button
          type="button"
          onClick={() => onChange('inherit')}
          className={cn(
            'h-7 w-8 rounded flex items-center justify-center transition-all cursor-pointer',
            state === 'inherit'
              ? 'bg-[#4e5058] text-white shadow-xs font-bold'
              : 'text-[#949ba4] hover:text-white hover:bg-white/5',
          )}
          title={t('Netral')}
        >
          <Slash className="w-3 h-3 stroke-[2.5]" />
        </button>

        {/* Allow Button (Green) */}
        <button
          type="button"
          onClick={() => onChange('allow')}
          className={cn(
            'h-7 w-8 rounded flex items-center justify-center transition-all cursor-pointer',
            state === 'allow'
              ? 'bg-[#23a55a] text-white shadow-xs font-bold'
              : 'text-[#949ba4] hover:text-[#23a55a] hover:bg-[#23a55a]/15',
          )}
          title={t('Izinkan')}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
