import React, { useState } from 'react';
import { Key, Laptop, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export function AccountSecuritySection() {
  const { t } = useTranslation();
  const [isEditingPassword, setIsEditingPassword] = useState(false);

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
            onClick={() => setIsEditingPassword(!isEditingPassword)}
            className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
          >
            {isEditingPassword ? t('Batal') : t('Edit')}
          </Button>
        </div>

        {isEditingPassword && (
          <div className="p-4 bg-muted/20 space-y-3">
            <Input
              type="password"
              placeholder={t('Password Saat Ini')}
              className="text-xs h-9 bg-input border-border text-foreground"
            />
            <Input
              type="password"
              placeholder={t('Password Baru')}
              className="text-xs h-9 bg-input border-border text-foreground"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => {
                  toast.success(t('Password berhasil diperbarui!'));
                  setIsEditingPassword(false);
                }}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                {t('Simpan Password Baru')}
              </Button>
            </div>
          </div>
        )}

        {/* Multi-Factor Authentication */}
        <div
          onClick={() => toast.info(t('Fitur 2FA Authenticator sedang disiapkan!'))}
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
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
            <span>{t('Set up')}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Logged-in Devices */}
        <div
          onClick={() => {
            toast.info(t('4 Perangkat aktif: Windows Desktop App, Chrome Browser, Android App, Web session.'));
          }}
          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <Laptop className="w-4 h-4 text-emerald-500" />
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
            <span>4 devices</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
