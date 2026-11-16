import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony } from '@/chat/chat-types';

interface AccessTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

const EXAMPLE_RULES = [
  'Be civil and respectful',
  'No spam or self-promotion',
  'No age-restricted or obscene content',
  'Help keep things safe',
];

export function AccessTab({
  activeColony,
  onUpdateColony,
  onClose,
  t,
}: AccessTabProps) {
  const initialSettings = activeColony.accessSettings || {
    joinMethod: 'invite_only',
    ageRestricted: false,
    rulesEnabled: true,
    rules: [
      'Be civil and respectful to all members.',
      'No spamming, advertising, or self-promotion without permission.',
      'Keep discussions in relevant channels.',
    ],
  };

  const [joinMethod, setJoinMethod] = useState<'invite_only' | 'apply' | 'discoverable'>(
    initialSettings.joinMethod || 'invite_only'
  );
  const [ageRestricted, setAgeRestricted] = useState(
    initialSettings.ageRestricted ?? false
  );
  const [rulesEnabled, setRulesEnabled] = useState(
    initialSettings.rulesEnabled ?? true
  );
  const [rules, setRules] = useState<string[]>(
    initialSettings.rules && initialSettings.rules.length > 0
      ? initialSettings.rules
      : [
          'Be civil and respectful to all members.',
          'No spamming, advertising, or self-promotion without permission.',
          'Keep discussions in relevant channels.',
        ]
  );
  const [newRuleInput, setNewRuleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Check if dirty
  const isDirty =
    joinMethod !== (initialSettings.joinMethod || 'invite_only') ||
    ageRestricted !== (initialSettings.ageRestricted ?? false) ||
    rulesEnabled !== (initialSettings.rulesEnabled ?? true) ||
    JSON.stringify(rules) !== JSON.stringify(initialSettings.rules || []);

  const handleAddRule = (text?: string) => {
    const toAdd = (text || newRuleInput).trim();
    if (!toAdd) return;
    if (rules.includes(toAdd)) {
      toast.info(t('Aturan ini sudah ada dalam daftar'));
      return;
    }
    setRules((prev) => [...prev, toAdd]);
    if (!text) setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setJoinMethod(initialSettings.joinMethod || 'invite_only');
    setAgeRestricted(initialSettings.ageRestricted ?? false);
    setRulesEnabled(initialSettings.rulesEnabled ?? true);
    setRules(
      initialSettings.rules && initialSettings.rules.length > 0
        ? initialSettings.rules
        : [
            'Be civil and respectful to all members.',
            'No spamming, advertising, or self-promotion without permission.',
            'Keep discussions in relevant channels.',
          ]
    );
    setNewRuleInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateColony(activeColony.id, {
        accessSettings: {
          joinMethod,
          ageRestricted,
          rulesEnabled,
          rules,
        },
      });
      toast.success(t('Pengaturan akses berhasil disimpan'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan akses'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Access')}</h2>
      </div>

      {/* SECTION 1: How can people join your server? */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('How can people join your server?')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Keep your server private, or open it up for more people to join.')}{' '}
            <span className="text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5">
              {t('Learn More')} <ExternalLink className="w-3 h-3 inline" />
            </span>
          </p>
        </div>

        {/* 3 Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Invite Only */}
          <div
            onClick={() => setJoinMethod('invite_only')}
            className={cn(
              'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group',
              joinMethod === 'invite_only'
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center text-foreground border border-border/60">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                    joinMethod === 'invite_only'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {joinMethod === 'invite_only' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  {t('Invite Only')}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  {t('People can join your server directly with an invite')}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Apply to Join */}
          <div
            onClick={() => setJoinMethod('apply')}
            className={cn(
              'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group',
              joinMethod === 'apply'
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center text-foreground border border-border/60">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                    joinMethod === 'apply'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {joinMethod === 'apply' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  {t('Apply to Join')}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  {t('People must submit an application and be approved to join')}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Discoverable */}
          <div
            onClick={() => setJoinMethod('discoverable')}
            className={cn(
              'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group',
              joinMethod === 'discoverable'
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center text-foreground border border-border/60">
                  <Globe className="w-4 h-4 text-purple-400" />
                </div>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                    joinMethod === 'discoverable'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {joinMethod === 'discoverable' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  {t('Discoverable')}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  {t('Anyone can join your server directly through Server Discovery')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* SECTION 2: Age-Restricted Server */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 pr-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('Age-Restricted Server')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('Users will need to confirm they are over the legal age to view the content in this server.')}{' '}
            <span className="text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5">
              {t('Learn more.')}
            </span>
          </p>
        </div>
        <Switch
          checked={ageRestricted}
          onCheckedChange={setAgeRestricted}
          className="shrink-0"
        />
      </div>

      <div className="border-t border-border/60" />

      {/* SECTION 3: Server Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 pr-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('Server Rules')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('Members must agree to rules before they can chat or interact in the server.')}
            </p>
          </div>
          <Switch
            checked={rulesEnabled}
            onCheckedChange={setRulesEnabled}
            className="shrink-0"
          />
        </div>

        {rulesEnabled && (
          <div className="space-y-4 p-4 rounded-xl border border-border/70 bg-card/60 animate-in fade-in-50">
            {/* Input rule */}
            <div className="flex items-center gap-2">
              <Input
                value={newRuleInput}
                onChange={(e) => setNewRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                placeholder={t('Enter a rule...')}
                className="text-xs bg-background/80 border-border/70 h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddRule()}
                disabled={!newRuleInput.trim()}
                className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add a rule')}</span>
              </Button>
            </div>

            {/* Quick example chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {t('Example rules:')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_RULES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleAddRule(example)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 hover:bg-muted/70 text-foreground transition-colors cursor-pointer"
                  >
                    + {example}
                  </button>
                ))}
              </div>
            </div>

            {/* List of rules */}
            <div className="space-y-2 pt-2">
              {rules.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                  {t('Belum ada aturan yang ditambahkan. Tambahkan aturan pertama di atas.')}
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-background/80 hover:border-border transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground font-mono mt-0.5 shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-xs text-foreground leading-relaxed break-words">
                        {rule}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-muted-foreground hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                      title={t('Hapus aturan')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save bar when dirty */}
      {isDirty && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 rounded-xl bg-[#111214] border border-border shadow-2xl animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('Careful — you have unsaved changes!')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer"
            >
              {t('Reset')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 font-semibold cursor-pointer shadow-xs"
            >
              {isSaving ? t('Menyimpan...') : t('Save Changes')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
