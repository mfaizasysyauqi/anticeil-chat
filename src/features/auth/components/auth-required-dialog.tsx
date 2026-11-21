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
import {
  Sparkles,
  Bot,
  Shield,
  UserPlus,
  Building2,
  Crown,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { isDevLoginEnabled, MOCK_DEV_USERS } from '../hooks/use-auth-session';
import { cn } from '@/lib/utils';

export interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onMicrosoftSignIn?: () => void;
  onGuestLogin?: (nickname: string) => void;
  onDevMockLogin?: (userIndex: number) => void;
  onSsoLogin?: (email: string, provider?: string) => void;
  featureTitle?: string;
  featureDescription?: string;
}

export type SsoProvider = 'google_workspace' | 'microsoft_entra' | 'okta_saml';

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
  onGuestLogin,
  onDevMockLogin,
  onSsoLogin,
  featureTitle,
  featureDescription,
}: AuthRequiredDialogProps) {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [ssoEmail, setSsoEmail] = useState('');
  const [selectedIdp, setSelectedIdp] = useState<SsoProvider>('google_workspace');

  const handleSsoSubmit = () => {
    const email = ssoEmail.trim();
    if (!email || !email.includes('@')) {
      return;
    }
    const providerName =
      selectedIdp === 'google_workspace'
        ? 'Google Workspace'
        : selectedIdp === 'microsoft_entra'
        ? 'Microsoft Entra ID'
        : 'Okta SAML 2.0';
    onClose();
    onSsoLogin?.(email, providerName);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" className="max-h-[92vh] overflow-y-auto custom-scrollbar p-0 bg-background border border-border shadow-2xl rounded-2xl select-none">
        {/* Banner with gradient & Anticeil branding */}
        <div className="relative w-full h-24 sm:h-28 bg-gradient-to-br from-amber-500/20 via-primary/20 to-purple-500/20 flex flex-col items-center justify-center border-b border-border/60 shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          <div className="size-13 sm:size-14 rounded-2xl bg-background/90 p-2 shadow-xl border border-border/80 flex items-center justify-center relative z-10 animate-in zoom-in-95 duration-200">
            <AnticeilLogo className="size-full text-foreground" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col items-center text-center space-y-4">
          <DialogHeader className="space-y-1.5 flex flex-col items-center pr-0">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              {featureTitle || t('Masuk ke Anticeil')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-[360px] leading-relaxed">
              {featureDescription ||
                t('Masuk dengan akun pribadi Anda atau hubungkan email kantor untuk Single Sign-On (SSO).')}
            </DialogDescription>
          </DialogHeader>

          {/* ── 1. Direct Dual OAuth: Google & Microsoft 365 (Entra ID) ── */}
          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onGoogleSignIn();
                }}
                className="h-11 px-3 text-xs font-semibold flex items-center justify-center gap-2 bg-card hover:bg-muted/80 border-border/80 hover:border-foreground/30 shadow-xs hover:shadow-sm rounded-xl cursor-pointer transition-all"
                title={t('Lanjutkan dengan Akun Google')}
              >
                <GoogleIcon className="size-4 shrink-0" />
                <span className="truncate">{t('Lanjutkan Google')}</span>
              </Button>

              {/* Microsoft 365 (Entra ID) Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftClick}
                className="h-11 px-3 text-xs font-semibold flex items-center justify-center gap-2 bg-card hover:bg-muted/80 border-border/80 hover:border-foreground/30 shadow-xs hover:shadow-sm rounded-xl cursor-pointer transition-all"
                title={t('Lanjutkan dengan Microsoft 365 / Entra ID')}
              >
                <MicrosoftIcon className="size-4 shrink-0" />
                <span className="truncate">{t('Lanjutkan Microsoft')}</span>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative w-full flex items-center justify-center my-0.5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Atau Single Sign-On (SSO)')}
            </span>
          </div>

          {/* ── 2. Prominent Corporate SSO & Domain Capture (Royal Enterprise) ── */}
          <div className="w-full rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-500/10 via-card/75 to-card p-3.5 sm:p-4 text-left space-y-3 shadow-md relative overflow-hidden">
            {/* Header with Royal Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="size-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Building2 className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {t('Masuk SSO Akun Perusahaan')}
                  </h4>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[9px] font-bold py-0 h-4 gap-1 shrink-0">
                <Crown className="size-2.5 fill-amber-400" />
                {t('ROYAL ENTERPRISE')}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('Login dengan email kantor (@perusahaan.com). Tanpa register, otomatis terhubung ke Colony kantor Anda via JIT Provisioning.')}
            </p>

            {/* Provider Selector Tabs: Google Workspace | Microsoft Entra | Okta SAML */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-background/80 border border-border/60">
              <button
                type="button"
                onClick={() => setSelectedIdp('google_workspace')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none',
                  selectedIdp === 'google_workspace'
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                title={t('Google Workspace SAML & OIDC')}
              >
                <GoogleIcon className="size-3.5 shrink-0" />
                <span className="truncate">Google</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIdp('microsoft_entra')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none',
                  selectedIdp === 'microsoft_entra'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                title={t('Microsoft Entra ID / Office 365 Tenant')}
              >
                <MicrosoftIcon className="size-3.5 shrink-0" />
                <span className="truncate">Entra ID</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIdp('okta_saml')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none',
                  selectedIdp === 'okta_saml'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                title={t('Okta Verify SAML 2.0 Identity Provider')}
              >
                <OktaIcon className="size-3.5 shrink-0 text-blue-400" />
                <span className="truncate">Okta / SAML</span>
              </button>
            </div>

            {/* Email Input & Submit */}
            <div className="flex items-center gap-2 pt-0.5">
              <Input
                type="email"
                placeholder={
                  selectedIdp === 'google_workspace'
                    ? t('nama@workspace-perusahaan.com...')
                    : selectedIdp === 'microsoft_entra'
                    ? t('nama@corp.onmicrosoft.com...')
                    : t('nama@okta-domain.com...')
                }
                value={ssoEmail}
                onChange={(e) => setSsoEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSsoSubmit();
                  }
                }}
                className="h-9 text-xs rounded-xl bg-background/90 border-border"
              />
              <Button
                type="button"
                onClick={handleSsoSubmit}
                className="h-9 px-3.5 text-xs font-bold shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-black shadow-md cursor-pointer transition-all"
                title={t('Lanjutkan login SSO perusahaan')}
              >
                <span>{t('Masuk SSO')}</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>

            {/* SSO Perks Footer */}
            <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-400" />
                <span>{t('JIT Auto-Provisioning')}</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="size-3 text-amber-400" />
                <span>{t('Domain Auto-Capture')}</span>
              </span>
            </div>
          </div>

          {/* ── 3. Quick Guest Mode Join ── */}
          <div className="w-full pt-1 text-left space-y-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-primary" />
                <span>{t('Atau Masuk sebagai Tamu (Guest Mode)')}</span>
              </span>
              <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/30 text-primary">
                {t('Tanpa Akun')}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {t('Langsung gabung ke aktivitas, Watch Together, atau voice channel tanpa login.')}
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

          {/* Close / Later Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            {t('Nanti Saja')}
          </Button>

          {/* Dev / AI Testing Bypass Options (Only shown in Dev / Staging) */}
          {isDevLoginEnabled && (
            <div className="w-full pt-2 mt-1 border-t border-amber-500/20 text-left space-y-2">
              <div className="flex items-center justify-between">
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
          <div className="pt-2 border-t border-border/50 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
            <Sparkles className="size-3 text-amber-500" />
            <span>{t('Gratis & langsung terhubung ke seluruh fitur')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
