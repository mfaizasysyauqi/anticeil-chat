import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  Compass,
  Loader2,
  Link as LinkIcon,
  Gamepad2,
  Code2,
  Music2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { ColonyIcon } from './colony-icon';
import type { Colony } from '@/chat/chat-types';
import { cn } from '@/lib/utils';

interface ColoniesExploreTabProps {
  filteredExplore: Colony[];
  inviteCodeInput: string;
  setInviteCodeInput: (val: string) => void;
  handleJoinByCode: (e: React.FormEvent) => void;
  isJoiningByCode: boolean;
  isLoadingPublic: boolean;
  handleOpenCreateColony: () => void;
  handleJoinPublic: (pub: Colony) => void;
  t: (key: string) => string;
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
  t,
}: ColoniesExploreTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categorizedList = useMemo(() => {
    if (selectedCategory === 'all') return filteredExplore;
    const cat = selectedCategory.toLowerCase();
    return filteredExplore.filter((c) => {
      const matchTag = c.tags && c.tags.some((tag) => tag.toLowerCase().includes(cat));
      const matchDesc = c.description && c.description.toLowerCase().includes(cat);
      const matchName = c.name && c.name.toLowerCase().includes(cat);
      return matchTag || matchDesc || matchName;
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

  return (
    <div className="space-y-6 w-full text-foreground">
      {/* ── 1. Quick Invite Code / Link Join Banner ── */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <LinkIcon className="w-5 h-5" />
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
            className="h-8 text-xs bg-muted/40 border-border w-full sm:w-56 rounded-xl"
          />
          <Button
            type="submit"
            size="sm"
            variant="teal"
            disabled={!inviteCodeInput.trim() || isJoiningByCode}
            className="h-8 px-4 text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
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

      {/* ── 2. Featured Server Spotlight Hero (Discord-style) ── */}
      {featuredColony && (
        <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-r from-sidebar-primary/25 via-background to-emerald-950/20 p-5 sm:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="size-16 rounded-2xl bg-card border-2 border-sidebar-primary/40 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                <ColonyIcon hub={featuredColony} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/40 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {t('Server Pilihan Komunitas')}
                  </span>
                  {featuredColony.verified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {t('Terverifikasi')}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                  {featuredColony.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl leading-relaxed">
                  {featuredColony.description || t('Komunitas resmi Anticeil untuk kolaborasi kreatif dan obrolan.')}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{featuredColony.onlineCount || 42} Online</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span>{featuredColony.membersCount || 148} Anggota</span>
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="teal"
              size="sm"
              onClick={() => handleJoinPublic(featuredColony)}
              className="h-9 px-5 text-xs font-bold rounded-xl cursor-pointer shadow-md shrink-0 flex items-center gap-2"
            >
              <span>{t('Gabung Sekarang')}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── 3. Category Filter Tabs ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer',
                  isSelected
                    ? 'bg-sidebar-primary/20 border-sidebar-primary/60 text-sidebar-primary shadow-xs'
                    : 'bg-card border-border/70 text-muted-foreground hover:border-sidebar-primary/40 hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Daftar Direktori Komunitas')} ({categorizedList.length})
          </h2>
        </div>
      </div>

      {/* ── 4. Grid of Discoverable Colony Cards ── */}
      {isLoadingPublic ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-2xl w-full">
          <Loader2 className="w-8 h-8 animate-spin text-sidebar-primary mb-2" />
          <p className="text-xs font-medium">{t('Memuat direktori colony komunitas...')}</p>
        </div>
      ) : categorizedList.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 stroke-[1.8] text-primary/80" />}
          title={t('Tidak Ada Colony di Kategori Ini')}
          description={t('Belum ada colony publik yang cocok dengan filter atau pencarian Anda.')}
          action={
            <Button
              size="sm"
              onClick={handleOpenCreateColony}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 px-4 text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{t('Buat Colony Baru')}</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorizedList.map((pub) => (
            <div
              key={pub.id}
              className="p-4 rounded-2xl border border-border/80 bg-card hover:border-sidebar-primary/50 transition-all flex flex-col justify-between gap-3.5 shadow-sm group hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-xl bg-secondary/60 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                    <ColonyIcon hub={pub} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-foreground truncate group-hover:text-sidebar-primary transition-colors">
                        {pub.name}
                      </h3>
                      {pub.verified && (
                        <span title={t('Terverifikasi')}>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {pub.description || t('Komunitas Anticeil untuk kolaborasi dan obrolan.')}
                    </p>
                  </div>
                </div>

                {/* Tags row */}
                {pub.tags && pub.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pub.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>{pub.onlineCount || Math.max(Math.floor((pub.membersCount || 10) * 0.3), 1)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span>{pub.membersCount || 10}</span>
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => handleJoinPublic(pub)}
                  className="h-7 px-3 text-xs font-bold gap-1 cursor-pointer rounded-lg shadow-xs"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>{t('Gabung')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
