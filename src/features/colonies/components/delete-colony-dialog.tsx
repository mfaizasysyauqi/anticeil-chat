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
import type { CommunityHub } from '@/chat/chat-types';

export interface DeleteColonyDialogProps {
  serverToDelete?: CommunityHub | null;
  hubToDelete?: CommunityHub | null;
  onClose: () => void;
  onDeleteConfirm: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteColonyDialog({
  serverToDelete,
  hubToDelete,
  onClose,
  onDeleteConfirm,
  t,
}: DeleteColonyDialogProps) {
  const targetServer = serverToDelete ?? hubToDelete;

  return (
    <Dialog open={!!targetServer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-500">{t('Hapus Colony?')}</DialogTitle>
          <DialogDescription>
            {t(
              'Apakah Anda yakin ingin menghapus colony "{{name}}"? Semua channel dan riwayat pesan di colony ini akan dihapus.',
              { name: targetServer?.name },
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
            {t('Hapus Colony')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const DeleteServerDialog = DeleteColonyDialog;
export type DeleteServerDialogProps = DeleteColonyDialogProps;
export const DeleteHubDialog = DeleteColonyDialog;
export type DeleteHubDialogProps = DeleteColonyDialogProps;
