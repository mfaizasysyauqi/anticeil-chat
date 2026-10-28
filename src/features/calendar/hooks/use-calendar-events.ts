import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CalendarEvent } from '../types';
import { calendarApi } from '../api/calendar-api';

export function useCalendarEvents(initialData: CalendarEvent[] = []) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await calendarApi.getCalendarEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch {
      // Keep optimistic
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      const created = await calendarApi.createCalendarEvent(eventData);
      if (created && created.id) {
        setEvents((prev) => [created, ...prev]);
        toast.success(`Jadwal "${created.title}" berhasil dibuat!`);
        return created;
      }
    } catch {
      toast.error('Gagal membuat jadwal baru.');
    }
    return null;
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await calendarApi.deleteCalendarEvent(id);
      toast.success('Jadwal berhasil dihapus.');
    } catch {
      // Ignored
    }
  };

  return {
    events,
    setEvents,
    isLoading,
    handleCreateEvent,
    handleDeleteEvent,
    refetch: fetchEvents,
  };
}
