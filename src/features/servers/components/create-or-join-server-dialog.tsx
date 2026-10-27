import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface CreateOrJoinServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newServerName?: string;
  setNewServerName?: (val: string) => void;
  newServerDesc?: string;
  setNewServerDesc?: (val: string) => void;
  newServerIconUrl?: string;
  setNewServerIconUrl?: (val: string) => void;
  joinInviteCode: string;
  setJoinInviteCode: (val: string) => void;
  isJoiningServer?: boolean;
  isJoiningHub?: boolean;
  onCreateServerSubmit?: (e: React.FormEvent) => void;
  onCreateHubSubmit?: (e: React.FormEvent) => void;
  onJoinServer?: () => void;
  onJoinHub?: () => void;
  t: (key: string) => string;

  // Backward-compatible props
  newHubName?: string;
  setNewHubName?: (val: string) => void;
  newHubDesc?: string;
  setNewHubDesc?: (val: string) => void;
  newHubIconUrl?: string;
  setNewHubIconUrl?: (val: string) => void;
}

export function CreateOrJoinServerDialog({
  open,
  onOpenChange,
  newServerName,
  setNewServerName,
  newServerDesc,
  setNewServerDesc,
  newServerIconUrl,
  setNewServerIconUrl,
  joinInviteCode,
  setJoinInviteCode,
  isJoiningServer,
  isJoiningHub,
  onCreateServerSubmit,
  onCreateHubSubmit,
  onJoinServer,
  onJoinHub,
  t,
  newHubName,
  setNewHubName,
  newHubDesc,
  setNewHubDesc,
  newHubIconUrl,
  setNewHubIconUrl,
}: CreateOrJoinServerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serverName = newServerName ?? newHubName ?? '';
  const setServerName = setNewServerName ?? setNewHubName ?? (() => {});
  const serverDesc = newServerDesc ?? newHubDesc ?? '';
  const setServerDesc = setNewServerDesc ?? setNewHubDesc ?? (() => {});
  const serverIconUrl = newServerIconUrl ?? newHubIconUrl ?? '';
  const setServerIconUrl = setNewServerIconUrl ?? setNewHubIconUrl ?? (() => {});
  const isJoining = isJoiningServer ?? isJoiningHub ?? false;
  const handleSubmit = onCreateServerSubmit ?? onCreateHubSubmit ?? (() => {});
  const handleJoin = onJoinServer ?? onJoinHub ?? (() => {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <Tabs defaultValue="create" className="w-full">
          <DialogHeader className="pb-2">
            <DialogTitle>{t('Server Komunitas')}</DialogTitle>
            <DialogDescription>
              {t('Buat server baru untuk proyek Anda atau gabung ke server lain menggunakan kode/link undangan.')}
            </DialogDescription>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="create">{t('Buat Server Baru')}</TabsTrigger>
              <TabsTrigger value="join">{t('Gabung via Link/Kode')}</TabsTrigger>
            </TabsList>
          </DialogHeader>

          <TabsContent value="create">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-3 py-3">
                {/* Server Picture Uploader */}
                <div className="flex flex-col items-center justify-center pb-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error(t('Ukuran file maksimal 5 MB.'));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const res = event.target?.result as string;
                        if (res) setServerIconUrl(res);
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group/avatar size-20 rounded-[20px] border-2 border-dashed border-primary/40 hover:border-primary flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all bg-muted/40 hover:bg-muted/60"
                    title={t('Unggah Foto Server')}
                  >
                    {serverIconUrl ? (
                      <img src={serverIconUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground group-hover/avatar:text-primary transition-colors">
                        <Camera className="size-6 mb-1 opacity-70 group-hover/avatar:opacity-100" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('Unggah')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{t('Pilih ikon atau logo untuk server Anda (opsional)')}</p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">{t('Nama Server')}</label>
                  <Input
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="contoh: Komunitas AI & Bot / Proyek Alpha"
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
                    placeholder="Ruang diskusi untuk alur kerja dan bot..."
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('Batal')}
                </Button>
                <Button type="submit">
                  {t('Buat Server')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <div className="grid gap-3 py-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">{t('Kode atau Link Undangan')}</label>
                <Input
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value)}
                  placeholder="contoh: inv_9f2a1b atau https://.../messages?invite=..."
                  className="text-xs"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Tempel link undangan dari pembuat server untuk langsung bergabung ke komunitas mereka.')}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('Batal')}
              </Button>
              <Button
                onClick={handleJoin}
                disabled={isJoining || !joinInviteCode.trim()}
              >
                {isJoining ? t('Bergabung...') : t('Gabung Server')}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const CreateOrJoinHubDialog = CreateOrJoinServerDialog;
export type CreateOrJoinHubDialogProps = CreateOrJoinServerDialogProps;
