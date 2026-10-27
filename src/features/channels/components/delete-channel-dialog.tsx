import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CommunityChannel } from '@/chat/chat-types';

export interface DeleteChannelDialogProps {
  channelToDelete: CommunityChannel | null;
  onClose: () => void;
  onDeleteConfirm: () => void;
  t: (key: string) => string;
}

export function DeleteChannelDialog({
  channelToDelete,
  onClose,
  onDeleteConfirm,
  t,
}: DeleteChannelDialogProps) {
  return (
    <Dialog open={!!channelToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-500">{t('Hapus Channel?')}</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus channel #{channelToDelete?.name}? Semua pesan di dalamnya akan terhapus permanen.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onDeleteConfirm}
          >
            Hapus Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
