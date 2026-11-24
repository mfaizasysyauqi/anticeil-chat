import React, { useState } from 'react';
import {
  Backpack,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Menu,
  Tag,
  ArrowRight,
  Filter,
  Trash2,
  Pencil,
} from 'lucide-react';
import dayjs from 'dayjs';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { InboxPopover } from '@/features/inbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING, LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { AssignmentItem, AssignmentTab } from '../types';
import type { Colony } from '@/chat/chat-types';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface AssignmentsViewProps {
  assignments: AssignmentItem[];
  colonies: Colony[];
  onOpenBoard?: (colonyId: string, channelId: string) => void;
  onToggleComplete?: (assignmentId: string, isCompleted: boolean) => void;
  onUpdateAssignment?: (assignmentId: string, updates: Partial<AssignmentItem>) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
}

export function AssignmentsView({
  assignments,
  colonies,
  onOpenBoard,
  onToggleComplete,
  onUpdateAssignment,
  onDeleteAssignment,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: AssignmentsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AssignmentTab>('assigned_to_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColonyFilter, setSelectedColonyFilter] = useState('all');

  // Edit task dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AssignmentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editColumnId, setEditColumnId] = useState<'todo' | 'in_progress' | 'review' | 'done'>('todo');
  const [editDueDate, setEditDueDate] = useState('');

  const now = dayjs();

  const handleOpenEdit = (item: AssignmentItem) => {
    setEditingTask(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPriority(item.priority || 'medium');
    setEditColumnId((item.columnId as any) || 'todo');
    setEditDueDate(item.dueDate ? dayjs(item.dueDate).format('YYYY-MM-DD') : '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    onUpdateAssignment?.(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      columnId: editColumnId,
      dueDate: editDueDate || undefined,
    });

    setIsEditDialogOpen(false);
    setEditingTask(null);
    toast.success('Tugas berhasil diperbarui!');
  };

  const filteredList = assignments.filter((item) => {
    // Search
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.channelName && item.channelName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Hub filter
    const matchesHub = selectedColonyFilter === 'all' || item.colonyId === selectedColonyFilter;

    if (!matchesSearch || !matchesHub) return false;

    // Filter out orphan assignments if colony list is provided and colony was deleted
    if (colonies && colonies.length > 0 && item.colonyId && item.colonyId !== 'anticeil') {
      const colonyExists = colonies.some((c) => c.id === item.colonyId);
      if (!colonyExists) return false;
    }

    const isDone = item.columnId === 'done';
    const isOverdue = item.dueDate && dayjs(item.dueDate).isBefore(now, 'day') && !isDone;

    if (activeTab === 'completed') return isDone;
    if (activeTab === 'overdue') return isOverdue;
    if (activeTab === 'upcoming') {
      return !isDone && item.dueDate && dayjs(item.dueDate).isAfter(now, 'day');
    }
    // assigned_to_me (active / not done)
    return !isDone;
  });

  const handleToggle = (item: AssignmentItem) => {
    const isCurrentlyDone = item.columnId === 'done';
    const willBeDone = !isCurrentlyDone;

    if (willBeDone) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
      toast.success('Tugas ditandai selesai! 🎉');
    }

    onToggleComplete?.(item.id, willBeDone);
  };

  const totalActive = assignments.filter((a) => a.columnId !== 'done').length;
  const totalDone = assignments.filter((a) => a.columnId === 'done').length;
  const totalOverdue = assignments.filter(
    (a) => a.columnId !== 'done' && a.dueDate && dayjs(a.dueDate).isBefore(now, 'day')
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Discord Style Single App Bar (h-12) ─────────────────────────── */}
      <div className={cn('sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden', horizontalPadding)}>
        <SidebarNavToggle onClick={onOpenSidebar} />

        {/* Tab Pills */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none">
            {[
              { id: 'assigned_to_me', label: 'Perlu Dikerjakan', count: totalActive },
              { id: 'upcoming', label: 'Mendatang' },
              { id: 'overdue', label: 'Terlewat', count: totalOverdue, isDanger: totalOverdue > 0 },
              { id: 'completed', label: 'Selesai', count: totalDone },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
                    active
                      ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full',
                        tab.isDanger
                          ? 'bg-red-500 text-white'
                          : active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        {/* Hub Filter & Search (Server Filter on Left, Search on Far Right) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Select
            value={selectedColonyFilter}
            onValueChange={setSelectedColonyFilter}
          >
            <SelectTrigger
              size="xs"
              className="h-7 w-24 sm:w-28 md:w-32 lg:w-36 text-xs bg-muted/40 border-sidebar-border"
            >
              <SelectValue placeholder={t('Semua Colony')} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">{t('Semua Colony')}</SelectItem>
              {colonies.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari tugas..."
            inputWidth="w-32 sm:w-40 md:w-48"
          />
        </div>
      </div>

      {/* ── Task Items List ────────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, verticalPadding)}>
        <div className="w-full space-y-3">
          {filteredList.length === 0 ? (
            <EmptyState
              media={
                <img
                  src="/atlas-tasks-empty.png"
                  alt="Tidak ada tugas"
                  className="h-36 sm:h-44 md:h-48 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] select-none pointer-events-none mb-1 animate-in fade-in zoom-in-95 duration-300"
                  loading="lazy"
                />
              }
              title={
                activeTab === 'completed'
                  ? 'Belum ada tugas yang selesai'
                  : activeTab === 'overdue'
                  ? 'Hebat! Tidak ada tugas yang terlewat'
                  : 'Tidak ada tugas yang perlu dikerjakan'
              }
              description="Tugas yang di-assign kepada Anda di channel Kanban colony komunitas akan otomatis terkumpul di halaman ini."
            />
          ) : (
            filteredList.map((item) => {
              const isDone = item.columnId === 'done';
              const isOverdue =
                item.dueDate && dayjs(item.dueDate).isBefore(now, 'day') && !isDone;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group',
                    isDone
                      ? 'bg-card/40 border-border/50 opacity-70'
                      : isOverdue
                      ? 'bg-card border-red-500/30 hover:border-red-500/60 shadow-xs'
                      : 'bg-card border-border hover:border-primary/50 shadow-xs'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                      title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 hover:stroke-primary" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={cn(
                            'text-sm font-bold text-foreground',
                            isDone && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            item.priority === 'urgent'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : item.priority === 'high'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : item.priority === 'medium'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-muted text-muted-foreground border border-border'
                          )}
                        >
                          {item.priority}
                        </span>

                        {/* Status Column Pill */}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                          {item.columnId === 'todo'
                            ? 'To Do'
                            : item.columnId === 'in_progress'
                            ? 'In Progress'
                            : item.columnId === 'review'
                            ? 'Review'
                            : 'Done'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                        {item.dueDate && (
                          <span
                            className={cn(
                              'flex items-center gap-1 font-medium',
                              isOverdue ? 'text-red-400 font-bold' : 'text-muted-foreground'
                            )}
                          >
                            {isOverdue && <AlertCircle className="w-3 h-3 text-red-400" />}
                            <Calendar className="w-3 h-3" />
                            <span>Tenggat: {dayjs(item.dueDate).format('DD MMMM YYYY')}</span>
                          </span>
                        )}

                        {item.hubName && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-foreground/80">
                              {item.hubName}
                            </span>
                          </>
                        )}

                        {item.channelName && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground">
                              #{item.channelName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Buka di Papan, Edit, Delete */}
                  <div className="flex items-center gap-1.5 justify-end shrink-0 pl-8 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenBoard?.(item.colonyId, item.channelId)}
                      className="h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      <span>Buka di Papan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>

                    {onUpdateAssignment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
                        title="Edit Tugas"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    )}

                    {onDeleteAssignment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onDeleteAssignment(item.id);
                        }}
                        className="h-8 px-2.5 text-xs text-rose-500 hover:text-rose-400 hover:border-rose-500/50 cursor-pointer gap-1.5"
                        title="Hapus tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
      </ScrollArea>

      {/* ── Edit Task Dialog ─────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Tugas</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbarui detail tugas papan Kanban ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Judul Tugas</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul tugas..."
                className="h-9 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Deskripsi</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Deskripsi tugas opsional..."
                rows={3}
                className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Status</label>
                <Select
                  value={editColumnId}
                  onValueChange={(val: any) => setEditColumnId(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/40 border-border">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Prioritas</label>
                <Select
                  value={editPriority}
                  onValueChange={(val: any) => setEditPriority(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/40 border-border">
                    <SelectValue placeholder="Pilih prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Tenggat Waktu</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="h-9 text-xs bg-muted/40 border-border text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editTitle.trim()}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
