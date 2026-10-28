import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CommunityHub } from '@/chat/chat-types';
import {
  loadStoredServerInvitations,
  saveStoredServerInvitations,
  loadStoredHubs,
  saveStoredHubs,
  type ServerInvitation,
} from '@/lib/community-hubs';
import { chatApi } from '@/chat/chat-api';
import { ServerIcon } from './server-icon';
import { toast } from 'sonner';

export interface ServersViewProps {
  servers: CommunityHub[];
  onSelectServer: (serverId: string) => void;
  onOpenCreateServer: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
}

export function ServersView({
  servers,
  onSelectServer,
  onOpenCreateServer,
  onOpenSidebar,
  horizontalPadding = 'px-4',
}: ServersViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'joined' | 'pending' | 'explore'>('joined');
  const [searchQuery, setSearchQuery] = useState('');
  const [serverInvitations, setServerInvitations] = useState<ServerInvitation[]>(() =>
    loadStoredServerInvitations()
  );

  // Real Public Servers from Backend DB
  const [publicServers, setPublicServers] = useState<CommunityHub[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setServerInvitations(loadStoredServerInvitations());
    window.addEventListener('anticeil_server_invites_changed', handleUpdate);
    return () => window.removeEventListener('anticeil_server_invites_changed', handleUpdate);
  }, []);

  // Fetch real public hubs from database
  useEffect(() => {
    let mounted = true;
    const fetchPublicServers = async () => {
      setIsLoadingPublic(true);
      try {
        const all = await chatApi.getHubs();
        if (mounted && Array.isArray(all)) {
          // Filter out DM hub and servers the current user is already member of
          const available = all.filter(
            (h) => h.id !== 'anticeil' && !servers.some((s) => s.id === h.id)
          );
          setPublicServers(available);
        }
      } catch (err) {
        console.warn('Failed to load public hubs from API', err);
      } finally {
        if (mounted) setIsLoadingPublic(false);
      }
    };

    fetchPublicServers();
    return () => {
      mounted = false;
    };
  }, [servers, activeTab]);

  // Exclude default home if desired or keep all
  const myServers = servers.filter((s) => s.id !== 'anticeil');

  const filteredMyServers = myServers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPendingInvites = serverInvitations.filter(
    (inv) =>
      inv.serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.inviterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.serverDescription && inv.serverDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExplore = publicServers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleJoinPublic = async (community: CommunityHub) => {
    try {
      const codeOrId = community.inviteCode || community.id;
      const joined = await chatApi.joinHub(codeOrId);
      toast.success(t('Berhasil bergabung dengan {{name}}! 🎉', { name: community.name }));
      onSelectServer(joined.id || community.id);
    } catch {
      toast.error(t('Gagal bergabung ke server'));
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
      onSelectServer(joined.id);
    } catch {
      toast.error(t('Kode undangan tidak valid atau server tidak ditemukan'));
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleAcceptInvitation = (invite: ServerInvitation) => {
    const updated = serverInvitations.filter((i) => i.id !== invite.id);
    setServerInvitations(updated);
    saveStoredServerInvitations(updated);

    // Persist as joined hub
    const existing = loadStoredHubs();
    if (!existing.some((h) => h.id === invite.serverId)) {
      const newHub: CommunityHub = {
        id: invite.serverId,
        name: invite.serverName,
        description: invite.serverDescription,
        initials: invite.serverName.slice(0, 2).toUpperCase(),
        iconType: 'initials',
        iconUrl: invite.serverIconUrl,
        role: 'member',
        membersCount: (invite.membersCount || 1) + 1,
      };
      saveStoredHubs([...existing, newHub]);
    }

    toast.success(`Berhasil bergabung dengan ${invite.serverName}! 🎉`);
    onSelectServer(invite.serverId);
  };

  const handleRejectInvitation = (invite: ServerInvitation) => {
    const updated = serverInvitations.filter((i) => i.id !== invite.id);
    setServerInvitations(updated);
    saveStoredServerInvitations(updated);
    toast.info(`Undangan server ${invite.serverName} telah ditolak.`);
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
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 mr-0.5 cursor-pointer shrink-0"
              title={t('Buka Menu Sidebar')}
              aria-label={t('Buka Menu Sidebar')}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Server')}</span>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />

          {/* Tab Filter Pills: Server Saya & Jelajahi */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('joined')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
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
              onClick={() => setActiveTab('pending')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'pending'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{t('Tertunda')}</span>
              {serverInvitations.length > 0 && (
                <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {serverInvitations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'explore'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('Jelajahi Server')}</span>
            </button>

            {/* Yellow Highlight Button: Buat Server Baru */}
            <Button
              size="xs"
              onClick={onOpenCreateServer}
              className="px-2.5 py-1 text-xs font-bold transition-all bg-amber-400 hover:bg-amber-300 text-black shrink-0 flex items-center gap-1 ml-0.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('Buat Server')}</span>
              <span className="sm:hidden">{t('Server')}</span>
            </Button>
          </div>
        </div>

        {/* Right side: Responsive Search Bar (Accessible on mobile too!) */}
        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${horizontalPadding} py-5 [scrollbar-width:thin] space-y-6`}>
        {activeTab === 'joined' ? (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Daftar Komunitas yang Anda Ikuti ({filteredMyServers.length})
              </h2>
            </div>

            {filteredMyServers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-2xl w-full">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectServer(srv.id);
                        }}
                        className="h-7 px-3 text-xs font-bold gap-1.5 cursor-pointer bg-amber-400 hover:bg-amber-300 text-black shadow-xs transition-all"
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
        ) : activeTab === 'pending' ? (
          /* Pending Server Invitations Tab */
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Undangan Server Tertunda')} ({filteredPendingInvites.length})
              </h2>
            </div>

            {filteredPendingInvites.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-2xl w-full">
                <Inbox className="w-12 h-12 stroke-1 mb-3 text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">{t('Tidak Ada Undangan Tertunda')}</h3>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
                  {t('Saat seseorang mengajak Anda untuk bergabung ke server komunitas mereka, undangannya akan muncul di sini.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3 shadow-xs group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-[14px] bg-sidebar-accent border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs font-bold text-base text-foreground group-hover:scale-105 transition-transform">
                        {inv.serverIconUrl ? (
                          <img src={inv.serverIconUrl} alt={inv.serverName} className="w-full h-full object-cover" />
                        ) : (
                          inv.serverName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{inv.serverName}</h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                            Undangan Masuk
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {inv.serverDescription || 'Komunitas Anticeil untuk kolaborasi dan obrolan santai.'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                          {inv.inviterAvatar && (
                            <img src={inv.inviterAvatar} alt={inv.inviterName} className="w-4 h-4 rounded-full object-cover" />
                          )}
                          <span>
                            Diundang oleh <strong className="text-foreground">{inv.inviterName}</strong>
                            {inv.inviterUsername ? ` (@${inv.inviterUsername})` : ''}
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

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectInvitation(inv)}
                          className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          <span>{t('Tolak')}</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(inv)}
                          className="h-8 px-3.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-2xs gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{t('Gabung Server')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Explore Tab (Full DB Integration - No Dummy Data) */
          <div className="space-y-4 w-full">
            {/* Quick Invite Code / Link Join Banner */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {t('Punya Tautan atau Kode Undangan?')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Masukkan kode atau tautan server untuk langsung bergabung.')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="Contoh: hub_xyz atau inv_abc"
                  className="h-8 text-xs bg-sidebar-accent border-border w-full sm:w-56"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inviteCodeInput.trim() || isJoiningByCode}
                  className="h-8 px-3 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black shrink-0 cursor-pointer"
                >
                  {isJoiningByCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                  <span>{t('Gabung')}</span>
                </Button>
              </form>
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Jelajahi Server Komunitas')} ({filteredExplore.length})
              </h2>
            </div>

            {isLoadingPublic ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl w-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60 mb-2" />
                <p className="text-xs font-medium">{t('Memuat server komunitas...')}</p>
              </div>
            ) : filteredExplore.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl w-full">
                <Compass className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                <h3 className="text-xs font-bold text-foreground">{t('Tidak Ada Server Publik Lain')}</h3>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  {t('Semua server komunitas saat ini sudah Anda ikuti, atau belum ada server publik lain yang terdaftar.')}
                </p>
                <Button
                  size="sm"
                  onClick={onOpenCreateServer}
                  className="mt-3.5 h-8 px-3 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>{t('Buat Server Baru')}</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExplore.map((pub) => (
                  <div
                    key={pub.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-3 shadow-xs group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-[14px] bg-sidebar-accent border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                        <ServerIcon hub={pub} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {pub.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {pub.description || t('Komunitas Anticeil untuk kolaborasi dan obrolan.')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Users className="w-3 h-3" />
                        <span>{pub.membersCount ? `${pub.membersCount.toLocaleString()} Anggota` : 'Komunitas Aktif'}</span>
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleJoinPublic(pub)}
                        className="h-7 px-3 text-xs font-bold gap-1.5 cursor-pointer bg-amber-400 hover:bg-amber-300 text-black shadow-xs transition-all"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>{t('Gabung Server')}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
