import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Volume2,
  ChevronDown,
  Upload,
  Check,
  Share2,
  X,
  Users,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import type { CalendarEvent } from '@/features/calendar/types';
import { calendarApi } from '@/features/calendar/api/calendar-api';
import { EventCreateWizard } from './event-create-wizard';

export interface ColonyEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeColony: Colony | null;
  channels: ColonyChannel[];
  events: CalendarEvent[];
  onCreateEvent: (eventData: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  currentUser?: any;
  onJoinChannel?: (channelId: string) => void;
}

export function ColonyEventsModal({
  isOpen,
  onClose,
  activeColony,
  channels,
  events,
  onCreateEvent,
  currentUser,
  onJoinChannel,
}: ColonyEventsModalProps) {
  const [viewState, setViewState] = useState<'list' | 'create' | 'share'>('list');
  const [createdShareEvent, setCreatedShareEvent] = useState<CalendarEvent | null>(null);
  const [interestedEventIds, setInterestedEventIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('anticeil_interested_events');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggleInterest = (eventId: string) => {
    setInterestedEventIds((prev) => {
      const next = new Set(prev);
      const isInterested = !next.has(eventId);
      if (next.has(eventId)) {
        next.delete(eventId);
        toast.info('Kamu membatalkan tanda tertarik pada event ini.');
      } else {
        next.add(eventId);
        toast.success('Kamu ditandai tertarik pada event ini! 🔔');
      }
      try {
        localStorage.setItem('anticeil_interested_events', JSON.stringify(Array.from(next)));
      } catch {}
      calendarApi.updateCalendarEvent(eventId, { isInterested }).catch(() => {});
      return next;
    });
  };



  // Filter server specific events
  const serverEvents = events.filter((ev) => {
    if (!activeColony) return true;
    return ev.colonyId === activeColony.id || (ev.hubName && ev.hubName.toLowerCase() === activeColony.name.toLowerCase());
  });

  const voiceChannels = channels.filter(
    (c) => (c.colonyId === activeColony?.id || !c.colonyId) && c.type === 'voice'
  );

  const handleOpenCreate = () => {
    setViewState('create');
  };

  const handleFinishCreate = async (eventData: Partial<CalendarEvent>) => {
    try {
      const newEvent = await onCreateEvent({
        ...eventData,
        colonyId: activeColony?.id || 'anticeil',
        hubName: activeColony?.name || 'Anticeil',
      });

      if (newEvent) {
        setCreatedShareEvent(newEvent);
        setViewState('share');
      }
    } catch {
      toast.error('Gagal membuat event');
    }
  };

  const getShareLink = () => {
    const code = activeColony?.inviteCode || activeColony?.id || 'anticeil';
    return `${window.location.origin}/messages?invite=${code}&event=${createdShareEvent?.id || ''}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    toast.success('Link event berhasil disalin!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[480px] p-0 bg-background border-border text-foreground rounded-2xl overflow-hidden shadow-2xl focus:outline-none"
      >
        <DialogTitle className="sr-only">Server Events</DialogTitle>

        {/* ── VIEW 1: EVENTS LIST MODAL ── */}
        {viewState === 'list' && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm tracking-wide text-foreground">
                    {serverEvents.length} {serverEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>
                <div className="w-px h-4 bg-border" />
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="h-7 text-xs px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Create Event
                </Button>
              </div>
            </div>

            {/* List Body */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[500px] max-md:scrollbar-none custom-scrollbar">
              {serverEvents.length === 0 ? (
                <EmptyState
                  compact
                  icon={<CalendarIcon className="w-6 h-6 stroke-[1.8] text-primary/80" />}
                  title="Belum ada event terjadwal"
                  description="Rencanakan acara komunitas, streaming game bareng, atau rapat suara terjadwal di sini."
                  action={
                    <Button
                      size="sm"
                      onClick={handleOpenCreate}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 shadow-xs cursor-pointer"
                    >
                      Buat Event Pertama
                    </Button>
                  }
                />
              ) : (
                serverEvents.map((ev) => {
                  const evDate = dayjs(ev.startTime);
                  const isFuture = evDate.isAfter(dayjs());
                  const diffMin = evDate.diff(dayjs(), 'minute');

                  let timeLabel = `Today at ${evDate.format('HH:mm')}`;
                  if (!evDate.isSame(dayjs(), 'day')) {
                    timeLabel = evDate.format('MMM D, YYYY [at] HH:mm');
                  }
                  if (isFuture && diffMin < 60 && diffMin >= 0) {
                    timeLabel = `Starting in ${diffMin}m`;
                  }

                  return (
                    <div
                      key={ev.id}
                      className="p-4 bg-card hover:bg-muted/30 border border-border rounded-xl space-y-3 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                            NEW
                          </span>
                          <span className="text-xs font-semibold text-primary">{timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CommunityAvatar
                            name={currentUser?.name || 'Creator'}
                            imageUrl={currentUser?.avatar}
                            size={20}
                          />
                          <div className="flex items-center gap-1 text-[11px]">
                            <Users className="w-3.5 h-3.5" />
                            <span>{interestedEventIds.has(ev.id) ? 2 : 1}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground">{ev.title}</h4>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          {ev.channelId ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{ev.channelName || 'Voice Channel'}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{ev.channelName || 'Somewhere Else'}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {ev.channelId && onJoinChannel && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                onJoinChannel(ev.channelId!);
                                onClose();
                              }}
                              className="h-7 text-xs px-2.5 font-semibold cursor-pointer"
                            >
                              Join Voice
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={interestedEventIds.has(ev.id) ? "default" : "secondary"}
                            className={cn(
                              "h-7 text-xs px-3 font-semibold flex items-center gap-1 rounded-md shadow-xs cursor-pointer transition-colors",
                              interestedEventIds.has(ev.id)
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-accent text-foreground"
                            )}
                            onClick={() => toggleInterest(ev.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {interestedEventIds.has(ev.id) ? 'Interested' : 'Interest'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 2: CREATE EVENT WIZARD ── */}
        {viewState === 'create' && (
          <EventCreateWizard
            activeColony={activeColony}
            channels={channels}
            voiceChannels={voiceChannels}
            onCancel={() => setViewState('list')}
            onFinish={handleFinishCreate}
            currentUser={currentUser}
          />
        )}

        {/* ── VIEW 3: SHARE EVENT MODAL (DISCORD STYLE) ── */}
        {viewState === 'share' && (
          <div className="p-6 text-center space-y-4">
            <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
              <CalendarIcon className="w-8 h-8 text-primary" />
              <Sparkles className="w-4 h-4 text-primary absolute top-1 right-1" />
              <Sparkles className="w-3.5 h-3.5 text-secondary absolute bottom-1 left-1" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">All set. Now share your event!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                Copy the event link below to invite people to your event. This also acts as a server invite link.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-lg">
              <Input
                readOnly
                value={getShareLink()}
                className="bg-transparent border-0 text-xs h-8 text-muted-foreground select-all focus-visible:ring-0"
              />
              <Button
                size="sm"
                onClick={copyShareLink}
                className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-md shrink-0 shadow-xs cursor-pointer"
              >
                Copy
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground/70 text-left">
              Your invite link expires in 7 days.
            </p>

            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewState('list');
                }}
                className="w-full text-xs h-9 cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
