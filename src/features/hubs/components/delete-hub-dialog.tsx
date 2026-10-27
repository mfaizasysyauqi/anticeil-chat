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
import type { CommunityHub } from '@/chat/messages-types';

export interface DeleteHubDialogProps {
  hubToDelete: CommunityHub | null;
  onClose: () => void;
  onDeleteConfirm: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteHubDialog({
  hubToDelete,
  onClose,
  onDeleteConfirm,
  t,
}: DeleteHubDialogProps) {
  return (
    <Dialog open={!!hubToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-500">{t('Hapus Server?')}</DialogTitle>
          <DialogDescription>
            {t(
              'Apakah Anda yakin ingin menghapus server "{{name}}"? Semua channel dan riwayat pesan di server ini akan dihapus.',
              { name: hubToDelete?.name },
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('Batal')}
          </Button>
          <Button
            variant="destructive"
            onClick={onDeleteConfirm}
          >
            {t('Hapus Server')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
