import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon } from 'lucide-react';
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
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '../types';

export interface CalendarScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  colonies: Colony[];
  channels: ColonyChannel[];
  onCreateEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  defaultDate?: string;
}

export function CalendarScheduleDialog({
  isOpen,
  onOpenChange,
  colonies,
  channels,
  onCreateEvent,
  defaultDate,
}: CalendarScheduleDialogProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'meeting' | 'task' | 'activity'>('meeting');
  const [newDate, setNewDate] = useState(defaultDate || dayjs().format('YYYY-MM-DD'));
  const [newTime, setNewTime] = useState('14:00');
  const [selectedColonyId, setSelectedColonyId] = useState(colonies[0]?.id || 'anticeil');
  const [selectedChannelId, setSelectedChannelId] = useState('');

  const voiceChannels = channels.filter(
    (c) => (c.colonyId || 'anticeil') === selectedColonyId && c.type === 'voice'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startDateTime = `${newDate}T${newTime}:00`;

    const selectedColony = colonies.find((h) => h.id === selectedColonyId);
    const selectedChannel = channels.find((c) => c.id === selectedChannelId);

    onCreateEvent?.({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      startTime: startDateTime,
      type: newType,
      colonyId: selectedColonyId,
      hubName: selectedColony?.name || 'Komunitas Anticeil',
      channelId: selectedChannelId || undefined,
      channelName: selectedChannel?.name || 'General Voice',
      status: 'scheduled',
    });

    onOpenChange(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">Jadwalkan Acara Baru</DialogTitle>
        <form onSubmit={handleSubmit}>
          <div className={cn('py-4 border-b border-border bg-muted/20', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Jadwalkan Acara / Meeting
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Rencanakan panggilan suara atau pertemuan komunitas dengan rekan tim
            </p>
          </div>

          <div className={cn('py-4 space-y-4 max-h-[70vh] overflow-y-auto [scrollbar-width:thin]', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
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
                <Select
                  value={selectedColonyId}
                  onValueChange={(val) => {
                    setSelectedColonyId(val);
                    setSelectedChannelId('');
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Pilih Colony..." />
                  </SelectTrigger>
                  <SelectContent>
                    {colonies.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Saluran Suara (Voice)
                </label>
                <Select
                  value={selectedChannelId}
                  onValueChange={(val) => setSelectedChannelId(val)}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Pilih Saluran..." />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceChannels.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Tidak ada saluran suara
                      </SelectItem>
                    ) : (
                      voiceChannels.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          🔊 {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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

          <div className={cn('py-3 bg-muted/40 border-t border-border flex items-center justify-end gap-2', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
