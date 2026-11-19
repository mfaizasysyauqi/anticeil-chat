import React, { useState } from 'react';
import {
  Building2,
  Crown,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Lock,
  Globe,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface EnterpriseSsoTabProps {
  activeColony: Colony;
  channels: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

export function EnterpriseSsoTab({
  activeColony,
  channels,
  onUpdateColony,
  t,
}: EnterpriseSsoTabProps) {
  const currentTier = activeColony.tier || 'free';
  const isRoyal = currentTier === 'royal';

  const [ssoEnabled, setSsoEnabled] = useState(activeColony.ssoEnabled ?? true);
  const [ssoProvider, setSsoProvider] = useState<'google_workspace' | 'microsoft_azure' | 'okta' | 'generic_oidc'>(
    activeColony.ssoProvider || 'google_workspace'
  );
  const [domains, setDomains] = useState<string[]>(activeColony.allowedEmailDomains || []);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [defaultChannelId, setDefaultChannelId] = useState(
    activeColony.defaultChannelId || (channels.find((c) => c.type === 'text')?.id || '')
  );
  const [domainVerified, setDomainVerified] = useState(activeColony.domainVerified ?? false);
  const [verificationToken, setVerificationToken] = useState(
    activeColony.domainVerificationToken || `anticeil-verify=${activeColony.id.slice(0, 8)}`
  );
  const [ssoEnforced, setSsoEnforced] = useState(activeColony.ssoEnforced ?? false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const textChannels = channels.filter((c) => !c.type || c.type === 'text');

  const handleUpgradeToRoyal = async () => {
    setIsUpgrading(true);
    try {
      await onUpdateColony(activeColony.id, {
        tier: 'royal',
        ssoEnabled: true,
        domainVerificationToken: verificationToken,
      });
      toast.success(t('Selamat! Colony Anda telah berhasil di-upgrade ke Tier Royal 👑'), {
        description: t('Fitur Enterprise SSO dan Domain Capture kini telah aktif.'),
      });
    } catch {
      toast.error(t('Gagal mengaktifkan Tier Royal.'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddDomain = () => {
    let clean = newDomainInput.trim().toLowerCase();
    if (!clean) return;
    if (clean.includes('@')) {
      clean = clean.split('@')[1];
    }
    // Remove protocol or slashes if user pasted url
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    if (!clean.includes('.')) {
      toast.error(t('Format domain tidak valid. Contoh: perusahaan.com'));
      return;
    }

    if (domains.includes(clean)) {
      toast.info(t('Domain sudah ada dalam daftar.'));
      return;
    }

    const next = [...domains, clean];
    setDomains(next);
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter((d) => d !== domainToRemove));
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verificationToken);
    toast.success(t('Token verifikasi TXT berhasil disalin ke clipboard!'));
  };

  const handleVerifyDns = async () => {
    setIsVerifying(true);
    try {
      const res = await colonyApi.verifyColonyDomain(activeColony.id, domains[0] || 'corporate.com');
      if (res.success) {
        setDomainVerified(true);
        if (res.token) setVerificationToken(res.token);
        await onUpdateColony(activeColony.id, {
          domainVerified: true,
          domainVerificationToken: res.token || verificationToken,
        });
        toast.success(t('DNS Record berhasil diverifikasi! Domain terotentikasi secara sah 🛡️'));
      }
    } catch {
      toast.error(t('Gagal memverifikasi DNS domain.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateColony(activeColony.id, {
        tier: isRoyal ? 'royal' : currentTier,
        ssoEnabled,
        ssoProvider,
        allowedEmailDomains: domains,
        defaultChannelId,
        domainVerified,
        domainVerificationToken: verificationToken,
        ssoEnforced,
      });
      toast.success(t('Pengaturan Enterprise & SSO berhasil disimpan!'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            {t('Enterprise SSO & Domain Capture')}
          </h2>
          {isRoyal ? (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1 px-2.5 py-0.5">
              <Crown className="h-3 w-3 fill-amber-400" />
              ROYAL TIER
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
              {currentTier.toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            'The SSO Wall & Domain Capture Pattern: Karyawan otomatis bergabung ke colony saat login dengan email perusahaan tanpa butuh link undangan.'
          )}
        </p>
      </div>

      {/* Tier Royal Status / Upgrade Banner */}
      {!isRoyal ? (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-background p-6 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
            <Crown className="w-48 h-48 text-amber-500" />
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                {t('Buka Akses Tier Royal (Enterprise Sovereign)')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                {t(
                  'Tier Royal didesain untuk perusahaan dan organisasi profesional. Dapatkan integrasi SSO terpusat, Domain Capture instan untuk seluruh karyawan, audit log tak terbatas, dan dukungan SLA prioritas.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/50">
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{t('Zero-friction JIT onboarding via email kantor')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/50">
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{t('Dukungan Google Workspace, Microsoft 365, & Okta')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/50">
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{t('Verifikasi kepemilikan domain via DNS TXT Record')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/50">
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{t('10x Colony Boosts gratis & unlimited cloud storage')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
            <div>
              <span className="text-xs text-muted-foreground">{t('Investasi Enterprise')}</span>
              <div className="text-sm font-bold text-foreground">
                Rp 499.000 <span className="text-xs text-muted-foreground font-normal">/ colony / bulan</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleUpgradeToRoyal}
              disabled={isUpgrading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer"
            >
              {isUpgrading ? t('Mengaktifkan Tier Royal...') : t('Upgrade ke Tier Royal Sekarang 👑')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {t('Colony Aktif di Tier Royal 👑')}
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-emerald-500/30">
                  {t('Sovereign Enterprise')}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('Domain capture dan JIT employee auto-join diaktifkan untuk colony ini.')}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdateColony(activeColony.id, { tier: 'free' })}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            {t('Downgrade ke Free')}
          </Button>
        </div>
      )}

      {/* Main SSO Controls (Always available if Royal, or previewable) */}
      <div className={cn('space-y-6', !isRoyal && 'opacity-60 pointer-events-none')}>
        {/* Toggle SSO */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t('Aktifkan SSO & Domain Auto-Join')}
            </div>
            <div className="text-xs text-muted-foreground max-w-md">
              {t(
                'Saat diaktifkan, siapapun yang login dengan email domain yang terdaftar akan otomatis menjadi anggota Colony ini.'
              )}
            </div>
          </div>
          <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} />
        </div>

        {/* Identity Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {t('Penyedia Identitas SSO (IdP)')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'google_workspace', label: 'Google Workspace', desc: 'Google OAuth & Directory' },
              { id: 'microsoft_azure', label: 'Microsoft 365', desc: 'Entra ID (Azure AD)' },
              { id: 'okta', label: 'Okta / JumpCloud', desc: 'SAML 2.0 & OIDC' },
              { id: 'generic_oidc', label: 'Generic OIDC', desc: 'Custom SAML / OpenID' },
            ].map((p) => {
              const active = ssoProvider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSsoProvider(p.id as any)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20',
                    active
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:border-border/80'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-foreground">{p.label}</span>
                    <Radio className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground/30')} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Allowed Email Domains */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {t('Domain Email Perusahaan yang Diizinkan')}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {domains.length} {t('domain terdaftar')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                @
              </span>
              <Input
                type="text"
                placeholder={t('perusahaan.com atau kantor.id...')}
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                className="pl-7 h-9 text-xs rounded-xl bg-background"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddDomain}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('Tambah Domain')}
            </Button>
          </div>

          {/* List of active domains */}
          {domains.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {domains.map((d) => (
                <div
                  key={d}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-foreground font-medium"
                >
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>@{d}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(d)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    title={t('Hapus domain')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
              {t('Belum ada domain perusahaan yang didaftarkan. Tambahkan domain seperti "tokopedia.com".')}
            </div>
          )}
        </div>

        {/* DNS TXT Verification Section */}
        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-amber-500" />
                {t('Verifikasi Kepemilikan Domain (DNS TXT Record)')}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Cegah domain hijacking dengan memverifikasi kepemilikan DNS domain Anda.')}
              </p>
            </div>
            {domainVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('Terverifikasi')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1 text-[11px]">
                <Clock className="h-3.5 w-3.5" />
                {t('Menunggu Verifikasi')}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <span className="text-[10px] text-muted-foreground block">{t('Tipe Record')}</span>
              <span className="font-mono font-semibold text-foreground">TXT</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <span className="text-[10px] text-muted-foreground block">{t('Host / Name')}</span>
              <span className="font-mono font-semibold text-foreground">@ atau _anticeil</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground block">{t('Nilai TXT Record')}</span>
              <span className="font-mono text-xs text-foreground truncate block">{verificationToken}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyToken}
              className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              {t('Salin')}
            </Button>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isVerifying || domainVerified}
              onClick={handleVerifyDns}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {domainVerified
                ? t('Domain Sudah Terverifikasi')
                : isVerifying
                ? t('Memeriksa DNS...')
                : t('Verifikasi DNS Sekarang')}
            </Button>
          </div>
        </div>

        {/* Default Landing Channel */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {t('Saluran Onboarding Karyawan Pertama Kali')}
          </label>
          <p className="text-xs text-muted-foreground">
            {t('Karyawan yang baru pertama kali login akan langsung diarahkan ke saluran ini.')}
          </p>
          <select
            value={defaultChannelId}
            onChange={(e) => setDefaultChannelId(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {textChannels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Enforce SSO Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              {t('Wajibkan Autentikasi SSO (Enforce SSO)')}
            </div>
            <div className="text-xs text-muted-foreground max-w-md">
              {t(
                'Tolak akses bagi siapapun yang masuk tanpa email perusahaan yang terverifikasi. Link undangan publik akan dinonaktifkan.'
              )}
            </div>
          </div>
          <Switch checked={ssoEnforced} onCheckedChange={setSsoEnforced} />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-10 px-6 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-md cursor-pointer"
          >
            {isSaving ? t('Menyimpan...') : t('Simpan Perubahan Enterprise')}
          </Button>
        </div>
      </div>
    </div>
  );
}
