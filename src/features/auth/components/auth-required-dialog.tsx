import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/core/i18n';
import { Sparkles, Bot, Shield, UserPlus, Building2, Crown } from 'lucide-react';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { isDevLoginEnabled, MOCK_DEV_USERS } from '../hooks/use-auth-session';

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onGuestLogin?: (nickname: string) => void;
  onDevMockLogin?: (userIndex: number) => void;
  onSsoLogin?: (email: string) => void;
  featureTitle?: string;
  featureDescription?: string;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  onGoogleSignIn,
  onGuestLogin,
  onDevMockLogin,
  onSsoLogin,
  featureTitle,
  featureDescription,
}: AuthRequiredDialogProps) {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [ssoEmail, setSsoEmail] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-[16px] select-none">
        {/* Banner with gradient & Anticeil branding */}
        <div className="relative w-full h-28 bg-gradient-to-br from-amber-500/20 via-primary/20 to-purple-500/20 flex flex-col items-center justify-center border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-background/90 p-2 shadow-xl border border-border/80 flex items-center justify-center relative z-10 animate-in zoom-in-95 duration-200">
            <AnticeilLogo className="w-full h-full text-foreground" />
          </div>
        </div>

        <div className="p-5 flex flex-col items-center text-center">
          <DialogHeader className="space-y-1.5 flex flex-col items-center pr-0">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              {featureTitle || t('Masuk ke Anticeil')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-[340px] leading-relaxed">
              {featureDescription ||
                t('Masuk dengan akun Google Anda untuk bergabung ke colony, mengirim pesan, dan terhubung dengan komunitas Anticeil.')}
            </DialogDescription>
          </DialogHeader>

          {/* Action button */}
          <div className="w-full mt-4 space-y-2.5">
            <Button
              type="button"
              onClick={() => {
                onClose();
                onGoogleSignIn();
              }}
              className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2.5 bg-primary text-primary-foreground hover:opacity-95 shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{t('Lanjutkan dengan Google')}</span>
            </Button>

            {/* Quick Guest Mode Join */}
            <div className="w-full pt-2.5 pb-1 text-left space-y-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Atau Masuk sebagai Tamu (Guest Mode)')}</span>
                </span>
                <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/30 text-primary">
                  {t('Tanpa Akun')}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t('Langsung gabung ke aktivitas, Watch Together, atau voice channel tanpa login Google.')}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Input
                  type="text"
                  placeholder={t('Nama panggilan tamu...')}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onClose();
                      onGuestLogin?.(guestName);
                    }
                  }}
                  className="h-9 text-xs rounded-xl bg-muted/40 border-border"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onGuestLogin?.(guestName);
                  }}
                  className="h-9 px-3.5 text-xs font-semibold shrink-0 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                >
                  {t('Masuk Tamu 👤')}
                </Button>
              </div>
            </div>

            {/* Corporate SSO Login (Tier Royal Enterprise) */}
            <div className="w-full pt-2.5 pb-1 text-left space-y-2 border-t border-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('Masuk SSO Akun Perusahaan')}</span>
                </span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[9px] py-0 h-4 gap-1">
                  <Crown className="w-2.5 h-2.5 fill-amber-400" />
                  {t('ROYAL')}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t('Login dengan email kantor (@perusahaan.com). Tanpa register, langsung auto-join Colony kantor Anda.')}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Input
                  type="email"
                  placeholder={t('nama@perusahaan.com...')}
                  value={ssoEmail}
                  onChange={(e) => setSsoEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (ssoEmail.trim()) {
                        onClose();
                        onSsoLogin?.(ssoEmail.trim());
                      }
                    }
                  }}
                  className="h-9 text-xs rounded-xl bg-muted/40 border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (ssoEmail.trim()) {
                      onClose();
                      onSsoLogin?.(ssoEmail.trim());
                    }
                  }}
                  className="h-9 px-3.5 text-xs font-semibold shrink-0 rounded-xl border-amber-500/40 hover:bg-amber-500/15 text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                >
                  {t('Masuk SSO 🏢')}
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              {t('Nanti Saja')}
            </Button>

            {/* Dev / AI Testing Bypass Options (Only shown in Dev / Staging) */}
            {isDevLoginEnabled && (
              <div className="w-full pt-2 mt-2 border-t border-amber-500/20 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    <span>AI Testing / Dev Bypass</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500 py-0 h-4">
                    DEV ONLY
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {MOCK_DEV_USERS.map((usr, idx) => (
                    <Button
                      key={usr.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onDevMockLogin?.(idx);
                      }}
                      className="h-8 px-1.5 text-[10px] font-semibold flex items-center justify-center gap-1 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer"
                      title={`Masuk sebagai ${usr.name}`}
                    >
                      <span className="truncate">{usr.firstName} {usr.lastName}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{t('Gratis & langsung terhubung ke seluruh fitur')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
