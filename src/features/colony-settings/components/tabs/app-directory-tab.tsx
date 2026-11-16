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

import {
  DIRECTORY_APPS,
  DIRECTORY_CATEGORIES as CATEGORIES,
  type DirectoryAppItem,
} from './directory-apps-data';

export type { DirectoryAppItem };

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
