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
  Calendar,
  Gem,
  FolderPlus,
  Trash2,
  CheckCheck,
  Check,
  BellOff,
  Pencil,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type Colony,
  type ColonyChannel,
  type ColonyChannelType,
  resolveChannelType,
} from '@/chat/chat-types';
import type { ColonySettingsSection } from '@/features/colony-settings';
import { categoriesApi, type ColonyCategory } from '../api/categories-api';

export interface ColonyChannelsSidebarProps {
  activeColony: Colony | null;
  channels: ColonyChannel[];
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
  onOpenServerSettings: (section?: ColonySettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: ColonyChannelType, categoryId?: string) => void;
  onOpenCreateCategory?: () => void;
  onDeleteCategory?: (categoryId: string) => void;
  onUpdateCategory?: (categoryId: string, name: string) => void;
  categories?: ColonyCategory[];
  onOpenCreateColony?: () => void;
  onOpenEditChannel: (channel: ColonyChannel) => void;
  onUpdateColonyIcon?: (file: File) => Promise<void> | void;
  setIsCallPiP: (pip: boolean) => void;
  calendarEvents?: any[];
  onOpenServerEvents?: () => void;
  selectedActivityAppId?: string | null;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ColonyChannelsSidebar({
  activeColony,
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
  onOpenCreateColony,
  onOpenCreateCategory,
  onDeleteCategory,
  onUpdateCategory,
  categories = [],
  onOpenEditChannel,
  onUpdateColonyIcon,
  setIsCallPiP,
  calendarEvents = [],
  onOpenServerEvents,
  selectedActivityAppId,
  t,
}: ColonyChannelsSidebarProps) {
  const serverIconQuickInputRef = useRef<HTMLInputElement>(null);
  const [editingCategory, setEditingCategory] = React.useState<ColonyCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = React.useState('');
  const [hideMutedChannels, setHideMutedChannels] = React.useState(false);

  const colonyChannels = channels
    .filter((c) => (c.colonyId || 'anticeil') === (activeColony?.id || 'anticeil') && !c.isDirectMessage)
    .filter((c) => !hideMutedChannels || !c.isMuted)
    .map((c) => ({
      ...c,
      type: resolveChannelType(c),
    }));
  const colonyCategories = (categories || []).filter(
    (cat) => cat.colonyId === (activeColony?.id || 'anticeil')
  );

  const getCategoryChannels = (cat: ColonyCategory) => {
    return colonyChannels.filter((c) => {
      if (c.categoryId === cat.id) return true;
      if (c.categoryName && c.categoryName.toUpperCase() === cat.name.toUpperCase()) return true;
      if (!c.categoryId || c.categoryId === '') {
        const defaultTextId = `cat_text_${activeColony?.id || 'anticeil'}`;
        const defaultVoiceId = `cat_voice_${activeColony?.id || 'anticeil'}`;
        const defaultForumId = `cat_forum_${activeColony?.id || 'anticeil'}`;
        const defaultKanbanId = `cat_kanban_${activeColony?.id || 'anticeil'}`;

        if (cat.id === defaultTextId && c.type === 'text') return true;
        if (cat.id === defaultVoiceId && c.type === 'voice') return true;
        if (cat.id === defaultForumId && c.type === 'forum') return true;
        if (cat.id === defaultKanbanId && c.type === 'kanban') return true;
      }
      return false;
    });
  };

  const uncategorizedChannels = colonyChannels.filter((c) => {
    const isClaimed = colonyCategories.some((cat) => {
      if (c.categoryId === cat.id) return true;
      if (c.categoryName && c.categoryName.toUpperCase() === cat.name.toUpperCase()) return true;
      if (!c.categoryId || c.categoryId === '') {
        const defaultTextId = `cat_text_${activeColony?.id || 'anticeil'}`;
        const defaultVoiceId = `cat_voice_${activeColony?.id || 'anticeil'}`;
        const defaultForumId = `cat_forum_${activeColony?.id || 'anticeil'}`;
        const defaultKanbanId = `cat_kanban_${activeColony?.id || 'anticeil'}`;

        if (cat.id === defaultTextId && c.type === 'text') return true;
        if (cat.id === defaultVoiceId && c.type === 'voice') return true;
        if (cat.id === defaultForumId && c.type === 'forum') return true;
        if (cat.id === defaultKanbanId && c.type === 'kanban') return true;
      }
      return false;
    });
    return !isClaimed;
  });

  const renderChannelItem = (ch: ColonyChannel) => {
    const isActiveCh = activeChannelId === ch.id;

    if (ch.type === 'voice') {
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
              isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
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
    }

    if (ch.type === 'forum') {
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
                isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
              )}
            />
            <span className="truncate flex-1">{ch.name}</span>
            {ch.isPrivate && (
              <span title="Private Channel">
                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              </span>
            )}

            {activeCallChannelId === ch.id &&
              (selectedActivityAppId === 'watch-together' || selectedActivityAppId === 'youtube') && (
                <div
                  className="w-5 h-3.5 bg-red-600 rounded flex items-center justify-center shrink-0 shadow-xs"
                  title="Watch Together Aktif"
                >
                  <svg className="w-2.5 h-2.5 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}

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
    }

    if (ch.type === 'kanban') {
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
                isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
              )}
            />
            <span className="truncate flex-1">{ch.name}</span>
            {ch.isPrivate && (
              <span title="Private Channel">
                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              </span>
            )}
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
    }

