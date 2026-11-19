import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Columns3,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Tag,
  Menu,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { KanbanCard, KanbanColumn, KanbanPriority } from '../types';
import type { ColonyChannel, Colony, ColonyMember } from '@/chat/chat-types';
import { assignmentsApi } from '@/features/assignments/api/assignments-api';
import { KanbanCardDialog } from './kanban-card-dialog';
import { toast } from 'sonner';

export interface KanbanChannelViewProps {
  activeChannel: ColonyChannel;
  activeColony: Colony | null;
  displayMembers: ColonyMember[];
  currentUser: any;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
  onCardsUpdate?: (cards: KanbanCard[]) => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'review', title: 'Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

export function KanbanChannelView({
  activeChannel,
  activeColony,
  displayMembers,
  currentUser,
  onOpenSidebar,
  horizontalPadding = 'px-4 sm:px-6',
  onCardsUpdate,
}: KanbanChannelViewProps) {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('todo');



  // Stable ref for parent callback to prevent infinite re-render loops
  const onCardsUpdateRef = useRef(onCardsUpdate);
  useEffect(() => {
    onCardsUpdateRef.current = onCardsUpdate;
  }, [onCardsUpdate]);

  // Fetch real cards from PostgreSQL database via API
  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentsApi.getAssignments(activeChannel.id, activeColony?.id);
      if (Array.isArray(data)) {
        const mapped: KanbanCard[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          columnId: d.columnId || 'todo',
          channelId: d.channelId || activeChannel.id,
          channelName: d.channelName || activeChannel.name,
          colonyId: d.colonyId || activeColony?.id || 'anticeil',
          hubName: d.hubName || activeColony?.name || 'Anticeil',
          assigneeId: d.assigneeId || d.userId,
          assigneeName: d.assigneeName || 'Member',
          assigneeAvatar: d.assigneeAvatar || null,
          priority: (d.priority || 'medium') as KanbanPriority,
          dueDate: d.dueDate || undefined,
          tags: Array.isArray(d.tags) ? d.tags : [],
          createdAt: d.createdAt || new Date().toISOString(),
          completedAt: d.completedAt || undefined,
        }));
        setCards(mapped);
        onCardsUpdateRef.current?.(mapped);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Failed to load kanban cards from backend', err);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeChannel.id, activeColony?.id, activeChannel.name, activeColony?.name]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.tags && card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleMoveCard = async (cardId: string, direction: 'left' | 'right') => {
    const colOrder = ['todo', 'in_progress', 'review', 'done'];
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    const currentIndex = colOrder.indexOf(targetCard.columnId);
    const nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= colOrder.length) return;
    const newCol = colOrder[nextIndex];
    const completedAt = newCol === 'done' ? dayjs().toISOString() : undefined;

    // Optimistic UI update
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, columnId: newCol, completedAt } : c
    );
    setCards(updated);
    onCardsUpdate?.(updated);

    try {
      await assignmentsApi.updateAssignment(cardId, {
        columnId: newCol,
        completedAt: completedAt || null,
      });
    } catch {
      toast.error('Gagal memperbarui status kartu di database.');
      fetchCards(); // Rollback on error
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    const previous = [...cards];
    const updated = cards.filter((c) => c.id !== cardId);
    setCards(updated);
    onCardsUpdate?.(updated);

    try {
      await assignmentsApi.deleteAssignment(cardId);
      toast.success('Kartu tugas berhasil dihapus dari database');
    } catch {
      toast.error('Gagal menghapus kartu dari database.');
      setCards(previous);
      onCardsUpdate?.(previous);
    }
  };

  const handleCreateCardSubmit = async (cardData: {
    title: string;
    description?: string;
    columnId: string;
    priority: KanbanPriority;
    assigneeId: string;
    assigneeName: string;
    assigneeAvatar?: string;
    dueDate?: string;
    tags?: string[];
  }) => {
    if (!cardData.title.trim() || isSubmitting) return;

    const payload = {
      title: cardData.title.trim(),
      description: cardData.description || '',
      columnId: cardData.columnId,
      channelId: activeChannel.id,
      channelName: activeChannel.name,
      colonyId: activeColony?.id || 'anticeil',
      hubName: activeColony?.name || 'Komunitas',
      assigneeId: cardData.assigneeId,
      assigneeName: cardData.assigneeName,
      assigneeAvatar: cardData.assigneeAvatar || null,
      priority: cardData.priority,
      dueDate: cardData.dueDate,
      tags: cardData.tags || [],
    };

    setIsSubmitting(true);
    try {
      const created = await assignmentsApi.createAssignment(payload);
      const newCard: KanbanCard = {
        ...payload,
        id: created.id || `card-${Date.now()}`,
        createdAt: dayjs().toISOString(),
        completedAt: cardData.columnId === 'done' ? dayjs().toISOString() : undefined,
      };
      const updated = [newCard, ...cards];
      setCards(updated);
      onCardsUpdate?.(updated);
      setIsAddCardOpen(false);
      toast.success('Kartu tugas berhasil disimpan ke database! 🎉');
    } catch (err) {
      toast.error('Gagal menyimpan kartu ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className={cn('h-12 border-b border-border flex items-center justify-between shrink-0 bg-background z-10', horizontalPadding)}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden sidebar-toggle-btn h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
            title="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Columns3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              #{activeChannel.name}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                Kanban Board
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden xs:block">
              {activeChannel.description || 'Papan kerja kolaboratif untuk manajemen tugas tim'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              setTargetColumnId('todo');
              setIsAddCardOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Kartu</span>
            <span className="sm:hidden">Kartu</span>
          </Button>
        </div>
      </div>

      {/* ── Subheader Filters ─────────────────────────────────────── */}
      <div className={cn('py-2.5 border-b border-border/50 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-muted/20', horizontalPadding)}>
        <div className="relative flex-1 max-w-xs min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kartu tugas atau tag..."
            className="h-8 pl-8 text-xs bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">
            Prioritas:
          </span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'urgent', label: 'Urgent' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPriorityFilter(p.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border',
                priorityFilter === p.id
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kanban Columns Board ──────────────────────────────────── */}
      <div className={cn('flex-1 min-h-0 overflow-x-auto overflow-y-hidden py-4 sm:py-6 [scrollbar-width:thin]', horizontalPadding)}>
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-medium">Memuat kartu tugas dari database...</span>
          </div>
        ) : (
          (() => {
            const visibleColumns = DEFAULT_COLUMNS.filter((col) =>
              filteredCards.some((c) => c.columnId === col.id),
            );

            if (visibleColumns.length === 0) {
              return (
                <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Columns3 className="w-10 h-10 stroke-1 opacity-50" />
                  <span className="text-sm font-medium">Belum ada daftar kartu di board ini.</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setTargetColumnId('todo');
                      setIsAddCardOpen(true);
                    }}
                    className="gap-1.5 text-xs h-8 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Kartu Pertama
                  </Button>
                </div>
              );
            }

            return (
              <div className="flex gap-4 h-full min-w-max items-start">
                {visibleColumns.map((col) => {
                  const columnCards = filteredCards.filter((c) => c.columnId === col.id);

                  return (
                    <div
                      key={col.id}
                      className="w-72 sm:w-80 h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-xs shrink-0"
                    >
                {/* Column Header */}
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{col.title}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', col.color)}>
                      {columnCards.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTargetColumnId(col.id);
                      setIsAddCardOpen(true);
                    }}
                    className="size-6 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 [scrollbar-width:thin]">
                  {columnCards.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center p-3 text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                      <p className="text-xs">Belum ada kartu di kolom ini</p>
                    </div>
                  ) : (
                    columnCards.map((card) => {
                      const isOverdue =
                        card.dueDate &&
                        dayjs(card.dueDate).isBefore(dayjs(), 'day') &&
                        card.columnId !== 'done';

                      return (
                        <div
                          key={card.id}
                          className="p-3 bg-background hover:bg-muted/40 border border-border/80 rounded-lg shadow-2xs transition-all flex flex-col gap-2 group relative"
                        >
                          {/* Priority Pill & Due Date */}
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                                card.priority === 'urgent'
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : card.priority === 'high'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : card.priority === 'medium'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-muted text-muted-foreground border border-border'
                              )}
                            >
                              {card.priority}
                            </span>

                            {card.dueDate && (
                              <div
                                className={cn(
                                  'flex items-center gap-1 text-[10px] font-medium',
                                  isOverdue ? 'text-red-400 font-bold' : 'text-muted-foreground'
                                )}
                              >
                                {isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{dayjs(card.dueDate).format('DD MMM')}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Title */}
                          <h4 className="text-xs font-bold text-foreground leading-snug">
                            {card.title}
                          </h4>

                          {/* Description */}
                          {card.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {card.description}
                            </p>
                          )}

                          {/* Tags */}
                          {card.tags && card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {card.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                                >
                                  <Tag className="w-2 h-2" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: Assignee & Move Action buttons */}
                          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CommunityAvatar
                                name={card.assigneeName || 'Member'}
                                imageUrl={card.assigneeAvatar}
                                size={20}
                              />
                              <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                                {card.assigneeName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {col.id !== 'todo' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveCard(card.id, 'left')}
                                  title="Pindah ke kolom sebelumnya"
                                  className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </Button>
                              )}
                              {col.id !== 'done' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveCard(card.id, 'right')}
                                  title="Pindah ke kolom berikutnya"
                                  className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCard(card.id)}
                                title="Hapus kartu"
                                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        );
      })()
    )}
      </div>

      {/* ── Dialog Tambah Kartu Baru ──────────────────────────────── */}
      <KanbanCardDialog
        isOpen={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        channelName={activeChannel.name}
        defaultColumnId={targetColumnId}
        displayMembers={displayMembers}
        currentUser={currentUser}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateCardSubmit}
      />
    </div>
  );
}