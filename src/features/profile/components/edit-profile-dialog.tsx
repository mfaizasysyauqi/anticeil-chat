import React, { useState, useEffect, useMemo } from 'react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import {
  AtSign,
  Clock,
  Moon,
  Sun,
  Palette,
  Sparkles,
  CheckCircle2,
  LogOut,
  UserCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  onSaveDisplayName: (name: string) => Promise<void> | void;
  isSavingDisplayName?: boolean;
  onSaveUsername: (username: string) => Promise<void> | void;
  isSavingUsername?: boolean;
  theme: any;
  setTheme: (theme: any) => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentUser,
  currentUserName,
  onSaveDisplayName,
  isSavingDisplayName = false,
  onSaveUsername,
  isSavingUsername = false,
  theme,
  setTheme,
  onGoogleSignIn,
  onLogout,
  t,
}: EditProfileDialogProps) {
  const suggestedUsername = useMemo(() => {
    if (currentUser?.username) return currentUser.username;
    // Auto-generate from email or display name
    const base = currentUser?.email?.split('@')[0] || currentUserName;
    return base?.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || '';
  }, [currentUser?.username, currentUser?.email, currentUserName]);

  const [editDisplayNameInput, setEditDisplayNameInput] = useState(currentUserName);
  const [editUsernameInput, setEditUsernameInput] = useState(suggestedUsername);

  useEffect(() => {
    if (open) {
      setEditDisplayNameInput(currentUserName);
      setEditUsernameInput(suggestedUsername);
    }
  }, [open, currentUserName, suggestedUsername]);

  // Cooldown calculation: 14 days from usernameLastChangedAt
  const usernameLastChangedAt = currentUser?.usernameLastChangedAt;
  const usernameCooldownEnd = usernameLastChangedAt
    ? new Date(new Date(usernameLastChangedAt).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const isUsernameCooldownActive = Boolean(
    usernameCooldownEnd && usernameCooldownEnd.getTime() > Date.now(),
  );

  const handleDisplayNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName) return;
    onSaveDisplayName(editDisplayNameInput.trim());
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsernameInput.trim() || editUsernameInput.trim() === currentUser?.username) return;
    onSaveUsername(editUsernameInput.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {currentUser ? (
              <CommunityAvatar
                name={currentUserName}
                email={currentUser?.email}
                imageUrl={currentUser?.imageUrl}
                size={28}
                showStatus={false}
                className="shrink-0"
              />
            ) : (
              <AtSign className="w-4 h-4 text-primary" />
            )}
            {!currentUser ? t('Masuk ke Anticeil') : t('Profil & Identitas Akun')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {!currentUser
              ? t('Masuk menggunakan akun Google Anda untuk mengobrol dan berkolaborasi.')
              : t('Kelola Nama Tampilan Anda dan Username unik untuk obrolan serta server.')}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {!currentUser ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-muted/30 text-center space-y-3">
                <div className="mx-auto size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{t('Masuk ke Anticeil')}</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {t('Masuk menggunakan akun Google Anda untuk mengobrol, bergabung ke server, dan berkolaborasi.')}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="w-full gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                  {t('Masuk dengan Google')}
                </Button>
              </div>

              {/* Theme switcher */}
              <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{t('Tema Tampilan Antarmuka')}</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Pilih palet visual yang nyaman untuk mata Anda.')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'dark'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    <span>AMOLED Black</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('midnight')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'midnight'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Classic Grey</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'light'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Display Name */}
              <form onSubmit={handleDisplayNameSubmit} className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      {t('Nama Tampilan (Display Name)')}
                    </label>
                    <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {t('Bebas Diubah')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Nama yang dilihat rekan di obrolan & server.')}
                  </p>
                </div>

                <div className="flex gap-2 pt-0.5">
                  <Input
                    value={editDisplayNameInput}
                    onChange={(e) => setEditDisplayNameInput(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    maxLength={100}
                    className="text-xs font-medium h-8 bg-card"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingDisplayName || !editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName}
                    className="shrink-0 h-8 text-xs cursor-pointer"
                  >
                    {isSavingDisplayName ? t('Menyimpan...') : t('Simpan')}
                  </Button>
                </div>
              </form>

              {/* Section 2: Unique Username (@handle) with 14-day Cooldown */}
              <form onSubmit={handleUsernameSubmit} className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{t('Username Unik')}</span>
                    </label>
                    <span className="text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {t('Cooldown 14 Hari')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Identifier unik sistem untuk mention (@username).')}
                  </p>
                </div>

                <div className="relative pt-0.5">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                  <Input
                    value={editUsernameInput}
                    onChange={(e) => setEditUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username_anda"
                    disabled={isUsernameCooldownActive}
                    maxLength={32}
                    className="pl-7 text-xs font-mono h-8 bg-card"
                  />
                </div>

                {isUsernameCooldownActive ? (
                  <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('Cooldown Aktif')}</span>
                    </div>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      {t('Username dapat diubah kembali pada:')}{' '}
                      <strong className="text-foreground">
                        {dayjs(usernameCooldownEnd).format('DD MMMM YYYY, HH:mm')}
                      </strong>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-muted-foreground">
                      {t('3-32 karakter: huruf kecil, angka, underscore (_).')}
                    </p>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        isUsernameCooldownActive ||
                        isSavingUsername ||
                        !editUsernameInput.trim() ||
                        editUsernameInput.trim() === currentUser?.username
                      }
                      className="shrink-0 h-8 text-xs cursor-pointer"
                    >
                      {isSavingUsername ? t('Menyimpan...') : t('Simpan Username')}
                    </Button>
                  </div>
                )}
              </form>

              {/* Section 3: Theme Appearance */}
              <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{t('Tampilan & Tema')}</span>
                    </label>
                    <span className="text-[10px] text-foreground/80 font-medium bg-muted px-2 py-0.5 rounded-full border border-border/40">
                      {theme === 'dark' ? 'Dark Mode (AMOLED)' : theme === 'midnight' ? 'Midnight' : 'Light Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Pilih tema tampilan favorit Anda.')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'dark'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-purple-400" />
                    </div>
                    <span>Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('midnight')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'midnight'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#313338] border border-white/20 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-sky-400" />
                    </div>
                    <span>Midnight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      theme === 'light'
                        ? 'border-foreground/50 bg-accent text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-white border border-black/20 flex items-center justify-center">
                      <Sun className="w-3 h-3 text-amber-500" />
                    </div>
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Authenticated Identity Status (Clean & Informative, NO redundant OAuth Connect prompt) */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {currentUser?.email || currentUser?.username || 'Akun Anticeil'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {t('Sesi login terautentikasi dan tersinkronisasi')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('Aktif')}
                </span>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter className={cn('flex items-center w-full', currentUser ? 'justify-between sm:justify-between' : 'justify-end sm:justify-end')}>
          {currentUser && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onLogout();
              }}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('Keluar Akun')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-xs h-8"
          >
            {t('Tutup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
