import React, { useState } from 'react';
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
import { useTranslation } from '@/core/i18n';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName?: string;
  onCreateThread: (name: string, initialMessage?: string) => Promise<void>;
}

export function CreateThreadModal({
  isOpen,
  onClose,
  channelName,
  onCreateThread,
}: CreateThreadModalProps) {
  const { t } = useTranslation();

  const [threadName, setThreadName] = useState('');
  const [initialMsg, setInitialMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateThread(threadName.trim(), initialMsg.trim() || undefined);
      setThreadName('');
      setInitialMsg('');
      onClose();
    } catch (err) {
      console.error('Failed to create thread', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M5.5 4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 4h-13zm2 3h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2z" />
              </svg>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">{t('Buat Thread Baru')}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('Thread membuat percakapan terfokus pada topik tertentu dalam')} #{channelName || 'channel'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              {t('NAMA THREAD')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder={t('cth. diskusi-fitur-baru')}
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              maxLength={100}
              required
              className="bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              {t('PESAN AWAL (OPSIONAL)')}
            </label>
            <textarea
              placeholder={t('Kirim pesan pembuka untuk memulai thread...')}
              value={initialMsg}
              onChange={(e) => setInitialMsg(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-muted/50 border border-border text-foreground text-xs p-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!threadName.trim() || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            >
              {isSubmitting ? t('Membuat...') : t('Buat Thread')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
