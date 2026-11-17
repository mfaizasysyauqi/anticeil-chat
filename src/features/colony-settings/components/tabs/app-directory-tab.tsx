import React, { useState, useMemo, useEffect } from 'react';
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
  Bot,
  Settings,
  Trash2,
  Sliders,
  Hash,
  Power,
  Copy,
  AlertTriangle,
  Rocket,
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getSocket } from '@/providers/socket-provider';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import type { Colony, ColonyApp, ColonyChannel } from '@/chat/chat-types';
import {
  DIRECTORY_APPS,
  DIRECTORY_CATEGORIES as CATEGORIES,
  type DirectoryAppItem,
} from './directory-apps-data';

export type { DirectoryAppItem };

interface AppDirectoryTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  onNavigateSection?: (section: string) => void;
  onNavigateToApps?: () => void;
  t: (key: string) => string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'Send Messages', label: 'Send Messages', desc: 'Izinkan bot mengirim pesan respon otomatis di saluran teks.' },
  { id: 'Embed Links', label: 'Embed Links', desc: 'Izinkan bot menampilkan kartu informasi kaya, pratinjau, dan embed interaktif.' },
  { id: 'Attach Files', label: 'Attach Files', desc: 'Izinkan bot mengunggah gambar render, audio, atau aset file.' },
  { id: 'Use Slash Commands', label: 'Use Slash Commands', desc: 'Izinkan anggota koloni memicu perintah /slash bot ini di obrolan.' },
  { id: 'Connect & Speak', label: 'Connect & Speak', desc: 'Izinkan bot bergabung dan menyiarkan audio/musik ke saluran suara.' },
  { id: 'Manage Roles', label: 'Manage Roles', desc: 'Izinkan bot menetapkan reaction-role otomatis ke anggota.' },
  { id: 'Kick Members', label: 'Kick Members', desc: 'Izinkan modul auto-moderasi bot mengeluarkan anggota yang melanggar aturan.' },
];

