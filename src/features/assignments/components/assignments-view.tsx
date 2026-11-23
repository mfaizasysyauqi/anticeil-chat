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
} from 'lucide-react';
import dayjs from 'dayjs';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { toast } from 'sonner';

export interface AssignmentsViewProps {
  assignments: AssignmentItem[];
  colonies: Colony[];
  onOpenBoard?: (colonyId: string, channelId: string) => void;
  onToggleComplete?: (assignmentId: string, isCompleted: boolean) => void;
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
  onDeleteAssignment,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: AssignmentsViewProps) {
  const [activeTab, setActiveTab] = useState<AssignmentTab>('assigned_to_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColonyFilter, setSelectedColonyFilter] = useState('all');

  const now = dayjs();

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
        <div className="flex items-center gap-2 shrink-0">
          <SidebarNavToggle onClick={onOpenSidebar} />

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Backpack className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Tugas Saya</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Tab Pills */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none px-1">
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
              <SelectValue placeholder="Semua Colony" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Semua Server</SelectItem>
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
              icon={<Backpack className="w-8 h-8 stroke-[1.8] text-primary/80" />}
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

                  {/* Open in Board & Delete Actions */}
                  <div className="flex items-center gap-1.5 justify-end shrink-0 pl-8 sm:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenBoard?.(item.colonyId, item.channelId)}
                      className="h-7 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      <span>Buka di Papan</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>

                    {onDeleteAssignment && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onDeleteAssignment(item.id);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                        title="Hapus tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