    // Default: text
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
              isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
            )}
          />
          <span className="truncate flex-1">{ch.name}</span>
          {ch.isPrivate && (
            <span title="Private Channel">
              <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            </span>
          )}

          {activeCallChannelId === ch.id &&
            (selectedActivityAppId === 'watch-together' || selectedActivityAppId === 'youtube') && (
              <div
                className="w-5 h-3.5 bg-red-600 rounded flex items-center justify-center shrink-0 shadow-xs"
                title="Watch Together Aktif"
              >
                <svg className="w-2.5 h-2.5 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}

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
  };

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
              if (!file || !activeColony) return;
              if (onUpdateColonyIcon) {
                await onUpdateColonyIcon(file);
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
                  {activeColony?.iconUrl ? (
                    <img
                      src={activeColony.iconUrl}
                      alt={activeColony.name}
                      className="w-5 h-5 rounded-[6px] object-cover shrink-0 border border-white/10"
                    />
                  ) : null}
                  <span className="text-sm font-semibold truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {activeColony?.name || t('Colony')}
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
                <Camera className="w-4 h-4 mr-2 text-primary" /> {t('Ubah Foto Colony')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Boost */}
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('boost');
                }}
                className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
              >
                <Zap className="w-4 h-4 mr-2 text-primary" /> {t('Colony Boost')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Invite & Settings */}
              <DropdownMenuItem
                onClick={() => {
                  const code = activeColony?.inviteCode || activeColony?.id;
                  const url = `${window.location.origin}/messages?invite=${code}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t('Link undangan berhasil disalin! 📋'));
                }}
                className="cursor-pointer"
              >
                <UserPlus className="w-4 h-4 mr-2" /> {t('Undang ke Colony')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('profile');
                }}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" /> {t('Pengaturan Colony')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Channel & Category */}
              <DropdownMenuItem onClick={() => onOpenCreateChannel('CHANNELS', 'text')} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" /> {t('Buat Channel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenCreateCategory?.()} className="cursor-pointer">
                <FolderPlus className="w-4 h-4 mr-2" /> {t('Buat Kategori')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenCreateColony?.()} className="cursor-pointer">
                <Layers className="w-4 h-4 mr-2" /> {t('Buat Colony Baru')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Notification & Privacy */}
              <DropdownMenuItem
                onClick={() => {
                  onOpenServerSettings('audit-log');
                }}
                className="cursor-pointer"
              >
                <ScrollText className="w-4 h-4 mr-2" /> {t('Log Audit Colony')}
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
                <Edit2 className="w-4 h-4 mr-2" /> {t('Edit Profil Colony')}
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

      {/* Scroll Area: Server channels grouped by category with right-click menu on empty space */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 pb-16 [scrollbar-width:thin] flex flex-col">
        {/* Discord-style Server Events & Boost Entry */}
        {activeColony && (
          <div className="space-y-0.5 mb-3">
            {(() => {
              const count = calendarEvents.filter((ev) => ev.colonyId === activeColony.id || (ev.hubName && ev.hubName.toLowerCase() === activeColony.name.toLowerCase())).length;
              return (
                <button
                  type="button"
                  onClick={() => onOpenServerEvents?.()}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer group text-xs font-semibold"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    <span className="truncate">{count} {count === 1 ? 'Event' : 'Events'}</span>
                  </div>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => onOpenServerSettings('boost')}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer group text-xs font-semibold"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Gem className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span className="truncate">Colony Boosts</span>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-4">
          {colonyChannels.length === 0 ? (
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
                            {/* UNCATEGORIZED CHANNELS (WHEN CHANNELS HAVE NO CATEGORY OR CATEGORY WAS DELETED) */}
              {uncategorizedChannels.length > 0 && (
                <div className="space-y-1 mb-2">
                  <div
                    onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, uncategorized: !prev?.uncategorized }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200 shrink-0',
                          Boolean(collapsedCategories?.uncategorized) && '-rotate-90',
                        )}
                      />
                      <span className="truncate">{t('Tanpa Kategori')}</span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        ({uncategorizedChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateChannel('CHANNELS', 'text', '');
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                          title={t('Buat Channel')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Channel')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories?.uncategorized && (
                    <div className="space-y-0.5">
                      {uncategorizedChannels.map(renderChannelItem)}
                    </div>
                  )}
                </div>
              )}

              {/* ALL ACTIVE CATEGORIES (DEFAULTS + CUSTOMS, FULLY DELETABLE & EDITABLE) */}
              {colonyCategories.map((cat) => {
                const catChannels = getCategoryChannels(cat);
                const isCollapsed = Boolean(collapsedCategories?.[cat.id]);

                return (
                  <div key={cat.id} className="space-y-1 mb-2">
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div
                          onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, [cat.id]: !prev?.[cat.id] }))}
                          className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <ChevronDown
                              className={cn(
                                'w-3 h-3 transition-transform duration-200 shrink-0',
                                isCollapsed && '-rotate-90',
                              )}
                            />
                            <span className="truncate">{cat.name}</span>
                            <span className="text-[10px] text-muted-foreground/60 shrink-0">
                              ({catChannels.length})
                            </span>
                          </div>
                          <Tooltip delayDuration={150}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCreateChannel('CHANNELS', 'text', cat.id);
                                }}
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                                title={t('Buat Channel')}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                              {t('Buat Channel')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56 bg-card border-border text-foreground">
                        <ContextMenuItem
                          onClick={() => toast.success(t('Semua channel di kategori ini ditandai telah dibaca'))}
                          className="cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span>{t('Mark As Read')}</span>
                        </ContextMenuItem>

                        <ContextMenuSeparator />

                        <ContextMenuCheckboxItem
                          checked={isCollapsed}
                          onCheckedChange={(checked) =>
                            setCollapsedCategories((prev: any) => ({ ...prev, [cat.id]: checked }))
                          }
                          className="cursor-pointer"
                        >
                          <span>{t('Collapse Category')}</span>
                        </ContextMenuCheckboxItem>

                        <ContextMenuItem
                          onClick={() => {
                            setCollapsedCategories((prev: any) => {
                              const next: any = { uncategorized: true };
                              colonyCategories.forEach((c) => {
                                next[c.id] = true;
                              });
                              return next;
                            });
                          }}
                          className="cursor-pointer"
                        >
                          <span>{t('Collapse All Categories')}</span>
                        </ContextMenuItem>

                        <ContextMenuSeparator />

                        <ContextMenuSub>
                          <ContextMenuSubTrigger className="cursor-pointer">
                            <BellOff className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span>{t('Mute Category')}</span>
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-48 bg-card border-border">
                            {['15 Menit', '1 Jam', '8 Jam', '24 Jam', 'Sampai diaktifkan kembali'].map((duration) => (
                              <ContextMenuItem
                                key={duration}
                                onClick={() => toast.success(t(`Kategori dibisukan selama ${duration}`))}
                                className="cursor-pointer"
                              >
                                {duration}
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSeparator />

                        <ContextMenuItem
                          onClick={() => {
                            setEditingCategory(cat);
                            setEditCategoryName(cat.name);
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span>{t('Edit Category')}</span>
                        </ContextMenuItem>

                        <ContextMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm(t('Hapus kategori ini? Channel di dalamnya tidak akan terhapus.'))) {
                              if (onDeleteCategory) {
                                onDeleteCategory(cat.id);
                              } else {
                                categoriesApi.deleteCategory(cat.id, activeColony?.id || 'anticeil');
                              }
                            }
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                          <span>{t('Delete Category')}</span>
                        </ContextMenuItem>

                        <ContextMenuSeparator />

                        <ContextMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(cat.id);
                            toast.success(t('Category ID disalin ke papan klip'));
                          }}
                          className="cursor-pointer"
                        >
                          <Hash className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span>{t('Copy Category ID')}</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>

                    {!isCollapsed && (
                      <div className="space-y-0.5">
                        {catChannels.length === 0 ? (
                          <div className="px-3 py-1 text-[11px] text-muted-foreground/50 italic">
                            {t('Belum ada channel')}
                          </div>
                        ) : (
                          catChannels.map(renderChannelItem)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Empty space filler so right clicking anywhere below channels opens the menu */}
        <div className="flex-1 min-h-[140px] cursor-default" />
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent className="w-56 bg-card border-border text-foreground">
      <ContextMenuItem
        onClick={() => {
          setHideMutedChannels((prev) => !prev);
          toast.info(hideMutedChannels ? t('Menampilkan channel yang dibisukan') : t('Menyembunyikan channel yang dibisukan'));
        }}
        className="flex items-center justify-between cursor-pointer"
      >
        <span>{t('Hide Muted Channels')}</span>
        <div
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center transition-colors',
            hideMutedChannels
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground/60',
          )}
        >
          {hideMutedChannels && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={() => onOpenCreateChannel('CHANNELS', 'text')}
        className="cursor-pointer"
      >
        <span>{t('Create Channel')}</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => onOpenCreateCategory?.()}
        className="cursor-pointer"
      >
        <span>{t('Create Category')}</span>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => onOpenInvite()}
        className="cursor-pointer"
      >
        <span>{t('Invite to Colony')}</span>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>

      {/* Edit Category Dialog */}
      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Pencil className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold">{t('Edit Kategori')}</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {t('Ubah nama kategori colony Anda.')}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingCategory || !editCategoryName.trim()) return;
              const newName = editCategoryName.trim().toUpperCase();
              if (onUpdateCategory) {
                onUpdateCategory(editingCategory.id, newName);
              } else {
                categoriesApi.updateCategory({
                  ...editingCategory,
                  name: newName,
                });
                toast.success(t(`Kategori berhasil diubah menjadi ${newName}`));
              }
              setEditingCategory(null);
            }}
          >
            <DialogBody className="space-y-4 py-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t('NAMA KATEGORI')}
                </label>
                <Input
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value.toUpperCase())}
                  className="bg-muted/40 border-border text-foreground text-xs uppercase"
                  autoFocus
                  required
                />
              </div>
            </DialogBody>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingCategory(null)}
                className="text-xs"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editCategoryName.trim()}
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {t('Simpan Perubahan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
