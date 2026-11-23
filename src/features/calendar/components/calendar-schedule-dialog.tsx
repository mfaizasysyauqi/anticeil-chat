import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/core/i18n';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
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
  const { t } = useTranslation();
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
      hubName: selectedColony?.name || t('Komunitas Anticeil'),
      channelId: selectedChannelId || undefined,
      channelName: selectedChannel?.name || t('General Voice'),
      status: 'scheduled',
    });

    onOpenChange(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-0 flex flex-col overflow-hidden max-h-[85vh]">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/50 shrink-0 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span>{t('Jadwalkan Acara / Meeting')}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {t('Rencanakan panggilan suara atau pertemuan komunitas dengan rekan tim')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {t('Judul Acara / Meeting *')}
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('Contoh: Sprint Planning Minggu 4')}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t('Tanggal')}
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
                  {t('Waktu (WIB)')}
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
                  {t('Pilih Server / Komunitas')}
                </label>
                <Select
                  value={selectedColonyId}
                  onValueChange={(val) => {
                    setSelectedColonyId(val);
                    setSelectedChannelId('');
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder={t('Pilih Colony...')} />
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
                  {t('Saluran Suara (Voice)')}
                </label>
                <Select
                  value={selectedChannelId}
                  onValueChange={(val) => setSelectedChannelId(val)}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder={t('Pilih Saluran...')} />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceChannels.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        {t('Tidak ada saluran suara')}
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
                {t('Deskripsi / Agenda Pembahasan')}
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('Tuliskan topik agenda meeting yang akan dibahas...')}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="px-5 sm:px-6 py-3 border-t border-border/60 shrink-0 flex items-center justify-end gap-2 bg-card mt-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t('Simpan Jadwal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
