import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ColonyChannel } from '@/chat/chat-types';

export interface DeleteChannelDialogProps {
  channelToDelete: ColonyChannel | null;
  onClose: () => void;
  onDeleteConfirm: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteChannelDialog({
  channelToDelete,
  onClose,
  onDeleteConfirm,
  t,
}: DeleteChannelDialogProps) {
  return (
    <ConfirmDialog
      open={!!channelToDelete}
      onClose={onClose}
      onConfirm={onDeleteConfirm}
      title={t('Hapus Channel?')}
      description={t(
        'Apakah Anda yakin ingin menghapus channel #{{name}}? Semua pesan di dalamnya akan terhapus permanen.',
        { name: channelToDelete?.name }
      )}
      confirmLabel={t('Hapus Channel')}
      cancelLabel={t('Batal')}
      variant="destructive"
    />
  );
}
