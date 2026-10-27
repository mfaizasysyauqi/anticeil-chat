import React, { useState } from 'react';
import {
  UserPlus,
  AtSign,
  UserCheck,
  AlertCircle,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
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
import { toast } from 'sonner';
import type { CommunityHub } from '@/chat/chat-types';

export interface ServerInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeServer?: CommunityHub | null;
  activeHub?: CommunityHub | null;
  onInviteUsername: (username: string) => Promise<boolean | void>;
  t: (key: string) => string;
}

export function ServerInviteDialog({
  open,
  onOpenChange,
  activeServer,
  activeHub,
  onInviteUsername,
  t,
}: ServerInviteDialogProps) {
  const currentServer = activeServer ?? activeHub;
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInvitingUsername, setIsInvitingUsername] = useState(false);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawUser = inviteUsername.trim().replace(/^@/, '');
    if (!rawUser) {
      toast.error(t('Masukkan username yang ingin diundang'));
      return;
    }

    try {
      setIsInvitingUsername(true);
      setUserNotFound(null);
      const success = await onInviteUsername(rawUser);
      if (success === false) {
        setUserNotFound(rawUser);
      } else {
        setInviteUsername('');
        setUserNotFound(null);
      }
    } catch {
      setUserNotFound(rawUser);
    } finally {
      setIsInvitingUsername(false);
    }
  };

  const handleCopyLink = () => {
    const code = currentServer?.inviteCode || currentServer?.id;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/messages?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success(t('Tautan undangan berhasil disalin! 📋'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="w-5 h-5 text-primary" />
            {t('Undang Teman ke')} {currentServer?.name || 'Server'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('Undang langsung menggunakan username atau bagikan link undangan server.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Form 1: Invite by Username */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-primary" />
                {t('Undang via Username')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t('Contoh: faiz, alex_99')}
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                <Input
                  value={inviteUsername}
                  onChange={(e) => {
                    setInviteUsername(e.target.value);
                    if (userNotFound) setUserNotFound(null);
                  }}
                  placeholder="username"
                  className="pl-7 text-xs font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={isInvitingUsername || !inviteUsername.trim()}
                size="sm"
                className="gap-1.5 shrink-0"
              >
                {isInvitingUsername ? (
                  <span className="text-xs">{t('Mencari...')}</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{t('Undang')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Alert when username not found -> Immediate Share Link Callout */}
          {userNotFound && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-start gap-2 text-amber-500 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t('Pengguna')} @{userNotFound} {t('tidak ditemukan')}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {t('Pengguna belum terdaftar di Anticeil. Bagikan link undangan di bawah ini langsung kepada mereka. Saat mereka mendaftar atau login via OAuth (Google / GitHub), sistem akan')} <strong className="text-foreground">{t('otomatis memasukkan mereka ke server ini')}</strong>!
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5 h-8 border-amber-500/40 hover:bg-amber-500/20 text-foreground cursor-pointer"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('Link Tersalin!') : t('Salin Link Undangan Otomatis')}</span>
              </Button>
            </div>
          )}

          {/* Form 2: Share Link Undangan Server */}
          <div className="pt-2 border-t border-border space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                {t('Tautan Undangan Server')}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {t('Tidak pernah kedaluwarsa')}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/messages?invite=${currentServer?.inviteCode || currentServer?.id}`}
                className="text-xs font-mono bg-muted/40 select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5 shrink-0 cursor-pointer"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? t('Tersalin!') : t('Salin')}</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {t('Kirim tautan ini ke calon anggota. Mereka yang login atau registrasi via tautan ini akan otomatis langsung bergabung.')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              setUserNotFound(null);
              setInviteUsername('');
            }}
          >
            {t('Selesai')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias
export const HubInviteDialog = ServerInviteDialog;
export type HubInviteDialogProps = ServerInviteDialogProps;
