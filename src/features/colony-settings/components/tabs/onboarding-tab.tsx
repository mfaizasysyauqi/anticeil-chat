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
import type { Colony, ColonyChannel, ColonyOnboarding } from '@/chat/chat-types';

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

  // Onboarding state
  const [welcomeMessage, setWelcomeMessage] = useState(
    onboarding.welcomeMessage ||
      `Hi @${activeColony.role === 'owner' ? 'zmsta' : 'member'}! I made this server so that all of us could have a safe space to connect and build together. Excited to have you here!`
  );

  const [startingChannels, setStartingChannels] = useState<string[]>(
    onboarding.defaultChannelIds || channels.slice(0, 3).map((c) => c.id)
  );

  const [tasks, setTasks] = useState(
    onboarding.tasks || [
      { id: '1', title: 'Introduce yourself', channelId: channels[0]?.id || 'general' },
      { id: '2', title: 'Read the server rules and guidelines', channelId: channels[1]?.id || 'rules' },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);

  const toggleStartingChannel = (channelId: string) => {
    setStartingChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSaveOnboarding = async () => {
    setIsSaving(true);
    try {
      const updated: ColonyOnboarding = {
        enabled: true,
        welcomeMessage,
        defaultChannelIds: startingChannels,
        tasks,
      };
      await onUpdateColony(activeColony.id, { onboarding: updated });
      toast.success(t('Alur Onboarding server berhasil disimpan! 🎉'));
      setIsBuilderOpen(false);
    } catch {
      toast.error(t('Gagal menyimpan Onboarding'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl pb-24 text-foreground">
      {/* ── Top Hero: Wooden Signpost Illustration (Screenshot 3) ── */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
        {/* Signpost SVG */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-32 h-32 drop-shadow-xl" viewBox="0 0 140 140" fill="none">
            {/* Wooden post */}
            <path d="M64 40H76V130H64V40Z" fill="#5865F2" rx="4" />
            <path d="M67 40H73V130H67V40Z" fill="#4752C4" />

            {/* Top Sign pointing right */}
            <path
              d="M36 28H100L112 40L100 52H36C33.7909 52 32 50.2091 32 48V32C32 29.7909 33.7909 28 36 28Z"
              fill="#E0E1F5"
            />
            <circle cx="48" cy="40" r="3" fill="#5865F2" />
            <text x="90" y="44" fill="#5865F2" fontSize="16" fontWeight="bold">
              #
            </text>

            {/* Middle Sign pointing left */}
            <path
              d="M104 58H40L28 70L40 82H104C106.209 82 108 80.2091 108 78V62C108 59.7909 106.209 58 104 58Z"
              fill="#C4C9F4"
            />
            <circle cx="92" cy="70" r="3" fill="#4752C4" />
            <path
              d="M48 66C48 64.5 50 63 52 63C54 63 56 64.5 56 66C56 68 53 71 52 72C51 71 48 68 48 66Z"
              fill="#5865F2"
            />

            {/* Bottom Sign pointing right */}
            <path
              d="M42 88H96L108 100L96 112H42C39.7909 112 38 110.209 38 108V92C38 89.7909 39.7909 88 42 88Z"
              fill="#E0E1F5"
            />
            <circle cx="54" cy="100" r="3" fill="#5865F2" />
            <circle cx="86" cy="100" r="4" fill="#5865F2" />
            <circle cx="96" cy="100" r="2.5" fill="#5865F2" />
          </svg>
        </div>

        <div className="space-y-2 max-w-lg">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
            {t('Welcome your new members with Onboarding!')}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {t(
              'Customize channels and roles for your new members. Give them the perfect starting experience.'
            )}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsBuilderOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-6 rounded-lg cursor-pointer shadow-md"
        >
          {t('Check it out')}
        </Button>
      </div>

      {/* ── Testimonial Quote Card (Screenshot 3) ── */}
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

      {/* ── 3 Feature Showcase Cards (Screenshot 4) ── */}
      <div className="space-y-12 pt-4">
        {/* Feature 1: Questions & Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Visual Mockup Card */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-lg space-y-3">
            <span className="text-xs font-bold text-foreground block">
              {t('What do you want to do in this server?')}
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/60 bg-primary/10 cursor-pointer">
                <span className="text-xs text-foreground font-medium">
                  📚 {t('Discuss cool books and stories')}
                </span>
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px]">
                  ✓
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40">
                <span className="text-xs text-foreground/80 font-medium">
                  🎤 {t('Join the weekly book club & voice')}
                </span>
                <div className="w-4 h-4 rounded-full border border-muted-foreground/40" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40">
                <span className="text-xs text-foreground/80 font-medium">
                  📰 {t('Keep up with book release news')}
                </span>
                <div className="w-4 h-4 rounded-full border border-muted-foreground/40" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              {t('You will be added to @Books and #book-chat channel')}
            </p>
          </div>

          {/* Copy description */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-foreground">
              {t('Help members pick additional channels and roles')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Create customization questions and ask members to answer them before or after joining. Hassle-free and easy to use, for both you and your members!'
              )}
            </p>
          </div>
        </div>

        {/* Feature 2: Welcome Message & Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Copy description */}
          <div className="space-y-2 order-2 md:order-1">
            <h3 className="text-base font-bold text-foreground">
              {t('Say hi to every member and help them engage')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Create a custom welcome message and instructions for getting started. You can also show members resource pages for FAQ, Rules, and more.'
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

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground font-medium">
                    {t('Introduce yourself')}
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground font-medium">
                    {t('Share your favorite thing')}
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
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
                        ? 'bg-primary border-primary text-primary-foreground'
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
              {t('Choose which channels new members start with')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "Give them a set of channels that's just the stuff they care about. Hide any unwanted Archives or bot-spam. Less overwhelming, more chatting!"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL: Onboarding Setup Builder ── */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="sm:max-w-[520px] bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t('Konfigurasi Onboarding Server')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Atur pesan sambutan dan saluran pembuka default bagi anggota baru.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t('Pesan Sambutan Admin')}
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs bg-muted border border-border text-foreground resize-none rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {t('Saluran Pembuka Default (Centang untuk ditampilkan):')}
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                {channels.map((c) => {
                  const isChecked = startingChannels.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleStartingChannel(c.id)}
                      className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted cursor-pointer"
                    >
                      <span className="text-xs text-foreground">#{c.name}</span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center',
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
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
          </div>

          <DialogFooter className="gap-2">
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
              size="sm"
              onClick={handleSaveOnboarding}
              disabled={isSaving}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? t('Menyimpan...') : t('Aktifkan Onboarding')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
