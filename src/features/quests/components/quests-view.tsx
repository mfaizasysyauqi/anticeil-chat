import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';
import { uploadMediaToR2 } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QuestsEmptyState } from './quests-empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { AppFilterDrawer } from '@/components/ui/app-filter-drawer';
import { FilterToggleButton } from '@/components/ui/filter-toggle-button';
import { Input } from '@/components/ui/input';
import { FormDropdown } from '@/components/ui/form-dropdown';
import {
  CHANNEL_HORIZONTAL_PADDING,
  CHANNEL_VERTICAL_PADDING,
  LAYOUT_PAGE_SPACING,
  TEXT_STYLES,
  BUTTON_STYLES,
  DIALOG_STYLES,
  SURFACE_STYLES,
} from '@/lib/layout-constants';
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
  currentUser?: any;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
}

export function QuestsView({
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
  onNavigateShop,
  onLaunchActivity,
  currentUser,
  requireAuth,
}: QuestsViewProps) {
  const { t } = useTranslation();
  const isAdmin = currentUser?.email?.toLowerCase() === 'anticeil.official@gmail.com';
  const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'claimed'>('all');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [claimedQuests, setClaimedQuests] = useState<QuestItem[]>([]);
  const [balance, setBalance] = useState<ShopBalance>({ dew: 0, currencyCode: 'IDR' });
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'suggested' | 'reward_desc' | 'alphabetical'>('suggested');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Drawer State (Sheet Drawer ensures 100% Symmetrical Page Layout)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showOnlyHighReward, setShowOnlyHighReward] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  const QUEST_CATEGORY_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('Semua Kategori') },
      { id: 'game', label: t('Game & Rekreasi') },
      { id: 'activity', label: t('Aktivitas Video') },
      { id: 'social', label: t('Komunitas & Chat') },
      { id: 'profile', label: t('Profil & Kustomisasi') },
    ],
    [t]
  );

  const QUEST_STATUS_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('Semua Status') },
      { id: 'not_started', label: t('Tersedia / Belum Diambil') },
      { id: 'in_progress', label: t('Sedang Berjalan') },
      { id: 'completed', label: t('Siap Diklaim') },
    ],
    [t]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (showOnlyHighReward) count++;
    if (showOnlyFeatured) count++;
    return count;
  }, [filterCategory, filterStatus, showOnlyHighReward, showOnlyFeatured]);

  const handleResetFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setShowOnlyHighReward(false);
    setShowOnlyFeatured(false);
  };

  // Quest CRUD State
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestItem | null>(null);
  const [isSubmittingQuest, setIsSubmittingQuest] = useState(false);
  const [questCoverFile, setQuestCoverFile] = useState<File | null>(null);
  const [questCoverPreview, setQuestCoverPreview] = useState<string>('');
  const questFileInputRef = useRef<HTMLInputElement>(null);

  const [questForm, setQuestForm] = useState({
    title: '',
    subtitle: '',
    category: 'activity' as 'activity' | 'game' | 'social' | 'profile',
    promoter: 'Anticeil Activities',
    coverUrl: '',
    badge: 'Baru',
    rewardDew: 300,
    target: 5,
    unit: 'kali',
    actionLabel: 'Mulai',
    appId: '',
  });

  const handleOpenCreateQuest = () => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenCreateQuest(),
        t('Tambah Quest'),
        t('Masuk ke Anticeil untuk menambahkan quest baru ke Database.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat menambahkan quest'));
      return;
    }
    setEditingQuest(null);
    setQuestCoverFile(null);
    setQuestCoverPreview('');
    setQuestForm({
      title: '',
      subtitle: '',
      category: 'activity',
      promoter: 'Anticeil Community',
      coverUrl: '',
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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenEditQuest(quest),
        t('Edit Quest'),
        t('Masuk ke Anticeil untuk mengedit quest di Database.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat mengedit quest'));
      return;
    }
    setEditingQuest(quest);
    setQuestCoverFile(null);
    setQuestCoverPreview(quest.coverUrl || '');
    setQuestForm({
      title: quest.title,
      subtitle: quest.subtitle,
      category: quest.category || 'activity',
      promoter: quest.promoter,
      coverUrl: quest.coverUrl || '',
      badge: quest.badge || '',
      rewardDew: quest.rewardDew || 100,
      target: quest.target || 1,
      unit: quest.unit || 'kali',
      actionLabel: quest.actionLabel || 'Mulai',
      appId: quest.appId || '',
    });
    setIsQuestModalOpen(true);
  };

  const handleQuestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan'));
      return;
    }
    setQuestCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setQuestCoverPreview(objectUrl);
  };

  const handleRemoveQuestCover = () => {
    setQuestCoverFile(null);
    setQuestCoverPreview('');
    setQuestForm((f) => ({ ...f, coverUrl: '' }));
    if (questFileInputRef.current) {
      questFileInputRef.current.value = '';
    }
  };

  const handleSaveQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questForm.title.trim()) {
      toast.error(t('Judul quest tidak boleh kosong'));
      return;
    }
    if (!questCoverFile && !questCoverPreview.trim()) {
      toast.error(t('Silakan pilih file gambar cover'));
      return;
    }

    setIsSubmittingQuest(true);
    try {
      let finalCoverUrl = questForm.coverUrl || questCoverPreview;

      // Jika ada file lokal baru, upload ke Cloudflare R2 sekarang saat tombol simpan diklik
      if (questCoverFile) {
        const uploadRes = await uploadMediaToR2(questCoverFile, `quest_${Date.now()}`);
        if (uploadRes.url) {
          finalCoverUrl = uploadRes.url;
        }
      }

      const payload = {
        ...questForm,
        coverUrl: finalCoverUrl,
      };

      if (editingQuest) {
        const res = await questsApi.updateQuest(editingQuest.id, payload);
        if (res.success && res.quest) {
          setQuests((prev) => prev.map((q) => (q.id === editingQuest.id ? res.quest! : q)));
          toast.success(res.message || t('Quest berhasil diperbarui'));
          setIsQuestModalOpen(false);
          setEditingQuest(null);
          setQuestCoverFile(null);
          setQuestCoverPreview('');
        } else {
          toast.error(res.message || t('Gagal memperbarui quest'));
        }
      } else {
        const res = await questsApi.createQuest(payload);
        if (res.success && res.quest) {
          setQuests((prev) => [res.quest!, ...prev]);
          toast.success(res.message || t('Quest baru berhasil ditambahkan'));
          setIsQuestModalOpen(false);
          setEditingQuest(null);
          setQuestCoverFile(null);
          setQuestCoverPreview('');
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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleDeleteQuest(e, questId),
        t('Hapus Quest'),
        t('Masuk ke Anticeil untuk menghapus quest dari Database.'),
      );
      return;
    }
    if (!isAdmin) {
      toast.error(t('Hanya akun admin yang dapat menghapus quest'));
      return;
    }
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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleAcceptQuest(quest),
        t('Ambil Quest'),
        t('Masuk ke Anticeil untuk mengambil misi dan mendapatkan hadiah Dew.'),
      );
      return;
    }
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
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleClaimReward(quest),
        t('Klaim Hadiah Quest'),
        t('Masuk ke Anticeil untuk mengklaim hadiah Dew Anda.'),
      );
      return;
    }
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
    if (filterStatus !== 'all') {
      list = list.filter((q) => (q.status || 'not_started') === filterStatus);
    }
    if (showOnlyHighReward) {
      list = list.filter((q) => (q.rewardDew || 0) >= 250);
    }
    if (showOnlyFeatured) {
      list = list.filter((q) => Boolean(q.badge));
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
  }, [quests, filterCategory, filterStatus, showOnlyHighReward, showOnlyFeatured, sortBy, searchQuery]);

  // Quests that user has accepted (in_progress or completed ready to claim)
  const acceptedCount = useMemo(() => {
    return quests.filter((q) => q.status === 'in_progress' || q.status === 'completed').length;
  }, [quests]);

  const acceptedQuests = useMemo(() => {
    let list = quests.filter((q) => q.status === 'in_progress' || q.status === 'completed');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.promoter.toLowerCase().includes(q)
      );
    }
    return list;
  }, [quests, searchQuery]);

  // Reusable Quest Card Renderer (100% DRY across All Quests & Accepted Quests tabs)
  const renderQuestCard = (quest: QuestItem) => {
    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

    return (
      <div
        key={quest.id}
        className="rounded-xl border border-border bg-card flex flex-col justify-between overflow-hidden shadow-xs hover:border-primary/50 transition-all group relative"
      >
        {/* Quest Artwork Banner */}
        <div className="relative h-28 sm:h-36 bg-card overflow-hidden">
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

          {/* Edit & Delete Buttons (Fullstack CRUD) */}
          {isAdmin && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditQuest(quest);
                }}
                className="size-6 sm:size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-md"
                title={t('Edit Quest')}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteQuest(e, quest.id)}
                className="size-6 sm:size-7 rounded-md bg-background/90 hover:bg-red-600 border border-border/80 hover:border-red-600 text-red-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-red-950/40 backdrop-blur-md"
                title={t('Hapus Quest')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="absolute bottom-2.5 left-2.5 text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[70%]">
            {quest.promoter}
          </span>
        </div>

        {/* Quest Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {quest.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {quest.subtitle}
            </p>
          </div>

          {/* Reward Box with Glowing Dew Gem */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between gap-1.5 sm:gap-2 shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="size-6 sm:size-7 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0 animate-pulse">
                💧
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-black text-cyan-400 truncate">
                  Claim {quest.rewardDew} Dew
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">
                  Free-to-Play Currency
                </div>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
              1.0x
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              <span className="truncate mr-1">
                {quest.progress} / {quest.target} {quest.unit}
              </span>
              <span className="shrink-0">{percent}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5 sm:gap-2">
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
  };

  // Discord-style 1:1 Right Filter Panel Renderer for Quests
  const renderFilterContent = () => {
    return (
      <div className="space-y-6">
        {/* 1. Kategori Quest */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Kategori Quest')}
          </h4>
          <div className="space-y-1.5">
            {QUEST_CATEGORY_OPTIONS.map((opt) => {
              const isSelected = filterCategory === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilterCategory(opt.id)}
                  className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
                >
                  <div
                    className={cn(
                      'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Status Quest */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Status Quest')}
          </h4>
          <div className="space-y-1.5">
            {QUEST_STATUS_OPTIONS.map((opt) => {
              const isSelected = filterStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilterStatus(opt.id)}
                  className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
                >
                  <div
                    className={cn(
                      'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tampilkan Hanya */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Tampilkan Hanya')}
          </h4>
          <div className="space-y-1.5">
            {/* Hadiah Dew Tinggi */}
            <button
              type="button"
              onClick={() => setShowOnlyHighReward(!showOnlyHighReward)}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
            >
              <div
                className={cn(
                  'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                  showOnlyHighReward
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                )}
              >
                {showOnlyHighReward && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate flex items-center gap-1.5">
                <span>{t('Hadiah Dew Tinggi (≥ 250)')}</span>
                <span>💧</span>
              </span>
            </button>

            {/* Quest Unggulan */}
            <button
              type="button"
              onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
            >
              <div
                className={cn(
                  'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                  showOnlyFeatured
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                )}
              >
                {showOnlyFeatured && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate flex items-center gap-1.5">
                <span>{t('Quest Unggulan')}</span>
                <span>⭐</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const heroQuest = quests[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── 1. Reusable App Bar Header (DRY & 100% Consistent, No Shop Button) ── */}
      <QuestsHeader
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        acceptedCount={acceptedCount}
        claimedCount={claimedQuests.length}
        dewBalance={balance?.dew ?? 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── 2. Main Scrollable Body (100% Symmetrical with AppsView, CallsView, ColoniesView) ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, 'space-y-6', verticalPadding)}>
        {activeTab === 'all' && (
          <>
            {/* ── Top Quests Toolbar: Available Quests count + Sort + Filter + Tambah Quest (100% Consistent with ShopView & FriendsView) ── */}
            <div className="flex items-center justify-between min-h-7 gap-2 sm:gap-3 pb-2 border-b border-border/50">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                <Flame className="w-4 h-4 text-primary shrink-0" />
                <span className={cn(TEXT_STYLES.SECTION_MUTED, 'truncate max-w-[110px] sm:max-w-none text-xs')}>
                  {t('Available Quests')}
                </span>
                <span className={TEXT_STYLES.COUNTER_LABEL}>
                  ({filteredQuests.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(BUTTON_STYLES.TOOLBAR_BORDERED, 'w-auto px-2.5 sm:px-3 whitespace-nowrap shrink-0')}
                    >
                      <span>
                        {sortBy === 'suggested'
                          ? t('Suggested')
                          : sortBy === 'reward_desc'
                          ? t('Hadiah Tertinggi')
                          : t('Nama (A-Z)')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
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

                {/* Filter Sheet Trigger (100% Symmetrical layout on all screen sizes) */}
                <FilterToggleButton
                  isOpen={isFilterDrawerOpen}
                  label={t('Filter')}
                  activeCount={activeFilterCount}
                  onClick={() => setIsFilterDrawerOpen(true)}
                />

                {/* Create Quest Button (Fullstack CRUD) - Placed at the far right after Filters */}
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={handleOpenCreateQuest}
                    className={cn(BUTTON_STYLES.TOOLBAR_ACTION, 'px-2 sm:px-3 h-7')}
                    title={t('Tambah Quest Baru ke Database')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('Tambah Quest')}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* ── Featured Hero Quest Banner (Discord 1:1) ── */}
            {heroQuest && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/25 via-card to-background border border-primary/30 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-xl">
                <div className="space-y-2 sm:space-y-2.5 max-w-xl z-10">
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
                    <div className="px-2.5 sm:px-3 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-black flex items-center gap-1.5 shadow-xs">
                      <span>💧</span>
                      <span>+{heroQuest.rewardDew} Dew (F2P Money)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 z-10 shrink-0 w-full md:w-auto">
                  {heroQuest.status === 'completed' ? (
                    <Button
                      size="lg"
                      onClick={() => handleClaimReward(heroQuest)}
                      className="flex-1 md:flex-initial font-bold h-10 sm:h-11 px-5 sm:px-6 gap-2 cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse justify-center"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t('Klaim 💧')} {heroQuest.rewardDew} {t('Dew')}</span>
                    </Button>
                  ) : heroQuest.status === 'in_progress' ? (
                    <Button
                      size="lg"
                      onClick={() => handleProgressQuest(heroQuest)}
                      className="flex-1 md:flex-initial font-bold h-10 sm:h-11 px-5 sm:px-6 gap-2 cursor-pointer shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground justify-center"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{heroQuest.actionLabel || t('Lanjutkan Quest')}</span>
                    </Button>
                  ) : heroQuest.status === 'claimed' ? (
                    <div className="h-10 sm:h-11 px-4 sm:px-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{t('Hadiah Sudah Diklaim')}</span>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => handleAcceptQuest(heroQuest)}
                      className="flex-1 md:flex-initial font-bold h-10 sm:h-11 px-5 sm:px-6 gap-2 cursor-pointer shadow-lg justify-center"
                    >
                      <span>{t('Terima Quest')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditQuest(heroQuest)}
                        className="h-10 sm:h-11 px-3 text-xs font-semibold gap-1 cursor-pointer bg-card/60 backdrop-blur-xs"
                        title={t('Edit Quest')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleDeleteQuest(e, heroQuest.id)}
                        className="h-10 sm:h-11 px-3 text-xs font-semibold gap-1 cursor-pointer bg-card/80 hover:bg-red-600 border border-border/70 hover:border-red-600 text-red-400 hover:text-white backdrop-blur-xs transition-colors shadow-xs"
                        title={t('Hapus Quest')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* ── Active Promoted Quests Spotlight Row (4 desktop, 3 tablet, 2 mobile) ── */}
            {quests.length > 0 && (
              <div className={SURFACE_STYLES.CARD_GRID}>
                {quests.slice(0, 4).map((q) => (
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
            )}

            {/* ── Quests Cards Grid (Discord 1:1 Layout) ── */}
              {filteredQuests.length === 0 ? (
                <QuestsEmptyState
                  activeTab="all"
                  searchQuery={searchQuery}
                  hasActiveFilters={activeFilterCount > 0 || filterCategory !== 'all'}
                  isAdmin={isAdmin}
                  onResetSearch={() => setSearchQuery('')}
                  onResetFilters={handleResetFilters}
                  onCreateQuest={handleOpenCreateQuest}
                />
              ) : (
                <div className={SURFACE_STYLES.CARD_GRID}>
                  {filteredQuests.map((quest) => renderQuestCard(quest))}
                </div>
              )}
            </>
          )}

          {/* ── 2. Accepted Quests Tab View (Quest yang Diterima) ── */}
          {activeTab === 'accepted' && (
            <div>
              {acceptedQuests.length === 0 ? (
                <QuestsEmptyState
                  activeTab="accepted"
                  onGoToAll={() => setActiveTab('all')}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between min-h-7 gap-3 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className={TEXT_STYLES.SECTION_MUTED}>
                        {t('Quest Diterima')}
                      </span>
                      <span className={TEXT_STYLES.COUNTER_LABEL}>
                        ({acceptedQuests.length})
                      </span>
                    </div>
                  </div>

                  <div className={SURFACE_STYLES.CARD_GRID}>
                    {acceptedQuests.map((quest) => renderQuestCard(quest))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Claimed Quests Tab View (Discord 1:1) ── */}
          {activeTab === 'claimed' && (
          <div>
            {claimedQuests.length === 0 ? (
              <QuestsEmptyState
                activeTab="claimed"
                onGoToAll={() => setActiveTab('all')}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {t('Riwayat Quest yang Telah Selesai')} ({claimedQuests.length})
                  </h3>
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1 shrink-0">
                    <span>💧 {t('Total')}:</span>
                    <span>+{claimedQuests.reduce((acc, q) => acc + q.rewardDew, 0)} Dew</span>
                  </div>
                </div>

                <div className={SURFACE_STYLES.CARD_GRID}>
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
      </ScrollArea>

      {/* Reusable Filter Sheet Drawer (Tightened width, eliminating empty right gap) */}
      <AppFilterDrawer
        open={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        title={t('Filter Quests')}
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        {renderFilterContent()}
      </AppFilterDrawer>

      {/* ── 3. Reusable Dialog: Create / Edit Quest (Fullstack CRUD) ── */}
      <Dialog open={isQuestModalOpen} onOpenChange={setIsQuestModalOpen}>
        <DialogContent className={cn(DIALOG_STYLES.MODAL_STANDARD, 'p-0 flex flex-col overflow-hidden max-h-[85vh]')}>
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
            <DialogTitle className={DIALOG_STYLES.HEADER_TITLE}>
              {editingQuest ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              <span>{editingQuest ? t('Edit Quest Database') : t('Tambah Quest Baru ke Database')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuest} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-3">
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

            <div className="grid grid-cols-2 gap-3 items-end">
              <FormDropdown
                label={t('Kategori')}
                value={questForm.category}
                onChange={(val) => setQuestForm((f) => ({ ...f, category: val as any }))}
                size="sm"
                options={[
                  { value: 'activity', label: t('Aktivitas Video') },
                  { value: 'game', label: t('Game & Rekreasi') },
                  { value: 'social', label: t('Komunitas & Chat') },
                  { value: 'profile', label: t('Kustomisasi Profil') },
                ]}
              />

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
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                {t('Cover Image (Upload ke Cloudflare R2)')}
              </label>
              <input
                ref={questFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuestFileChange}
                className="hidden"
              />

              {questCoverPreview ? (
                <div className="relative group rounded-xl border border-border/80 bg-muted/20 overflow-hidden p-2">
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                    <img
                      src={questCoverPreview}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => questFileInputRef.current?.click()}
                        className="h-7 text-xs gap-1.5 shadow-md cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{t('Ganti Gambar')}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={handleRemoveQuestCover}
                        className="h-7 text-xs gap-1.5 shadow-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('Hapus')}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span className="truncate max-w-[240px]">
                      {questCoverFile ? questCoverFile.name : t('Gambar tersimpan')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium shrink-0">
                      {questCoverFile ? t('Pratinjau lokal • disimpan ke R2') : t('Tersimpan di Cloudflare R2')}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => questFileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer p-3 group"
                >
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">
                      {t('Klik untuk upload file gambar cover')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t('Format JPG, PNG, WebP, GIF. Pratinjau lokal sebelum disimpan ke Cloudflare R2.')}
                    </p>
                  </div>
                </button>
              )}
            </div>

            </div>

            <DialogFooter className="px-5 sm:px-6 py-3 border-t border-border/60 shrink-0 flex items-center justify-end gap-2 bg-card mt-0">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
