import React, { useState } from 'react';
import {
  ShieldAlert,
  MessageSquare,
  Bot,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonySafetySettings } from '@/chat/chat-types';

interface SafetySetupTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

export function SafetySetupTab({
  activeColony,
  onUpdateColony,
  onClose,
  t,
}: SafetySetupTabProps) {
  const safety = activeColony.safetySettings || {};

  // 1. Raid Protection & CAPTCHA (default 2 of 3)
  const [raidProtection, setRaidProtection] = useState({
    captchaOnJoin: safety.raidProtection?.captchaOnJoin ?? true,
    raidAlerts: safety.raidProtection?.raidAlerts ?? true,
    autoPauseInvites: safety.raidProtection?.autoPauseInvites ?? false,
  });

  // 2. DM and Spam Protection (default 5 of 5)
  const [dmSpamProtection, setDmSpamProtection] = useState({
    filterExplicitMedia: safety.dmSpamProtection?.filterExplicitMedia ?? true,
    blockKnownSpam: safety.dmSpamProtection?.blockKnownSpam ?? true,
    rateLimitNewMembers: safety.dmSpamProtection?.rateLimitNewMembers ?? true,
    warnUnverifiedLinks: safety.dmSpamProtection?.warnUnverifiedLinks ?? true,
    filterInvites: safety.dmSpamProtection?.filterInvites ?? true,
  });

  // 3. AutoMod (default 1 of 5)
  const [autoMod, setAutoMod] = useState({
    blockFlaggedWords: safety.autoMod?.blockFlaggedWords ?? true,
    blockSevereProfanity: safety.autoMod?.blockSevereProfanity ?? false,
    blockSpamRepeated: safety.autoMod?.blockSpamRepeated ?? false,
    blockEveryoneMentions: safety.autoMod?.blockEveryoneMentions ?? false,
    customBlocklist: safety.autoMod?.customBlocklist ?? ['free nitro', 'crypto-airdrop', 'steam-gift-card'],
  });
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // 4. Permissions (default 1 of 3)
  const [permissions, setPermissions] = useState({
    restrictEveryoneMention: safety.permissions?.restrictEveryoneMention ?? true,
    disableUploadsUnverified: safety.permissions?.disableUploadsUnverified ?? false,
    require2faModeration: safety.permissions?.require2faModeration ?? false,
  });

  // Active modal state
  const [activeModal, setActiveModal] = useState<'raid' | 'dm' | 'automod' | 'permissions' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Compute enabled counts
  const raidCount = Object.values(raidProtection).filter(Boolean).length;
  const dmCount = Object.values(dmSpamProtection).filter(Boolean).length;
  const autoModCount =
    (autoMod.blockFlaggedWords ? 1 : 0) +
    (autoMod.blockSevereProfanity ? 1 : 0) +
    (autoMod.blockSpamRepeated ? 1 : 0) +
    (autoMod.blockEveryoneMentions ? 1 : 0) +
    (autoMod.customBlocklist.length > 0 ? 1 : 0);
  const permissionsCount = Object.values(permissions).filter(Boolean).length;

  const handleSaveSettings = async (sectionName: string) => {
    setIsSaving(true);
    try {
      const updatedSettings: ColonySafetySettings = {
        raidProtection,
        dmSpamProtection,
        autoMod,
        permissions,
      };
      await onUpdateColony(activeColony.id, { safetySettings: updatedSettings });
      toast.success(t(`Pengaturan ${sectionName} berhasil diperbarui! 🛡️`));
      setActiveModal(null);
    } catch {
      toast.error(t('Gagal menyimpan pengaturan keamanan'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKeyword = () => {
    const val = newKeywordInput.trim().toLowerCase();
    if (!val) return;
    if (autoMod.customBlocklist.includes(val)) {
      toast.info(t('Kata ini sudah ada di daftar'));
      return;
    }
    setAutoMod((prev) => ({
      ...prev,
      customBlocklist: [...prev.customBlocklist, val],
    }));
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setAutoMod((prev) => ({
      ...prev,
      customBlocklist: prev.customBlocklist.filter((k) => k !== keyword),
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      {/* Header (Screenshot 1) */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Safety Setup')}</h2>
      </div>

      {/* Main Container Card (Screenshot 1 Discord Parity) */}
      <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden shadow-xl">
        {/* 1. Raid Protection and CAPTCHA */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Raid Protection and CAPTCHA')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(`${raidCount} of 3 enabled`)}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('raid')}
            className="h-8 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 2. DM and Spam Protection */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('DM and Spam Protection')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(`${dmCount} of 5 enabled`)}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('dm')}
            className="h-8 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 3. AutoMod */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('AutoMod')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(`${autoModCount} of 5 enabled`)}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('automod')}
            className="h-8 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 4. Permissions */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Permissions')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(`${permissionsCount} of 3 enabled`)}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('permissions')}
            className="h-8 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>
      </div>

      {/* ── MODAL 1: Raid Protection & CAPTCHA ── */}
      <Dialog open={activeModal === 'raid'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>{t('Raid Protection and CAPTCHA')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Lindungi server Anda dari serangan bot otomatis dan gelombang join masif.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 divide-y divide-border/50">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Require CAPTCHA for suspicious joins')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Wajibkan verifikasi Cloudflare Turnstile saat mendeteksi aktivitas join mencurigakan.')}
                </span>
              </div>
              <Switch
                checked={raidProtection.captchaOnJoin}
                onCheckedChange={(val) => setRaidProtection((p) => ({ ...p, captchaOnJoin: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Automated Raid Alerts to moderators')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Kirim notifikasi instan ke admin jika laju join melebihi ambang batas normal.')}
                </span>
              </div>
              <Switch
                checked={raidProtection.raidAlerts}
                onCheckedChange={(val) => setRaidProtection((p) => ({ ...p, raidAlerts: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Auto-pause invites during sudden influx')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Jeda seluruh tautan undangan secara otomatis jika terdeteksi serangan raid.')}
                </span>
              </div>
              <Switch
                checked={raidProtection.autoPauseInvites}
                onCheckedChange={(val) => setRaidProtection((p) => ({ ...p, autoPauseInvites: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
              {t('Batal')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveSettings('Raid Protection')}
              disabled={isSaving}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: DM and Spam Protection ── */}
      <Dialog open={activeModal === 'dm'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <MessageSquare className="w-4 h-4" />
              <span>{t('DM and Spam Protection')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Cegah spam pesan, link jebakan, dan konten eksplisit yang menyasar anggota server.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 divide-y divide-border/50 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Scan direct messages for explicit media')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Pindai gambar atau video eksplisit dalam obrolan sesama anggota server.')}
                </span>
              </div>
              <Switch
                checked={dmSpamProtection.filterExplicitMedia}
                onCheckedChange={(val) => setDmSpamProtection((p) => ({ ...p, filterExplicitMedia: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Block messages containing known spam phrases')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Blokir pesan yang cocok dengan database spam dan penipuan phishing.')}
                </span>
              </div>
              <Switch
                checked={dmSpamProtection.blockKnownSpam}
                onCheckedChange={(val) => setDmSpamProtection((p) => ({ ...p, blockKnownSpam: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Rate limit rapid messages from new members')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Terapkan cooldown pesan otomatis untuk anggota baru (di bawah 10 menit bergabung).')}
                </span>
              </div>
              <Switch
                checked={dmSpamProtection.rateLimitNewMembers}
                onCheckedChange={(val) => setDmSpamProtection((p) => ({ ...p, rateLimitNewMembers: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Warn members before opening unverified links')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Tampilkan popup peringatan keamanan saat pengguna mengklik link di luar domain resmi.')}
                </span>
              </div>
              <Switch
                checked={dmSpamProtection.warnUnverifiedLinks}
                onCheckedChange={(val) => setDmSpamProtection((p) => ({ ...p, warnUnverifiedLinks: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Filter suspicious invite links in chat')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Cegah anggota mempromosikan atau mengirim link invite server lain tanpa izin.')}
                </span>
              </div>
              <Switch
                checked={dmSpamProtection.filterInvites}
                onCheckedChange={(val) => setDmSpamProtection((p) => ({ ...p, filterInvites: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
              {t('Batal')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveSettings('DM and Spam Protection')}
              disabled={isSaving}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: AutoMod ── */}
      <Dialog open={activeModal === 'automod'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-indigo-400">
              <Bot className="w-4 h-4" />
              <span>{t('AutoMod Rules')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Sistem moderasi otomatis berbasis aturan dan kata kunci untuk menyaring pesan berbahaya.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 divide-y divide-border/50 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Block commonly flagged words')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Blokir kata-kata kasar dan hinaan yang sering dilaporkan komunitas.')}
                </span>
              </div>
              <Switch
                checked={autoMod.blockFlaggedWords}
                onCheckedChange={(val) => setAutoMod((p) => ({ ...p, blockFlaggedWords: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Block severe profanity and hate speech')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Deteksi otomatis ujaran kebencian, diskriminasi, dan ancaman.')}
                </span>
              </div>
              <Switch
                checked={autoMod.blockSevereProfanity}
                onCheckedChange={(val) => setAutoMod((p) => ({ ...p, blockSevereProfanity: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Block spam content & repeated character flooding')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Cegah pengiriman teks berulang-ulang atau pemanjangan karakter secara masif.')}
                </span>
              </div>
              <Switch
                checked={autoMod.blockSpamRepeated}
                onCheckedChange={(val) => setAutoMod((p) => ({ ...p, blockSpamRepeated: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Block mentions of @everyone by non-admins')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Cegah ping massal yang mengganggu seluruh server.')}
                </span>
              </div>
              <Switch
                checked={autoMod.blockEveryoneMentions}
                onCheckedChange={(val) => setAutoMod((p) => ({ ...p, blockEveryoneMentions: val }))}
              />
            </div>

            {/* Custom Word Blocklist */}
            <div className="space-y-2 pt-3">
              <span className="text-xs font-semibold text-foreground block">
                {t('Custom Keyword Blocklist')}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder={t('Tambahkan kata yang ingin diblokir...')}
                  className="text-xs bg-[#111214] border-border/70 h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddKeyword}
                  className="h-8 px-3 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {autoMod.customBlocklist.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] text-foreground border border-border/60"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-muted-foreground hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
              {t('Batal')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveSettings('AutoMod')}
              disabled={isSaving}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: Permissions ── */}
      <Dialog open={activeModal === 'permissions'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#1e1f22] border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('Permissions Security')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pengaturan keamanan hak akses krusial untuk mencegah penyalahgunaan peran.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 divide-y divide-border/50">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Restrict @everyone role mention permission')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Hanya moderator dan admin yang diizinkan melakukan mention @everyone.')}
                </span>
              </div>
              <Switch
                checked={permissions.restrictEveryoneMention}
                onCheckedChange={(val) => setPermissions((p) => ({ ...p, restrictEveryoneMention: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Disable attachment uploads for unverified accounts')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Cegah akun tamu atau akun tanpa verifikasi mengunggah file media.')}
                </span>
              </div>
              <Switch
                checked={permissions.disableUploadsUnverified}
                onCheckedChange={(val) => setPermissions((p) => ({ ...p, disableUploadsUnverified: val }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  {t('Require 2FA for moderation actions')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {t('Wajibkan autentikasi dua faktor untuk kick, ban, dan modifikasi peran.')}
                </span>
              </div>
              <Switch
                checked={permissions.require2faModeration}
                onCheckedChange={(val) => setPermissions((p) => ({ ...p, require2faModeration: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} className="text-xs">
              {t('Batal')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveSettings('Permissions')}
              disabled={isSaving}
              className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
