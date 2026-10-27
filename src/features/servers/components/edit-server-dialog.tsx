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
import { Input } from '@/components/ui/input';
import type { CommunityHub } from '@/chat/messages-types';

export interface EditServerDialogProps {
  serverToEdit?: CommunityHub | null;
  hubToEdit?: CommunityHub | null;
  onClose: () => void;
  editServerName?: string;
  setEditServerName?: (name: string) => void;
  editServerDesc?: string;
  setEditServerDesc?: (desc: string) => void;
  onEditServerSubmit?: (e: React.FormEvent) => void;
  t: (key: string) => string;

  // Backward-compatible props
  editHubName?: string;
  setEditHubName?: (name: string) => void;
  editHubDesc?: string;
  setEditHubDesc?: (desc: string) => void;
  onEditHubSubmit?: (e: React.FormEvent) => void;
}

export function EditServerDialog({
  serverToEdit,
  hubToEdit,
  onClose,
  editServerName,
  setEditServerName,
  editServerDesc,
  setEditServerDesc,
  onEditServerSubmit,
  t,
  editHubName,
  setEditHubName,
  editHubDesc,
  setEditHubDesc,
  onEditHubSubmit,
}: EditServerDialogProps) {
  const targetServer = serverToEdit ?? hubToEdit;
  const serverName = editServerName ?? editHubName ?? '';
  const setServerName = setEditServerName ?? setEditHubName ?? (() => {});
  const serverDesc = editServerDesc ?? editHubDesc ?? '';
  const setServerDesc = setEditServerDesc ?? setEditHubDesc ?? (() => {});
  const handleSubmit = onEditServerSubmit ?? onEditHubSubmit ?? (() => {});

  return (
    <Dialog open={!!targetServer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('Ganti Nama Server')}</DialogTitle>
            <DialogDescription>
              {t('Perbarui nama dan deskripsi server atau workspace ini.')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">{t('Nama Server')}</label>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Nama server..."
                className="text-xs"
                required
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">{t('Deskripsi (Opsional)')}</label>
              <Input
                value={serverDesc}
                onChange={(e) => setServerDesc(e.target.value)}
                placeholder="Deskripsi server..."
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
              {t('Batal')}
            </Button>
            <Button type="submit">
              {t('Simpan Perubahan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const EditHubDialog = EditServerDialog;
export type EditHubDialogProps = EditServerDialogProps;
