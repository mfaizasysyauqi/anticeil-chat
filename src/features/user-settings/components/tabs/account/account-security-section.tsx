import React, { useState } from 'react';
import { Key, Laptop, ChevronRight, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { securityApi } from '../../../api/security-api';

export interface AccountSecuritySectionProps {
  onOpenDevices?: () => void;
  onOpen2FA?: () => void;
  twoFactorEnabled?: boolean;
  sessionCount?: number;
}

export function AccountSecuritySection({
  onOpenDevices,
  onOpen2FA,
  twoFactorEnabled = false,
  sessionCount = 1,
}: AccountSecuritySectionProps) {
  const { t } = useTranslation();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('Password baru minimal harus 6 karakter'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('Konfirmasi password tidak cocok'));
      return;
    }

    setIsSavingPassword(true);
    try {
      await securityApi.changePassword({
        oldPassword: currentPassword || undefined,
        newPassword,
      });
      toast.success(t('Password berhasil diperbarui!'));
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || t('Gagal memperbarui password'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div id="account-security" className="space-y-3 scroll-mt-4">
      <h3 className="text-sm font-bold text-foreground">
        {t('Password & Security')}
      </h3>

      <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
        {/* Password row */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-foreground">
              {t('Password')}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
              ••••••••••••••••
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsEditingPassword(!isEditingPassword);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
          >
            {isEditingPassword ? t('Batal') : t('Ganti Password')}
          </Button>
        </div>

        {isEditingPassword && (
          <form onSubmit={handlePasswordSubmit} className="p-4 bg-muted/20 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t('Password Saat Ini')}
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('Masukkan password lama')}
                className="text-xs h-9 bg-input border-border text-foreground"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t('Password Baru')}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('Minimal 6 karakter')}
                className="text-xs h-9 bg-input border-border text-foreground"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t('Konfirmasi Password Baru')}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('Ketik ulang password baru')}
                className="text-xs h-9 bg-input border-border text-foreground"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isSavingPassword}
                onClick={() => setIsEditingPassword(false)}
                className="h-8 text-xs font-semibold"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingPassword || !newPassword || newPassword !== confirmPassword}
                className="h-8 text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {t('Menyimpan...')}
                  </>
                ) : (
                  t('Simpan Password Baru')
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Multi-Factor Authentication */}
        <div
          onClick={onOpen2FA}
          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-semibold text-foreground">
                {t('Multi-Factor Authentication')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Amankan akun Anda dengan aplikasi autentikator tambahan.')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {twoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('Aktif')}
              </span>
            ) : (
              <span className="text-muted-foreground group-hover:text-foreground">{t('Set up')}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </div>
        </div>

        {/* Logged-in Devices */}
        <div
          onClick={onOpenDevices}
          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <Laptop className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-semibold text-foreground">
                {t('Logged-in Devices')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Kelola perangkat yang sedang masuk ke akun Anda.')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
            <span>
              {sessionCount} {sessionCount > 1 ? t('devices') : t('device')}
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
