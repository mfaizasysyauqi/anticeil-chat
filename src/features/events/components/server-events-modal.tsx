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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CommunityHub, CommunityChannel } from '@/chat/chat-types';
import type { CalendarEvent } from '@/features/calendar/types';

export interface ServerEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHub: CommunityHub | null;
  channels: CommunityChannel[];
  events: CalendarEvent[];
  onCreateEvent: (eventData: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  currentUser?: any;
  onJoinChannel?: (channelId: string) => void;
}

export function ServerEventsModal({
  isOpen,
  onClose,
  activeHub,
  channels,
  events,
  onCreateEvent,
  currentUser,
  onJoinChannel,
}: ServerEventsModalProps) {
  const [viewState, setViewState] = useState<'list' | 'create' | 'share'>('list');
  const [createdShareEvent, setCreatedShareEvent] = useState<CalendarEvent | null>(null);

  // Form State for Creation Wizard (Step 1, 2, 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [locationType, setLocationType] = useState<'voice' | 'external'>('voice');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [externalLocation, setExternalLocation] = useState<string>('');

  const [topic, setTopic] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(dayjs().add(1, 'hour').minute(0).format('HH:mm'));
  const [frequency, setFrequency] = useState('none');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter server specific events
  const serverEvents = events.filter((ev) => {
    if (!activeHub) return true;
    return ev.hubId === activeHub.id || (ev.hubName && ev.hubName.toLowerCase() === activeHub.name.toLowerCase());
  });

  const voiceChannels = channels.filter(
    (c) => (c.hubId === activeHub?.id || !c.hubId) && c.type === 'voice'
  );

  const resetForm = () => {
    setStep(1);
    setLocationType('voice');
    setSelectedChannelId(voiceChannels[0]?.id || '');
    setExternalLocation('');
    setTopic('');
    setStartDate(dayjs().format('YYYY-MM-DD'));
    setStartTime(dayjs().add(1, 'hour').minute(0).format('HH:mm'));
    setFrequency('none');
    setDescription('');
    setCoverImage('');
  };

  const handleOpenCreate = () => {
    resetForm();
    if (voiceChannels.length > 0) {
      setSelectedChannelId(voiceChannels[0].id);
    }
    setViewState('create');
  };

  const handleFinishCreate = async () => {
    if (!topic.trim()) {
      toast.error('Topik event wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCh = channels.find((c) => c.id === selectedChannelId);
      const startDateTime = dayjs(`${startDate}T${startTime}:00`).toISOString();

      const newEvent = await onCreateEvent({
        title: topic,
        description,
        type: locationType === 'voice' ? 'activity' : 'meeting',
        hubId: activeHub?.id || 'anticeil',
        hubName: activeHub?.name || 'Anticeil',
        channelId: locationType === 'voice' ? selectedChannelId : undefined,
        channelName: locationType === 'voice' ? (selectedCh?.name || 'Voice') : externalLocation,
        startTime: startDateTime,
        status: 'scheduled',
      });

      if (newEvent) {
        setCreatedShareEvent(newEvent);
        setViewState('share');
      }
    } catch {
      toast.error('Gagal membuat event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareLink = () => {
    const code = activeHub?.inviteCode || activeHub?.id || 'anticeil';
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
        className="max-w-[460px] p-0 bg-[#1e1f22] border-[#2b2d31] text-foreground rounded-2xl overflow-hidden shadow-2xl focus:outline-none"
      >
        <DialogTitle className="sr-only">Server Events</DialogTitle>

        {/* ── VIEW 1: EVENTS LIST MODAL ── */}
        {viewState === 'list' && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2b2d31]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm tracking-wide">
                    {serverEvents.length} {serverEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>
                <div className="w-px h-4 bg-[#35363c]" />
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="h-7 text-xs px-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md shadow-sm"
                >
                  Create Event
                </Button>
              </div>
            </div>

            {/* List Body */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[500px] [scrollbar-width:thin]">
              {serverEvents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mx-auto text-muted-foreground">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Belum ada event terjadwal</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Rencanakan acara komunitas, streaming game bareng, atau rapat suara terjadwal di sini.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs h-8 px-4"
                  >
                    Buat Event Pertama
                  </Button>
                </div>
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
                      className="p-4 bg-[#2b2d31]/80 hover:bg-[#2b2d31] border border-white/5 rounded-xl space-y-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                            NEW
                          </span>
                          <span className="text-xs font-semibold text-indigo-400">{timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CommunityAvatar
                            name={currentUser?.name || 'Creator'}
                            imageUrl={currentUser?.avatar}
                            size={20}
                          />
                          <div className="flex items-center gap-1 text-[11px]">
                            <Users className="w-3.5 h-3.5" />
                            <span>1</span>
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

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-muted-foreground">
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
                              className="h-7 text-xs px-2.5 bg-[#313338] hover:bg-[#383a40]"
                            >
                              Join Voice
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3 bg-[#23a55a] hover:bg-[#209250] text-white font-medium flex items-center gap-1 rounded-md"
                            onClick={() => toast.success('Kamu ditandai tertarik pada event ini! 🔔')}
                          >
                            <Check className="w-3.5 h-3.5" /> Interested
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

        {/* ── VIEW 2: CREATE EVENT WIZARD (STEPS 1, 2, 3) ── */}
        {viewState === 'create' && (
          <div className="flex flex-col">
            {/* Step Progress Bar Header */}
            <div className="px-6 pt-5 pb-3">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div
                  className={`h-1 rounded-full transition-all ${
                    step >= 1 ? 'bg-indigo-500' : 'bg-[#35363c]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all ${
                    step >= 2 ? 'bg-indigo-500' : 'bg-[#35363c]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all ${
                    step >= 3 ? 'bg-indigo-500' : 'bg-[#35363c]'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span className={step === 1 ? 'text-indigo-400' : ''}>Location</span>
                <span className={step === 2 ? 'text-indigo-400' : ''}>Event Info</span>
                <span className={step === 3 ? 'text-indigo-400' : ''}>Review</span>
              </div>
            </div>

            {/* Wizard Body */}
            <div className="px-6 py-3 space-y-4 max-h-[480px] overflow-y-auto [scrollbar-width:thin]">
              {/* ── STEP 1: LOCATION ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Where is your event?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      So no one gets lost on where to go.
                    </p>
                  </div>

                  {/* Radio 1: Voice Channel */}
                  <label
                    onClick={() => setLocationType('voice')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      locationType === 'voice'
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : 'border-[#2b2d31] bg-[#2b2d31]/40 hover:bg-[#2b2d31]/80'
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        locationType === 'voice'
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-muted-foreground/40'
                      }`}
                    >
                      {locationType === 'voice' && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <span>Voice Channel</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Hang out with voice, video, screenshare, and Go Live.
                      </p>
                    </div>
                  </label>

                  {/* Radio 2: Somewhere Else */}
                  <label
                    onClick={() => setLocationType('external')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      locationType === 'external'
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : 'border-[#2b2d31] bg-[#2b2d31]/40 hover:bg-[#2b2d31]/80'
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        locationType === 'external'
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-muted-foreground/40'
                      }`}
                    >
                      {locationType === 'external' && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>Somewhere Else</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Text channel, external link, or in-person location.
                      </p>
                    </div>
                  </label>

                  {/* Sub-inputs based on selection */}
                  {locationType === 'voice' ? (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Select a channel <span className="text-red-400">*</span>
                      </label>
                      <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                        <SelectTrigger className="w-full bg-[#111214] border-[#2b2d31] text-xs h-10">
                          <SelectValue placeholder="Pilih Voice Channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111214] border-[#2b2d31] text-xs">
                          {voiceChannels.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Tidak ada voice channel
                            </SelectItem>
                          ) : (
                            voiceChannels.map((vc) => (
                              <SelectItem key={vc.id} value={vc.id}>
                                <div className="flex items-center gap-2">
                                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{vc.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Enter a location <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={externalLocation}
                        onChange={(e) => setExternalLocation(e.target.value)}
                        placeholder="Add a location, link, or something."
                        className="bg-[#111214] border-[#2b2d31] text-xs h-10"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: EVENT INFO ── */}
              {step === 2 && (
                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">What's your event about?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fill out the details of your event.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Event Topic <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Judul acara komunitas..."
                      className="bg-[#111214] border-[#2b2d31] text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Start Date <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-[#111214] border-[#2b2d31] text-xs h-9 [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Start Time <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-[#111214] border-[#2b2d31] text-xs h-9 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Event Frequency <span className="text-red-400">*</span>
                    </label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="w-full bg-[#111214] border-[#2b2d31] text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111214] border-[#2b2d31] text-xs">
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every other week</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan tentang apa acara ini..."
                      rows={3}
                      className="w-full rounded-md border border-[#2b2d31] bg-[#111214] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 3: REVIEW ── */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Card Preview Discord Style */}
                  <div className="p-4 bg-[#2b2d31] border border-white/5 rounded-xl space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-400">
                          {dayjs(`${startDate}T${startTime}`).isSame(dayjs(), 'day')
                            ? `Today at ${startTime}`
                            : `${dayjs(startDate).format('MMM D')} at ${startTime}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CommunityAvatar
                          name={currentUser?.name || 'Creator'}
                          imageUrl={currentUser?.avatar}
                          size={20}
                        />
                        <div className="flex items-center gap-1 text-[11px]">
                          <Users className="w-3.5 h-3.5" />
                          <span>0</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground">{topic || 'Untitled Event'}</h4>
                      {description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
                      {locationType === 'voice' ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{channels.find((c) => c.id === selectedChannelId)?.name || 'General Voice'}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{externalLocation || 'External Location'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <h4 className="text-lg font-bold text-foreground">Here's a preview of your event.</h4>
                    <p className="text-xs text-muted-foreground">
                      This event will auto start when it's time and alert the channel.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#111214]/60 border-t border-[#2b2d31]">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewState('list')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              )}

              <div className="flex items-center gap-2">
                {step < 3 ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (step === 1) {
                        if (locationType === 'voice' && !selectedChannelId) {
                          toast.error('Pilih channel terlebih dahulu');
                          return;
                        }
                        if (locationType === 'external' && !externalLocation.trim()) {
                          toast.error('Masukkan detail lokasi terlebih dahulu');
                          return;
                        }
                      }
                      if (step === 2) {
                        if (!topic.trim()) {
                          toast.error('Topik event wajib diisi');
                          return;
                        }
                      }
                      setStep((s) => (s + 1) as any);
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-5 h-8 font-medium rounded-md"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleFinishCreate}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-5 h-8 font-medium rounded-md shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: SHARE EVENT MODAL (DISCORD STYLE) ── */}
        {viewState === 'share' && (
          <div className="p-6 text-center space-y-4">
            <div className="relative w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
              <CalendarIcon className="w-8 h-8 text-foreground" />
              <Sparkles className="w-4 h-4 text-cyan-400 absolute top-1 right-1" />
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 absolute bottom-1 left-1" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">All set. Now share your event!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                Copy the event link below to invite people to your event. This also acts as a server invite link.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-[#111214] border border-[#2b2d31] rounded-lg">
              <Input
                readOnly
                value={getShareLink()}
                className="bg-transparent border-0 text-xs h-8 text-muted-foreground select-all focus-visible:ring-0"
              />
              <Button
                size="sm"
                onClick={copyShareLink}
                className="h-8 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-md shrink-0"
              >
                Copy
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground/60 text-left">
              Your invite link expires in 7 days.
            </p>

            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewState('list');
                }}
                className="w-full text-xs h-9"
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
