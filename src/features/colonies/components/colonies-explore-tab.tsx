import React, { useState, useMemo } from 'react';
import {
  Plus,
  Compass,
  Loader2,
  Link as LinkIcon,
  Gamepad2,
  Code2,
  Music2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColonyHeroCard } from './colony-hero-card';
import { ColonyCard } from './colony-card';
import type { Colony } from '@/chat/chat-types';
import { cn } from '@/lib/utils';

export interface ColoniesExploreTabProps {
  filteredExplore: Colony[];
  inviteCodeInput: string;
  setInviteCodeInput: (val: string) => void;
  handleJoinByCode: (e: React.FormEvent) => void;
  isJoiningByCode: boolean;
  isLoadingPublic: boolean;
  handleOpenCreateColony: () => void;
  handleJoinPublic: (pub: Colony) => Promise<void> | void;
  joinedColonyIds?: string[];
  handleSelectColony?: (colonyId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const CATEGORIES = [
  { id: 'all', label: 'Semua', icon: Compass },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'tech', label: 'Teknologi & Koding', icon: Code2 },
  { id: 'music', label: 'Musik & Audio', icon: Music2 },
  { id: 'education', label: 'Edukasi & Riset', icon: GraduationCap },
  { id: 'community', label: 'Sosial & Hangout', icon: Sparkles },
];

export function ColoniesExploreTab({
  filteredExplore,
  inviteCodeInput,
  setInviteCodeInput,
  handleJoinByCode,
  isJoiningByCode,
  isLoadingPublic,
  handleOpenCreateColony,
  handleJoinPublic,
  joinedColonyIds = [],
  handleSelectColony,
  t,
}: ColoniesExploreTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joiningColonyId, setJoiningColonyId] = useState<string | null>(null);

  const categorizedList = useMemo(() => {
    if (selectedCategory === 'all') return filteredExplore;
    const cat = selectedCategory.toLowerCase();
    return filteredExplore.filter((c) => {
      const matchTag = c.tags && c.tags.some((tag) => tag.toLowerCase().includes(cat));
      const matchDesc = c.description && c.description.toLowerCase().includes(cat);
      const matchName = c.name && c.name.toLowerCase().includes(cat);
      const matchCategory = c.category && c.category.toLowerCase() === cat;
      return matchTag || matchDesc || matchName || matchCategory;
    });
  }, [filteredExplore, selectedCategory]);

  // Featured colony for hero spotlight
  const featuredColony = useMemo(() => {
    return (
      filteredExplore.find((c) => c.verified || (c.boostTier && c.boostTier > 0)) ||
      filteredExplore[0] ||
      null
    );
  }, [filteredExplore]);

  const onJoin = async (colony: Colony) => {
    setJoiningColonyId(colony.id);
    try {
      await handleJoinPublic(colony);
    } finally {
      setJoiningColonyId(null);
    }
  };

  return (
    <div className="space-y-6 w-full text-foreground">
      {/* ── 1. Quick Invite Code / Link Join Banner ── */}
      <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {t('Punya Tautan atau Kode Undangan?')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('Masukkan kode atau tautan colony untuk langsung bergabung ke server kawan.')}
            </p>
          </div>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Input
            type="text"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            placeholder="Contoh: hub_xyz atau inv_abc"
            className="h-8 text-xs bg-muted/40 border-border w-full sm:w-56"
          />
          <Button
            type="submit"
            size="sm"
            variant="teal"
            disabled={!inviteCodeInput.trim() || isJoiningByCode}
            className="h-8 px-4 text-xs font-semibold shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            {isJoiningByCode ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{t('Gabung')}</span>
          </Button>
        </form>
      </div>

      {/* ── 2. Featured Server Spotlight Hero (Reusable Card) ── */}
      {featuredColony && (
        <ColonyHeroCard
          colony={featuredColony}
          isJoined={joinedColonyIds.includes(featuredColony.id)}
          onJoin={onJoin}
          onOpen={handleSelectColony}
          isJoining={joiningColonyId === featuredColony.id}
        />
      )}

      {/* ── 3. Category Filter Tabs (Reusable Tabs System) ── */}
      <div className="space-y-3">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="h-auto p-1 bg-muted/40 border border-border/60 rounded-lg flex items-center gap-1 overflow-x-auto [scrollbar-width:none] justify-start">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Daftar Direktori Komunitas')} ({categorizedList.length})
          </h2>
        </div>
      </div>

      {/* ── 4. Grid of Discoverable Colony Cards (Reusable ColonyCard) ── */}
      {isLoadingPublic ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl w-full">
          <Loader2 className="w-8 h-8 animate-spin text-sidebar-primary mb-2" />
          <p className="text-xs font-medium">{t('Memuat direktori colony komunitas...')}</p>
        </div>
      ) : categorizedList.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 stroke-[1.8] text-primary/80" />}
          title={
            filteredExplore.length === 0
              ? t('Belum Ada Colony Publik')
              : t('Tidak Ada Colony di Kategori Ini')
          }
          description={
            filteredExplore.length === 0
              ? t('Belum ada colony publik yang dapat dijelajahi. Buat colony baru atau bergabung melalui tautan/kode undangan!')
              : t('Belum ada colony publik yang cocok dengan filter atau pencarian Anda.')
          }
          action={
            <Button
              size="sm"
              variant="teal"
              onClick={handleOpenCreateColony}
              className="h-8 px-4 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('Buat Colony Baru')}</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorizedList.map((pub) => (
            <ColonyCard
              key={pub.id}
              colony={pub}
              isJoined={joinedColonyIds.includes(pub.id)}
              onJoin={onJoin}
              onOpen={handleSelectColony}
              isJoining={joiningColonyId === pub.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
