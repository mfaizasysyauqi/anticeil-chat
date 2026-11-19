import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Check,
  Hash,
  Volume2,
  ShieldCheck,
  ChevronRight,
  PartyPopper,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel, ColonyOnboarding } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface CommunityWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeColony: Colony;
  channels?: ColonyChannel[];
  previewMode?: boolean;
  onComplete?: () => void;
}

export function CommunityWelcomeDialog({
  isOpen,
  onClose,
  activeColony,
  channels = [],
  previewMode = false,
  onComplete,
}: CommunityWelcomeDialogProps) {
  const { t } = useTranslation();
  const onboarding = activeColony.onboarding || {};

  const welcomeMessage =
    onboarding.welcomeMessage ||
    `Selamat datang di ${activeColony.name}! Kami senang Anda bisa bergabung dengan komunitas kami. Silakan pilih minat dan baca aturan untuk memulai obrolan.`;

  const startingChannelIds = onboarding.defaultChannelIds || channels.slice(0, 3).map((c) => c.id);
  const startingChannels = channels.filter((c) => startingChannelIds.includes(c.id));

  const questions = onboarding.questions || [
    {
      id: 'q1',
      title: 'Apa yang ingin Anda lakukan di server ini?',
      options: [
        { id: 'opt1', label: '📚 Diskusi dan belajar bersama rekan' },
        { id: 'opt2', label: '🎮 Main bareng dan ngobrol santai' },
        { id: 'opt3', label: '🔔 Mendapatkan pengumuman dan berita terbaru' },
      ],
    },
  ];

  const rules = onboarding.rules || [
    'Bersikap sopan dan saling menghargai sesama anggota.',
    'Dilarang melakukan spam, phishing, atau promosi tanpa izin admin.',
    'Gunakan saluran teks dan suara sesuai dengan fungsinya.',
  ];

  const requireRulesAgreement = onboarding.requireRulesAgreement ?? true;

  // Answers state: { [questionId]: optionId }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (questions[0]?.options?.[0]) {
      initial[questions[0].id] = questions[0].options[0].id;
    }
    return initial;
  });

  const [hasAgreedRules, setHasAgreedRules] = useState(!requireRulesAgreement);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionId ? '' : optionId,
    }));
  };

  const handleFinish = async () => {
    if (requireRulesAgreement && !hasAgreedRules) {
      toast.error(t('Harap setujui peraturan server terlebih dahulu.'));
      return;
    }

    if (previewMode) {
      toast.success(t('Tes preview Onboarding berhasil! Layar ini siap untuk anggota baru. 🎉'));
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await colonyApi.completeColonyOnboarding(activeColony.id, {
        answers: selectedAnswers,
        agreedRules: hasAgreedRules,
      });
      // Store in localStorage that user completed onboarding for this colony
      try {
        localStorage.setItem(`anticeil_onboarded_${activeColony.id}`, 'true');
      } catch {}
      toast.success(t(`Selamat datang di ${activeColony.name}! Selamat mengobrol! 🚀`));
      onComplete?.();
      onClose();
    } catch {
      toast.error(t('Gagal menyelesaikan Onboarding. Silakan coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/80 shadow-2xl text-foreground">
        {/* Header Hero Banner */}
        <div className="relative p-6 bg-gradient-to-br from-sidebar-primary/20 via-background to-emerald-950/20 border-b border-border/60 shrink-0">
          {previewMode && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/50 text-sidebar-primary text-[10px] font-bold tracking-wide uppercase">
              {t('Mode Preview')}
            </div>
          )}

          <div className="flex items-center gap-4">
            <CommunityAvatar
              name={activeColony.name}
              size={54}
              className="rounded-2xl border-2 border-sidebar-primary/40 shadow-lg shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground truncate">
                  {activeColony.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/30">
                  {t('Komunitas Resmi')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {activeColony.description || t('Selamat datang di server komunitas Anticeil kami!')}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Welcome Message Card */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-sidebar-primary" />
              <span>{t('Pesan Sambutan dari Pengelola')}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/50 p-3 rounded-lg border border-border/50">
              "{welcomeMessage}"
            </p>
          </div>

          {/* Questions Section */}
          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sidebar-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Personalisasi Pengalaman Anda')}
                </h3>
              </div>

              {questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    {q.title}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => toggleOption(q.id, opt.id)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-sidebar-primary/15 border-sidebar-primary text-sidebar-primary shadow-xs'
                              : 'bg-secondary/40 border-border/70 text-muted-foreground hover:border-sidebar-primary/50 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="truncate">{opt.label}</span>
                          </div>
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-2',
                              isSelected
                                ? 'bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Starting Channels Preview */}
          {startingChannels.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {t('Saluran yang Siap Digunakan:')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {startingChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/60"
                  >
                    <div className="p-1 rounded-md bg-sidebar-primary/10 text-sidebar-primary">
                      {ch.type === 'voice' ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <Hash className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">
                        {ch.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {ch.description || t('Saluran umum')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Rules Agreement */}
          <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-sidebar-primary" />
              <span>{t('Peraturan Komunitas Server')}</span>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground pl-1">
              {rules.map((rule, idx) => (
                <li key={idx} className="leading-relaxed">
                  {rule}
                </li>
              ))}
            </ol>

            {requireRulesAgreement && (
              <label className="flex items-start gap-2.5 pt-2 border-t border-border/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAgreedRules}
                  onChange={(e) => setHasAgreedRules(e.target.checked)}
                  className="mt-0.5 rounded border-border text-sidebar-primary focus:ring-sidebar-ring cursor-pointer"
                />
                <span className="text-xs font-medium text-foreground">
                  {t('Saya telah membaca dan menyetujui semua peraturan server di atas.')}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between sm:justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('Tutup')}
          </Button>

          <Button
            type="button"
            variant="teal"
            size="sm"
            onClick={handleFinish}
            disabled={isSubmitting || (requireRulesAgreement && !hasAgreedRules)}
            className="text-xs font-bold px-5 h-9 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
          >
            <span>{isSubmitting ? t('Menyimpan...') : t('Mulai Menjelajah Saluran')}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