export function AppDirectoryTab({
  activeColony,
  channels = [],
  onUpdateColony,
  onClose,
  onNavigateSection,
  onNavigateToApps,
  t,
}: AppDirectoryTabProps) {
  const [activeSidebarNav, setActiveSidebarNav] = useState<'apps' | 'installed' | 'servers' | 'quests'>('apps');
  const [selectedCategory, setSelectedCategory] = useState<string>('Featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<DirectoryAppItem | null>(null);
  const [managingApp, setManagingApp] = useState<ColonyApp | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Installed Apps state with live sync
  const [installedApps, setInstalledApps] = useState<ColonyApp[]>(activeColony.installedApps || []);

  // Permission Edit State inside Managing Modal
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editAllowedChannels, setEditAllowedChannels] = useState<string[]>([]);
  const [editEnabled, setEditEnabled] = useState<boolean>(true);
  const [allChannelsAllowed, setAllChannelsAllowed] = useState<boolean>(true);

  // Sync from props
  useEffect(() => {
    if (activeColony.installedApps) {
      setInstalledApps(activeColony.installedApps);
    }
  }, [activeColony.installedApps]);

  // Load from backend on mount or colony change
  useEffect(() => {
    if (!activeColony?.id) return;
    let isMounted = true;
    coloniesApi.getColonyApps(activeColony.id).then((apps) => {
      if (isMounted && Array.isArray(apps) && apps.length > 0) {
        setInstalledApps(apps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeColony?.id]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!activeColony?.id) return;
    const socket = getSocket();

    const handleAppInstalled = (data: { hubId: string; app: ColonyApp }) => {
      if (data?.hubId === activeColony.id && data?.app) {
        setInstalledApps((prev) => {
          const filtered = prev.filter((a) => a.id !== data.app.id);
          return [data.app, ...filtered];
        });
      }
    };

    const handleAppUninstalled = (data: { hubId: string; appId: string }) => {
      if (data?.hubId === activeColony.id && data?.appId) {
        setInstalledApps((prev) => prev.filter((a) => a.id !== data.appId));
        if (managingApp?.id === data.appId) {
          setManagingApp(null);
        }
      }
    };

    const handleAppUpdated = (data: {
      hubId: string;
      appId: string;
      permissions?: string[];
      allowedChannels?: string[];
      enabled?: boolean;
    }) => {
      if (data?.hubId === activeColony.id && data?.appId) {
        setInstalledApps((prev) =>
          prev.map((a) =>
            a.id === data.appId
              ? {
                  ...a,
                  permissions: data.permissions ?? a.permissions,
                  allowedChannels: data.allowedChannels ?? a.allowedChannels,
                  enabled: data.enabled ?? a.enabled,
                }
              : a
          )
        );
      }
    };

    socket.on('COLONY_APP_INSTALLED', handleAppInstalled);
    socket.on('COLONY_APP_UNINSTALLED', handleAppUninstalled);
    socket.on('COLONY_APP_UPDATED', handleAppUpdated);

    return () => {
      socket.off('COLONY_APP_INSTALLED', handleAppInstalled);
      socket.off('COLONY_APP_UNINSTALLED', handleAppUninstalled);
      socket.off('COLONY_APP_UPDATED', handleAppUpdated);
    };
  }, [activeColony.id, managingApp?.id]);

  const isAppInstalled = (appId: string) => {
    return installedApps.some((a) => a.id === appId);
  };

  const getInstalledApp = (appId: string) => {
    return installedApps.find((a) => a.id === appId);
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

  // Open manage modal for an installed app
  const handleOpenManageModal = (appItem: ColonyApp | DirectoryAppItem) => {
    const existing = getInstalledApp(appItem.id);
    const dirApp = 'bannerImage' in appItem ? appItem : null;
    const colApp = !dirApp ? (appItem as ColonyApp) : null;

    const app: ColonyApp = existing || {
      id: appItem.id,
      name: appItem.name,
      description: appItem.description,
      category: appItem.category,
      icon: dirApp ? dirApp.iconText : colApp?.icon,
      banner: dirApp ? dirApp.bannerImage : colApp?.banner,
      badge: appItem.badge,
      verified: appItem.verified,
      slashCommands: dirApp ? dirApp.commands : (colApp?.slashCommands || []),
      permissions: appItem.permissions || ['Send Messages', 'Embed Links', 'Use Slash Commands'],
      allowedChannels: [],
      enabled: true,
      author: dirApp ? dirApp.author : colApp?.author,
      installedAt: new Date().toISOString(),
    };

    setManagingApp(app);
    setEditPermissions(app.permissions || ['Send Messages', 'Embed Links', 'Use Slash Commands']);
    setEditAllowedChannels(app.allowedChannels || []);
    setAllChannelsAllowed(!app.allowedChannels || app.allowedChannels.length === 0);
    setEditEnabled(app.enabled !== false);
    setSelectedApp(null);
  };

  // Install bot to colony
  const handleInstallApp = async (app: DirectoryAppItem) => {
    if (isAppInstalled(app.id)) {
      toast.info(t(`${app.name} sudah terpasang di server ini.`));
      handleOpenManageModal(app);
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
        allowedChannels: [],
        enabled: true,
        author: app.author,
        installedAt: new Date().toISOString(),
      };

      const updated = [newApp, ...installedApps.filter((a) => a.id !== newApp.id)];
      setInstalledApps(updated);
      await coloniesApi.installColonyApp(activeColony.id, app.id, newApp);
      await onUpdateColony(activeColony.id, { installedApps: updated });

      toast.success(t(`${app.name} berhasil ditambahkan ke server! 🤖🎉`));
      setSelectedApp(null);
    } catch {
      toast.error(t('Gagal menambahkan aplikasi ke server'));
    } finally {
      setIsInstalling(false);
    }
  };

  // Uninstall / Revoke bot
  const handleUninstallApp = async (appId: string, appName: string) => {
    setIsRevoking(true);
    try {
      const updated = installedApps.filter((a) => a.id !== appId);
      setInstalledApps(updated);
      await coloniesApi.uninstallColonyApp(activeColony.id, appId);
      await onUpdateColony(activeColony.id, { installedApps: updated });

      toast.success(t(`Bot ${appName} berhasil dicabut dari server.`));
      setManagingApp(null);
    } catch {
      toast.error(t('Gagal mencabut bot dari server'));
    } finally {
      setIsRevoking(false);
    }
  };

  // Save updated permissions & channel scope
  const handleSavePermissions = async () => {
    if (!managingApp) return;
    setIsSavingPermissions(true);
    try {
      const channelsToSave = allChannelsAllowed ? [] : editAllowedChannels;
      const updates = {
        permissions: editPermissions,
        allowedChannels: channelsToSave,
        enabled: editEnabled,
      };

      const updatedList = installedApps.map((a) =>
        a.id === managingApp.id ? { ...a, ...updates } : a
      );
      setInstalledApps(updatedList);

      await coloniesApi.updateColonyAppPermissions(activeColony.id, managingApp.id, updates);
      await onUpdateColony(activeColony.id, { installedApps: updatedList });

      toast.success(t(`Pengaturan izin bot ${managingApp.name} berhasil disimpan! 🛡️`));
      setManagingApp(null);
    } catch {
      toast.error(t('Gagal memperbarui izin bot'));
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t(`Perintah ${text} disalin ke clipboard!`));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[680px] -m-4 md:-m-6 bg-[#111214] text-foreground">
      {/* ── Left Sidebar (Discover Nav) ── */}
      <div className="w-full lg:w-60 shrink-0 bg-[#1e1f22] border-r border-border/60 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 py-1">
            <Compass className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {t('App Directory')}
            </h2>
          </div>

          <nav className="space-y-1">
            {/* Apps Catalog */}
            <button
              type="button"
              onClick={() => setActiveSidebarNav('apps')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'apps'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Grid className="w-4 h-4 shrink-0" />
                <span>{t('Browse Directory')}</span>
              </div>
            </button>

            {/* Installed Bots & Apps */}
            <button
              type="button"
              onClick={() => setActiveSidebarNav('installed')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'installed'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 shrink-0" />
                <span>{t('Installed Apps')}</span>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                  activeSidebarNav === 'installed'
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {installedApps.length}
              </span>
            </button>

            {/* Servers */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarNav('servers');
                toast.info(t('Jelajahi server komunitas publik di tab Server Discovery!'));
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                activeSidebarNav === 'servers'
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>{t('Servers')}</span>
            </button>

            {/* Quests */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarNav('quests');
                toast.info(t('Quest & Reward server akan segera hadir!'));
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
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
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer mb-2"
            >
              <span>← {t('Back to Integrations')}</span>
            </button>
          </div>
        )}

        {/* Shortcut to Aplikasi & Aktivitas */}
        {onNavigateToApps && (
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onNavigateToApps();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 shrink-0" />
                <span>{t('Buka Aplikasi & Aktivitas')}</span>
              </div>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {/* ── Main View Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-[82vh] [scrollbar-width:thin]">
        {activeSidebarNav === 'apps' ? (
          <>
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
                  placeholder={t('Search bots & apps...')}
                  className="h-8 pl-8 text-xs bg-[#1e1f22] border-border/70 text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Hero Banner */}
            <div className="relative mx-6 mt-6 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e1b4b] via-[#1e293b] to-[#0f172a] border border-blue-900/30 p-8 shadow-2xl">
              <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-indigo-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                  <Bot className="w-3 h-3" />
                  <span>COLONY BOT ECOSYSTEM</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-sans">
                  FIND THINGS TO DO TOGETHER
                </h1>
                <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed">
                  {t(
                    'Bring the fun to your hangouts with apps for games, music, moderation, slash commands, and creative tools.'
                  )}
                </p>
              </div>
            </div>

            {/* Apps Section: Promoted Games / Grid */}
            <div className="p-6 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {selectedCategory === 'Featured' ? t('Promoted Apps & Games') : t(selectedCategory)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {filteredApps.length} {t('apps available')}
                  </span>
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredApps.map((app) => {
                    const installed = isAppInstalled(app.id);
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          if (installed) {
                            handleOpenManageModal(app);
                          } else {
                            setSelectedApp(app);
                          }
                        }}
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
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-xs shrink-0',
                                  app.iconBg
                                )}
                              >
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
          </>
        ) : activeSidebarNav === 'installed' ? (
          /* ── Installed Apps View ── */
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span>{t('Installed Colony Apps & Bots')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                    {installedApps.length}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Kelola bot dan aplikasi yang aktif di server ini, sesuaikan perizinan slash command, dan atur batasan saluran.')}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveSidebarNav('apps')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 h-8 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add More Apps')}</span>
              </Button>
            </div>

            {installedApps.length === 0 ? (
              <div className="text-center py-16 bg-[#1e1f22]/50 rounded-2xl border border-dashed border-border/60 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center mx-auto text-muted-foreground">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Belum Ada Aplikasi Terpasang')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t('Tingkatkan keseruan koloni Anda dengan menambahkan game, musik, atau auto-moderasi dari App Directory.')}
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveSidebarNav('apps')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold mt-2 cursor-pointer"
                >
                  {t('Buka Direktori Aplikasi')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {installedApps.map((app) => {
                  const allowedChannelsCount = app.allowedChannels?.length || 0;
                  const isEnabled = app.enabled !== false;
                  return (
                    <div
                      key={app.id}
                      className="rounded-xl border border-border/70 bg-[#1e1f22] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-border transition-colors shadow-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-card border border-border/80 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                          {app.icon || '🤖'}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                              {app.name}
                            </span>
                            {app.verified && (
                              <span className="text-primary text-xs font-bold" title="Verified Bot">
                                ✓
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/60 text-muted-foreground font-medium">
                              {app.category}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1',
                                isEnabled
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  isEnabled ? 'bg-emerald-400' : 'bg-muted-foreground'
                                )}
                              />
                              {isEnabled ? t('Active') : t('Disabled')}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                            {app.description}
                          </p>

                          {/* Slash Commands & Channel Scope pill */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {app.slashCommands && app.slashCommands.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-400 font-mono">
                                <Terminal className="w-3 h-3 text-muted-foreground" />
                                <span>{app.slashCommands[0]}</span>
                                {app.slashCommands.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{app.slashCommands.length - 1} more
                                  </span>
                                )}
                              </div>
                            )}

                            <span className="text-[10px] text-muted-foreground">•</span>

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Hash className="w-3 h-3" />
                              <span>
                                {allowedChannelsCount === 0
                                  ? t('All Channels')
                                  : `${allowedChannelsCount} ${t('channels')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenManageModal(app)}
                          className="h-8 px-3 text-xs gap-1.5 cursor-pointer bg-card/60 hover:bg-card border-border/80"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{t('Manage & Permissions')}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUninstallApp(app.id, app.name)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-red-400 gap-1 cursor-pointer"
                          title="Hapus dari Server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
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
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl ring-4 ring-[#1e1f22]',
                      selectedApp.iconBg
                    )}
                  >
                    {selectedApp.iconText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedApp.name}
                      </h3>
                      {selectedApp.verified && (
                        <span title="Verified App" className="text-primary text-sm font-bold">
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
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
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
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{t('Slash Commands')}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {t('Klik perintah untuk menyalin')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.commands.map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => copyToClipboard(cmd)}
                      className="px-2.5 py-1 rounded-md bg-background/80 hover:bg-background border border-border/60 hover:border-primary/50 text-[11px] text-blue-400 font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{cmd}</span>
                      <Copy className="w-3 h-3 text-muted-foreground/60" />
                    </button>
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
                      className="px-2 py-0.5 rounded-md bg-muted/40 text-[10px] text-muted-foreground border border-border/40"
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

      {/* ── Manage Bot Permissions & Scope Modal ── */}
      <Dialog open={!!managingApp} onOpenChange={(open) => !open && setManagingApp(null)}>
        {managingApp && (
          <DialogContent className="sm:max-w-[620px] max-h-[88vh] overflow-y-auto p-0 bg-[#1e1f22] border-border/80 text-foreground [scrollbar-width:thin]">
            <DialogHeader className="p-6 pb-4 border-b border-border/60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/80 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {managingApp.icon || '🤖'}
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                      <span>{managingApp.name}</span>
                      {managingApp.verified && (
                        <span className="text-primary text-xs font-bold" title="Verified Bot">
                          ✓
                        </span>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {t('Konfigurasi hak akses, izin slash command, dan batasan saluran bot.')}
                    </DialogDescription>
                  </div>
                </div>

                {/* Enable/Disable Master Toggle */}
                <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border/60 shrink-0">
                  <Power
                    className={cn(
                      'w-3.5 h-3.5',
                      editEnabled ? 'text-emerald-400' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {editEnabled ? t('Enabled') : t('Disabled')}
                  </span>
                  <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* 1. Slash Commands Preview */}
              {managingApp.slashCommands && managingApp.slashCommands.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('Daftar Perintah Slash Command')}</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {t('Tersedia di obrolan via "/"')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {managingApp.slashCommands.map((cmd) => (
                      <div
                        key={cmd}
                        onClick={() => copyToClipboard(cmd)}
                        className="p-2 rounded-lg bg-card/80 border border-border/60 hover:border-primary/50 text-xs font-mono text-blue-400 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="truncate">{cmd}</span>
                        <Copy className="w-3 h-3 text-muted-foreground/60 shrink-0 ml-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Bot Permissions Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Izin Bot & Hak Akses Server')}</span>
                </label>

                <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground block">
                            {t(perm.label)}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {t(perm.desc)}
                          </span>
                        </div>
                        <Switch
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditPermissions((prev) => [...prev, perm.id]);
                            } else {
                              setEditPermissions((prev) => prev.filter((p) => p !== perm.id));
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Channel Scope Restrictions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('Batasan Saluran (Channel Scope)')}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {allChannelsAllowed ? t('Semua Saluran') : t('Saluran Tertentu')}
                    </span>
                    <Switch
                      checked={allChannelsAllowed}
                      onCheckedChange={(checked) => {
                        setAllChannelsAllowed(checked);
                        if (checked) {
                          setEditAllowedChannels([]);
                        }
                      }}
                    />
                  </div>
                </div>

                {!allChannelsAllowed && (
                  <div className="rounded-xl border border-border/60 bg-card p-3 max-h-40 overflow-y-auto space-y-1.5 [scrollbar-width:thin]">
                    {channels.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        {t('Tidak ada saluran teks yang ditemukan.')}
                      </p>
                    ) : (
                      channels.map((ch) => {
                        const isSelected = editAllowedChannels.includes(ch.id);
                        return (
                          <label
                            key={ch.id}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditAllowedChannels((prev) => [...prev, ch.id]);
                                } else {
                                  setEditAllowedChannels((prev) =>
                                    prev.filter((id) => id !== ch.id)
                                  );
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground font-medium">{ch.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 bg-[#111214] border-t border-border/60 flex flex-row items-center justify-between">
              {/* Revoke / Uninstall Button */}
              <Button
                type="button"
                variant="ghost"
                disabled={isRevoking}
                onClick={() => handleUninstallApp(managingApp.id, managingApp.name)}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 h-9 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRevoking ? t('Mencabut...') : t('Cabut Bot dari Server')}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManagingApp(null)}
                  className="text-xs h-9 cursor-pointer"
                >
                  {t('Batal')}
                </Button>

                <Button
                  type="button"
                  disabled={isSavingPermissions}
                  onClick={handleSavePermissions}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4 cursor-pointer shadow-md"
                >
                  {isSavingPermissions ? t('Menyimpan...') : t('Simpan Perubahan')}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
