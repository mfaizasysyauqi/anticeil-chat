import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Clock,
  UserCheck,
  UserX,
  Users,
  Check,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyAccessSettings, ColonyApplication } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface AccessTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

const EXAMPLE_RULES = [
  'Hormati semua anggota tanpa diskriminasi',
  'Dilarang spamming, promosi tak berizin, atau tautan mencurigakan',
  'Jaga diskusi tetap sesuai topik saluran yang ditentukan',
  'Dilarang membagikan konten dewasa atau yang melanggar hukum',
];

export function AccessTab({
  activeColony,
  onUpdateColony,
  onClose,
  t,
}: AccessTabProps) {
  const initialSettings: ColonyAccessSettings = activeColony.accessSettings || {
    joinMethod: 'invite_only',
    ageRestricted: false,
    rulesEnabled: true,
    rules: [
      'Be civil and respectful to all members.',
      'No spamming, advertising, or self-promotion without permission.',
      'Keep discussions in relevant channels.',
    ],
    screeningQuestions: [
      { id: 'q1', question: 'Mengapa kamu tertarik bergabung dengan colony ini?', required: true },
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
  const [screeningQuestions, setScreeningQuestions] = useState<Array<{ id: string; question: string; required?: boolean }>>(
    initialSettings.screeningQuestions && initialSettings.screeningQuestions.length > 0
      ? initialSettings.screeningQuestions
      : [{ id: 'q1', question: 'Mengapa kamu tertarik bergabung dengan colony ini?', required: true }]
  );
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Applications Management
  const [applications, setApplications] = useState<ColonyApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Fetch access settings and applications on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const live = await colonyApi.getColonyAccess(activeColony.id);
        if (isMounted && live) {
          if (live.joinMethod) setJoinMethod(live.joinMethod);
          if (live.ageRestricted !== undefined) setAgeRestricted(live.ageRestricted);
          if (live.rulesEnabled !== undefined) setRulesEnabled(live.rulesEnabled);
          if (live.rules && live.rules.length > 0) setRules(live.rules);
          if (live.screeningQuestions && live.screeningQuestions.length > 0) {
            setScreeningQuestions(live.screeningQuestions);
          }
        }
      } catch (err) {
        console.error('Failed to load live colony access settings', err);
      }

      setIsLoadingApps(true);
      try {
        const apps = await colonyApi.getColonyApplications(activeColony.id);
        if (isMounted) {
          setApplications(apps);
        }
      } catch (err) {
        console.error('Failed to load colony applications', err);
      } finally {
        if (isMounted) setIsLoadingApps(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeColony.id]);

  // Check if dirty
  const isDirty =
    joinMethod !== (initialSettings.joinMethod || 'invite_only') ||
    ageRestricted !== (initialSettings.ageRestricted ?? false) ||
    rulesEnabled !== (initialSettings.rulesEnabled ?? true) ||
    JSON.stringify(rules) !== JSON.stringify(initialSettings.rules || []) ||
    JSON.stringify(screeningQuestions) !== JSON.stringify(initialSettings.screeningQuestions || []);

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

  const handleAddQuestion = () => {
    const q = newQuestionInput.trim();
    if (!q) return;
    const newId = `q_${Date.now()}`;
    setScreeningQuestions((prev) => [...prev, { id: newId, question: q, required: true }]);
    setNewQuestionInput('');
  };

  const handleRemoveQuestion = (id: string) => {
    setScreeningQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleToggleQuestionRequired = (id: string) => {
    setScreeningQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, required: !q.required } : q))
    );
  };

  const handleApproveApplication = async (appId: string) => {
    setProcessingAppId(appId);
    try {
      await colonyApi.approveColonyApplication(activeColony.id, appId);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'approved' } : a))
      );
      toast.success(t('Permohonan berhasil disetujui'));
    } catch {
      toast.error(t('Gagal menyetujui permohonan'));
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    setProcessingAppId(appId);
    try {
      await colonyApi.rejectColonyApplication(activeColony.id, appId);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'rejected' } : a))
      );
      toast.info(t('Permohonan telah ditolak'));
    } catch {
      toast.error(t('Gagal menolak permohonan'));
    } finally {
      setProcessingAppId(null);
    }
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
    setScreeningQuestions(
      initialSettings.screeningQuestions && initialSettings.screeningQuestions.length > 0
        ? initialSettings.screeningQuestions
        : [{ id: 'q1', question: 'Mengapa kamu tertarik bergabung dengan colony ini?', required: true }]
    );
    setNewRuleInput('');
    setNewQuestionInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedPayload: ColonyAccessSettings = {
      joinMethod,
      ageRestricted,
      rulesEnabled,
      rules,
      screeningQuestions,
    };

    try {
      await colonyApi.updateColonyAccess(activeColony.id, updatedPayload);
      await onUpdateColony(activeColony.id, {
        accessSettings: updatedPayload,
      });
      toast.success(t('Pengaturan akses berhasil disimpan'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan akses'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredApplications = applications.filter((a) => {
    if (appFilter === 'all') return true;
    return a.status === appFilter;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-8 max-w-3xl pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>{t('Access & Membership')}</span>
          <Badge variant="outline" className="text-[11px] border-primary/30 text-primary font-mono font-medium">
            Gatekeeper
          </Badge>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Atur metode verifikasi masuk, permohonan keanggotaan, dan kepatuhan aturan server.')}
        </p>
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
                  <Lock className="w-4 h-4 text-primary" />
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
              'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative',
              joinMethod === 'apply'
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
            )}
          >
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-xs">
                {pendingCount}
              </span>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center text-foreground border border-border/60">
                  <Mail className="w-4 h-4 text-primary" />
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
                  <Globe className="w-4 h-4 text-teal-400" />
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

      {/* SECTION 2: Membership Screening Questions (Visible if joinMethod === 'apply') */}
      {joinMethod === 'apply' && (
        <div className="space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>{t('Screening Questions (Pertanyaan Seleksi Masuk)')}</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('Pertanyaan yang wajib dijawab calon anggota sebelum mengajukan permohonan bergabung.')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newQuestionInput}
                onChange={(e) => setNewQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                placeholder={t('Contoh: Mengapa kamu tertarik bergabung dengan kami?')}
                className="text-xs bg-background/80 border-border/70 h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddQuestion}
                disabled={!newQuestionInput.trim()}
                className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Tambah')}</span>
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              {screeningQuestions.length === 0 ? (
                <div className="py-5 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                  {t('Belum ada pertanyaan seleksi. Tambahkan pertanyaan di atas.')}
                </div>
              ) : (
                screeningQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-background/80 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground font-mono shrink-0">
                        Q{idx + 1}.
                      </span>
                      <span className="text-xs text-foreground font-medium truncate">
                        {q.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionRequired(q.id)}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer',
                          q.required
                            ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                            : 'bg-muted/40 border-border text-muted-foreground'
                        )}
                      >
                        {q.required ? t('Wajib') : t('Opsional')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-muted-foreground hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={t('Hapus pertanyaan')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Membership Applications Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{t('Permohonan Masuk Menunggu Persetujuan')}</span>
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      {pendingCount} Pending
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t('Tinjau jawaban calon anggota dan tentukan penerimaan atau penolakan.')}
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/70 text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAppFilter(filter)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer capitalize',
                      appFilter === filter
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {filter === 'all' ? t('Semua') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Applications */}
            <div className="space-y-2.5">
              {isLoadingApps ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t('Memuat daftar permohonan...')}
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border/70 rounded-xl space-y-1">
                  <UserCheck className="w-6 h-6 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    {t('Tidak ada permohonan keanggotaan')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {appFilter === 'pending'
                      ? t('Semua permohonan telah ditindaklanjuti.')
                      : t('Belum ada pengguna yang mengajukan permohonan.')}
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card/70 hover:border-border transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="w-8 h-8 border border-border shrink-0">
                          <AvatarImage src={app.userAvatar || undefined} />
                          <AvatarFallback className="text-[11px] font-bold bg-primary/20 text-primary">
                            {app.userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate">
                              {app.userName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {app.userId.substring(0, 8)}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 inline" />
                            {new Date(app.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] capitalize font-medium',
                            app.status === 'pending' && 'bg-primary/10 text-primary border-primary/30',
                            app.status === 'approved' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                            app.status === 'rejected' && 'bg-red-500/10 text-red-400 border-red-500/30'
                          )}
                        >
                          {app.status}
                        </Badge>

                        {app.status === 'pending' && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApproveApplication(app.id)}
                              disabled={processingAppId === app.id}
                              className="h-7 px-2.5 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t('Setujui')}</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectApplication(app.id)}
                              disabled={processingAppId === app.id}
                              className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>{t('Tolak')}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Answers Display */}
                    {app.answers && Object.keys(app.answers).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 space-y-1.5 text-xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          {t('Jawaban Seleksi:')}
                        </span>
                        {Object.entries(app.answers).map(([key, val]) => (
                          <div key={key} className="space-y-0.5">
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {key}:
                            </p>
                            <p className="text-xs text-foreground pl-2 border-l border-primary/40 leading-relaxed">
                              {val}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-border/60" />
        </div>
      )}

      {/* SECTION 3: Age-Restricted Server */}
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

      {/* SECTION 4: Server Rules */}
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
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-2xl animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
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
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4 font-semibold cursor-pointer shadow-xs"
            >
              {isSaving ? t('Menyimpan...') : t('Save Changes')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
