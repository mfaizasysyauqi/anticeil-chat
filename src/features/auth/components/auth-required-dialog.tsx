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
import { useTranslation } from '@/core/i18n';
import {
  Sparkles,
  Bot,
  QrCode,
  KeyRound,
} from 'lucide-react';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { isDevLoginEnabled, MOCK_DEV_USERS } from '../hooks/use-auth-session';
import { QrCodeLogin } from './qr-code-login';
import { cn } from '@/lib/utils';

export interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onMicrosoftSignIn?: () => void;
  onOktaSignIn?: () => void;
  onGuestLogin?: (nickname: string) => void;
  onDevMockLogin?: (userIndex: number) => void;
  onSsoLogin?: (email: string, provider?: string) => void;
  onQrLoginSuccess?: (user: any, token: string) => void;
  featureTitle?: string;
  featureDescription?: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4 shrink-0'} viewBox="0 0 24 24">
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
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4 shrink-0'} viewBox="0 0 23 23">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function OktaIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  );
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  onGoogleSignIn,
  onMicrosoftSignIn,
  onOktaSignIn,
  onDevMockLogin,
  onSsoLogin,
  onQrLoginSuccess,
  featureTitle,
  featureDescription,
}: AuthRequiredDialogProps) {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState<'qr' | 'sso'>('qr');

  const handleQrSuccess = (user: any, token: string) => {
    if (onQrLoginSuccess) {
      onQrLoginSuccess(user, token);
    } else {
      localStorage.setItem('token', token);
      localStorage.setItem('ap_token', token);
      localStorage.setItem('anticeil_current_user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
    }
    onClose();
  };

  const handleMicrosoftClick = () => {
    onClose();
    if (onMicrosoftSignIn) {
      onMicrosoftSignIn();
    } else if (onSsoLogin) {
      const email = window.prompt(t('Masukkan email Microsoft 365 / Entra ID Anda:'));
      if (email && email.includes('@')) {
        onSsoLogin(email.trim(), 'Microsoft Entra ID');
      }
    }
  };

  const handleOktaClick = () => {
    onClose();
    if (onOktaSignIn) {
      onOktaSignIn();
    } else if (onSsoLogin) {
      const email = window.prompt(t('Masukkan email Okta / SSO Anda:'));
      if (email && email.includes('@')) {
        onSsoLogin(email.trim(), 'Okta SSO');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" className="max-h-[92vh] overflow-y-auto custom-scrollbar p-0 bg-background border border-border shadow-2xl rounded-2xl select-none">
        {/* Banner with gradient & Anticeil branding */}
        <div className="relative w-full h-20 sm:h-22 bg-gradient-to-br from-amber-500/15 via-primary/20 to-purple-500/15 flex flex-col items-center justify-center border-b border-border/60 shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          <div className="size-11 rounded-2xl bg-background/95 p-2 shadow-lg border border-border/80 flex items-center justify-center relative z-10 animate-in zoom-in-95 duration-200">
            <AnticeilLogo className="size-full text-foreground" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col items-center text-center space-y-3.5">
          <DialogHeader className="space-y-1 flex flex-col items-center text-center pr-0">
            <DialogTitle className="text-base font-bold tracking-tight text-foreground text-center">
              {featureTitle || t('Masuk ke Anticeil')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-xs sm:max-w-sm leading-relaxed text-center">
              {featureDescription ||
                t('Pilih akun untuk melanjutkan ke percakapan, colony, dan aktivitas.')}
            </DialogDescription>
          </DialogHeader>

          {/* ── Mode Switcher Tab (QR Code vs SSO / Email) ── */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border/80 rounded-xl w-full max-w-xs gap-1">
            <button
              type="button"
              onClick={() => setAuthTab('qr')}
              className={cn(
                'py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                authTab === 'qr'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <QrCode className="size-3.5 text-primary" />
              <span>{t('Scan Kode QR')}</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('sso')}
              className={cn(
                'py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                authTab === 'sso'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <KeyRound className="size-3.5 text-amber-500" />
              <span>{t('Akun & SSO')}</span>
            </button>
          </div>

          {/* ── Tab Content: QR Code Login ── */}
          {authTab === 'qr' && (
            <div className="w-full animate-in fade-in duration-200">
              <QrCodeLogin
                onLoginSuccess={handleQrSuccess}
                onSwitchToSso={() => setAuthTab('sso')}
              />
            </div>
          )}

          {/* ── Tab Content: 1-Click Direct SSO Providers (Google, Microsoft, Okta) ── */}
          {authTab === 'sso' && (
            <div className="w-full space-y-2 animate-in fade-in duration-200">
              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onGoogleSignIn();
                }}
                className="w-full h-10 px-3.5 text-xs font-semibold flex items-center justify-center gap-2.5 bg-card hover:bg-muted/80 border-border/80 hover:border-foreground/30 shadow-xs hover:shadow-sm rounded-xl cursor-pointer transition-all"
                title={t('Lanjutkan dengan Akun Google')}
              >
                <GoogleIcon className="size-4 shrink-0" />
                <span className="truncate">{t('Lanjutkan dengan Google')}</span>
              </Button>

              {/* Microsoft 365 Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftClick}
                className="w-full h-10 px-3.5 text-xs font-semibold flex items-center justify-center gap-2.5 bg-card hover:bg-muted/80 border-border/80 hover:border-foreground/30 shadow-xs hover:shadow-sm rounded-xl cursor-pointer transition-all"
                title={t('Lanjutkan dengan Microsoft 365 / Entra ID')}
              >
                <MicrosoftIcon className="size-4 shrink-0" />
                <span className="truncate">{t('Lanjutkan dengan Microsoft')}</span>
              </Button>

              {/* Okta Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleOktaClick}
                className="w-full h-10 px-3.5 text-xs font-semibold flex items-center justify-center gap-2.5 bg-card hover:bg-muted/80 border-border/80 hover:border-foreground/30 shadow-xs hover:shadow-sm rounded-xl cursor-pointer transition-all"
                title={t('Lanjutkan dengan Okta / Auth0')}
              >
                <OktaIcon className="size-4 shrink-0 text-blue-400" />
                <span className="truncate">{t('Lanjutkan dengan Okta')}</span>
              </Button>

              <button
                type="button"
                onClick={() => setAuthTab('qr')}
                className="w-full pt-1 text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-4"
              >
                {t('← Atau masuk dengan Scan Kode QR')}
              </button>
            </div>
          )}

          {/* Close / Later Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            {t('Nanti Saja')}
          </Button>

          {/* Dev / AI Testing Bypass Options (Only shown in Dev / Staging) */}
          {isDevLoginEnabled && (
            <div className="w-full pt-2 mt-1 border-t border-amber-500/20 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <Bot className="size-3" />
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

          {/* Footer note */}
          <div className="pt-1.5 border-t border-border/50 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75 text-center">
            <Sparkles className="size-3 text-amber-500" />
            <span>{t('Gratis & langsung terhubung ke seluruh fitur')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
