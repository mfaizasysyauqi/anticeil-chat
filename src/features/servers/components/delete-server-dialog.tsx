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

export interface DeleteServerDialogProps {
  serverToDelete?: CommunityHub | null;
  hubToDelete?: CommunityHub | null;
  onClose: () => void;
  onDeleteConfirm: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteServerDialog({
  serverToDelete,
  hubToDelete,
  onClose,
  onDeleteConfirm,
  t,
}: DeleteServerDialogProps) {
  const targetServer = serverToDelete ?? hubToDelete;

  return (
    <Dialog open={!!targetServer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-500">{t('Hapus Server?')}</DialogTitle>
          <DialogDescription>
            {t(
              'Apakah Anda yakin ingin menghapus server "{{name}}"? Semua channel dan riwayat pesan di server ini akan dihapus.',
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
            {t('Hapus Server')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const DeleteHubDialog = DeleteServerDialog;
export type DeleteHubDialogProps = DeleteServerDialogProps;
