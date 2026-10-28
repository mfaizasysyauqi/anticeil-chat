import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Zap,
  UserPlus,
  Settings,
  Webhook,
  Plus,
  Radio,
  Camera,
  Edit2,
  Lock,
  Layers,
  ScrollText,
  ExternalLink,
  Hash,
  Volume2,
  MessagesSquare,
  Columns3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type CommunityHub,
  type CommunityChannel,
  type CommunityChannelType,
  resolveChannelType,
} from '@/chat/chat-types';
import type { ServerSettingsSection } from '@/features/server-settings';

export interface ServerChannelsSidebarProps {
  activeHub: CommunityHub | null;
  channels: CommunityChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  collapsedCategories: any;
  setCollapsedCategories: any;
  threadsMap: Record<string, any[]>;
  channelThreads: any[];
  activeThread: any;
  setActiveThread: (thread: any) => void;
  activeCallCounts?: Record<string, number>;
  onItemClick?: () => void;
  onOpenInvite: () => void;
  onOpenServerSettings: (section?: ServerSettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: CommunityChannelType) => void;
  onOpenCreateHub?: () => void;
  onOpenEditChannel: (channel: CommunityChannel) => void;
  onUpdateHubIcon?: (file: File) => Promise<void> | void;
  setIsCallPiP: (pip: boolean) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ServerChannelsSidebar({
  activeHub,
  channels,
  activeChannelId,
  setActiveChannelId,
  activeCallChannelId,
  setActiveCallChannelId,
  collapsedCategories,
  setCollapsedCategories,
  threadsMap,
  channelThreads,
  activeThread,
  setActiveThread,
  activeCallCounts = {},
  onItemClick,
  onOpenInvite,
  onOpenServerSettings,
  onOpenCreateChannel,
  onOpenCreateHub,
  onOpenEditChannel,
  onUpdateHubIcon,
  setIsCallPiP,
  t,
}: ServerChannelsSidebarProps) {
  const serverIconQuickInputRef = useRef<HTMLInputElement>(null);

  const hubChannels = channels
    .filter((c) => (c.hubId || 'anticeil') === (activeHub?.id || 'anticeil') && !c.isDirectMessage)
    .map((c) => ({
      ...c,
      type: resolveChannelType(c),
    }));
  const textChannels = hubChannels.filter((c) => c.type === 'text');
  const voiceChannels = hubChannels.filter((c) => c.type === 'voice');
  const forumChannels = hubChannels.filter((c) => c.type === 'forum');
  const kanbanChannels = hubChannels.filter((c) => c.type === 'kanban');

  return (
    <>
      {/* Server Header: Title + dropdown with channel/server actions */}
      <div className="h-12 border-b border-sidebar-border px-2 flex items-center font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
        <div className="w-full">
          <input
            type="file"
            ref={serverIconQuickInputRef}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !activeHub) return;
              if (onUpdateHubIcon) {
                await onUpdateHubIcon(file);
              }
              e.target.value = '';
            }}
            accept="image/*"
            className="hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full h-8 px-2 flex items-center justify-between rounded-md hover:bg-sidebar-accent/60 transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-sidebar-ring group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {activeHub?.iconUrl ? (
                    <img
                      src={activeHub.iconUrl}
                      alt={activeHub.name}
                      className="w-5 h-5 rounded-[6px] object-cover shrink-0 border border-white/10"
                    />
                  ) : null}
                  <span className="text-sm font-semibold truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {activeHub?.name || t('Server')}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-1 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {/* Server Picture Action */}
              <DropdownMenuItem
                onClick={() => {
                  serverIconQuickInputRef.current?.click();
                }}
                className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
              >
                <Camera className="w-4 h-4 mr-2 text-primary" /> {t('Ubah Foto Server')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Boost */}
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('boost');
                }}
                className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
              >
                <Zap className="w-4 h-4 mr-2 text-primary" /> {t('Server Boost')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Invite & Settings */}
              <DropdownMenuItem
                onClick={() => {
                  const code = activeHub?.inviteCode || activeHub?.id;
                  const url = `${window.location.origin}/messages?invite=${code}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t('Link undangan berhasil disalin! 📋'));
                }}
                className="cursor-pointer"
              >
                <UserPlus className="w-4 h-4 mr-2" /> {t('Undang ke Server')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('profile');
                }}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" /> {t('Pengaturan Server')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Channel & Category */}
              <DropdownMenuItem onClick={() => onOpenCreateChannel('CHANNELS', 'text')} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" /> {t('Buat Channel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenCreateHub?.()} className="cursor-pointer">
                <Layers className="w-4 h-4 mr-2" /> {t('Buat Server Baru')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Notification & Privacy */}
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('audit-log');
                }}
                className="cursor-pointer"
              >
                <ScrollText className="w-4 h-4 mr-2" /> {t('Log Audit Server')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('integrations');
                }}
                className="cursor-pointer"
              >
                <Webhook className="w-4 h-4 mr-2" /> {t('Integrasi & Bot')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Per-server profile */}
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('profile');
                }}
                className="cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" /> {t('Edit Profil Server')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/templates" className="flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" /> {t('Jelajahi Marketplace')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scroll Area: Server channels grouped by category */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 pb-16 [scrollbar-width:thin]">
        <div className="space-y-4">
          {hubChannels.length === 0 ? (
            <div className="px-2.5 py-4 text-center">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed mb-2">
                {t('Belum ada channel')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenCreateChannel('CHANNELS', 'text')}
                className="h-7 text-xs px-2.5 gap-1 w-full"
              >
                <Plus className="w-3 h-3" />
                {t('Buat Channel')}
              </Button>
            </div>
          ) : (
            <>
              {/* 1. TEXT CHANNELS CATEGORY */}
              {textChannels.length > 0 && (
                <div>
                <div
                  onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, text: !prev?.text }))}
                  className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                >
                  <div className="flex items-center gap-1">
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        collapsedCategories?.text && '-rotate-90',
                      )}
                    />
                    <span>{t('Text Channels')}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ({textChannels.length})
                    </span>
                  </div>
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateChannel('CHANNELS', 'text');
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                      {t('Buat Text Channel')}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {!collapsedCategories?.text && (
                  <div className="space-y-0.5">
                    {textChannels.map((ch) => {
                      const isActiveCh = activeChannelId === ch.id;

                      return (
                        <div key={ch.id} className="space-y-0.5">
                          <div
                            onClick={() => {
                              setActiveChannelId(ch.id);
                              onItemClick?.();
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                              isActiveCh
                                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                          >
                            <Hash
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                isActiveCh
                                  ? 'text-primary'
                                  : 'text-muted-foreground/70 group-hover:text-foreground',
                              )}
                            />
                            <span className="truncate flex-1">{ch.name}</span>
                            {ch.isPrivate && (
                              <span title="Private Channel">
                                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              </span>
                            )}

                            {/* Channel action buttons */}
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenInvite();
                                }}
                                title={t('Buat Undangan')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditChannel(ch);
                                }}
                                title={t('Pengaturan Channel')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* 2. VOICE CHANNELS CATEGORY */}
              {voiceChannels.length > 0 && (
                <div>
                <div
                  onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, voice: !prev?.voice }))}
                  className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                >
                  <div className="flex items-center gap-1">
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        collapsedCategories?.voice && '-rotate-90',
                      )}
                    />
                    <span>{t('Voice Channels')}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ({voiceChannels.length})
                    </span>
                  </div>
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateChannel('CHANNELS', 'voice');
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                      {t('Buat Voice Channel')}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {!collapsedCategories?.voice && (
                  <div className="space-y-0.5">
                    {voiceChannels.map((ch) => {
                      const isActiveCh = activeChannelId === ch.id;
                      return (
                        <div
                          key={ch.id}
                          onClick={() => {
                            setActiveChannelId(ch.id);
                            setActiveCallChannelId(ch.id);
                            setIsCallPiP(false);
                            onItemClick?.();
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                            isActiveCh
                              ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <Volume2
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActiveCh
                                ? 'text-primary'
                                : 'text-muted-foreground/70 group-hover:text-foreground',
                            )}
                          />
                          <span className="truncate flex-1">{ch.name}</span>
                          {ch.isPrivate && (
                            <span title="Private Channel">
                              <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            </span>
                          )}
                          {activeCallCounts[ch.id] && activeCallCounts[ch.id] > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0 animate-pulse">
                              <Radio className="w-2.5 h-2.5" />
                              {activeCallCounts[ch.id]}
                            </span>
                          ) : null}

                          {/* Channel action buttons */}
                          <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInvite();
                              }}
                              title={t('Buat Undangan')}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditChannel(ch);
                              }}
                              title={t('Pengaturan Channel')}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* 3. FORUM CHANNELS CATEGORY */}
              {forumChannels.length > 0 && (
                <div>
                <div
                  onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, forum: !prev?.forum }))}
                  className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                >
                  <div className="flex items-center gap-1">
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        collapsedCategories?.forum && '-rotate-90',
                      )}
                    />
                    <span>{t('Forum Channels')}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ({forumChannels.length})
                    </span>
                  </div>
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateChannel('CHANNELS', 'forum');
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                      {t('Buat Forum Channel')}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {!collapsedCategories?.forum && (
                  <div className="space-y-0.5">
                    {forumChannels.map((ch) => {
                      const isActiveCh = activeChannelId === ch.id;
                      const childThreads =
                        threadsMap[ch.id] || (activeChannelId === ch.id ? channelThreads : []);

                      return (
                        <div key={ch.id} className="space-y-0.5">
                          <div
                            onClick={() => {
                              setActiveChannelId(ch.id);
                              setActiveThread(null);
                              onItemClick?.();
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                              isActiveCh
                                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                          >
                            <MessagesSquare
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                isActiveCh
                                  ? 'text-primary'
                                  : 'text-muted-foreground/70 group-hover:text-foreground',
                              )}
                            />
                            <span className="truncate flex-1">{ch.name}</span>
                            {ch.isPrivate && (
                              <span title="Private Channel">
                                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              </span>
                            )}

                            {/* Channel action buttons */}
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenInvite();
                                }}
                                title={t('Buat Undangan')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditChannel(ch);
                                }}
                                title={t('Pengaturan Channel')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Nested Threads under Forum Channel */}
                          {childThreads && childThreads.length > 0 && (
                            <div className="ml-4 pl-2.5 border-l border-border/40 space-y-0.5 my-0.5">
                              {childThreads.map((th) => {
                                const isThActive =
                                  activeChannelId === ch.id && activeThread?.id === th.id;
                                return (
                                  <div
                                    key={th.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChannelId(ch.id);
                                      setActiveThread(th);
                                      onItemClick?.();
                                    }}
                                    className={cn(
                                      'flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors',
                                      isThActive
                                        ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    )}
                                  >
                                    <span className="text-muted-foreground/50 text-[11px] font-mono leading-none">
                                      └──
                                    </span>
                                    <span className="truncate flex-1">{th.name}</span>
                                    {th.messageCount > 0 && (
                                      <span className="text-[10px] text-muted-foreground/60 font-mono px-1 rounded bg-muted/40">
                                        {th.messageCount}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* 4. KANBAN CHANNELS CATEGORY */}
              {kanbanChannels.length > 0 && (
                <div>
                  <div
                    onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, kanban: !prev?.kanban }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          collapsedCategories?.kanban && '-rotate-90',
                        )}
                      />
                      <span>{t('Kanban Boards')}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({kanbanChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateChannel('CHANNELS', 'kanban');
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Kanban Board')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories?.kanban && (
                    <div className="space-y-0.5">
                      {kanbanChannels.map((ch) => {
                        const isActiveCh = activeChannelId === ch.id;

                        return (
                          <div key={ch.id} className="relative group">
                            <div
                              onClick={() => {
                                setActiveChannelId(ch.id);
                                onItemClick?.();
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                                isActiveCh
                                  ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              )}
                            >
                              <Columns3
                                className={cn(
                                  'w-4 h-4 shrink-0 transition-colors',
                                  isActiveCh
                                    ? 'text-primary'
                                    : 'text-muted-foreground/70 group-hover:text-foreground',
                                )}
                              />
                              <span className="truncate flex-1">{ch.name}</span>
                              {ch.isPrivate && (
                                <span title="Private Channel">
                                  <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                </span>
                              )}

                              {/* Channel action buttons */}
                              <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenInvite();
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditChannel(ch);
                                  }}
                                  title={t('Pengaturan Channel')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
