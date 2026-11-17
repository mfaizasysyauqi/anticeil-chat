import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonySafetySettings } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import { SafetyModals } from './safety/safety-modals';

interface SafetySetupTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function SafetySetupTab({
  activeColony,
  onUpdateColony,
  onClose,
  t,
}: SafetySetupTabProps) {
  const safety = activeColony.safetySettings || {};

  // 1. Raid Protection & CAPTCHA
  const [raidProtection, setRaidProtection] = useState({
    captchaOnJoin: safety.raidProtection?.captchaOnJoin ?? true,
    raidAlerts: safety.raidProtection?.raidAlerts ?? true,
    autoPauseInvites: safety.raidProtection?.autoPauseInvites ?? false,
  });

  // 2. DM and Spam Protection
  const [dmSpamProtection, setDmSpamProtection] = useState({
    filterExplicitMedia: safety.dmSpamProtection?.filterExplicitMedia ?? true,
    blockKnownSpam: safety.dmSpamProtection?.blockKnownSpam ?? true,
    rateLimitNewMembers: safety.dmSpamProtection?.rateLimitNewMembers ?? true,
    warnUnverifiedLinks: safety.dmSpamProtection?.warnUnverifiedLinks ?? true,
    filterInvites: safety.dmSpamProtection?.filterInvites ?? true,
  });

  // 3. AutoMod
  const [autoMod, setAutoMod] = useState({
    blockFlaggedWords: safety.autoMod?.blockFlaggedWords ?? true,
    blockSevereProfanity: safety.autoMod?.blockSevereProfanity ?? false,
    blockSpamRepeated: safety.autoMod?.blockSpamRepeated ?? false,
    blockEveryoneMentions: safety.autoMod?.blockEveryoneMentions ?? false,
    customBlocklist: safety.autoMod?.customBlocklist ?? ['free nitro', 'crypto-airdrop', 'steam-gift-card'],
  });
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // 4. Permissions
  const [permissions, setPermissions] = useState({
    restrictEveryoneMention: safety.permissions?.restrictEveryoneMention ?? true,
    disableUploadsUnverified: safety.permissions?.disableUploadsUnverified ?? false,
    require2faModeration: safety.permissions?.require2faModeration ?? false,
  });

  // Active modal state
  const [activeModal, setActiveModal] = useState<'raid' | 'dm' | 'automod' | 'permissions' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AutoMod Simulator state
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{ allowed: boolean; reason?: string } | null>(null);

  // Load live safety settings on colony change
  useEffect(() => {
    colonyApi.getColonySafety(activeColony.id).then((live) => {
      if (live) {
        if (live.raidProtection) {
          setRaidProtection((p) => ({
            ...p,
            captchaOnJoin: live.raidProtection?.captchaOnJoin ?? p.captchaOnJoin,
            raidAlerts: live.raidProtection?.raidAlerts ?? p.raidAlerts,
            autoPauseInvites: live.raidProtection?.autoPauseInvites ?? p.autoPauseInvites,
          }));
        }
        if (live.dmSpamProtection) {
          setDmSpamProtection((p) => ({
            ...p,
            filterExplicitMedia: live.dmSpamProtection?.filterExplicitMedia ?? p.filterExplicitMedia,
            blockKnownSpam: live.dmSpamProtection?.blockKnownSpam ?? p.blockKnownSpam,
            rateLimitNewMembers: live.dmSpamProtection?.rateLimitNewMembers ?? p.rateLimitNewMembers,
            warnUnverifiedLinks: live.dmSpamProtection?.warnUnverifiedLinks ?? p.warnUnverifiedLinks,
            filterInvites: live.dmSpamProtection?.filterInvites ?? p.filterInvites,
          }));
        }
        if (live.autoMod) {
          setAutoMod((p) => ({
            ...p,
            blockFlaggedWords: live.autoMod?.blockFlaggedWords ?? p.blockFlaggedWords,
            blockSevereProfanity: live.autoMod?.blockSevereProfanity ?? p.blockSevereProfanity,
            blockSpamRepeated: live.autoMod?.blockSpamRepeated ?? p.blockSpamRepeated,
            blockEveryoneMentions: live.autoMod?.blockEveryoneMentions ?? p.blockEveryoneMentions,
            customBlocklist: live.autoMod?.customBlocklist ?? p.customBlocklist,
          }));
        }
        if (live.permissions) {
          setPermissions((p) => ({
            ...p,
            restrictEveryoneMention: live.permissions?.restrictEveryoneMention ?? p.restrictEveryoneMention,
            disableUploadsUnverified: live.permissions?.disableUploadsUnverified ?? p.disableUploadsUnverified,
            require2faModeration: live.permissions?.require2faModeration ?? p.require2faModeration,
          }));
        }
      }
    }).catch(() => {});
  }, [activeColony.id]);

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
      await colonyApi.updateColonySafety(activeColony.id, updatedSettings);
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

  const handleRunSimulator = () => {
    if (!testMessage.trim()) {
      setTestResult(null);
      return;
    }
    const raw = testMessage.toLowerCase();

    // 1. Check @everyone mentions
    if (autoMod.blockEveryoneMentions && (raw.includes('@everyone') || raw.includes('@here'))) {
      setTestResult({
        allowed: false,
        reason: 'Penyebutan @everyone atau @here diblokir oleh aturan AutoMod.',
      });
      return;
    }

    // 2. Check custom keyword blocklist
    const matched = autoMod.customBlocklist.find((k) => k && raw.includes(k.toLowerCase()));
    if (matched) {
      setTestResult({
        allowed: false,
        reason: `Ditemukan kata/frasa terlarang ("${matched}").`,
      });
      return;
    }

    // 3. Check severe profanity
    if (autoMod.blockSevereProfanity) {
      const severeWords = ['anjing', 'bangsat', 'babi', 'kontol', 'memek', 'ngentot', 'fuck', 'bitch', 'asshole'];
      const matchedProf = severeWords.find((w) => raw.includes(w));
      if (matchedProf) {
        setTestResult({
          allowed: false,
          reason: 'Mengandung kata-kata kasar atau ujaran yang dilarang.',
        });
        return;
      }
    }

    setTestResult({ allowed: true });
  };

  return (
    <div className="space-y-6 max-w-3xl pb-16 text-foreground">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">{t('Safety Setup & AutoMod')}</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Active Guard
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('Konfigurasikan perlindungan anti-raid, filter DM & spam, aturan sensor otomatis AutoMod, serta izin keamanan.')}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-xl">
        {/* 1. Raid Protection and CAPTCHA */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Raid Protection and CAPTCHA')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('{{count}} of {{total}} enabled', { count: raidCount, total: 3 })}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('raid')}
            className="h-8 px-4 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 2. DM and Spam Protection */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('DM and Spam Protection')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('{{count}} of {{total}} enabled', { count: dmCount, total: 5 })}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('dm')}
            className="h-8 px-4 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 3. AutoMod */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('AutoMod Rules & Keyword Filter')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('{{count}} of {{total}} enabled', { count: autoModCount, total: 5 })}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('automod')}
            className="h-8 px-4 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>

        {/* 4. Permissions */}
        <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">
                {t('Permissions & Verification Gates')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('{{count}} of {{total}} enabled', { count: permissionsCount, total: 3 })}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal('permissions')}
            className="h-8 px-4 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border/70 rounded-lg cursor-pointer shrink-0"
          >
            {t('Edit')}
          </Button>
        </div>
      </div>

      {/* ── AutoMod Live Simulator Sandbox ── */}
      <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {t('Simulator Uji Coba AutoMod')}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('Uji coba apakah sebuah pesan atau tautan akan terblokir oleh aturan AutoMod komunitas Anda.')}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Input
            value={testMessage}
            onChange={(e) => {
              setTestMessage(e.target.value);
              setTestResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunSimulator();
            }}
            placeholder="contoh: halo @everyone ada promo free nitro atau crypto-airdrop..."
            className="text-xs bg-muted/50 border-border/70 h-9 focus-visible:ring-primary/40"
          />
          <Button
            type="button"
            onClick={handleRunSimulator}
            disabled={!testMessage.trim()}
            className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer shadow-xs"
          >
            {t('Uji Pesan')}
          </Button>
        </div>

        {testResult && (
          <div
            className={cn(
              'p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all',
              testResult.allowed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            )}
          >
            {testResult.allowed ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t('Lolos Pemeriksaan')}</span>: {t('Pesan ini aman dan akan diizinkan oleh AutoMod.')}
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t('Terblokir oleh AutoMod')}</span>: {testResult.reason}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <SafetyModals
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        isSaving={isSaving}
        onSaveSettings={handleSaveSettings}
        raidProtection={raidProtection}
        setRaidProtection={setRaidProtection}
        dmSpamProtection={dmSpamProtection}
        setDmSpamProtection={setDmSpamProtection}
        autoMod={autoMod}
        setAutoMod={setAutoMod}
        newKeywordInput={newKeywordInput}
        setNewKeywordInput={setNewKeywordInput}
        onAddKeyword={handleAddKeyword}
        onRemoveKeyword={handleRemoveKeyword}
        permissions={permissions}
        setPermissions={setPermissions}
        t={t}
      />
    </div>
  );
}
