import React, { useState, useMemo } from 'react';
import {
  Compass,
  Grid,
  Search,
  Sparkles,
  Check,
  Plus,
  ExternalLink,
  Shield,
  Terminal,
  X,
  Gamepad2,
  Tv,
  Wrench,
  Users2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyApp } from '@/chat/chat-types';

interface AppDirectoryTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  onNavigateSection?: (section: string) => void;
  t: (key: string) => string;
}

export interface DirectoryAppItem {
  id: string;
  name: string;
  badge: string;
  category: 'Featured' | 'Games' | 'Entertainment' | 'Moderation and Tools' | 'Social' | 'Utilities';
  description: string;
  longDescription: string;
  bannerGradient: string;
  bannerImage?: string;
  iconBg: string;
  iconText: string;
  iconImage?: string;
  verified: boolean;
  author: string;
  commands: string[];
  permissions: string[];
}

const DIRECTORY_APPS: DirectoryAppItem[] = [
  {
    id: 'exoplanet',
    name: 'EXOPLANET',
    badge: 'Promoted',
    category: 'Games',
    description: 'Andy Weir presents Exoplanet, listen now only on Audible. Your ship is wrecked and stranded...',
    longDescription:
      'Immerse your server in an audio-driven sci-fi survival narrative from bestselling author Andy Weir. Make collective story choices, survive planetary perils, and unlock exclusive space badges.',
    bannerGradient: 'from-amber-900/60 via-stone-900/80 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-amber-600',
    iconText: '🚀',
    verified: true,
    author: 'Audible Original',
    commands: ['/exoplanet start', '/exoplanet vote [choice]', '/exoplanet status'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'rings-of-power',
    name: 'The Rings of Power',
    badge: 'Games • Promoted',
    category: 'Games',
    description: "It is the Second Age. Enter Sauron's forge in Barad-dûr and discover exclusive lore, quizzes, and rewards.",
    longDescription:
      "Journey into Middle-earth's Second Age. Forge legendary rings, conquer server trivia challenges, and pledge your allegiance to the Elves, Dwarves, Númenóreans, or Southlands.",
    bannerGradient: 'from-amber-600/50 via-zinc-900/80 to-black',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-amber-500',
    iconText: '💍',
    verified: true,
    author: 'Prime Video & Amazon Studios',
    commands: ['/forge ring', '/lore search [query]', '/trivia middle-earth'],
    permissions: ['Send Messages', 'Embed Links', 'Add Reactions', 'Use Slash Commands'],
  },
  {
    id: 'wordle',
    name: 'Wordle',
    badge: 'The New York Times Games',
    category: 'Games',
    description: 'Enjoy Wordle from New York Times Games! You have 6 chances to guess a 5-letter word with friends.',
    longDescription:
      'The viral word guessing sensation directly in your server. Compete synchronously with colony members on the daily puzzle or generate endless custom 5-letter showdowns.',
    bannerGradient: 'from-emerald-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-emerald-600',
    iconText: '🟩',
    verified: true,
    author: 'The New York Times',
    commands: ['/wordle daily', '/wordle duel @user', '/wordle stats'],
    permissions: ['Send Messages', 'Embed Links', 'Use Slash Commands'],
  },
  {
    id: 'farm-merge-valley',
    name: 'Farm Merge Valley',
    badge: 'Games',
    category: 'Games',
    description: 'Farm, merge, grow and expand your land! Welcome to the world of farming that gets better together.',
    longDescription:
      'A cozy cooperative multiplayer merge puzzle game. Cultivate your shared server valley, harvest crops, trade goods with other colonies, and raise adorable farm animals.',
    bannerGradient: 'from-rose-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-red-500',
    iconText: '🐔',
    verified: true,
    author: 'Merge Games Studio',
    commands: ['/farm harvest', '/farm market', '/farm visit @user'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'gartic-phone',
    name: 'Gartic Phone',
    badge: 'Popular Party Game',
    category: 'Social',
    description: 'The telephone drawing game! Pass animated sketches and hilarious prompts around your voice channel.',
    longDescription:
      'Laugh uncontrollably with your friends. One player writes a sentence, the next draws it, the next guesses what was drawn. Pure chaos and fun.',
    bannerGradient: 'from-blue-900/60 via-zinc-900 to-black',
    bannerImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-blue-500',
    iconText: '🎨',
    verified: true,
    author: 'Onrizon Games',
    commands: ['/gartic start', '/gartic lobby', '/gartic theme [name]'],
    permissions: ['Send Messages', 'Connect & Speak', 'Use Slash Commands'],
  },
  {
    id: 'carl-bot',
    name: 'Carl-bot',
    badge: 'Moderation • Reaction Roles',
    category: 'Moderation and Tools',
    description: 'Advanced reaction roles, mod logs, auto-moderation, custom embeds, and server management.',
    longDescription:
      'One of the most trusted moderation suites in Discord history. Fast reaction role assignment, highly configurable auto-punishments, logging feeds, and announcement builders.',
    bannerGradient: 'from-cyan-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-cyan-600',
    iconText: '🐢',
    verified: true,
    author: 'CarlBot Team',
    commands: ['/rr make', '/warn @user [reason]', '/embed create'],
    permissions: ['Manage Roles', 'Kick Members', 'Ban Members', 'Manage Messages'],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    badge: 'Creative AI',
    category: 'Entertainment',
    description: 'Generate stunning photorealistic artwork, concept designs, and portraits directly from text prompts.',
    longDescription:
      'Transform imaginative words into breathtaking imagery. Collaborate with channel members using upscaling, panning, outpainting, and stylistic blends.',
    bannerGradient: 'from-purple-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-purple-600',
    iconText: '⛵',
    verified: true,
    author: 'Midjourney, Inc.',
    commands: ['/imagine [prompt]', '/blend [image1] [image2]', '/describe [image]'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'rythm',
    name: 'Rythm Music',
    badge: 'Music Assistant',
    category: 'Entertainment',
    description: 'Stream music from Spotify, Soundcloud, and YouTube directly into your voice channels with zero lag.',
    longDescription:
      'High-fidelity sound, shared playlists, song queue management, lyrics display, and audio filters (Bass Boost, Nightcore, Lo-Fi) for your colony hangout.',
    bannerGradient: 'from-indigo-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-indigo-600',
    iconText: '🎵',
    verified: true,
    author: 'Rythm Inc.',
    commands: ['/play [song or url]', '/queue', '/skip', '/lyrics'],
    permissions: ['Connect & Speak', 'Use Voice Activity', 'Send Messages'],
  },
];

const CATEGORIES = [
  'Featured',
  'Games',
  'Entertainment',
  'Moderation and Tools',
  'Social',
  'Utilities',
] as const;

export function AppDirectoryTab({
  activeColony,
  onUpdateColony,
  onClose,
  onNavigateSection,
  t,
}: AppDirectoryTabProps) {
  const [activeSidebarNav, setActiveSidebarNav] = useState<'apps' | 'servers' | 'quests'>('apps');
  const [selectedCategory, setSelectedCategory] = useState<string>('Featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<DirectoryAppItem | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const installedApps: ColonyApp[] = activeColony.installedApps || [];

  const isAppInstalled = (appId: string) => {
    return installedApps.some((a) => a.id === appId);
  };

  const filteredApps = useMemo(() => {
    return DIRECTORY_APPS.filter((app) => {
      const matchSearch =
        searchQuery === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'Featured' || app.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleInstallApp = async (app: DirectoryAppItem) => {
    if (isAppInstalled(app.id)) {
      toast.info(t(`${app.name} sudah terpasang di server ini.`));
      return;
    }

    setIsInstalling(true);
    try {
      const newApp: ColonyApp = {
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        icon: app.iconText,
        banner: app.bannerImage,
        badge: app.badge,
        verified: app.verified,
        slashCommands: app.commands,
        permissions: app.permissions,
        installedAt: new Date().toISOString(),
      };

      const updated = [...installedApps, newApp];
      await onUpdateColony(activeColony.id, { installedApps: updated });
      toast.success(t(`${app.name} berhasil ditambahkan ke server! 🤖🎉`));
      setSelectedApp(null);
    } catch {
      toast.error(t('Gagal menambahkan aplikasi ke server'));
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[680px] -m-4 md:-m-6 bg-[#111214] text-foreground">
      {/* ── Left Sidebar (Discover Nav) ── */}
      <div className="w-full lg:w-56 shrink-0 bg-[#1e1f22] border-r border-border/60 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 py-1">
            <Compass className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {t('Discover')}
            </h2>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveSidebarNav('apps')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'apps'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>{t('Apps')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarNav('servers');
                toast.info(t('Jelajahi server komunitas publik di tab Server Discovery!'));
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'servers'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>{t('Servers')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSidebarNav('quests');
                toast.info(t('Quest & Reward server akan segera hadir!'));
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'quests'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t('Quests')}</span>
            </button>
          </nav>
        </div>

        {/* Back to Integrations shortcut */}
        {onNavigateSection && (
          <div className="pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={() => onNavigateSection('integrations')}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>← {t('Back to Integrations')}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main App Directory View ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-[82vh] [scrollbar-width:thin]">
        {/* Top Category Tabs & Search Bar */}
        <div className="sticky top-0 z-10 bg-[#111214]/95 backdrop-blur-md border-b border-border/60 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto [scrollbar-width:none]">
            <Grid className="w-4 h-4 text-muted-foreground mr-1 shrink-0 hidden sm:block" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                  selectedCategory === cat
                    ? 'bg-white text-black font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/80'
                )}
              >
                {t(cat)}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search')}
              className="h-8 pl-8 text-xs bg-[#1e1f22] border-border/70 text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Hero Banner (Matching Screenshot 3) */}
        <div className="relative mx-6 mt-6 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e1b4b] via-[#1e293b] to-[#0f172a] border border-blue-900/30 p-8 shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-indigo-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-sans">
              FIND THINGS TO DO TOGETHER
            </h1>
            <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed">
              {t('Bring the fun to your hangouts with apps for games, music, creative tools, and more.')}
            </p>
          </div>
        </div>

        {/* Apps Section: Promoted Games / Grid */}
        <div className="p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {selectedCategory === 'Featured' ? t('Promoted Games') : t(selectedCategory)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {filteredApps.length} {t('apps available')}
              </span>
            </div>

            {/* Grid of 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredApps.map((app) => {
                const installed = isAppInstalled(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="group flex flex-col rounded-xl overflow-hidden bg-[#1e1f22] border border-border/70 hover:border-border hover:shadow-xl transition-all cursor-pointer"
                  >
                    {/* Banner Image / Gradient */}
                    <div className="relative h-32 w-full overflow-hidden bg-muted/40">
                      {app.bannerImage ? (
                        <img
                          src={app.bannerImage}
                          alt={app.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={cn('w-full h-full bg-gradient-to-br', app.bannerGradient)} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f22] via-transparent to-black/30" />

                      {/* App Badge on Banner */}
                      <span className="absolute top-2 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/10">
                        {app.badge}
                      </span>
                    </div>

                    {/* App Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-xs shrink-0', app.iconBg)}>
                            {app.iconText}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                              {app.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {app.author}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>

                      {/* Action status button */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {app.category}
                        </span>
                        {installed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            {t('Installed')}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                            {t('View App')}
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── App Detail & Add to Server Modal ── */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-[#1e1f22] border-border/80 text-foreground">
            {/* Modal Banner */}
            <div className="relative h-40 w-full overflow-hidden">
              {selectedApp.bannerImage ? (
                <img
                  src={selectedApp.bannerImage}
                  alt={selectedApp.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={cn('w-full h-full bg-gradient-to-br', selectedApp.bannerGradient)} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f22] via-[#1e1f22]/50 to-transparent" />
            </div>

            {/* Modal Header & Content */}
            <div className="p-6 pt-0 space-y-5 -mt-8 relative z-10">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl ring-4 ring-[#1e1f22]', selectedApp.iconBg)}>
                    {selectedApp.iconText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedApp.name}
                      </h3>
                      {selectedApp.verified && (
                        <span title="Verified App" className="text-primary text-sm">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {selectedApp.author} • {selectedApp.category}
                    </span>
                  </div>
                </div>

                {/* Add to Server button */}
                <Button
                  onClick={() => handleInstallApp(selectedApp)}
                  disabled={isInstalling || isAppInstalled(selectedApp.id)}
                  className={cn(
                    'text-xs font-semibold h-9 px-4 rounded-lg cursor-pointer shadow-md shrink-0',
                    isAppInstalled(selectedApp.id)
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                  )}
                >
                  {isAppInstalled(selectedApp.id) ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      {t('Added to Server')}
                    </span>
                  ) : isInstalling ? (
                    t('Adding...')
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      {t('Add to Server')}
                    </span>
                  )}
                </Button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {selectedApp.longDescription}
                </p>
              </div>

              {/* Slash Commands */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{t('Commands')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.commands.map((cmd) => (
                    <code
                      key={cmd}
                      className="px-2 py-1 rounded-md bg-background/80 border border-border/60 text-[11px] text-blue-400 font-mono"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('Permissions Requested')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded-md bg-muted/40 text-[10px] text-muted-foreground"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
