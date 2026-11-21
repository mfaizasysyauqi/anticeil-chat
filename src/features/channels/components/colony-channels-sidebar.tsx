import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Calendar,
  Gem,
  Check,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
import {
  SidebarColonyHeader,
  SidebarChannelItem,
  SidebarCategoryGroup,
  SidebarEditCategoryDialog,
} from './sidebar';

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
  onMoveChannelCategory?: (channelId: string, categoryId?: string, categoryName?: string) => Promise<void> | void;
  setIsCallPiP: (pip: boolean) => void;
  calendarEvents?: any[];
  onOpenServerEvents?: () => void;
  selectedActivityAppId?: string | null;
  onToggleCollapseSidebar?: () => void;
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
  onMoveChannelCategory,
  setIsCallPiP,
  calendarEvents = [],
  onOpenServerEvents,
  selectedActivityAppId,
  onToggleCollapseSidebar,
  t,
}: ColonyChannelsSidebarProps) {
  const [editingCategory, setEditingCategory] = useState<ColonyCategory | null>(null);
  const [hideMutedChannels, setHideMutedChannels] = useState(false);
  const [draggingChannelId, setDraggingChannelId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggingChannelId(null);
      setDragOverCategoryId(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('mouseup', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('mouseup', handleGlobalDragEnd);
    };
  }, []);

  const handleMoveChannel = async (channelId: string, targetCatId?: string, targetCatName?: string) => {
    setDraggingChannelId(null);
    setDragOverCategoryId(null);
    const channel = colonyChannels.find((c) => c.id === channelId);
    if (!channel) return;
    const currentCatId = channel.categoryId || '';
    const targetId = targetCatId || '';
    if (currentCatId === targetId) return;

    if (onMoveChannelCategory) {
      await onMoveChannelCategory(channelId, targetCatId || undefined, targetCatName || undefined);
    }
  };

  const colonyChannels = React.useMemo(() => {
    const targetId = activeColony?.id || 'anticeil';
    const seen = new Set<string>();
    return channels
      .filter((c) => {
        const matches = (c.colonyId || 'anticeil') === targetId && !c.isDirectMessage;
        if (!matches) return false;
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .filter((c) => !hideMutedChannels || !c.isMuted)
      .map((c) => ({
        ...c,
        type: resolveChannelType(c),
      }));
  }, [channels, activeColony?.id, hideMutedChannels]);

  const colonyCategories = (categories || []).filter(
    (cat) => cat.colonyId === (activeColony?.id || 'anticeil'),
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

  const renderDraggableChannel = (ch: ColonyChannel) => {
    const isDraggingThis = draggingChannelId === ch.id;

    return (
      <div
        key={ch.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', ch.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggingChannelId(ch.id);
        }}
        onDragEnd={() => {
          setDraggingChannelId(null);
          setDragOverCategoryId(null);
        }}
        className={cn(
          'transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
          isDraggingThis && 'opacity-30 scale-[0.99]',
        )}
      >
        <SidebarChannelItem
          channel={ch}
          activeChannelId={activeChannelId}
          setActiveChannelId={setActiveChannelId}
          activeCallChannelId={activeCallChannelId}
          setActiveCallChannelId={setActiveCallChannelId}
          setIsCallPiP={setIsCallPiP}
          activeCallCounts={activeCallCounts}
          selectedActivityAppId={selectedActivityAppId}
          threadsMap={threadsMap}
          channelThreads={channelThreads}
          activeThread={activeThread}
          setActiveThread={setActiveThread}
          onItemClick={onItemClick}
          onOpenInvite={onOpenInvite}
          onOpenEditChannel={onOpenEditChannel}
          t={t}
        />
      </div>
    );
  };

  const handleCollapseAll = () => {
    setCollapsedCategories((prev: any) => {
      const next: any = { uncategorized: true };
      colonyCategories.forEach((c) => {
        next[c.id] = true;
      });
      return next;
    });
  };

  return (
    <>
      {/* Colony Header */}
      <SidebarColonyHeader
        activeColony={activeColony}
        onUpdateColonyIcon={onUpdateColonyIcon}
        onOpenServerSettings={onOpenServerSettings}
        onOpenCreateChannel={onOpenCreateChannel}
        onOpenCreateCategory={onOpenCreateCategory}
        onOpenCreateColony={onOpenCreateColony}
        onToggleCollapseSidebar={onToggleCollapseSidebar}
        t={t}
      />

      {/* Scroll Area with Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 pb-16 custom-scrollbar flex flex-col">
            {/* Server Events & Boost Entry */}
            {activeColony && (
              <div className="space-y-0.5 mb-3">
                {(() => {
                  const count = calendarEvents.filter(
                    (ev) =>
                      ev.colonyId === activeColony.id ||
                      (ev.hubName && ev.hubName.toLowerCase() === activeColony.name.toLowerCase()),
                  ).length;
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
                  {/* Uncategorized channels */}
                  {uncategorizedChannels.length > 0 ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverCategoryId !== '__uncategorized__') {
                          setDragOverCategoryId('__uncategorized__');
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverCategoryId === '__uncategorized__') {
                          setDragOverCategoryId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCategoryId(null);
                        setDraggingChannelId(null);
                        const channelId = e.dataTransfer.getData('text/plain');
                        if (channelId) {
                          handleMoveChannel(channelId, '', '');
                        }
                      }}
                      className={cn(
                        'space-y-1 mb-2 p-1 -m-1 rounded-lg transition-all duration-150',
                        dragOverCategoryId === '__uncategorized__' &&
                          'ring-2 ring-primary/80 bg-primary/10 shadow-xs',
                      )}
                    >
                      <div
                        onClick={() =>
                          setCollapsedCategories((prev: any) => ({
                            ...prev,
                            uncategorized: !prev?.uncategorized,
                          }))
                        }
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
                              type="button"
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
                          {uncategorizedChannels.map(renderDraggableChannel)}
                        </div>
                      )}
                    </div>
                  ) : draggingChannelId ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverCategoryId !== '__uncategorized__') {
                          setDragOverCategoryId('__uncategorized__');
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverCategoryId === '__uncategorized__') {
                          setDragOverCategoryId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverCategoryId(null);
                        setDraggingChannelId(null);
                        const channelId = e.dataTransfer.getData('text/plain');
                        if (channelId) {
                          handleMoveChannel(channelId, '', '');
                        }
                      }}
                      className={cn(
                        'border border-dashed border-primary/50 bg-primary/5 rounded-md py-2 px-3 text-center text-[11px] text-primary font-medium mb-2 transition-all animate-pulse',
                        dragOverCategoryId === '__uncategorized__' && 'ring-2 ring-primary/80 bg-primary/15',
                      )}
                    >
                      {t('Lepas di sini untuk pindahkan ke Tanpa Kategori')}
                    </div>
                  ) : null}

                  {/* Categories */}
                  {colonyCategories.map((cat) => {
                    const catChannels = getCategoryChannels(cat);
                    const isCollapsed = Boolean(collapsedCategories?.[cat.id]);
                    const isDragOverThis = dragOverCategoryId === cat.id;

                    if (
                      (cat.id.startsWith('cat_forum_') ||
                        cat.id.startsWith('cat_kanban_') ||
                        cat.name === 'FORUM CHANNELS' ||
                        cat.name === 'KANBAN BOARDS') &&
                      catChannels.length === 0 &&
                      !draggingChannelId
                    ) {
                      return null;
                    }

                    return (
                      <SidebarCategoryGroup
                        key={cat.id}
                        category={cat}
                        channels={catChannels}
                        isCollapsed={isCollapsed}
                        isDragOver={isDragOverThis}
                        onToggleCollapse={() =>
                          setCollapsedCategories((prev: any) => ({
                            ...prev,
                            [cat.id]: !prev?.[cat.id],
                          }))
                        }
                        onCollapseAll={handleCollapseAll}
                        onOpenCreateChannel={onOpenCreateChannel}
                        onEditCategory={(c) => setEditingCategory(c)}
                        onDeleteCategory={(catId) => {
                          if (onDeleteCategory) {
                            onDeleteCategory(catId);
                          } else {
                            categoriesApi.deleteCategory(catId, activeColony?.id || 'anticeil');
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverCategoryId !== cat.id) {
                            setDragOverCategoryId(cat.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                          if (dragOverCategoryId === cat.id) {
                            setDragOverCategoryId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverCategoryId(null);
                          setDraggingChannelId(null);
                          const channelId = e.dataTransfer.getData('text/plain');
                          if (channelId) {
                            handleMoveChannel(channelId, cat.id, cat.name);
                          }
                        }}
                        renderChannel={renderDraggableChannel}
                        t={t}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {/* Empty space filler for context menu */}
            <div className="flex-1 min-h-[140px] cursor-default" />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56 bg-card border-border text-foreground">
          <ContextMenuItem
            onClick={() => {
              setHideMutedChannels((prev) => !prev);
              toast.info(
                hideMutedChannels
                  ? t('Menampilkan channel yang dibisukan')
                  : t('Menyembunyikan channel yang dibisukan'),
              );
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
      <SidebarEditCategoryDialog
        editingCategory={editingCategory}
        onClose={() => setEditingCategory(null)}
        onUpdateCategory={onUpdateCategory}
        t={t}
      />
    </>
  );
}
