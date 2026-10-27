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
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CalendarEvent, CalendarViewMode, CalendarFilterType } from '../types';
import type { CommunityHub, CommunityChannel } from '@/chat/chat-types';

export interface CalendarViewProps {
  events: CalendarEvent[];
  hubs: CommunityHub[];
  channels: CommunityChannel[];
  onJoinChannel?: (channelId: string) => void;
  onOpenSidebar: () => void;
  onCreateEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  horizontalPadding?: string;
}

export function CalendarView({
  events: initialEvents,
  hubs,
  channels,
  onJoinChannel,
  onOpenSidebar,
  onCreateEvent,
  horizontalPadding = 'px-4 sm:px-6',
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterType, setFilterType] = useState<CalendarFilterType>('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'meeting' | 'task' | 'activity'>('meeting');
  const [newDate, setNewDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [newTime, setNewTime] = useState('14:00');
  const [selectedHubId, setSelectedHubId] = useState(hubs[0]?.id || 'anticeil');
  const [selectedChannelId, setSelectedChannelId] = useState('');

  const voiceChannels = channels.filter(
    (c) => (c.hubId || 'anticeil') === selectedHubId && c.type === 'voice'
  );

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hub = hubs.find((h) => h.id === selectedHubId);
    const channel = channels.find((c) => c.id === selectedChannelId);

    const startDateTime = `${newDate}T${newTime}:00`;

    onCreateEvent?.({
      title: newTitle.trim(),
      description: newDescription.trim(),
      type: newType,
      startTime: startDateTime,
      hubId: selectedHubId,
      hubName: hub?.name || 'Komunitas Anticeil',
      channelId: selectedChannelId || undefined,
      channelName: channel?.name || 'General Voice',
      status: 'scheduled',
    });

    setNewTitle('');
    setNewDescription('');
    setIsScheduleOpen(false);
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
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              Kalender & Jadwal
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                Teams + Meet
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden xs:block">
              Jadwal meeting panggilan suara, deadline tugas, dan aktivitas komunitas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer',
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Bulan
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer',
                viewMode === 'agenda'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Agenda
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jadwalkan Meeting</span>
            <span className="sm:hidden">Meeting</span>
          </Button>
        </div>
      </div>

      {/* ── Subheader Controls & Filters ────────────────────────────── */}
      <div className={cn('py-2.5 border-b border-border/50 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-muted/20', horizontalPadding)}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="size-7 rounded-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="size-7 rounded-md cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm font-bold text-foreground px-1">
            {currentDate.format('MMMM YYYY')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-7 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Hari Ini
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'meeting', label: 'Meeting & Voice' },
            { id: 'task', label: 'Tugas' },
            { id: 'activity', label: 'Aktivitas' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id as any)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border',
                filterType === pill.id
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area: Month Grid vs Agenda List ────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4 sm:p-6">
        {viewMode === 'month' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
            {/* Calendar Month Grid (Left 2 cols) */}
            <div className="lg:col-span-2 flex flex-col bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs">
              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-muted-foreground">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span className="text-amber-500/80">Sab</span>
                <span className="text-red-500/80">Min</span>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1">
                {days.map((item, idx) => {
                  const isSelected = item.dateStr === selectedDateStr;
                  const isToday = item.dateStr === dayjs().format('YYYY-MM-DD');
                  const dayEvents = filteredEvents.filter((e) =>
                    e.startTime.startsWith(item.dateStr)
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dayjs(item.dateStr))}
                      className={cn(
                        'min-h-[64px] sm:min-h-[82px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-2xs'
                          : item.isCurrentMonth
                          ? 'border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border'
                          : 'border-transparent bg-transparent opacity-40 hover:opacity-75',
                        isToday && !isSelected && 'border-primary/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-xs font-bold size-5 flex items-center justify-center rounded-full',
                            isToday
                              ? 'bg-primary text-primary-foreground font-extrabold'
                              : isSelected
                              ? 'text-primary font-bold'
                              : 'text-foreground'
                          )}
                        >
                          {item.dayNumber}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-mono font-semibold px-1 rounded bg-primary/20 text-primary">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Small Event Pills on desktop */}
                      <div className="space-y-1 mt-1 hidden sm:block">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'text-[10px] truncate px-1.5 py-0.5 rounded font-medium',
                              ev.type === 'meeting'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : ev.type === 'task'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            )}
                          >
                            {dayjs(ev.startTime).format('HH:mm')} {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-muted-foreground font-medium pl-1">
                            +{dayEvents.length - 2} lainnya
                          </div>
                        )}
                      </div>

                      {/* Dots on mobile */}
                      <div className="flex sm:hidden gap-1 mt-1">
                        {dayEvents.slice(0, 3).map((ev, dotIdx) => (
                          <div
                            key={dotIdx}
                            className={cn(
                              'size-1.5 rounded-full',
                              ev.type === 'meeting'
                                ? 'bg-blue-400'
                                : ev.type === 'task'
                                ? 'bg-amber-400'
                                : 'bg-purple-400'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Agenda (Right Col) */}
            <div className="flex flex-col bg-card border border-border rounded-xl p-4 shadow-xs">
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
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                    <CalendarIcon className="w-8 h-8 stroke-1 mb-2 opacity-50" />
                    <p className="text-xs font-medium">Tidak ada jadwal pada tanggal ini</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Klik "Jadwalkan Meeting" untuk menambahkan jadwal baru.
                    </p>
                  </div>
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
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                Semua Agenda Mendatang ({filteredEvents.length})
              </h2>
            </div>

            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl">
                  <CalendarIcon className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada agenda meeting atau tugas</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Jadwalkan rapat komunitas atau buat tugas di Kanban channel.
                  </p>
                </div>
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

                    {ev.type === 'meeting' && ev.channelId && (
                      <Button
                        size="sm"
                        onClick={() => onJoinChannel?.(ev.channelId!)}
                        className="h-8 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5 mr-1.5" />
                        Gabung Call
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog Jadwalkan Meeting Baru ─────────────────────────── */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border text-foreground rounded-2xl shadow-2xl">
          <form onSubmit={handleCreateSubmit} className="flex flex-col">
            <div className="p-5 pb-3 border-b border-border">
              <DialogTitle className="text-base font-bold text-foreground">
                Jadwalkan Meeting Baru
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rencanakan panggilan suara atau pertemuan komunitas dengan rekan tim
              </p>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto [scrollbar-width:thin]">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Judul Acara / Meeting *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Sprint Planning Minggu 4"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Tanggal
                  </label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Waktu (WIB)
                  </label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Pilih Server / Komunitas
                  </label>
                  <select
                    value={selectedHubId}
                    onChange={(e) => {
                      setSelectedHubId(e.target.value);
                      setSelectedChannelId('');
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Saluran Suara (Voice)
                  </label>
                  <select
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Pilih Saluran...</option>
                    {voiceChannels.map((c) => (
                      <option key={c.id} value={c.id}>
                        🔊 {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Deskripsi / Agenda Pembahasan
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tuliskan topik agenda meeting yang akan dibahas..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Simpan Jadwal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
