import React from 'react';
import { Hash, Volume2, MessagesSquare } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { CommunityChannel } from '@/chat/chat-types';

export interface EditChannelDialogProps {
  channelToEdit: CommunityChannel | null;
  onClose: () => void;
  editChannelType: 'text' | 'voice' | 'forum';
  setEditChannelType: (type: 'text' | 'voice' | 'forum') => void;
  editChannelName: string;
  setEditChannelName: (name: string) => void;
  editChannelDesc: string;
  setEditChannelDesc: (desc: string) => void;
  onEditChannelSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export function EditChannelDialog({
  channelToEdit,
  onClose,
  editChannelType,
  setEditChannelType,
  editChannelName,
  setEditChannelName,
  editChannelDesc,
  setEditChannelDesc,
  onEditChannelSubmit,
  t,
}: EditChannelDialogProps) {
  return (
    <Dialog open={!!channelToEdit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onEditChannelSubmit}>
          <DialogHeader>
            <DialogTitle>{t('Edit Channel')}</DialogTitle>
            <DialogDescription>
              Perbarui nama dan deskripsi topik channel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">{t('Tipe Channel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEditChannelType('text')}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                    editChannelType === 'text'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Hash className="w-4 h-4" />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditChannelType('voice')}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                    editChannelType === 'voice'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditChannelType('forum')}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                    editChannelType === 'forum'
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <MessagesSquare className="w-4 h-4" />
                  <span>Forum</span>
                </button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">Nama Channel</label>
              <Input
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">Deskripsi</label>
              <Input
                value={editChannelDesc}
                onChange={(e) => setEditChannelDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
