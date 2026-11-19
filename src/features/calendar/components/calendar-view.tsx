import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  CheckSquare,
  Clock,
  Sparkles,
  Menu,
  Users,
  Compass,
  Filter,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { TopBarActionButton } from '@/components/ui/top-bar-action-button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING } from '@/lib/layout-constants';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CalendarEvent, CalendarViewMode, CalendarFilterType } from '../types';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import { CalendarMonthGrid } from './calendar-month-grid';
import { CalendarScheduleDialog } from './calendar-schedule-dialog';

export interface CalendarViewProps {
  events: CalendarEvent[];
  colonies: Colony[];
  channels: ColonyChannel[];
  onJoinChannel?: (channelId: string) => void;
  onOpenSidebar: () => void;
  onCreateEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent?: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent?: (id: string) => void;
  horizontalPadding?: string;
  verticalPadding?: string;
}

export function CalendarView({
  events: initialEvents,
  colonies,
  channels,
  onJoinChannel,
  onOpenSidebar,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterType, setFilterType] = useState<CalendarFilterType>('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'meeting' | 'task' | 'activity'>('meeting');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('14:00');

  const handleOpenEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title || '');
    setEditDescription(ev.description || '');
    setEditType((ev.type as any) || 'meeting');
    const d = ev.startTime ? dayjs(ev.startTime) : dayjs();
    setEditDate(d.format('YYYY-MM-DD'));
    setEditTime(d.format('HH:mm'));
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle.trim()) return;
    onUpdateEvent?.(editingEvent.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      type: editType,
      startTime: `${editDate}T${editTime}:00`,
    });
    setIsEditDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Hapus agenda "${title}"?`)) {
      onDeleteEvent?.(id);
    }
  };



  const filteredEvents = initialEvents.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.type === filterType;
  });

  // Calendar calculations
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const startDayOfWeek = (startOfMonth.day() + 6) % 7; // Monday = 0

  const days: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Previous month padding days
  const prevMonth = currentDate.subtract(1, 'month');
  const prevMonthDays = prevMonth.daysInMonth();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    days.push({
      dayNumber: d,
      dateStr: prevMonth.date(d).format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      dayNumber: d,
      dateStr: currentDate.date(d).format('YYYY-MM-DD'),
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingDays = (7 - (days.length % 7)) % 7;
  const nextMonth = currentDate.add(1, 'month');
  for (let d = 1; d <= remainingDays; d++) {
    days.push({
      dayNumber: d,
      dateStr: nextMonth.date(d).format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const selectedDayEvents = filteredEvents.filter((ev) =>
    ev.startTime.startsWith(selectedDateStr)
  );

  const handlePrevMonth = () => setCurrentDate((prev) => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate((prev) => prev.add(1, 'month'));
  const handleToday = () => {
    const now = dayjs();
    setCurrentDate(now);
    setSelectedDate(now);
  };



  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar: Discord Style (100% Match to Teman & Permintaan Pesan) ── */}
      <div
        className={cn(
          'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile burger menu: Fixed non-scrollable */}
          {onOpenSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
              title="Buka Menu Sidebar"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Kalender</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] px-1">

          {/* Mode Tabs: Bulan & Agenda */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
                viewMode === 'month'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>Bulan</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
                viewMode === 'agenda'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>Agenda</span>
              {filteredEvents.length > 0 && (
                <span className="text-[10px] text-muted-foreground/70">({filteredEvents.length})</span>
              )}
            </button>
          </div>

          {viewMode === 'month' && (
            <>
              <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />
              {/* Month switcher navigation */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handlePrevMonth}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-bold text-foreground px-1 whitespace-nowrap">
                  {currentDate.format('MMM YYYY')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNextMonth}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleToday}
                  className="hidden sm:inline-flex text-[11px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 h-6 rounded hover:bg-muted ml-0.5"
                >
                  Hari Ini
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right side: Filters & FAR RIGHT Action Button (+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'meeting', label: 'Meeting' },
              { id: 'task', label: 'Tugas' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilterType(pill.id as any)}
                className={cn(
                  'px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer',
                  filterType === pill.id
                    ? 'bg-muted text-foreground font-bold'
                    : 'text-muted-foreground/80 hover:text-foreground'
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Mobile & Tablet Dropdown (Icon button only on mobile & tablet) */}
          <div className="flex lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-xs"
                  className={cn(
                    'h-7 w-7 text-xs font-semibold bg-muted/40 border-sidebar-border hover:bg-muted text-foreground p-0 flex items-center justify-center relative cursor-pointer',
                    filterType !== 'all' && 'border-primary/50 text-primary bg-primary/10'
                  )}
                  title={filterType === 'all' ? 'Filter Jadwal: Semua' : `Filter: ${filterType}`}
                  aria-label="Filter Jadwal"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {filterType !== 'all' && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'meeting', label: 'Meeting' },
                  { id: 'task', label: 'Tugas' },
                ].map((pill) => (
                  <DropdownMenuItem
                    key={pill.id}
                    onClick={() => setFilterType(pill.id as any)}
                    className={cn(
                      'flex items-center justify-between text-xs',
                      filterType === pill.id && 'font-bold text-primary bg-primary/10'
                    )}
                  >
                    <span>{pill.label}</span>
                    {filterType === pill.id && <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Primary Theme Action Button: Jadwalkan Meeting placed at FAR RIGHT */}
          <TopBarActionButton
            onClick={() => setIsScheduleOpen(true)}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            label="Jadwalkan Meeting"
            shortLabel="Meeting"
            iconOnlyTablet={true}
            title="Jadwalkan Meeting"
            aria-label="Jadwalkan Meeting"
          />
        </div>
      </div>

      {/* ── Main Content Area: Month Grid vs Agenda List ────────────── */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none lg:[scrollbar-width:thin]', horizontalPadding, verticalPadding)}>
        {viewMode === 'month' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
            {/* Calendar Month Grid (Left 2 cols) */}
            <CalendarMonthGrid
              days={days}
              selectedDateStr={selectedDateStr}
              filteredEvents={filteredEvents}
              onSelectDate={setSelectedDate}
            />

            {/* Selected Day Agenda (Right Col) */}
            <div className="flex flex-col bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {selectedDate.format('dddd, D MMMM YYYY')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedDayEvents.length} jadwal tercatat
                  </p>
                </div>
                {selectedDate.isSame(dayjs(), 'day') && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Hari Ini
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 [scrollbar-width:thin]">
                {selectedDayEvents.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<CalendarIcon className="w-6 h-6 stroke-[1.8] text-primary/80" />}
                    title="Tidak ada jadwal pada tanggal ini"
                    description="Klik Jadwalkan Meeting untuk menambahkan jadwal baru."
                  />
                ) : (
                  selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/50 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-7 rounded-md flex items-center justify-center shrink-0',
                              ev.type === 'meeting'
                                ? 'bg-blue-500/15 text-blue-400'
                                : ev.type === 'task'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-purple-500/15 text-purple-400'
                            )}
                          >
                            {ev.type === 'meeting' ? (
                              <Video className="w-3.5 h-3.5" />
                            ) : ev.type === 'task' ? (
                              <CheckSquare className="w-3.5 h-3.5" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-foreground line-clamp-1">
                              {ev.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{dayjs(ev.startTime).format('HH:mm')} WIB</span>
                              {ev.hubName && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{ev.hubName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {ev.type === 'meeting' && ev.channelId && (
                          <Button
                            size="sm"
                            onClick={() => onJoinChannel?.(ev.channelId!)}
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-xs"
                          >
                            Gabung Call
                          </Button>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-muted-foreground/90 bg-background/50 p-2 rounded border border-border/40">
                          {ev.description}
                        </p>
                      )}

                      {ev.attendees && ev.attendees.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>Peserta:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {ev.attendees.map((att) => (
                              <CommunityAvatar
                                key={att.id}
                                name={att.name}
                                imageUrl={att.avatar}
                                size={20}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Agenda / List Mode */
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                Semua Agenda Mendatang ({filteredEvents.length})
              </h2>
            </div>

            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="w-8 h-8 stroke-[1.8] text-primary/80" />}
                  title="Belum ada agenda meeting atau tugas"
                  description="Jadwalkan rapat komunitas atau buat tugas di Kanban channel."
                />
              ) : (
                filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'size-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          ev.type === 'meeting'
                            ? 'bg-blue-500/15 text-blue-400'
                            : ev.type === 'task'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-purple-500/15 text-purple-400'
                        )}
                      >
                        {ev.type === 'meeting' ? (
                          <Video className="w-5 h-5" />
                        ) : ev.type === 'task' ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Compass className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{ev.title}</h3>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                              ev.type === 'meeting'
                                ? 'bg-blue-500/15 text-blue-400'
                                : ev.type === 'task'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-purple-500/15 text-purple-400'
                            )}
                          >
                            {ev.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">
                            {dayjs(ev.startTime).format('dddd, D MMMM YYYY - HH:mm')} WIB
                          </span>
                          {ev.hubName && (
                            <>
                              <span>•</span>
                              <span>{ev.hubName}</span>
                            </>
                          )}
                          {ev.channelName && (
                            <>
                              <span>•</span>
                              <span className="font-medium">#{ev.channelName}</span>
                            </>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {ev.type === 'meeting' && ev.channelId && (
                        <Button
                          size="sm"
                          onClick={() => onJoinChannel?.(ev.channelId!)}
                          className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5 mr-1.5" />
                          Gabung Call
                        </Button>
                      )}
                      {onUpdateEvent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(ev)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit Agenda"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {onDeleteEvent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(ev.id, ev.title)}
                          className="h-8 px-2.5 text-xs text-rose-500 hover:text-rose-400 hover:border-rose-500/50 cursor-pointer"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog Jadwalkan Meeting Baru ─────────────────────────── */}
      <CalendarScheduleDialog
        isOpen={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        colonies={colonies}
        channels={channels}
        onCreateEvent={onCreateEvent}
      />

      {/* ── Dialog Edit Agenda ─────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 bg-card border-border text-foreground">
          <DialogTitle className="text-lg font-bold text-foreground">Edit Agenda</DialogTitle>
          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul Agenda</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Contoh: Rapat Mingguan Developer"
                className="bg-muted/40 border-border"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Tipe Agenda</label>
              <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                <SelectTrigger className="bg-muted/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Video Call / Meeting</SelectItem>
                  <SelectItem value="task">Tugas / Task</SelectItem>
                  <SelectItem value="activity">Aktivitas / Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tanggal</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-muted/40 border-border text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Waktu (WIB)</label>
                <Input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="bg-muted/40 border-border text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Deskripsi (Opsional)</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Tuliskan catatan singkat..."
                className="bg-muted/40 border-border text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs font-bold bg-primary text-primary-foreground">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}