import React from 'react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '../types';

export interface CalendarMonthGridProps {
  days: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }>;
  selectedDateStr: string;
  filteredEvents: CalendarEvent[];
  onSelectDate: (date: dayjs.Dayjs) => void;
}

export function CalendarMonthGrid({
  days,
  selectedDateStr,
  filteredEvents,
  onSelectDate,
}: CalendarMonthGridProps) {
  const todayStr = dayjs().format('YYYY-MM-DD');

  return (
    <div className="lg:col-span-2 flex flex-col bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs lg:h-full min-h-0 relative overflow-hidden">
      {/* Day Headers (Mon - Sun) */}
      <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-muted-foreground shrink-0 relative z-20">
        <span>Sen</span>
        <span>Sel</span>
        <span>Rab</span>
        <span>Kam</span>
        <span>Jum</span>
        <span className="text-amber-500/80">Sab</span>
        <span className="text-red-500/80">Min</span>
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 auto-rows-fr [grid-auto-rows:1fr] min-h-0 relative">
        {days.map((item, idx) => {
          const isSelected = item.dateStr === selectedDateStr;
          const isToday = item.dateStr === todayStr;
          const dayEvents = filteredEvents.filter((e) =>
            e.startTime.startsWith(item.dateStr)
          );

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(dayjs(item.dateStr))}
              className={cn(
                'min-h-[64px] sm:min-h-[82px] h-full p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-2xs'
                  : item.isCurrentMonth
                  ? 'border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border'
                  : 'border-transparent bg-transparent opacity-40 hover:opacity-75',
                isToday && !isSelected && 'border-primary/40'
              )}
            >
              <div className="flex items-center justify-between shrink-0 relative z-20">
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
              <div className="space-y-1 mt-1 hidden sm:block flex-1 overflow-hidden relative z-20">
                {dayEvents.slice(0, 3).map((ev) => (
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
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-muted-foreground font-medium pl-1">
                    +{dayEvents.length - 3} lainnya
                  </div>
                )}
              </div>

              {/* Dots on mobile */}
              <div className="flex sm:hidden gap-1 mt-1 relative z-20">
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
  );
}
