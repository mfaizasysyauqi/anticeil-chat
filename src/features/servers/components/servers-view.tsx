import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Users,
  Search,
  ExternalLink,
  Menu,
  Sparkles,
  Compass,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CommunityHub } from '@/chat/chat-types';
import { ServerIcon } from './server-icon';
import { toast } from 'sonner';

export interface ServersViewProps {
  servers: CommunityHub[];
  onSelectServer: (serverId: string) => void;
  onOpenCreateServer: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
}

const PUBLIC_EXPLORE_COMMUNITIES = [
  {
    id: 'explore-dev',
    name: 'Anticeil Developers & Creators',
    description: 'Komunitas resmi developer, designer, dan pengembang otomasi Anticeil. Berbagi tips kode, bot, dan template kolaborasi.',
    membersCount: 2450,
    onlineCount: 412,
    iconBg: 'bg-emerald-600',
    bannerGradient: 'from-emerald-950 via-zinc-900 to-black',
    tags: ['Developer', 'TypeScript', 'AI'],
  },
  {
    id: 'explore-gaming',
    name: 'Indo Gaming Lounge & Esports',
    description: 'Tempat kumpul mabar Valorant, Mobile Legends, Genshin Impact, dan nonton bareng YouTube Watch Together setiap malam.',
    membersCount: 5120,
    onlineCount: 890,
    iconBg: 'bg-rose-600',
    bannerGradient: 'from-rose-950 via-zinc-900 to-black',
    tags: ['Gaming', 'Voice Call', 'Co-Watch'],
  },
  {
    id: 'explore-design',
    name: 'UI/UX & Product Design Lab',
    description: 'Diskusi tren desain antarmuka, Figma design system, kritik portofolio, dan kolaborasi live canvas whiteboard.',
    membersCount: 1890,
    onlineCount: 275,
    iconBg: 'bg-purple-600',
    bannerGradient: 'from-purple-950 via-zinc-900 to-black',
    tags: ['Design', 'UI/UX', 'Figma'],
  },
  {
    id: 'explore-music',
    name: 'Lofi & Chill Hangout',
    description: 'Ruang santai mendengarkan musik lofi, belajar bersama (study with me), dan obrolan kasual sehari-hari.',
    membersCount: 3200,
    onlineCount: 520,
    iconBg: 'bg-amber-600',
    bannerGradient: 'from-amber-950 via-zinc-900 to-black',
    tags: ['Music', 'Chill', 'Study'],
  },
];

export function ServersView({
  servers,
  onSelectServer,
  onOpenCreateServer,
  onOpenSidebar,
  horizontalPadding = 'px-4',
}: ServersViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'joined' | 'explore'>('joined');
  const [searchQuery, setSearchQuery] = useState('');

  // Exclude default home if desired or keep all
  const myServers = servers.filter((s) => s.id !== 'anticeil');

  const filteredMyServers = myServers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExplore = PUBLIC_EXPLORE_COMMUNITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinPublic = (community: typeof PUBLIC_EXPLORE_COMMUNITIES[0]) => {
    toast.success(`Berhasil bergabung dengan ${community.name}! 🎉`);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar: Discord Style (100% Match to Teman & Permintaan Pesan) ── */}
      <div
        className={cn(
          'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto [scrollbar-width:none]">
          {/* Mobile burger menu */}
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors mr-0.5 cursor-pointer shrink-0"
              title={t('Buka Menu Sidebar')}
              aria-label={t('Buka Menu Sidebar')}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Server')}</span>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />

          {/* Tab Filter Pills: Server Saya & Jelajahi */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('joined')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'joined'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{t('Server Saya')}</span>
              {myServers.length > 0 && (
                <span className="text-[10px] text-muted-foreground/70">({myServers.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'explore'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('Jelajahi Server')}</span>
            </button>

            {/* Yellow Highlight Button: Buat Server Baru (Matches 'Tambah Teman' Style) */}
            <button
              onClick={onOpenCreateServer}
              className="px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer bg-amber-400 hover:bg-amber-300 text-black shrink-0 flex items-center gap-1 ml-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('Buat Server')}</span>
            </button>
          </div>
        </div>

        {/* Right side: Search Box */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="relative w-44 lg:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'joined' ? 'Cari server saya...' : 'Cari komunitas...'}
              className="w-full h-7 pl-8 pr-2 text-xs bg-muted/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${horizontalPadding} py-5 [scrollbar-width:thin] space-y-6`}>
        {activeTab === 'joined' ? (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Daftar Komunitas yang Anda Ikuti ({filteredMyServers.length})
              </h2>
            </div>

            {filteredMyServers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-2xl">
                <Globe className="w-12 h-12 stroke-1 mb-3 text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">Belum Bergabung dengan Server</h3>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
                  Anda belum memiliki atau bergabung dengan server komunitas. Buat server baru atau jelajahi komunitas publik yang tersedia!
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={onOpenCreateServer}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-bold h-8 text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Buat Server
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('explore')}
                    className="h-8 text-xs cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 mr-1" /> Jelajahi Komunitas
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMyServers.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => onSelectServer(srv.id)}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-[14px] bg-sidebar-accent border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                        <ServerIcon hub={srv} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {srv.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {srv.description || 'Komunitas Anticeil untuk kolaborasi dan obrolan santai.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Users className="w-3 h-3" />
                        <span>Komunitas Aktif</span>
                      </span>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectServer(srv.id);
                        }}
                        className="h-7 px-3 text-xs font-semibold gap-1.5 cursor-pointer group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      >
                        <span>Buka Server</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Explore Tab */
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Jelajahi Server Publik & Komunitas Populer ({filteredExplore.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExplore.map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div className={cn('h-24 p-4 relative flex items-end bg-gradient-to-r', pub.bannerGradient)}>
                    <div className="flex items-center gap-3 z-10">
                      <div className={cn('size-12 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-base', pub.iconBg)}>
                        {pub.name.charAt(0)}
                      </div>
                      <div className="text-white">
                        <h3 className="text-sm font-bold drop-shadow-xs line-clamp-1">{pub.name}</h3>
                        <span className="text-[11px] text-zinc-300 flex items-center gap-2">
                          <span>{pub.membersCount.toLocaleString()} Anggota</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">● {pub.onlineCount} Online</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pub.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {pub.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleJoinPublic(pub)}
                        className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Gabung Server</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
