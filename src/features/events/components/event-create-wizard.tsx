import React, { useState } from 'react';
import {
  Volume2,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Upload,
} from 'lucide-react';
import dayjs from 'dayjs';
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
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import type { CalendarEvent } from '@/features/calendar/types';

export interface EventCreateWizardProps {
  activeColony: Colony | null;
  channels: ColonyChannel[];
  voiceChannels: ColonyChannel[];
  onCancel: () => void;
  onFinish: (eventData: Partial<CalendarEvent>) => Promise<void>;
  currentUser?: any;
}

export function EventCreateWizard({
  activeColony,
  channels,
  voiceChannels,
  onCancel,
  onFinish,
  currentUser,
}: EventCreateWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [locationType, setLocationType] = useState<'voice' | 'external'>('voice');
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    voiceChannels[0]?.id || ''
  );
  const [externalLocation, setExternalLocation] = useState<string>('');

  const [topic, setTopic] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(
    dayjs().add(1, 'hour').minute(0).format('HH:mm')
  );
  const [frequency, setFrequency] = useState('none');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const channel = channels.find((c) => c.id === selectedChannelId);
      const startDateTime = `${startDate}T${startTime}:00`;

      await onFinish({
        title: topic.trim(),
        description: description.trim() || undefined,
        type: locationType === 'voice' ? 'meeting' : 'activity',
        startTime: startDateTime,
        colonyId: activeColony?.id,
        hubName: activeColony?.name || 'Komunitas',
        channelId: locationType === 'voice' ? selectedChannelId : undefined,
        channelName: locationType === 'voice' ? channel?.name || 'Voice Room' : externalLocation || 'Somewhere Else',
        status: 'scheduled',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Wizard Steps indicator */}
      <div className="px-6 pt-5 pb-3 border-b border-border space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-1 rounded-full transition-all ${
              step >= 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-1 rounded-full transition-all ${
              step >= 2 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-1 rounded-full transition-all ${
              step >= 3 ? 'bg-primary' : 'bg-muted'
            }`}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span className={step === 1 ? 'text-primary font-bold' : ''}>Location</span>
          <span className={step === 2 ? 'text-primary font-bold' : ''}>Event Info</span>
          <span className={step === 3 ? 'text-primary font-bold' : ''}>Review</span>
        </div>
      </div>

      {/* Wizard Body */}
      <div className="px-6 py-4 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
        {/* ── STEP 1: LOCATION ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Where is your event?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                So no one gets lost on where to go.
              </p>
            </div>

            {/* Radio 1: Voice Channel */}
            <label
              onClick={() => setLocationType('voice')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                locationType === 'voice'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div
                className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                  locationType === 'voice'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                }`}
              >
                {locationType === 'voice' && <div className="size-1.5 rounded-full bg-primary-foreground" />}
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
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div
                className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                  locationType === 'external'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                }`}
              >
                {locationType === 'external' && <div className="size-1.5 rounded-full bg-primary-foreground" />}
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
                  <SelectTrigger className="w-full bg-card border-border text-xs h-10">
                    <SelectValue placeholder="Pilih Voice Channel" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-xs">
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
                  className="bg-card border-border text-xs h-10"
                />
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: EVENT INFO ── */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div>
              <h3 className="text-lg font-bold text-foreground">What&apos;s your event about?</h3>
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
                className="bg-card border-border text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-card border-border text-xs h-9 [color-scheme:dark]"
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
                  className="bg-card border-border text-xs h-9 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Apa yang akan dilakukan dalam acara ini? Berikan rincian singkat..."
                className="w-full bg-card border border-border rounded-md p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[70px] resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <CalendarIcon className="w-4 h-4" />
                <span>{dayjs(startDate).format('dddd, D MMMM YYYY')} @ {startTime}</span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-snug">{topic}</h3>
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              )}
              <div className="pt-2 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                {locationType === 'voice' ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    <span>{channels.find((c) => c.id === selectedChannelId)?.name || 'General Voice'}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{externalLocation || 'External Location'}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-center py-2 space-y-1">
              <h4 className="text-base font-bold text-foreground">Here&apos;s a preview of your event.</h4>
              <p className="text-xs text-muted-foreground">
                This event will auto start when it&apos;s time and alert the channel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t border-border">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => (s - 1) as any)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Back
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
        )}

        <div className="flex items-center gap-2">
          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => {
                if (step === 1 && locationType === 'external' && !externalLocation.trim()) {
                  return;
                }
                if (step === 2 && !topic.trim()) {
                  return;
                }
                setStep((s) => (s + 1) as any);
              }}
              disabled={(step === 1 && locationType === 'external' && !externalLocation.trim()) || (step === 2 && !topic.trim())}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Next
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
