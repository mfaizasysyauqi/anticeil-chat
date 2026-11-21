import React, { useState, useEffect, useCallback } from 'react';
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
  Inbox,
  Check,
  X,
  Loader2,
  Link as LinkIcon,
  Hash,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TopBarActionButton } from '@/components/ui/top-bar-action-button';
import { Input } from '@/components/ui/input';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
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
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { Colony } from '@/chat/chat-types';
import {
  loadStoredColonyInvitations,
  saveStoredColonyInvitations,
  loadStoredColonies,
  saveStoredColonies,
  type ColonyInvitation,
} from '@/lib/colony';
import { chatApi, colonyApi } from '@/chat/chat-api';
import { ColonyIcon } from './colony-icon';
import { ColonyCard } from './colony-card';
import { ColoniesExploreTab } from './colonies-explore-tab';
import { toast } from 'sonner';

export interface ColoniesViewProps {
  colonies?: Colony[];
  servers?: Colony[];
  onSelectColony?: (colonyId: string) => void;
  onSelectServer?: (serverId: string) => void;
  onOpenCreateColony?: () => void;
  onOpenCreateServer?: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
}

export function ColoniesView({
  colonies,
  servers,
  onSelectColony,
  onSelectServer,
  onOpenCreateColony,
  onOpenCreateServer,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: ColoniesViewProps) {
  const colonyList = colonies ?? servers ?? [];
  const handleSelectColony = onSelectColony ?? onSelectServer ?? (() => {});
  const handleOpenCreateColony = onOpenCreateColony ?? onOpenCreateServer ?? (() => {});
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'joined' | 'pending' | 'explore'>('joined');
  const [searchQuery, setSearchQuery] = useState('');
  const [colonyInvitations, setColonyInvitations] = useState<ColonyInvitation[]>(() =>
    loadStoredColonyInvitations()
  );

  const fetchColonyInvitations = useCallback(async () => {
    try {
      const live = await colonyApi.getServerInvitations();
      if (Array.isArray(live)) {
        setColonyInvitations(live);
      }
    } catch {
      setColonyInvitations(loadStoredColonyInvitations());
    }
  }, []);

  // Real Public Servers from Backend DB
  const [publicColonies, setPublicColonies] = useState<Colony[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

  useEffect(() => {
    fetchColonyInvitations();
    const handleUpdate = () => fetchColonyInvitations();
    window.addEventListener('anticeil_server_invites_changed', handleUpdate);
    return () => window.removeEventListener('anticeil_server_invites_changed', handleUpdate);
  }, [fetchColonyInvitations]);

  // Fetch real public hubs from database
  useEffect(() => {
    // Sync latest membersCount and onlineCount from database
    colonyApi.getColonies().then((serverColonies) => {
      if (Array.isArray(serverColonies) && serverColonies.length > 0) {
        const stored = loadStoredColonies();
        let changed = false;
        const merged = stored.map((s) => {
          const match = serverColonies.find((c) => c.id === s.id);
          if (match && (s.membersCount !== match.membersCount || s.onlineCount !== match.onlineCount)) {
            changed = true;
            return {
              ...s,
              membersCount: match.membersCount,
              onlineCount: match.onlineCount,
            };
          }
          return s;
        });
        if (changed) {
          saveStoredColonies(merged);
        }
      }
    }).catch(() => {});

    let mounted = true;
    const fetchPublicColonies = async () => {
      setIsLoadingPublic(true);
      try {
        const all = await colonyApi.getDiscoverColonies();
        if (mounted && Array.isArray(all)) {
          // Filter out DM hub and servers the current user is already member of
          // And strictly enforce only public colonies
          const available = all.filter(
            (h) =>
              h.id !== 'anticeil' &&
              h.id !== 'direct-messages' &&
              !colonyList.some((s) => s.id === h.id) &&
              (h.isPublic === true || h.visibility === 'public' || h.accessSettings?.joinMethod === 'discoverable') &&
              h.isPublic !== false &&
              h.visibility !== 'private'
          );
          setPublicColonies(available);
        }
      } catch (err) {
        console.warn('Failed to load public hubs from API', err);
      } finally {
        if (mounted) setIsLoadingPublic(false);
      }
    };

    fetchPublicColonies();
    const handleColoniesChange = () => fetchPublicColonies();
    window.addEventListener('anticeil_colonies_changed', handleColoniesChange);
    return () => {
      mounted = false;
      window.removeEventListener('anticeil_colonies_changed', handleColoniesChange);
    };
  }, [colonyList, activeTab]);

  // Exclude default home if desired or keep all
  const myColonies = colonyList.filter((s) => s.id !== 'anticeil');

  const filteredMyColonies = myColonies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPendingInvites = colonyInvitations.filter(
    (inv) =>
      ((inv.colonyName || inv.serverName || "Colony") || inv.serverName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.inviterName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.colonyDescription && inv.colonyDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExplore = publicColonies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleJoinPublic = async (community: Colony) => {
    try {
      const joined = await colonyApi.joinColony(community);
      toast.success(t('Berhasil bergabung dengan {{name}}! 🎉', { name: community.name }));
      handleSelectColony(joined.id || community.id);
    } catch {
      toast.error(t('Gagal bergabung ke colony'));
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim();
    if (!code) return;
    setIsJoiningByCode(true);
    try {
      const joined = await chatApi.joinHub(code);
      toast.success(t('Berhasil bergabung dengan {{name}}! 🎉', { name: joined.name }));
      setInviteCodeInput('');
      handleSelectColony(joined.id);
    } catch {
      toast.error(t('Kode undangan tidak valid atau colony tidak ditemukan'));
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleAcceptInvitation = async (invite: ColonyInvitation) => {
    try {
      const res = await colonyApi.acceptServerInvitation(invite.id);
      const joinedHub: Colony = res?.hub || {
        id: invite.colonyId || invite.serverId || invite.id,
        name: (invite.colonyName || invite.serverName || "Colony"),
        description: invite.colonyDescription,
        initials: (invite.colonyName || invite.serverName || "Colony").slice(0, 2).toUpperCase(),
        iconType: 'initials',
        iconUrl: invite.colonyIconUrl,
        role: 'member',
        membersCount: (invite.membersCount || 1) + 1,
      };

      const updated = colonyInvitations.filter((i) => i.id !== invite.id);
      setColonyInvitations(updated);
      saveStoredColonyInvitations(updated);

      // Persist as joined hub
      const existing = loadStoredColonies();
      if (!existing.some((h) => h.id === joinedHub.id)) {
        saveStoredColonies([...existing, joinedHub]);
      }

      toast.success(`Berhasil bergabung dengan ${joinedHub.name}! 🎉`);
      handleSelectColony(joinedHub.id);
    } catch (e) {
      console.warn('Backend acceptColonyInvitation call:', e);
      toast.error(t('Gagal menerima undangan colony'));
    }
  };

  const handleRejectInvitation = async (invite: ColonyInvitation) => {
    const updated = colonyInvitations.filter((i) => i.id !== invite.id);
    setColonyInvitations(updated);
    saveStoredColonyInvitations(updated);
    try {
      await colonyApi.rejectServerInvitation(invite.id);
      toast.info(`Undangan colony ${(invite.colonyName || invite.serverName || "Colony")} telah ditolak.`);
    } catch {
      toast.info(`Undangan colony ${(invite.colonyName || invite.serverName || "Colony")} telah dihapus.`);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar: Discord Style (100% Match to Teman & Permintaan Pesan) ── */}
      <div
        className={cn(
          'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background overflow-hidden',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 shrink-0">
          <SidebarNavToggle onClick={onOpenSidebar} />

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Colony')}</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Tab Filter Pills: Server Saya & Jelajahi */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none px-1 touch-pan-x">
            <button
              onClick={() => setActiveTab('joined')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'joined'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{t('Colony Saya')}</span>
              {myColonies.length > 0 && (
                <span className="text-[10px] text-muted-foreground/70">({myColonies.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'pending'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{t('Tertunda')}</span>
              {colonyInvitations.length > 0 && (
                <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {colonyInvitations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={cn(
                'px-2 sm:px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'explore'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={t('Jelajahi Colony')}
              aria-label={t('Jelajahi Colony')}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">{t('Jelajahi Colony')}</span>
            </button>
          </div>

        {/* Right side: Responsive Search Bar & FAR RIGHT Action Button (+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeTab === 'joined'
                ? 'Cari server saya...'
                : activeTab === 'pending'
                ? 'Cari undangan...'
                : 'Cari komunitas...'
            }
            inputWidth="w-36 sm:w-44 md:w-56"
          />

          {/* Primary Theme Action Button: Buat Colony placed at FAR RIGHT */}
          <TopBarActionButton
            onClick={handleOpenCreateColony}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            label={t('Buat Colony')}
            iconOnlyTablet={true}
            title={t('Buat Colony')}
            aria-label={t('Buat Colony')}
          />
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, 'space-y-6', verticalPadding)}>
        {activeTab === 'joined' ? (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className={TEXT_STYLES.SECTION_MUTED}>
                Daftar Komunitas yang Anda Ikuti ({filteredMyColonies.length})
              </h2>
            </div>

            {filteredMyColonies.length === 0 ? (
              <EmptyState
                icon={<Globe className="w-8 h-8 stroke-[1.8] text-primary/80" />}
                title={t('Belum Bergabung dengan Colony')}
                description={t(
                  'Anda belum memiliki atau bergabung dengan colony komunitas. Buat colony baru atau jelajahi komunitas publik yang tersedia!'
                )}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleOpenCreateColony}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 text-xs cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> {t('Buat Colony')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('explore')}
                      className="h-8 text-xs cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 mr-1" /> {t('Jelajahi Komunitas')}
                    </Button>
                  </div>
                }
              />
            ) : (
              <div className={SURFACE_STYLES.CARD_GRID}>
                {filteredMyColonies.map((srv) => (
                  <ColonyCard
                    key={srv.id}
                    colony={srv}
                    isJoined={true}
                    onOpen={handleSelectColony}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending Server Invitations Tab */
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className={TEXT_STYLES.SECTION_MUTED}>
                {t('Undangan Colony Tertunda')} ({filteredPendingInvites.length})
              </h2>
            </div>

            {filteredPendingInvites.length === 0 ? (
              <EmptyState
                icon={<Inbox className="w-8 h-8 stroke-[1.8] text-primary/80" />}
                title={t('Tidak Ada Undangan Tertunda')}
                description={t(
                  'Saat seseorang mengajak Anda untuk bergabung ke colony komunitas mereka, undangannya akan muncul di sini.'
                )}
              />
            ) : (
              <div className={SURFACE_STYLES.CARD_GRID}>
                {filteredPendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-3 shadow-xs group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-[14px] bg-sidebar-accent border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs font-bold text-base text-foreground group-hover:scale-105 transition-transform">
                        {inv.colonyIconUrl ? (
                          <img src={inv.colonyIconUrl} alt={(inv.colonyName || inv.serverName || "Colony")} className="w-full h-full object-cover" />
                        ) : (
                          (inv.colonyName || inv.serverName || "Colony").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{(inv.colonyName || inv.serverName || "Colony")}</h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Undangan Masuk
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {inv.colonyDescription || 'Komunitas Anticeil untuk kolaborasi dan obrolan santai.'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                          {inv.inviterAvatar && (
                            <img src={inv.inviterAvatar} alt={inv.inviterName} className="w-4 h-4 rounded-full object-cover" />
                          )}
                          <span>
                            Diundang oleh <strong className="text-foreground">{inv.inviterName}</strong>
                            {(inv.inviterUsername || inv.inviterName || "") ? ` (@${(inv.inviterUsername || inv.inviterName || "")})` : ''}
                            {inv.createdAt ? ` • ${inv.createdAt}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Users className="w-3 h-3" />
                        <span>{inv.membersCount ? `${inv.membersCount.toLocaleString()} Anggota` : 'Komunitas Aktif'}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAcceptInvitation(inv)}
                              className="size-9 rounded-full bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                            {t('Gabung Colony')}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleRejectInvitation(inv)}
                              className="size-9 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                            {t('Tolak')}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Explore Tab (Full DB Integration - No Dummy Data) */
          <ColoniesExploreTab
            filteredExplore={filteredExplore}
            inviteCodeInput={inviteCodeInput}
            setInviteCodeInput={setInviteCodeInput}
            handleJoinByCode={handleJoinByCode}
            isJoiningByCode={isJoiningByCode}
            isLoadingPublic={isLoadingPublic}
            handleOpenCreateColony={handleOpenCreateColony}
            handleJoinPublic={handleJoinPublic}
            joinedColonyIds={colonyList.map((c) => c.id)}
            handleSelectColony={handleSelectColony}
            t={t}
          />
        )}
        </div>
      </ScrollArea>
    </div>
  );
}


// Backward-compatible alias
export const ServersView = ColoniesView;
export type ServerViewProps = ColoniesViewProps;
