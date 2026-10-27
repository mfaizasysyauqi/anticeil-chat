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

export interface EditHubDialogProps {
  hubToEdit: CommunityHub | null;
  onClose: () => void;
  editHubName: string;
  setEditHubName: (name: string) => void;
  editHubDesc: string;
  setEditHubDesc: (desc: string) => void;
  onEditHubSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export function EditHubDialog({
  hubToEdit,
  onClose,
  editHubName,
  setEditHubName,
  editHubDesc,
  setEditHubDesc,
  onEditHubSubmit,
  t,
}: EditHubDialogProps) {
  return (
    <Dialog open={!!hubToEdit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onEditHubSubmit}>
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
                value={editHubName}
                onChange={(e) => setEditHubName(e.target.value)}
                placeholder="Nama server..."
                className="text-xs"
                required
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold">{t('Deskripsi (Opsional)')}</label>
              <Input
                value={editHubDesc}
                onChange={(e) => setEditHubDesc(e.target.value)}
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
