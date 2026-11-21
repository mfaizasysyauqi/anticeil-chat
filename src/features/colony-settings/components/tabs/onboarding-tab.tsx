import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Hash,
  Volume2,
  Users,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  HelpCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel, ColonyOnboarding, ColonyOnboardingQuestion } from '@/chat/chat-types';
import { CommunityWelcomeDialog } from '@/features/onboarding/components/community-welcome-dialog';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface OnboardingTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

const TESTIMONIALS = [
  {
    quote:
      'Onboarding let newbies tailor their own unique experience on the server based on how they wanted to engage. It strengthened our retention over 10% since enabling!',
    author: 'Howl, Harry Potter admin',
  },
  {
    quote:
      'Our new members felt instantly guided instead of lost among 30 channels. Setup questions helped assign gaming roles automatically!',
    author: 'Valkyrie, Apex Legends Colony mod',
  },
  {
    quote:
      'The step-by-step welcome guide cut repeated questions in our general chat by more than half.',
    author: 'Estefano, Anticeil Dev Lead',
  },
];

export function OnboardingTab({
  activeColony,
  channels = [],
  onUpdateColony,
  t,
}: OnboardingTabProps) {
  const onboarding = activeColony.onboarding || {};
  const [currentTestimonialIdx, setCurrentTestimonialIdx] = useState(0);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Onboarding state
  const [enabled, setEnabled] = useState(onboarding.enabled ?? false);
  const [welcomeMessage, setWelcomeMessage] = useState(
    onboarding.welcomeMessage ||
      `Hi @${activeColony.role === 'owner' ? 'zmsta' : 'member'}! I made this server so that all of us could have a safe space to connect and build together. Excited to have you here!`
  );

  const [startingChannels, setStartingChannels] = useState<string[]>(
    onboarding.defaultChannelIds || channels.slice(0, 3).map((c) => c.id)
  );

  const [questions, setQuestions] = useState<ColonyOnboardingQuestion[]>(
    onboarding.questions || [
      {
        id: 'q1',
        title: 'Apa yang ingin Anda lakukan di server ini?',
        options: [
          { id: 'opt1', label: '📚 Diskusi dan belajar bersama rekan', channelId: channels[0]?.id },
          { id: 'opt2', label: '🎮 Main bareng dan obrolan santai', channelId: channels[1]?.id },
          { id: 'opt3', label: '🔔 Mendapatkan pengumuman dan berita terbaru', channelId: channels[0]?.id },
        ],
      },
    ]
  );

  const [rules, setRules] = useState<string[]>(
    onboarding.rules || [
      'Bersikap sopan dan saling menghargai sesama anggota.',
      'Dilarang melakukan spam, phishing, atau promosi tanpa izin admin.',
      'Gunakan saluran teks dan suara sesuai dengan fungsinya.',
    ]
  );

  const [requireRulesAgreement, setRequireRulesAgreement] = useState(
    onboarding.requireRulesAgreement ?? true
  );

  const [newRuleInput, setNewRuleInput] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleStartingChannel = (channelId: string) => {
    setStartingChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    setRules((prev) => [...prev, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim()) return;
    const newQ: ColonyOnboardingQuestion = {
      id: `q_${Date.now()}`,
      title: newQuestionTitle.trim(),
      options: [
        { id: `opt_${Date.now()}_1`, label: 'Pilihan Pertama' },
        { id: `opt_${Date.now()}_2`, label: 'Pilihan Kedua' },
      ],
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewQuestionTitle('');
  };

  const handleRemoveQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleSaveOnboarding = async (newEnabledState?: boolean) => {
    setIsSaving(true);
    const targetEnabled = typeof newEnabledState === 'boolean' ? newEnabledState : enabled;
    try {
      const updated: ColonyOnboarding = {
        enabled: targetEnabled,
        welcomeMessage,
        defaultChannelIds: startingChannels,
        questions,
        rules,
        requireRulesAgreement,
      };
      await colonyApi.updateColonyOnboarding(activeColony.id, updated);
      await onUpdateColony(activeColony.id, { onboarding: updated });
      setEnabled(targetEnabled);
      toast.success(
        targetEnabled
          ? t('Alur Onboarding server berhasil diaktifkan & disimpan! 🎉')
          : t('Onboarding server dinonaktifkan.')
      );
      setIsBuilderOpen(false);
    } catch {
      toast.error(t('Gagal menyimpan Onboarding'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 w-full pb-24 text-foreground">
      {/* ── Top Hero: Wooden Signpost Illustration in Teal Aesthetics ── */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5',
              enabled
                ? 'bg-sidebar-primary/20 border-sidebar-primary/50 text-sidebar-primary'
                : 'bg-muted border-border/70 text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                enabled ? 'bg-sidebar-primary animate-pulse' : 'bg-muted-foreground'
              )}
            />
            {enabled ? t('Onboarding Aktif') : t('Onboarding Belum Aktif')}
          </span>
        </div>

        {/* Signpost SVG in Anticeil Teal tokens */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-32 h-32 drop-shadow-xl" viewBox="0 0 140 140" fill="none">
            {/* Wooden post in Teal/Emerald */}
            <path d="M64 40H76V130H64V40Z" fill="#0d9488" rx="4" />
            <path d="M67 40H73V130H67V40Z" fill="#0f766e" />

            {/* Top Sign pointing right */}
            <path
              d="M36 28H100L112 40L100 52H36C33.7909 52 32 50.2091 32 48V32C32 29.7909 33.7909 28 36 28Z"
              fill="#ccfbf1"
            />
            <circle cx="48" cy="40" r="3" fill="#0d9488" />
            <text x="90" y="44" fill="#0d9488" fontSize="16" fontWeight="bold">
              #
            </text>

            {/* Middle Sign pointing left */}
            <path
              d="M104 58H40L28 70L40 82H104C106.209 82 108 80.2091 108 78V62C108 59.7909 106.209 58 104 58Z"
              fill="#99f6e4"
            />
            <circle cx="92" cy="70" r="3" fill="#0f766e" />
            <path
              d="M48 66C48 64.5 50 63 52 63C54 63 56 64.5 56 66C56 68 53 71 52 72C51 71 48 68 48 66Z"
              fill="#0d9488"
            />

            {/* Bottom Sign pointing right */}
            <path
              d="M42 88H96L108 100L96 112H42C39.7909 112 38 110.209 38 108V92C38 89.7909 39.7909 88 42 88Z"
              fill="#ccfbf1"
            />
            <circle cx="54" cy="100" r="3" fill="#0d9488" />
            <circle cx="86" cy="100" r="4" fill="#0d9488" />
            <circle cx="96" cy="100" r="2.5" fill="#0d9488" />
          </svg>
        </div>

        <div className="space-y-2 max-w-lg">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
            {t('Welcome your new members with Onboarding!')}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {t(
              'Customize channels and roles for your new members. Give them the perfect starting experience with rules and tailored questions.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            size="sm"
            variant="teal"
            onClick={() => setIsBuilderOpen(true)}
            className="font-semibold text-xs h-9 px-5 rounded-xl cursor-pointer shadow-md flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>{t('Atur Konfigurasi')}</span>
          </Button>

          <Button
            size="sm"
            variant="tealOutline"
            onClick={() => setIsPreviewOpen(true)}
            className="text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>{t('Lihat Live Preview')}</span>
          </Button>
        </div>
      </div>

      {/* ── Testimonial Quote Card ── */}
      <div className="relative p-6 rounded-2xl bg-card border border-border/70 shadow-sm max-w-2xl mx-auto space-y-4">
        <span className="text-4xl text-muted-foreground/30 font-serif leading-none block">
          “
        </span>
        <p className="text-xs md:text-sm text-foreground/90 italic leading-relaxed">
          {TESTIMONIALS[currentTestimonialIdx].quote}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {TESTIMONIALS[currentTestimonialIdx].author}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentTestimonialIdx((prev) =>
                  prev === 0 ? TESTIMONIALS.length - 1 : prev - 1
                )
              }
              className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentTestimonialIdx((prev) =>
                  prev === TESTIMONIALS.length - 1 ? 0 : prev + 1
                )
              }
              className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 Feature Showcase Cards ── */}
      <div className="space-y-12 pt-4">
        {/* Feature 1: Questions & Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Visual Mockup Card */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-lg space-y-3">
            <span className="text-xs font-bold text-foreground block">
              {questions[0]?.title || t('What do you want to do in this server?')}
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-sidebar-primary/60 bg-sidebar-primary/10 cursor-pointer">
                <span className="text-xs text-foreground font-medium">
                  {questions[0]?.options?.[0]?.label || '📚 Diskusi dan belajar bersama rekan'}
                </span>
                <div className="w-4 h-4 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[10px]">
                  ✓
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40">
                <span className="text-xs text-foreground/80 font-medium">
                  {questions[0]?.options?.[1]?.label || '🎮 Main bareng dan ngobrol santai'}
                </span>
                <div className="w-4 h-4 rounded-full border border-muted-foreground/40" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              {t('Opsi ini otomatis membuka saluran terkait bagi anggota baru.')}
            </p>
          </div>

          {/* Copy description */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-foreground">
              {t('Bantu anggota memilih saluran dan minat favorit')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Buat pertanyaan kustom dan biarkan anggota memilih preferensinya saat pertama kali masuk. Praktis dan memberikan sambutan yang personal.'
              )}
            </p>
          </div>
        </div>

        {/* Feature 2: Welcome Message & Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Copy description */}
          <div className="space-y-2 order-2 md:order-1">
            <h3 className="text-base font-bold text-foreground">
              {t('Sapa setiap anggota baru dengan pesan hangat')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Tulis pesan sambutan langsung dari pemilik atau tim moderator server Anda, lengkap dengan panduan orientasi.'
              )}
            </p>
          </div>

          {/* Visual Mockup Card */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-lg space-y-3.5 order-1 md:order-2">
            <div className="flex items-start gap-3">
              <CommunityAvatar
                name={activeColony.name}
                size={34}
                className="shrink-0 rounded-full"
              />
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-bold text-foreground block">
                  {activeColony.name} Admin 👑
                </span>
                <p className="text-xs text-foreground/90 leading-relaxed bg-muted p-3 rounded-xl border border-border/60">
                  {welcomeMessage}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Choose starting channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Visual Mockup Card */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-lg space-y-2">
            {channels.slice(0, 4).map((c) => {
              const isChecked = startingChannels.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleStartingChannel(c.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground font-medium">
                      {c.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                      isChecked
                        ? 'bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copy description */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-foreground">
              {t('Tentukan saluran pembuka bagi anggota baru')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Hindari anggota baru merasa kewalahan dengan puluhan saluran. Tampilkan saluran penting terlebih dahulu!'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL: Onboarding Setup Builder ── */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent size="md" className="max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border text-foreground shadow-2xl">
          <DialogHeader className="p-5 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="w-4 h-4 text-sidebar-primary" />
              <span>{t('Konfigurasi Onboarding Server')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Atur pesan sambutan, saluran default, pertanyaan preferensi, dan peraturan server.')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {/* 1. Enable Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/70">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  {t('Aktifkan Onboarding Anggota')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t('Tampilkan layar sambutan saat anggota baru bergabung.')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className="cursor-pointer"
              >
                {enabled ? (
                  <ToggleRight className="w-8 h-8 text-sidebar-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* 2. Welcome Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                {t('Pesan Sambutan Admin')}
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                placeholder={t('Tulis sambutan ramah untuk anggota baru...')}
                className="w-full p-2.5 text-xs bg-muted/60 border border-border text-foreground resize-none rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar-primary"
              />
            </div>

            {/* 3. Starting Channels */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                {t('Saluran Pembuka Default (Centang untuk ditampilkan):')}
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {channels.map((c) => {
                  const isChecked = startingChannels.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleStartingChannel(c.id)}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/40 cursor-pointer hover:border-sidebar-primary/50 transition-colors"
                    >
                      <span className="text-xs text-foreground">#{c.name}</span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                          isChecked
                            ? 'bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Onboarding Questions */}
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sidebar-primary" />
                  <span>{t('Pertanyaan Preferensi Anggota')}</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {questions.length} {t('Pertanyaan')}
                </span>
              </div>

              <div className="space-y-2">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {q.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                        title={t('Hapus pertanyaan')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-foreground border border-border/60"
                        >
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddQuestion} className="flex items-center gap-2 pt-1">
                  <Input
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    placeholder={t('Tambah pertanyaan baru (e.g. Minat utama Anda?)...')}
                    className="h-8 text-xs bg-muted/50 border-border"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="teal"
                    className="h-8 text-xs px-3 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('Tambah')}
                  </Button>
                </form>
              </div>
            </div>

            {/* 5. Server Rules */}
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sidebar-primary" />
                  <span>{t('Peraturan Komunitas Server')}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={requireRulesAgreement}
                    onChange={(e) => setRequireRulesAgreement(e.target.checked)}
                    className="rounded text-sidebar-primary focus:ring-sidebar-ring"
                  />
                  <span>{t('Wajibkan persetujuan')}</span>
                </label>
              </div>

              <div className="space-y-1.5">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/30 text-xs text-foreground"
                  >
                    <span className="truncate pr-2">
                      {idx + 1}. {rule}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-muted-foreground hover:text-destructive p-0.5 rounded"
                      title={t('Hapus aturan')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <form onSubmit={handleAddRule} className="flex items-center gap-2 pt-1">
                  <Input
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder={t('Tambah butir peraturan server baru...')}
                    className="h-8 text-xs bg-muted/50 border-border"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="teal"
                    className="h-8 text-xs px-3 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('Tambah')}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBuilderOpen(false)}
              className="text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              variant="teal"
              size="sm"
              onClick={() => handleSaveOnboarding()}
              disabled={isSaving}
              className="text-xs font-semibold px-4"
            >
              {isSaving ? t('Menyimpan...') : t('Simpan Konfigurasi')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Live Preview of Welcome Dialog ── */}
      <CommunityWelcomeDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        activeColony={{
          ...activeColony,
          onboarding: {
            enabled,
            welcomeMessage,
            defaultChannelIds: startingChannels,
            questions,
            rules,
            requireRulesAgreement,
          },
        }}
        channels={channels}
        previewMode={true}
      />
    </div>
  );
}
