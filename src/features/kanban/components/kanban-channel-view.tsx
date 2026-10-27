import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { KanbanCard, KanbanColumn, KanbanPriority } from '../types';
import type { CommunityChannel, CommunityHub, CommunityMember } from '@/chat/chat-types';
import { toast } from 'sonner';

export interface KanbanChannelViewProps {
  activeChannel: CommunityChannel;
  activeHub: CommunityHub | null;
  displayMembers: CommunityMember[];
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
  activeHub,
  displayMembers,
  currentUser,
  onOpenSidebar,
  horizontalPadding = 'px-4 sm:px-6',
  onCardsUpdate,
}: KanbanChannelViewProps) {
  const storageKey = `anticeil_kanban_${activeChannel.id}`;

  const [cards, setCards] = useState<KanbanCard[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default mock cards for initial kanban channel
    const currentUserName = currentUser?.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : 'Anda';

    return [
      {
        id: `card-1-${activeChannel.id}`,
        title: 'Desain Wireframe UI Kalender & Assignments',
        description: 'Buat komponen antarmuka responsif untuk kalender dan rekap tugas personal.',
        columnId: 'done',
        channelId: activeChannel.id,
        channelName: activeChannel.name,
        hubId: activeHub?.id || 'anticeil',
        hubName: activeHub?.name || 'Anticeil',
        assigneeId: currentUser?.id || 'current-user',
        assigneeName: currentUserName,
        assigneeAvatar: currentUser?.avatar || null,
        priority: 'high',
        dueDate: dayjs().format('YYYY-MM-DD'),
        tags: ['Design', 'UI/UX'],
        createdAt: dayjs().toISOString(),
        completedAt: dayjs().toISOString(),
      },
      {
        id: `card-2-${activeChannel.id}`,
        title: 'Integrasikan Kanban Board dengan Kalender',
        description: 'Pastikan deadline tugas yang diassign otomatis tampil di agenda meeting dan kalender.',
        columnId: 'in_progress',
        channelId: activeChannel.id,
        channelName: activeChannel.name,
        hubId: activeHub?.id || 'anticeil',
        hubName: activeHub?.name || 'Anticeil',
        assigneeId: currentUser?.id || 'current-user',
        assigneeName: currentUserName,
        assigneeAvatar: currentUser?.avatar || null,
        priority: 'urgent',
        dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        tags: ['Feature', 'Sync'],
        createdAt: dayjs().toISOString(),
      },
      {
        id: `card-3-${activeChannel.id}`,
        title: 'Testing sinkronisasi video YouTube Watch Together',
        description: 'Uji pemutaran video bersama, pause realtime, dan reconnect member.',
        columnId: 'todo',
        channelId: activeChannel.id,
        channelName: activeChannel.name,
        hubId: activeHub?.id || 'anticeil',
        hubName: activeHub?.name || 'Anticeil',
        assigneeId: displayMembers[0]?.id,
        assigneeName: displayMembers[0]?.name || 'Member',
        assigneeAvatar: displayMembers[0]?.avatar,
        priority: 'medium',
        dueDate: dayjs().add(4, 'day').format('YYYY-MM-DD'),
        tags: ['QA', 'Testing'],
        createdAt: dayjs().toISOString(),
      },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('todo');

  // New card modal state
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPriority, setCardPriority] = useState<KanbanPriority>('medium');
  const [cardAssigneeId, setCardAssigneeId] = useState(currentUser?.id || '');
  const [cardDueDate, setCardDueDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DD'));
  const [cardTags, setCardTags] = useState('');

  // Persist to localStorage & notify parent
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cards));
      onCardsUpdate?.(cards);
    } catch {}
  }, [cards, storageKey]);

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.tags && card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleMoveCard = (cardId: string, direction: 'left' | 'right') => {
    const colOrder = ['todo', 'in_progress', 'review', 'done'];
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const currentIndex = colOrder.indexOf(c.columnId);
        const nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= colOrder.length) return c;
        const newCol = colOrder[nextIndex];
        return {
          ...c,
          columnId: newCol,
          completedAt: newCol === 'done' ? dayjs().toISOString() : undefined,
        };
      })
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    toast.success('Kartu tugas berhasil dihapus');
  };

  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

    const assignee = displayMembers.find((m) => m.id === cardAssigneeId) || {
      id: currentUser?.id || 'anon',
      name: currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : 'Anda',
      avatar: currentUser?.avatar || null,
    };

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      title: cardTitle.trim(),
      description: cardDesc.trim() || undefined,
      columnId: targetColumnId,
      channelId: activeChannel.id,
      channelName: activeChannel.name,
      hubId: activeHub?.id || 'anticeil',
      hubName: activeHub?.name || 'Komunitas',
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeAvatar: assignee.avatar,
      priority: cardPriority,
      dueDate: cardDueDate || undefined,
      tags: cardTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: dayjs().toISOString(),
      completedAt: targetColumnId === 'done' ? dayjs().toISOString() : undefined,
    };

    setCards((prev) => [newCard, ...prev]);
    setCardTitle('');
    setCardDesc('');
    setCardTags('');
    setIsAddCardOpen(false);
    toast.success('Kartu tugas baru berhasil ditambahkan');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className={cn('h-14 border-b border-border flex items-center justify-between shrink-0 bg-card/60 backdrop-blur-md z-10', horizontalPadding)}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
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
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-4 sm:p-6 [scrollbar-width:thin]">
        <div className="flex gap-4 h-full min-w-max items-start">
          {DEFAULT_COLUMNS.map((col) => {
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
      </div>

      {/* ── Dialog Tambah Kartu Baru ──────────────────────────────── */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-card border-border text-foreground rounded-2xl shadow-2xl">
          <form onSubmit={handleCreateCardSubmit} className="flex flex-col">
            <div className="p-5 pb-3 border-b border-border">
              <DialogTitle className="text-base font-bold text-foreground">
                Tambah Kartu Tugas
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tambahkan tugas baru ke papan #{activeChannel.name}
              </p>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto [scrollbar-width:thin]">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Judul Tugas *
                </label>
                <Input
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="Contoh: Implementasi sistem autentikasi Google"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Deskripsi Tugas
                </label>
                <textarea
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  placeholder="Detail instruksi atau rincian pekerjaan..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Kolom Status
                  </label>
                  <select
                    value={targetColumnId}
                    onChange={(e) => setTargetColumnId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {DEFAULT_COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={cardPriority}
                    onChange={(e) => setCardPriority(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Penerima Tugas (Assignee)
                  </label>
                  <select
                    value={cardAssigneeId}
                    onChange={(e) => setCardAssigneeId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={currentUser?.id || 'current-user'}>
                      {currentUser?.firstName || 'Saya Sendiri'}
                    </option>
                    {displayMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Tenggat Waktu (Due Date)
                  </label>
                  <Input
                    type="date"
                    value={cardDueDate}
                    onChange={(e) => setCardDueDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Label / Tag (Pisahkan dengan koma)
                </label>
                <Input
                  value={cardTags}
                  onChange={(e) => setCardTags(e.target.value)}
                  placeholder="Frontend, Bug, Priority"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddCardOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Simpan Kartu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
