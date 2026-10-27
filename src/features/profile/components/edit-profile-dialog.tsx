import React, { useState, useEffect } from 'react';
import {
  AtSign,
  Clock,
  Moon,
  Sun,
  Palette,
  Sparkles,
  CheckCircle2,
  LogOut,
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
  const [editDisplayNameInput, setEditDisplayNameInput] = useState(currentUserName);
  const [editUsernameInput, setEditUsernameInput] = useState(currentUser?.username || '');

  useEffect(() => {
    if (open) {
      setEditDisplayNameInput(currentUserName);
      setEditUsernameInput(currentUser?.username || '');
    }
  }, [open, currentUserName, currentUser?.username]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <AtSign className="w-5 h-5 text-primary" />
            {!currentUser ? t('Masuk ke Anticeil') : t('Profil & Identitas Akun')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {!currentUser
              ? t('Masuk menggunakan akun Google Anda untuk mengobrol dan berkolaborasi.')
              : t('Kelola Nama Tampilan Anda dan Username unik untuk obrolan serta server.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[75vh] overflow-y-auto [scrollbar-width:thin] pr-1">
          {!currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <div className="space-y-3 p-3.5 rounded-xl border border-border bg-muted/20">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
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
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-card/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
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
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-card/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
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
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-card/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
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
          <form onSubmit={handleDisplayNameSubmit} className="space-y-3 p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  {t('Nama Tampilan (Display Name)')}
                </label>
                <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {t('Bebas Diubah Kapan Saja')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Nama yang dilihat teman di server obrolan. Tidak perlu unik, bebas spasi & karakter.')}
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={editDisplayNameInput}
                onChange={(e) => setEditDisplayNameInput(e.target.value)}
                placeholder="Nama Lengkap Anda"
                maxLength={100}
                className="text-xs font-medium"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSavingDisplayName || !editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName}
                className="shrink-0 cursor-pointer"
              >
                {isSavingDisplayName ? t('Menyimpan...') : t('Simpan')}
              </Button>
            </div>
          </form>

          {/* Section 2: Unique Username (@handle) with 14-day Cooldown */}
          <form onSubmit={handleUsernameSubmit} className="space-y-3 p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>{t('Username Unik')}</span>
                </label>
                <span className="text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {t('Cooldown 14 Hari')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Identifier unik sistem untuk mention (@username) dan undangan tanpa membocorkan email.')}
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">@</span>
              <Input
                value={editUsernameInput}
                onChange={(e) => setEditUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username_anda"
                disabled={isUsernameCooldownActive}
                maxLength={32}
                className="pl-7 text-xs font-mono"
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
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {t('3-32 karakter: huruf kecil, angka, dan underscore (_).')}
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
                  className="shrink-0 cursor-pointer"
                >
                  {isSavingUsername ? t('Menyimpan...') : t('Simpan Username')}
                </Button>
              </div>
            )}
          </form>

          {/* Section 3: Theme Appearance */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>{t('Tampilan & Tema')}</span>
                </label>
                <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                  {theme === 'dark' ? 'Dark Mode (AMOLED)' : theme === 'midnight' ? 'Midnight' : 'Light Mode'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Pilih tema tampilan favorit Anda. Semua komponen otomatis menyesuaikan warna secara konsisten.')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground',
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
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground',
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
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="w-5 h-5 rounded-full bg-white border border-black/20 flex items-center justify-center">
                  <Sun className="w-3 h-3 text-amber-500" />
                </div>
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Section 4: Google OAuth Integration */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>{t('Integrasi Akun Google (Google OAuth)')}</span>
                </label>
                {currentUser?.isGoogleLinked || currentUser?.provider === 'google' ? (
                  <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('Terhubung')}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                    {t('Belum Terhubung')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Tautkan akun Google untuk masuk dengan satu klik melalui Google Sign-In yang aman.')}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {currentUser?.isGoogleLinked || currentUser?.provider === 'google'
                      ? currentUser?.email || 'Google Account'
                      : 'Google Single Sign-On'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {currentUser?.isGoogleLinked || currentUser?.provider === 'google'
                      ? t('Akun Google tertaut aktif')
                      : t('Gunakan akun Google Anda')}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={currentUser?.isGoogleLinked || currentUser?.provider === 'google' ? 'outline' : 'default'}
                onClick={onGoogleSignIn}
                className="shrink-0 text-xs gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                </svg>
                {currentUser?.isGoogleLinked || currentUser?.provider === 'google'
                  ? t('Sinkronkan Ulang')
                  : t('Hubungkan Google')}
              </Button>
            </div>
          </div>
        </>
      )}
        </div>

        <DialogFooter className={cn("flex items-center w-full pt-2", currentUser ? "justify-between sm:justify-between" : "justify-end sm:justify-end")}>
          {currentUser && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onLogout();
              }}
              className="gap-1.5 cursor-pointer"
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
            className="cursor-pointer"
          >
            {t('Tutup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
