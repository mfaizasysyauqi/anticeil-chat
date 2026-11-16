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
import { SafetyModals } from './safety/safety-modals';

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
