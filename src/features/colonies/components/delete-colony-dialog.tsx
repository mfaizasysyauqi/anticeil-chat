import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Colony } from '@/chat/chat-types';

export interface DeleteColonyDialogProps {
  serverToDelete?: Colony | null;
  hubToDelete?: Colony | null;
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
    <ConfirmDialog
      open={!!targetServer}
      onClose={onClose}
      onConfirm={onDeleteConfirm}
      title={t('Hapus Colony?')}
      description={t(
        'Apakah Anda yakin ingin menghapus colony "{{name}}"? Semua channel dan riwayat pesan di colony ini akan dihapus.',
        { name: targetServer?.name }
      )}
      confirmLabel={t('Hapus Colony')}
      cancelLabel={t('Batal')}
      variant="destructive"
    />
  );
}

// Backward-compatible alias
export const DeleteServerDialog = DeleteColonyDialog;
export type DeleteServerDialogProps = DeleteColonyDialogProps;
export const DeleteHubDialog = DeleteColonyDialog;
export type DeleteHubDialogProps = DeleteColonyDialogProps;
