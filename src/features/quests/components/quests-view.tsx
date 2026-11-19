import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Check,
  Sparkles,
  Menu,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Flame,
  Award,
  Clock,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { QuestsHeader } from './quests-header';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { questsApi, type QuestItem } from '../api/quests-api';
import { shopApi, type ShopBalance } from '@/features/shop/api/shop-api';

export interface QuestsViewProps {
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
  onNavigateShop?: () => void;
  onLaunchActivity?: (appId: string) => void;
}

export function QuestsView({
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
  onNavigateShop,
  onLaunchActivity,
}: QuestsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'claimed'>('all');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [claimedQuests, setClaimedQuests] = useState<QuestItem[]>([]);
  const [balance, setBalance] = useState<ShopBalance>({ dew: 1500, currencyCode: 'IDR' });
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'suggested' | 'reward_desc' | 'alphabetical'>('suggested');
  const [searchQuery, setSearchQuery] = useState('');

  // Quest CRUD State
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestItem | null>(null);
  const [isSubmittingQuest, setIsSubmittingQuest] = useState(false);
  const [questForm, setQuestForm] = useState({
    title: '',
    subtitle: '',
    category: 'activity' as 'activity' | 'game' | 'social' | 'profile',
    promoter: 'Anticeil Activities',
    coverUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    badge: 'Baru',
    rewardDew: 300,
    target: 5,
    unit: 'kali',
    actionLabel: 'Mulai',
    appId: '',
  });

  const handleOpenCreateQuest = () => {
    setEditingQuest(null);
    setQuestForm({
      title: '',
      subtitle: '',
      category: 'activity',
      promoter: 'Anticeil Community',
      coverUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      badge: 'Baru',
      rewardDew: 300,
      target: 5,
      unit: 'kali',
      actionLabel: 'Mulai',
      appId: '',
    });
    setIsQuestModalOpen(true);
  };

  const handleOpenEditQuest = (quest: QuestItem) => {
    setEditingQuest(quest);
    setQuestForm({
      title: quest.title,
      subtitle: quest.subtitle,
      category: quest.category || 'activity',
      promoter: quest.promoter,
      coverUrl: quest.coverUrl,
      badge: quest.badge || '',
      rewardDew: quest.rewardDew || 100,
      target: quest.target || 1,
      unit: quest.unit || 'kali',
      actionLabel: quest.actionLabel || 'Mulai',
      appId: quest.appId || '',
    });
    setIsQuestModalOpen(true);
  };

  const handleSaveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questForm.title.trim()) {
      toast.error(t('Judul quest tidak boleh kosong'));
      return;
    }
    setIsSubmittingQuest(true);
    try {
      if (editingQuest) {
        const res = await questsApi.updateQuest(editingQuest.id, questForm);
        if (res.success && res.quest) {
          setQuests((prev) => prev.map((q) => (q.id === editingQuest.id ? res.quest! : q)));
          toast.success(res.message || t('Quest berhasil diperbarui'));
          setIsQuestModalOpen(false);
        } else {
          toast.error(res.message || t('Gagal memperbarui quest'));
        }
      } else {
        const res = await questsApi.createQuest(questForm);
        if (res.success && res.quest) {
          setQuests((prev) => [res.quest!, ...prev]);
          toast.success(res.message || t('Quest baru berhasil ditambahkan'));
          setIsQuestModalOpen(false);
        } else {
          toast.error(res.message || t('Gagal membuat quest'));
        }
      }
    } catch {
      toast.error(t('Terjadi kesalahan koneksi'));
    } finally {
      setIsSubmittingQuest(false);
    }
  };

  const handleDeleteQuest = async (e: React.MouseEvent, questId: string) => {
    e.stopPropagation();
    if (!window.confirm(t('Hapus quest ini dari database?'))) return;
    try {
      const res = await questsApi.deleteQuest(questId);
      if (res.success) {
        setQuests((prev) => prev.filter((q) => q.id !== questId));
        toast.success(res.message || t('Quest berhasil dihapus'));
      } else {
        toast.error(res.message || t('Gagal menghapus quest'));
      }
    } catch {
      toast.error(t('Gagal menghapus quest'));
    }
  };

  // Load Quests & Dew Balance
  const fetchQuestsData = async () => {
    setIsLoading(true);
    try {
      const [questsRes, claimedRes, balRes] = await Promise.all([
        questsApi.getQuests(),
        questsApi.getClaimedQuests(),
        shopApi.getBalance(),
      ]);
      if (Array.isArray(questsRes)) {
        setQuests(questsRes);
      }
      if (Array.isArray(claimedRes)) {
        setClaimedQuests(claimedRes);
      }
      if (balRes) {
        setBalance(balRes);
      }
    } catch (err) {
      console.warn('Failed to fetch quests from API', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestsData();
    const handleBalanceChanged = (e: any) => {
      if (e.detail) {
        setBalance(e.detail);
      } else {
        shopApi.getBalance().then((b) => b && setBalance(b));
      }
    };
    window.addEventListener('anticeil_balance_changed', handleBalanceChanged);
    return () => window.removeEventListener('anticeil_balance_changed', handleBalanceChanged);
  }, []);

  // Accept a quest
  const handleAcceptQuest = async (quest: QuestItem) => {
    try {
      const res = await questsApi.acceptQuest(quest.id);
      if (res.success && res.quest) {
        setQuests((prev) => prev.map((q) => (q.id === quest.id ? res.quest! : q)));
        toast.success(res.message);
      } else {
        // Local optimistic fallback
        setQuests((prev) =>
          prev.map((q) => (q.id === quest.id ? { ...q, status: 'in_progress' } : q))
        );
        toast.success(t('Quest diterima! Selesaikan misi untuk mendapatkan Dew. 🎯'));
      }
    } catch {
      toast.error(t('Gagal menerima quest'));
    }
  };

  // Progress or simulate activity action
  const handleProgressQuest = async (quest: QuestItem) => {
    try {
      const res = await questsApi.updateProgress(quest.id, 1);
      if (res.success && res.quest) {
        setQuests((prev) => prev.map((q) => (q.id === quest.id ? res.quest! : q)));
        toast.success(res.message);
      } else {
        // Local fallback
        const newProg = Math.min(quest.target, quest.progress + 1);
        const newStatus = newProg >= quest.target ? 'completed' : 'in_progress';
        setQuests((prev) =>
          prev.map((q) => (q.id === quest.id ? { ...q, progress: newProg, status: newStatus } : q))
        );
        if (newStatus === 'completed') {
          toast.success(t('Quest selesai! Klik tombol Klaim Dew untuk mengambil hadiah Anda. 🎉'));
        }
      }

      if (quest.appId && onLaunchActivity) {
        onLaunchActivity(quest.appId);
      }
    } catch {
      toast.error(t('Gagal memperbarui quest'));
    }
  };

  // Claim quest reward (F2P Dew Currency!)
  const handleClaimReward = async (quest: QuestItem) => {
    try {
      const res = await questsApi.claimQuest(quest.id);
      if (res.success) {
        toast.success(res.message || t(`Berhasil mengklaim +${quest.rewardDew} Dew! 💧🎉`));
        if (res.newBalance) {
          setBalance(res.newBalance);
          window.dispatchEvent(new CustomEvent('anticeil_balance_changed', { detail: res.newBalance }));
        } else {
          setBalance((prev) => {
            const next = { ...prev, dew: prev.dew + quest.rewardDew };
            window.dispatchEvent(new CustomEvent('anticeil_balance_changed', { detail: next }));
            return next;
          });
        }
        setQuests((prev) =>
          prev.map((q) =>
            q.id === quest.id ? { ...q, status: 'claimed', progress: q.target } : q
          )
        );
        try {
          const freshClaimed = await questsApi.getClaimedQuests();
          if (Array.isArray(freshClaimed) && freshClaimed.length > 0) {
            setClaimedQuests(freshClaimed);
          } else {
            setClaimedQuests((prev) => [
              { ...quest, status: 'claimed', claimedAt: new Date().toISOString() },
              ...prev.filter((c) => c.id !== quest.id),
            ]);
          }
        } catch {
          setClaimedQuests((prev) => [
            { ...quest, status: 'claimed', claimedAt: new Date().toISOString() },
            ...prev.filter((c) => c.id !== quest.id),
          ]);
        }
      } else {
        toast.error(res.message || t('Gagal mengklaim reward'));
      }
    } catch {
      toast.error(t('Terjadi kesalahan saat mengklaim'));
    }
  };

  // Filtered & sorted available quests
  const filteredQuests = useMemo(() => {
    let list = [...quests];
    if (filterCategory !== 'all') {
      list = list.filter((q) => q.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.promoter.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'reward_desc') {
      list.sort((a, b) => b.rewardDew - a.rewardDew);
    } else if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [quests, filterCategory, sortBy, searchQuery]);

  const heroQuest = quests[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── 1. Reusable App Bar Header (DRY & 100% Consistent, No Shop Button) ── */}
      <QuestsHeader
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        claimedCount={claimedQuests.length}
        dewBalance={balance?.dew ?? 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. Main Content Area ── */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none lg:[scrollbar-width:thin] space-y-8', horizontalPadding, verticalPadding)}>
        {activeTab === 'all' ? (
          <>
            {/* ── Featured Hero Quest Banner (Discord 1:1) ── */}
            {heroQuest && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/25 via-card to-background border border-primary/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2.5 max-w-xl z-10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                      <Sparkles className="w-3 h-3" /> {heroQuest.badge || t('QUEST UNGGULAN')}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {heroQuest.promoter}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                    {heroQuest.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {heroQuest.subtitle}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="px-3 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-black flex items-center gap-1.5 shadow-xs">
                      <span>💧</span>
                      <span>+{heroQuest.rewardDew} Dew (F2P Money)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0">
                  {heroQuest.status === 'completed' ? (
                    <Button
                      size="lg"
                      onClick={() => handleClaimReward(heroQuest)}
                      className="font-bold h-11 px-6 gap-2 cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t('Klaim 💧')} {heroQuest.rewardDew} {t('Dew')}</span>
                    </Button>
                  ) : heroQuest.status === 'in_progress' ? (
                    <Button
                      size="lg"
                      onClick={() => handleProgressQuest(heroQuest)}
                      className="font-bold h-11 px-6 gap-2 cursor-pointer shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{heroQuest.actionLabel || t('Lanjutkan Quest')}</span>
                    </Button>
                  ) : heroQuest.status === 'claimed' ? (
                    <div className="h-11 px-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{t('Hadiah Sudah Diklaim')}</span>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => handleAcceptQuest(heroQuest)}
                      className="font-bold h-11 px-6 gap-2 cursor-pointer shadow-lg"
                    >
                      <span>{t('Terima Quest')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditQuest(heroQuest)}
                      className="h-11 px-3 text-xs font-semibold gap-1 cursor-pointer bg-card/60 backdrop-blur-xs"
                      title={t('Edit Quest')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleDeleteQuest(e, heroQuest.id)}
                      className="h-11 px-3 text-xs font-semibold gap-1 cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground bg-card/60 backdrop-blur-xs"
                      title={t('Hapus Quest')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* ── Active Promoted Quests Carousel Row (Discord 1:1) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quests.slice(0, 3).map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between gap-3 shadow-xs relative overflow-hidden group hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
                      {q.promoter}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black">
                      <span>💧</span>
                      <span>{q.rewardDew} Dew</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {q.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {q.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {q.progress} / {q.target} {q.unit}
                    </span>

                    {q.status === 'completed' ? (
                      <Button
                        size="xs"
                        onClick={() => handleClaimReward(q)}
                        className="h-7 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        {t('Klaim')}
                      </Button>
                    ) : q.status === 'in_progress' ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleProgressQuest(q)}
                        className="h-7 px-3 text-xs font-semibold cursor-pointer"
                      >
                        {t('Lanjut')}
                      </Button>
                    ) : q.status === 'claimed' ? (
                      <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {t('Selesai')}
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleAcceptQuest(q)}
                        className="h-7 px-3 text-xs font-semibold cursor-pointer"
                      >
                        {t('Terima')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Available Quests Section Header & Filter Controls ── */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {t('Available Quests')}
                  </h3>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    ({filteredQuests.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Create Quest Button (Fullstack CRUD) */}
                  <Button
                    size="sm"
                    onClick={handleOpenCreateQuest}
                    className="h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('Tambah Quest')}</span>
                  </Button>

                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-7 px-2.5 rounded-md border border-border/70 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          {sortBy === 'suggested'
                            ? t('Suggested')
                            : sortBy === 'reward_desc'
                            ? t('Hadiah Tertinggi')
                            : t('Nama (A-Z)')}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-card border-border z-[150] text-foreground">
                      <DropdownMenuItem onClick={() => setSortBy('suggested')} className="text-xs cursor-pointer">
                        {t('Suggested')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('reward_desc')} className="text-xs cursor-pointer">
                        {t('Hadiah Tertinggi')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('alphabetical')} className="text-xs cursor-pointer">
                        {t('Nama (A-Z)')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter category dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-7 px-2.5 rounded-md border border-border/70 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                        <span>{t('Filters')}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-card border-border z-[150] text-foreground">
                      <DropdownMenuItem onClick={() => setFilterCategory('all')} className="text-xs cursor-pointer font-semibold">
                        {t('Semua Kategori')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterCategory('game')} className="text-xs cursor-pointer">
                        {t('Game & Rekreasi')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterCategory('activity')} className="text-xs cursor-pointer">
                        {t('Aktivitas Video')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterCategory('social')} className="text-xs cursor-pointer">
                        {t('Komunitas & Chat')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterCategory('profile')} className="text-xs cursor-pointer">
                        {t('Kustomisasi Profil')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ── Quests Cards Grid (Discord 1:1 Layout) ── */}
              {filteredQuests.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-xl border border-dashed border-border/80 p-8">
                  <div className="size-16 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-3xl select-none">
                    🎯
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-foreground">{t('Belum Ada Quest')}</h4>
                    <p className="text-xs text-muted-foreground">{t('Database quest kosong atau tidak ada quest yang cocok dengan filter pencarian Anda.')}</p>
                  </div>
                  <Button size="sm" onClick={handleOpenCreateQuest} className="gap-1.5 text-xs font-semibold cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('Tambah Quest Pertama')}</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuests.map((quest) => {
                    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

                    return (
                      <div
                        key={quest.id}
                        className="rounded-xl border border-border bg-card flex flex-col justify-between overflow-hidden shadow-xs hover:border-primary/50 transition-all group relative"
                      >
                        {/* Quest Artwork Banner */}
                        <div className="relative h-36 bg-[#111214] overflow-hidden">
                          <img
                            src={quest.coverUrl}
                            alt={quest.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

                          {quest.badge && (
                            <span className="absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
                              {quest.badge}
                            </span>
                          )}

                          {/* Hover Edit & Delete Buttons (Fullstack CRUD) */}
                          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditQuest(quest);
                              }}
                              className="size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-md"
                              title={t('Edit Quest')}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteQuest(e, quest.id)}
                              className="size-7 rounded-md bg-destructive/20 hover:bg-destructive hover:text-destructive-foreground text-destructive border border-destructive/30 flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-md"
                              title={t('Hapus Quest')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {quest.promoter}
                          </span>
                        </div>

                      {/* Quest Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {quest.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {quest.subtitle}
                          </p>
                        </div>

                        {/* Reward Box with Glowing Dew Gem */}
                        <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-sm shadow-xs animate-pulse">
                              💧
                            </div>
                            <div>
                              <div className="text-xs font-black text-cyan-400">
                                Claim {quest.rewardDew} Dew
                              </div>
                              <div className="text-[10px] font-semibold text-muted-foreground">
                                Free-to-Play Currency
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            1.0x
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                            <span>
                              {quest.progress} / {quest.target} {quest.unit}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                          {quest.status === 'completed' ? (
                            <Button
                              size="sm"
                              onClick={() => handleClaimReward(quest)}
                              className="w-full h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md animate-bounce"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              <span>{t('Klaim 💧')} {quest.rewardDew} {t('Dew')}</span>
                            </Button>
                          ) : quest.status === 'in_progress' ? (
                            <div className="w-full flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProgressQuest(quest)}
                                className="flex-1 h-8 text-xs font-semibold cursor-pointer"
                              >
                                <span>{quest.actionLabel || t('Jalankan')}</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleProgressQuest(quest)}
                                className="h-8 px-3 text-xs font-semibold cursor-pointer"
                                title={t('Tambahkan Progress')}
                              >
                                +1
                              </Button>
                            </div>
                          ) : quest.status === 'claimed' ? (
                            <div className="w-full h-8 rounded-md bg-muted/50 border border-border/60 text-muted-foreground font-semibold flex items-center justify-center gap-1.5 text-xs">
                              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                              <span>{t('Hadiah Telah Diklaim')}</span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptQuest(quest)}
                              className="w-full h-8 text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              <span>{t('Accept Quest')}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </>
        ) : (
          /* ── Claimed Quests Tab View (Discord 1:1) ── */
          <div>
            {claimedQuests.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                {/* Cute Discord-style empty illustration */}
                <div className="size-28 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-5xl shadow-inner select-none">
                  🧭
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-bold text-foreground">
                    {t("You haven't completed any Quests yet!")}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('Selesaikan quest di tab All Quests untuk mengumpulkan Dew gratis dan membuka kosmetik profil.')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                  className="font-semibold text-xs h-8 px-4 cursor-pointer"
                >
                  {t('See all Quests')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {t('Riwayat Quest yang Telah Selesai')} ({claimedQuests.length})
                  </h3>
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <span>💧 Total Dew Didapat:</span>
                    <span>+{claimedQuests.reduce((acc, q) => acc + q.rewardDew, 0)} Dew</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {claimedQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="rounded-xl border border-emerald-500/30 bg-card p-4 space-y-3 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{t('SELESAI & DIKLAIM')}</span>
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black">
                          +{quest.rewardDew} Dew
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground">{quest.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {quest.subtitle}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>{quest.promoter}</span>
                        <span>{quest.claimedAt ? new Date(quest.claimedAt).toLocaleDateString() : 'Hari ini'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Reusable Dialog: Create / Edit Quest (Fullstack CRUD) ── */}
      <Dialog open={isQuestModalOpen} onOpenChange={setIsQuestModalOpen}>
        <DialogContent className="w-[92vw] sm:w-[500px] p-5 rounded-xl bg-card border border-border shadow-xl z-[160] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              {editingQuest ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              <span>{editingQuest ? t('Edit Quest Database') : t('Tambah Quest Baru ke Database')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuest} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Judul Quest')}</label>
              <Input
                value={questForm.title}
                onChange={(e) => setQuestForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="misal: Anticeil Chess Grandmaster"
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Deskripsi / Subtitle')}</label>
              <Input
                value={questForm.subtitle}
                onChange={(e) => setQuestForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="misal: Menangkan 3 pertandingan catur bersama teman di Voice Channel."
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Kategori')}</label>
                <select
                  value={questForm.category}
                  onChange={(e) => setQuestForm((f) => ({ ...f, category: e.target.value as any }))}
                  className="w-full h-8 px-2 rounded-md bg-muted/40 border border-border text-xs text-foreground cursor-pointer"
                >
                  <option value="activity">{t('Aktivitas Video')}</option>
                  <option value="game">{t('Game & Rekreasi')}</option>
                  <option value="social">{t('Komunitas & Chat')}</option>
                  <option value="profile">{t('Kustomisasi Profil')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Promoter / Penyelenggara')}</label>
                <Input
                  value={questForm.promoter}
                  onChange={(e) => setQuestForm((f) => ({ ...f, promoter: e.target.value }))}
                  placeholder="Anticeil Games"
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Hadiah (Dew)')}</label>
                <Input
                  type="number"
                  min="1"
                  value={questForm.rewardDew}
                  onChange={(e) => setQuestForm((f) => ({ ...f, rewardDew: Number(e.target.value) }))}
                  className="h-8 text-xs bg-muted/40 border-border"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Target')}</label>
                <Input
                  type="number"
                  min="1"
                  value={questForm.target}
                  onChange={(e) => setQuestForm((f) => ({ ...f, target: Number(e.target.value) }))}
                  className="h-8 text-xs bg-muted/40 border-border"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Satuan')}</label>
                <Input
                  value={questForm.unit}
                  onChange={(e) => setQuestForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="menit / kali"
                  className="h-8 text-xs bg-muted/40 border-border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Badge (Opsional)')}</label>
                <Input
                  value={questForm.badge}
                  onChange={(e) => setQuestForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="Unggulan / Baru"
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Teks Tombol Aksi')}</label>
                <Input
                  value={questForm.actionLabel}
                  onChange={(e) => setQuestForm((f) => ({ ...f, actionLabel: e.target.value }))}
                  placeholder="Mulai Bermain"
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('App ID (Opsional)')}</label>
              <Input
                value={questForm.appId}
                onChange={(e) => setQuestForm((f) => ({ ...f, appId: e.target.value }))}
                placeholder="anticeil-chess, youtube-watch, atau kosongkan"
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Cover Image URL')}</label>
              <Input
                value={questForm.coverUrl}
                onChange={(e) => setQuestForm((f) => ({ ...f, coverUrl: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsQuestModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingQuest}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {isSubmittingQuest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingQuest ? t('Simpan Perubahan') : t('Tambah Quest')}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
