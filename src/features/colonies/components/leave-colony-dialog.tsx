import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Colony } from '@/chat/chat-types';

export interface LeaveColonyDialogProps {
  colonyToLeave?: Colony | null;
  onClose: () => void;
  onLeaveConfirm: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function LeaveColonyDialog({
  colonyToLeave,
  onClose,
  onLeaveConfirm,
  t,
}: LeaveColonyDialogProps) {
  return (
    <ConfirmDialog
      open={!!colonyToLeave}
      onClose={onClose}
      onConfirm={onLeaveConfirm}
      title={t('Tinggalkan Colony?')}
      description={t(
        'Apakah Anda yakin ingin keluar dari colony "{{name}}"? Anda tidak akan lagi dapat melihat percakapan di colony ini kecuali diundang kembali.',
        { name: colonyToLeave?.name }
      )}
      confirmLabel={t('Tinggalkan Colony')}
      cancelLabel={t('Batal')}
      variant="destructive"
    />
  );
}
