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
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
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
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
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
  horizontalPadding?: string;
}

export function CalendarView({
  events: initialEvents,
  colonies,
  channels,
  onJoinChannel,
  onOpenSidebar,
  onCreateEvent,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterType, setFilterType] = useState<CalendarFilterType>('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);



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

            {/* Theme Primary Button: Jadwalkan Meeting */}
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

        {/* Right side filter: Desktop pills & Mobile/Tablet dropdown */}
        <div className="flex items-center gap-1 shrink-0">
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
        </div>
      </div>

      {/* ── Main Content Area: Month Grid vs Agenda List ────────────── */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] py-4 sm:py-6', horizontalPadding)}>
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
          <div className="w-full space-y-4">
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
      <CalendarScheduleDialog
        isOpen={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        colonies={colonies}
        channels={channels}
        onCreateEvent={onCreateEvent}
      />
    </div>
  );
}