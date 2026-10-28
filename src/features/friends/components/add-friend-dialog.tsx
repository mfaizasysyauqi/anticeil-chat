import React, { useState } from 'react';
import { UserPlus, Sparkles } from 'lucide-react';
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
import { useTranslation } from '@/core/i18n';

export interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFriend: (username: string) => Promise<void> | void;
  isAddingFriend?: boolean;
}

export function AddFriendDialog({
  open,
  onOpenChange,
  onAddFriend,
  isAddingFriend = false,
}: AddFriendDialogProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = username.trim().replace(/^@/, '');
    if (!trimmed || isAddingFriend) return;
    await onAddFriend(trimmed);
    setUsername('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>{t('Tambah Teman')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('Kamu bisa menambahkan teman menggunakan nama pengguna mereka.')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Nama Pengguna')}
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('contoh: mfaizasysyauqi atau nama_teman')}
                className="h-9 text-xs"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
                {t('Pastikan nama pengguna sesuai, Anda dapat menambahkan teman dari workspace atau komunitas Anticeil.')}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {t('Permintaan pertemanan akan dikirimkan dan menunggu persetujuan di tab Tertunda mereka.')}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              disabled={!username.trim() || isAddingFriend}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs h-9 px-4 cursor-pointer disabled:opacity-50"
            >
              {isAddingFriend ? t('Mengirim...') : t('Kirim Permintaan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
