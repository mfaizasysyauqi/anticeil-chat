import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  securityApi,
  type TwoFactorStatus,
  type TwoFactorSetupData,
} from '@/features/user-settings/api/security-api';

export interface AccountTwoFactorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  onStatusChange?: (isEnabled: boolean) => void;
}

export function AccountTwoFactorModal({
  open,
  onOpenChange,
  userEmail = 'user@anticeil.com',
  onStatusChange,
}: AccountTwoFactorModalProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TwoFactorStatus>({
    isEnabled: false,
    enabledAt: null,
    hasBackupCodes: false,
    backupCodesRemaining: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup' | 'backup_codes' | 'view_backup'>('initial');

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const s = await securityApi.getTwoFactorStatus();
      setStatus(s);
      onStatusChange?.(s.isEnabled);
    } catch {
      toast.error(t('Gagal memuat status 2FA'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadStatus();
      setStep('initial');
      setVerificationCode('');
      setSetupData(null);
    }
  }, [open]);

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await securityApi.setupTwoFactor(userEmail);
      setSetupData(data);
      setStep('setup');
    } catch {
      toast.error(t('Gagal memulai konfigurasi 2FA'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    if (verificationCode.trim().length !== 6) {
      toast.error(t('Masukkan 6 digit kode dari aplikasi autentikator Anda'));
      return;
    }

    setIsVerifying(true);
    try {
      const res = await securityApi.enableTwoFactor(setupData.secret, verificationCode.trim());
      setBackupCodes(res.backupCodes);
      setStatus({
        isEnabled: true,
        enabledAt: new Date().toISOString(),
        hasBackupCodes: true,
        backupCodesRemaining: res.backupCodes.length,
      });
      onStatusChange?.(true);
      setStep('backup_codes');
      toast.success(t('Autentikasi 2 Faktor (2FA) berhasil diaktifkan! 🛡️'));
    } catch (err: any) {
      toast.error(err.message || t('Kode verifikasi tidak valid, silakan coba lagi'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !confirm(
        t(
          'Apakah Anda yakin ingin menonaktifkan Autentikasi 2 Faktor? Keamanan akun Anda akan berkurang.',
        ),
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await securityApi.disableTwoFactor();
      setStatus({
        isEnabled: false,
        enabledAt: null,
        hasBackupCodes: false,
        backupCodesRemaining: 0,
      });
      onStatusChange?.(false);
      setStep('initial');
      toast.success(t('2FA berhasil dinonaktifkan.'));
    } catch {
      toast.error(t('Gagal menonaktifkan 2FA'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBackupCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await securityApi.getBackupCodes();
      setBackupCodes(codes);
      setStep('view_backup');
    } catch {
      toast.error(t('Gagal memuat kode cadangan'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (
      !confirm(
        t('Apakah Anda yakin ingin membuat ulang kode cadangan? Kode cadangan lama tidak akan berlaku lagi.'),
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const newCodes = await securityApi.regenerateBackupCodes();
      setBackupCodes(newCodes);
      toast.success(t('Kode cadangan baru berhasil dibuat.'));
    } catch {
      toast.error(t('Gagal membuat ulang kode cadangan'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      toast.success(t('Kunci rahasia 2FA disalin ke clipboard'));
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      toast.success(t('Semua kode cadangan disalin'));
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const text = `KODE CADANGAN 2FA ANTICEIL\nAkun: ${userEmail}\nTanggal: ${new Date().toLocaleString()}\n\nSimpan kode ini di tempat yang aman. Setiap kode hanya dapat digunakan satu kali:\n\n${backupCodes.join('\n')}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('File kode cadangan berhasil diunduh'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-6 bg-background border border-border shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Autentikasi Dua Faktor (2FA)')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'Lindungi akun Anticeil Anda dengan lapisan keamanan tambahan menggunakan aplikasi seperti Google Authenticator, Authy, atau 1Password.',
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ── VIEW 1: Already Enabled ─────────────────────────────────────── */}
        {status.isEnabled && step === 'initial' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-emerald-400">
                    {t('2FA Sedang Aktif')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Akun Anda dilindungi dengan kode verifikasi 6 digit.')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleViewBackupCodes}
                className="w-full justify-between h-10 text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <span>{t('Lihat Kode Cadangan (Backup Codes)')}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {status.backupCodesRemaining} {t('tersedia')}
                </span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={isLoading}
                className="w-full h-10 text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-xs"
              >
                {t('Nonaktifkan Autentikasi 2 Faktor')}
              </Button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: Initial Not Enabled ─────────────────────────────────── */}
        {!status.isEnabled && step === 'initial' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground">
                    {t('Aplikasi Autentikator')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(
                      'Gunakan aplikasi seperti Google Authenticator, Microsoft Authenticator, atau Authy di ponsel Anda untuk menghasilkan kode keamanan saat masuk.',
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleStartSetup}
              disabled={isLoading}
              className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
            >
              <Key className="w-4 h-4 mr-2" />
              {t('Mulai Atur 2FA Sekarang')}
            </Button>
          </div>
        )}

        {/* ── VIEW 3: Step 1 & 2 Setup Form ──────────────────────────────── */}
        {step === 'setup' && setupData && (
          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">
                1. {t('Pindai Kode QR ini dengan Aplikasi Autentikator Anda')}
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-white border border-border shadow-xs shrink-0">
                  <img
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="size-36 object-contain"
                  />
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground">
                    {t('Atau masukkan kunci rahasia berikut secara manual:')}
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/60 border border-border">
                    <code className="text-xs font-mono font-bold text-primary truncate flex-1">
                      {setupData.secret}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleCopySecret}
                      className="size-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                      title={t('Salin Kunci')}
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                2. {t('Masukkan 6 Digit Kode dari Aplikasi')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-10 text-center font-mono text-base tracking-[0.3em] font-bold bg-muted/30 border-border text-foreground"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('initial')}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
              >
                {isVerifying ? t('Memverifikasi...') : t('Aktifkan 2FA')}
              </Button>
            </div>
          </form>
        )}

        {/* ── VIEW 4: Backup Codes Screen ─────────────────────────────────── */}
        {(step === 'backup_codes' || step === 'view_backup') && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="leading-relaxed">
                <span className="font-bold">{t('Simpan Kode Cadangan Ini!')}</span>{' '}
                {t('Jika Anda kehilangan akses ke ponsel atau aplikasi autentikator, kode ini adalah satu-satunya cara untuk memulihkan akun.')}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="grid grid-cols-2 gap-2 text-center">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-muted/40 border border-border/60 font-mono font-bold text-xs text-foreground tracking-wider select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCodes}
                className="flex-1 h-9 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodes ? t('Disalin!') : t('Salin Semua')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadBackupCodes}
                className="flex-1 h-9 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('Unduh (.txt)')}</span>
              </Button>
            </div>

            {step === 'view_backup' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerateCodes}
                className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('Buat Ulang Kode Cadangan Baru')}</span>
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                setStep('initial');
                if (step === 'backup_codes') onOpenChange(false);
              }}
              className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
            >
              {t('Selesai')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
