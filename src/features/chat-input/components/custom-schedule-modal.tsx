import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export interface CustomScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  onSchedule: (date: Date, text?: string) => Promise<void> | void;
}

export function CustomScheduleModal({
  open,
  onOpenChange,
  currentText,
  onSchedule,
}: CustomScheduleModalProps) {
  // Default to tomorrow 09:00
  const defaultDate = dayjs().add(1, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DDTHH:mm');
  const [scheduledTime, setScheduledTime] = useState(defaultDate);
  const [messageText, setMessageText] = useState(currentText);

  // Sync currentText if changed when opened
  React.useEffect(() => {
    if (open) {
      setMessageText(currentText);
    }
  }, [open, currentText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledTime) {
      toast.error('Pilih tanggal dan waktu pengiriman pesan');
      return;
    }
    const chosenDate = new Date(scheduledTime);
    if (chosenDate.getTime() <= Date.now()) {
      toast.error('Waktu terjadwal harus di masa depan');
      return;
    }

    await onSchedule(chosenDate, messageText.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-[#1e1f22] text-[#dbdee1] border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <CalendarPlus className="w-5 h-5 text-emerald-400" />
            Jadwalkan Pesan (Schedule Message)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tentukan tanggal dan waktu spesifik. Jadwal akan tersinkronisasi otomatis ke Database Kalender.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogBody className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Tanggal & Waktu
              </label>
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={dayjs().format('YYYY-MM-DDTHH:mm')}
                className="bg-[#111214] border-white/10 text-white text-xs h-9 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Isi Pesan Terjadwal</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan yang ingin dijadwalkan..."
                rows={3}
                className="w-full rounded-md bg-[#111214] border border-white/10 p-2.5 text-xs text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/80"
                required
              />
            </div>
          </DialogBody>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Jadwalkan Pesan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
