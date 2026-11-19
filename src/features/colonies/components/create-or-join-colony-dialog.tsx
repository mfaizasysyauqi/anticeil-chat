import React, { useRef, useState } from 'react';
import { Camera, Server, Globe, Lock } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export interface CreateOrJoinColonyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newServerName?: string;
  setNewServerName?: (val: string) => void;
  newServerDesc?: string;
  setNewServerDesc?: (val: string) => void;
  newServerIconUrl?: string;
  setNewServerIconUrl?: (val: string) => void;
  isPublic?: boolean;
  setIsPublic?: (val: boolean) => void;
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

export function CreateOrJoinColonyDialog({
  open,
  onOpenChange,
  newServerName,
  setNewServerName,
  newServerDesc,
  setNewServerDesc,
  newServerIconUrl,
  setNewServerIconUrl,
  isPublic,
  setIsPublic,
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
}: CreateOrJoinColonyDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalIsPublic, setInternalIsPublic] = useState(true);

  const serverName = newServerName ?? newHubName ?? '';
  const setServerName = setNewServerName ?? setNewHubName ?? (() => {});
  const serverDesc = newServerDesc ?? newHubDesc ?? '';
  const setServerDesc = setNewServerDesc ?? setNewHubDesc ?? (() => {});
  const serverIconUrl = newServerIconUrl ?? newHubIconUrl ?? '';
  const setServerIconUrl = setNewServerIconUrl ?? setNewHubIconUrl ?? (() => {});
  const isJoining = isJoiningServer ?? isJoiningHub ?? false;
  const isColonyPublic = isPublic !== undefined ? isPublic : internalIsPublic;
  const handleSetIsPublic = setIsPublic || setInternalIsPublic;
  const handleSubmit = onCreateServerSubmit ?? onCreateHubSubmit ?? (() => {});
  const handleJoin = onJoinServer ?? onJoinHub ?? (() => {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <Tabs defaultValue="create" className="w-full">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Server className="w-5 h-5 text-primary" />
              <span>{t('Colony Komunitas')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Buat colony baru untuk proyek Anda atau gabung ke colony lain menggunakan kode/link undangan.')}
            </DialogDescription>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="create" className="data-[state=active]:text-primary">
                {t('Buat Colony Baru')}
              </TabsTrigger>
              <TabsTrigger value="join" className="data-[state=active]:text-primary">
                {t('Gabung via Link/Kode')}
              </TabsTrigger>
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
                    className="relative group/avatar size-20 rounded-[20px] border-2 border-dashed border-primary/40 hover:border-primary flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all bg-primary/5 hover:bg-primary/10"
                    title={t('Unggah Foto Colony')}
                  >
                    {serverIconUrl ? (
                      <img src={serverIconUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground group-hover/avatar:text-primary transition-colors">
                        <Camera className="size-6 mb-1 text-primary opacity-80 group-hover/avatar:opacity-100" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 group-hover/avatar:text-primary">{t('Unggah')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{t('Pilih ikon atau logo untuk server Anda (opsional)')}</p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">{t('Nama Colony')}</label>
                  <Input
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="contoh: Komunitas AI & Bot / Proyek Alpha"
                    className="text-xs focus-visible:ring-primary/40 focus-visible:border-primary/80"
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
                    className="text-xs focus-visible:ring-primary/40 focus-visible:border-primary/80"
                  />
                </div>

                {/* Colony Visibility: Public vs Private */}
                <div className="grid gap-1.5 pt-0.5">
                  <label className="text-xs font-semibold">{t('Visibilitas Colony')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetIsPublic(true)}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all',
                        isColonyPublic
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
                          : 'border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-muted/40'
                      )}
                    >
                      <Globe className={cn('size-4 shrink-0', isColonyPublic ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{t('Publik')}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{t('Muncul di Jelajahi')}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetIsPublic(false)}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all',
                        !isColonyPublic
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
                          : 'border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-muted/40'
                      )}
                    >
                      <Lock className={cn('size-4 shrink-0', !isColonyPublic ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{t('Privat')}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{t('Hanya via tautan/kode')}</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-8 px-3"
                >
                  {t('Batal')}
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 cursor-pointer transition-all shadow-xs"
                >
                  {t('Buat Colony')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <div className="grid gap-3 py-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">{t('Kode Undangan atau Blueprint Template')}</label>
                <Input
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value)}
                  placeholder="contoh: inv_9f2a1b atau tpl-k9x2m1..."
                  className="text-xs focus-visible:ring-primary/40 focus-visible:border-primary/80"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Tempel link undangan anggota atau kode template (tpl-...) untuk menduplikasi blueprint channel & peran komunitas.')}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs h-8 px-3"
              >
                {t('Batal')}
              </Button>
              <Button
                onClick={handleJoin}
                disabled={isJoining || !joinInviteCode.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 cursor-pointer transition-all shadow-xs disabled:opacity-50"
              >
                {isJoining ? t('Bergabung...') : t('Gabung Colony')}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const CreateOrJoinServerDialog = CreateOrJoinColonyDialog;
export type CreateOrJoinServerDialogProps = CreateOrJoinColonyDialogProps;
export const CreateOrJoinHubDialog = CreateOrJoinColonyDialog;
export type CreateOrJoinHubDialogProps = CreateOrJoinColonyDialogProps;
