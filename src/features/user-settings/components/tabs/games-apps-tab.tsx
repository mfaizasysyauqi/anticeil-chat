import React, { useState, useMemo } from 'react';
import {
  Gamepad2, Users, Layers, Link2, Plus, Trash2, Pencil, Check,
  Search, ChevronDown, ChevronRight, Pin, PinOff, ExternalLink,
  ShieldAlert, Info, Key, ShieldCheck, X, MoreHorizontal, Shield, Mic, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { availablePlatforms, type UserConnection, type AuthorizedApp } from '../../data/platforms';

export interface GamesAppsTabProps {
  activeSection: 'registered_games' | 'activity_privacy' | 'overlay' | 'connected_apps';
  currentUser?: any;
  currentUserName?: string;
  onNavigateSection?: (section: string) => void;
}

export function GamesAppsTab({
  activeSection,
  currentUser,
  currentUserName,
  onNavigateSection,
}: GamesAppsTabProps) {
  const { t } = useTranslation();

  // ==========================================
  // REGISTERED GAMES & ACTIVITY PRIVACY STATES (Discord Parity)
  // ==========================================
  interface RegisteredGame {
    id: string;
    name: string;
    verified: boolean;
    lastPlayed: string;
    enabled: boolean;
    icon?: string;
  }

  const [registeredGames, setRegisteredGames] = useState<RegisteredGame[]>([
    {
      id: 'terraria',
      name: 'Terraria',
      verified: true,
      lastPlayed: '2 days ago',
      enabled: true,
      icon: '🌳',
    },
  ]);
  const [isAddingGameDropdownOpen, setIsAddingGameDropdownOpen] = useState(false);
  const [selectedGameToAdd, setSelectedGameToAdd] = useState('');
  const [customGameInput, setCustomGameInput] = useState('');

  const detectableGamesPreset = useMemo(
    () => [
      { name: 'Minecraft', verified: true, icon: '⛏️' },
      { name: 'Valorant', verified: true, icon: '🎯' },
      { name: 'Visual Studio Code', verified: false, icon: '💻' },
      { name: 'Spotify', verified: true, icon: '🎧' },
      { name: 'Counter-Strike 2', verified: true, icon: '💣' },
      { name: 'Genshin Impact', verified: true, icon: '✨' },
      { name: 'League of Legends', verified: true, icon: '⚔️' },
      { name: 'Grand Theft Auto V', verified: true, icon: '🚗' },
    ],
    [],
  );

  // Activity Privacy
  const [shareMyActivity, setShareMyActivity] = useState(true);
  const [shareWhenOnline, setShareWhenOnline] = useState(true);
  const [shareWhenStreaming, setShareWhenStreaming] = useState(true);
  const [shareServerScope, setShareServerScope] = useState<'all' | 'small' | 'none'>('all');
  const [activityServerSearch, setActivityServerSearch] = useState('');
  const [activityServerSortOrder, setActivityServerSortOrder] = useState<'order' | 'name' | 'members'>('order');
  const [showMoreActivityServers, setShowMoreActivityServers] = useState(false);

  // Activity Joining
  const [allowFriendsJoinGame, setAllowFriendsJoinGame] = useState(true);
  const [allowVoiceParticipantsJoinGame, setAllowVoiceParticipantsJoinGame] = useState(true);

  interface ActivityServerItem {
    id: string;
    name: string;
    members: number;
    avatarFallback: string;
    isPrimary?: boolean;
  }

  const initialActivityServers: ActivityServerItem[] = useMemo(
    () => [
      { id: 'hok-id', name: 'Honor of Kings Indonesia', members: 70494, avatarFallback: 'HOK', isPrimary: true },
      { id: 'zmsta-srv', name: "zmsta's server", members: 1, avatarFallback: 'zs', isPrimary: true },
      { id: 'fullz', name: '[FULLZ]', members: 9140, avatarFallback: 'FZ', isPrimary: true },
      { id: 'nasgul', name: 'Nasgul Community', members: 132520, avatarFallback: 'NC', isPrimary: true },
      { id: 'awd', name: 'awd', members: 4, avatarFallback: 'a', isPrimary: true },
      { id: 'moku', name: 'Moku', members: 24500, avatarFallback: 'MK' },
      { id: 'wild-forest', name: 'Wild Forest', members: 18200, avatarFallback: 'WF' },
      { id: 'cerita-crypto', name: 'Cerita Crypto', members: 45310, avatarFallback: 'CC' },
      { id: 'genshin-id', name: 'Genshin Impact ID', members: 58920, avatarFallback: 'GI' },
      { id: 'valorant-sea', name: 'Valorant SEA', members: 89400, avatarFallback: 'VS' },
      { id: 'indonesia-dev', name: 'Developer Indonesia', members: 31200, avatarFallback: 'DI' },
    ],
    [],
  );

  const [serverActivityEnabledMap, setServerActivityEnabledMap] = useState<Record<string, boolean>>(() => {
    return {
      'hok-id': true,
      'zmsta-srv': true,
      'fullz': true,
      'nasgul': true,
      'awd': true,
      'moku': true,
      'wild-forest': true,
      'cerita-crypto': true,
      'genshin-id': true,
      'valorant-sea': true,
      'indonesia-dev': true,
    };
  });

  const isAnyServerActivityOn = useMemo(() => {
    return Object.values(serverActivityEnabledMap).some(Boolean);
  }, [serverActivityEnabledMap]);

  const handleToggleAllServers = () => {
    const nextState = !isAnyServerActivityOn;
    setServerActivityEnabledMap((prev) => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = nextState;
      });
      return updated;
    });
    toast.success(
      nextState
        ? t('Semua server diaktifkan pembagian aktivitas')
        : t('Semua server dinonaktifkan pembagian aktivitas'),
    );
  };

  const filteredActivityServers = useMemo(() => {
    let list = [...initialActivityServers];
    if (activityServerSearch.trim()) {
      const q = activityServerSearch.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (activityServerSortOrder === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activityServerSortOrder === 'members') {
      list.sort((a, b) => b.members - a.members);
    }
    return list;
  }, [activityServerSearch, activityServerSortOrder, initialActivityServers]);

  const primaryActivityServers = useMemo(() => {
    return filteredActivityServers.slice(0, 5);
  }, [filteredActivityServers]);

  const secondaryActivityServers = useMemo(() => {
    return filteredActivityServers.slice(5);
  }, [filteredActivityServers]);

  // ==========================================
  // GAME OVERLAY STATES (Discord Parity)
  // ==========================================
  // Overview
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [enableLegacyOverlay, setEnableLegacyOverlay] = useState(true);
  const [overlayLockKeybind, setOverlayLockKeybind] = useState("SHIFT + '");
  const [isEditingOverlayKeybind, setIsEditingOverlayKeybind] = useState(false);
  const [tempOverlayKeybind, setTempOverlayKeybind] = useState("SHIFT + '");
  const [enableClickableRegions, setEnableClickableRegions] = useState(true);

  // Widgets
  const [widgetVoice, setWidgetVoice] = useState(true);
  const [widgetQuickActions, setWidgetQuickActions] = useState(true);
  const [widgetNotifications, setWidgetNotifications] = useState(true);
  const [widgetChat, setWidgetChat] = useState(true);
  const [widgetActivity, setWidgetActivity] = useState(true);
  const [widgetVideo, setWidgetVideo] = useState(true);
  const [widgetStreams, setWidgetStreams] = useState(true);

  // Voice Widget
  const [overlayAvatarSize, setOverlayAvatarSize] = useState<'Large' | 'Small'>('Large');
  const [overlayDisplayNames, setOverlayDisplayNames] = useState<'Always' | 'Only While Speaking' | 'Never'>('Always');
  const [overlayDisplayUsers, setOverlayDisplayUsers] = useState<'Always' | 'Only While Speaking'>('Always');
  const [overlayMaxUsers, setOverlayMaxUsers] = useState<number>(8);
  const [isVoiceWidgetPinned, setIsVoiceWidgetPinned] = useState(true);

  // Notifications
  const [overlayNotifMessages, setOverlayNotifMessages] = useState(true);
  const [overlayNotifWelcome, setOverlayNotifWelcome] = useState(true);
  const [overlayNotifGoLive, setOverlayNotifGoLive] = useState(true);
  const [overlayNotifGameActivity, setOverlayNotifGameActivity] = useState(true);
  const [overlayNotifNowPlaying, setOverlayNotifNowPlaying] = useState(true);

  const handleResetOverlayWidgets = () => {
    setWidgetVoice(true);
    setWidgetQuickActions(true);
    setWidgetNotifications(true);
    setWidgetChat(true);
    setWidgetActivity(true);
    setWidgetVideo(true);
    setWidgetStreams(true);
    toast.success(t('Tata letak widget overlay dikembalikan ke default!'));
  };

  // ==========================================
  // CONNECTED APPS & DEVELOPER STATES (Discord Parity)
  // ==========================================
  interface ConnectedPlatformItem {
    id: string;
    name: string;
    icon: string;
    bg: string;
    text: string;
  }

  const availablePlatforms: ConnectedPlatformItem[] = useMemo(
    () => [
      { id: 'riot', name: 'Riot Games', icon: '⚡', bg: 'bg-[#d93f2f]', text: 'text-white' },
      { id: 'battlenet', name: 'Battle.net', icon: '🌀', bg: 'bg-[#0074e0]', text: 'text-white' },
      { id: 'bluesky', name: 'Bluesky', icon: '🦋', bg: 'bg-[#1185fe]', text: 'text-white' },
      { id: 'bungie', name: 'Bungie.net', icon: '💠', bg: 'bg-[#18181b]', text: 'text-[#06b6d4]' },
      { id: 'paypal', name: 'PayPal', icon: '🅿️', bg: 'bg-[#003087]', text: 'text-white' },
      { id: 'reddit', name: 'Reddit', icon: '🤖', bg: 'bg-[#ff4500]', text: 'text-white' },
      { id: 'steam', name: 'Steam', icon: '⚙️', bg: 'bg-[#171a21]', text: 'text-white' },
      { id: 'x', name: 'X', icon: '✖️', bg: 'bg-black', text: 'text-white' },
      { id: 'ebay', name: 'eBay', icon: '🛍️', bg: 'bg-[#e53238]', text: 'text-white' },
      { id: 'crunchyroll', name: 'Crunchyroll', icon: '🍥', bg: 'bg-[#f47521]', text: 'text-white' },
      {
        id: 'playstation',
        name: 'PlayStation Network',
        icon: '🎮',
        bg: 'bg-[#003791]',
        text: 'text-white',
      },
      { id: 'xbox', name: 'Xbox', icon: '❎', bg: 'bg-[#107c10]', text: 'text-white' },
      { id: 'epic', name: 'Epic Games', icon: '🛡️', bg: 'bg-[#2b2b2b]', text: 'text-white' },
      { id: 'facebook', name: 'Facebook', icon: '📘', bg: 'bg-[#1877f2]', text: 'text-white' },
      { id: 'github', name: 'GitHub', icon: '🐙', bg: 'bg-[#24292e]', text: 'text-white' },
      { id: 'roblox', name: 'Roblox', icon: '🟥', bg: 'bg-[#e2231a]', text: 'text-white' },
      { id: 'twitch', name: 'Twitch', icon: '👾', bg: 'bg-[#9146ff]', text: 'text-white' },
      { id: 'youtube', name: 'YouTube', icon: '▶️', bg: 'bg-[#ff0000]', text: 'text-white' },
      { id: 'spotify', name: 'Spotify', icon: '🟢', bg: 'bg-[#1ed760]', text: 'text-black' },
    ],
    [],
  );

  interface UserConnection {
    id: string;
    platformId: string;
    accountName: string;
    platformName: string;
    icon: string;
    displayOnProfile: boolean;
    displayStatus: boolean;
  }

  const [userConnections, setUserConnections] = useState<UserConnection[]>([
    {
      id: 'conn-spotify',
      platformId: 'spotify',
      accountName: 'ESTEFANO',
      platformName: 'Spotify',
      icon: '🟢',
      displayOnProfile: true,
      displayStatus: true,
    },
  ]);

  interface AuthorizedApp {
    id: string;
    name: string;
    authorizedDate: string;
    icon: string;
    permissionsCount: number;
    permissionsList: string[];
    aboutInfo: string;
    policiesUrl: string;
  }

  const [authorizedApps, setAuthorizedApps] = useState<AuthorizedApp[]>([
    {
      id: 'app-nve',
      name: 'Neverness to Everness',
      authorizedDate: '11/1/2026',
      icon: '🌸',
      permissionsCount: 14,
      permissionsList: [
        'Access your username, avatar, and banner',
        'Know what servers you are in',
        'Access your email address',
        'Read your connections',
        'Join servers for you',
        'Update your presence and activity',
      ],
      aboutInfo: 'Official game client integration for Neverness to Everness by Hotta Studio.',
      policiesUrl: 'https://nte.perfectworld.com/privacy',
    },
    {
      id: 'app-watch-together',
      name: 'Watch Together',
      authorizedDate: '10/31/2026',
      icon: '▶️',
      permissionsCount: 6,
      permissionsList: [
        'Access your username and avatar',
        'Access your voice channel state',
        'Synchronize playback across participants',
      ],
      aboutInfo: 'Activity for watching YouTube videos with friends in voice channels.',
      policiesUrl: 'https://youtube.com/t/terms',
    },
  ]);

  const [authorizedAppSearch, setAuthorizedAppSearch] = useState('');
  const [expandedAppAbout, setExpandedAppAbout] = useState<Record<string, boolean>>({});
  const [expandedAppPerms, setExpandedAppPerms] = useState<Record<string, boolean>>({});

  return (
    <>
      {activeSection === 'registered_games' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: CURRENT GAME */}
            <div id="registered-current-game" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Current Game')}</h2>
              </div>

              {/* Box: No game detected */}
              <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-6 text-center space-y-3">
                <div className="text-sm font-semibold text-muted-foreground/80">
                  {t('No game detected')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('Not seeing your game?')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddingGameDropdownOpen(!isAddingGameDropdownOpen)}
                    className="text-[#5865F2] hover:underline font-semibold cursor-pointer"
                  >
                    {t('Add it!')}
                  </button>
                </div>

                {/* Dropdown to add a game */}
                {isAddingGameDropdownOpen && (
                  <div className="mt-4 pt-4 border-t border-border/60 max-w-md mx-auto text-left space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <label className="text-xs font-semibold text-foreground">
                      {t('Select a game or app to add:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedGameToAdd}
                        onChange={(e) => setSelectedGameToAdd(e.target.value)}
                        className="flex-1 h-9 rounded-lg bg-[#2b2d31] border border-border/80 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                      >
                        <option value="">{t('Choose a running app...')}</option>
                        {detectableGamesPreset.map((g) => (
                          <option key={g.name} value={g.name}>
                            {g.icon} {g.name}
                          </option>
                        ))}
                        <option value="__custom__">{t('➕ Add Custom Name...')}</option>
                      </select>
                      <Button
                        size="sm"
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-9 px-4 cursor-pointer"
                        onClick={() => {
                          const name =
                            selectedGameToAdd === '__custom__'
                              ? customGameInput.trim()
                              : selectedGameToAdd;
                          if (!name) {
                            toast.error(t('Pilih atau ketik nama game terlebih dahulu'));
                            return;
                          }
                          const exists = registeredGames.some(
                            (g) => g.name.toLowerCase() === name.toLowerCase(),
                          );
                          if (exists) {
                            toast.info(t('Game sudah ada dalam daftar'));
                            return;
                          }
                          const preset = detectableGamesPreset.find((p) => p.name === name);
                          setRegisteredGames((prev) => [
                            ...prev,
                            {
                              id: name.toLowerCase().replace(/\s+/g, '-'),
                              name,
                              verified: preset ? preset.verified : false,
                              lastPlayed: t('Just now'),
                              enabled: true,
                              icon: preset?.icon || '🎮',
                            },
                          ]);
                          setSelectedGameToAdd('');
                          setCustomGameInput('');
                          setIsAddingGameDropdownOpen(false);
                          toast.success(t(`${name} berhasil ditambahkan!`));
                        }}
                      >
                        {t('Add Game')}
                      </Button>
                    </div>

                    {selectedGameToAdd === '__custom__' && (
                      <Input
                        type="text"
                        placeholder={t('Enter app / game executable name...')}
                        value={customGameInput}
                        onChange={(e) => setCustomGameInput(e.target.value)}
                        className="h-8 text-xs bg-[#2b2d31] border-border/80 text-foreground"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 2: ADDED GAMES */}
            <div id="registered-added-games" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Added Games')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Some information about games (such as genre or cover art) is provided by')}{' '}
                  <a
                    href="https://www.igdb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    IGDB
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                  .
                </p>
              </div>

              {/* Games List */}
              <div className="space-y-2">
                {registeredGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2b2d31] flex items-center justify-center text-lg shadow-inner">
                        {game.icon || '🎮'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{game.name}</span>
                          {game.verified && (
                            <span
                              className="w-3.5 h-3.5 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[9px] font-bold"
                              title={t('Verified Game')}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t('Last played')} {game.lastPlayed}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={game.enabled}
                        onCheckedChange={(checked) => {
                          setRegisteredGames((prev) =>
                            prev.map((g) => (g.id === game.id ? { ...g, enabled: checked } : g)),
                          );
                          toast.success(
                            checked
                              ? t(`Overlay & status untuk ${game.name} diaktifkan`)
                              : t(`Overlay & status untuk ${game.name} dinonaktifkan`),
                          );
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredGames((prev) => prev.filter((g) => g.id !== game.id));
                          toast.success(t(`${game.name} dihapus dari daftar`));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                        title={t('Remove Game')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Related Settings Card (Matching Screenshot 1) */}
              <div className="pt-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => onNavigateSection?.('activity_privacy')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Activity Privacy')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'Control who sees activity information from games and connected apps I use.',
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          </div>
      )}

      {activeSection === 'activity_privacy' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: WHAT ACTIVITY I SHARE (Screenshot 2) */}
            <div id="activity-what-i-share" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('What Activity I Share')}</h2>
              </div>

              {/* 3 Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">{t('Share my activity')}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Share activity information from games and connected apps I use, including when and how I engage.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={shareMyActivity}
                    onCheckedChange={(checked) => {
                      setShareMyActivity(checked);
                      toast.success(
                        checked ? t('Aktivitas akan dibagikan') : t('Aktivitas tidak akan dibagikan'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Share when I come online')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Allow friends to receive a push notification when you come online.')}
                    </div>
                  </div>
                  <Switch
                    checked={shareWhenOnline}
                    onCheckedChange={(checked) => {
                      setShareWhenOnline(checked);
                      toast.success(
                        checked ? t('Notifikasi online aktif') : t('Notifikasi online nonaktif'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Share when I start streaming')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allow members that you interact with the most to get a notification when you start streaming in small servers.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={shareWhenStreaming}
                    onCheckedChange={(checked) => {
                      setShareWhenStreaming(checked);
                      toast.success(
                        checked ? t('Notifikasi streaming aktif') : t('Notifikasi streaming nonaktif'),
                      );
                    }}
                  />
                </div>
              </div>

              {/* Related Settings Card leading to Registered Games with Terraria tree icon (Screenshot 2) */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => onNavigateSection?.('registered_games')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Registered Games')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'You may also be sharing activity from 1 game you play, including Terraria. Restrict sharing on a game by game basis.',
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg bg-[#142b1b] border border-[#2d5a36] flex items-center justify-center text-sm shadow-sm"
                      title="Terraria"
                    >
                      🌳
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: WHERE I SHARE ACTIVITY (Screenshots 2, 3, 4) */}
            <div id="activity-where-i-share" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Where I Share Activity')}</h2>
                <div className="text-xs font-semibold text-foreground mt-2">
                  {t('Automatically share my activity when joining a server')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Your activity is always shared with your friends.')}
                </div>
              </div>

              {/* Radio Options */}
              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'all', title: t('Share in all servers') },
                  { id: 'small', title: t('Share in servers with 200 or fewer members') },
                  { id: 'none', title: t('Do not share in any servers') },
                ].map((opt) => {
                  const isSelected = shareServerScope === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setShareServerScope(opt.id as any);
                        toast.success(t(`Pengaturan server diubah: ${opt.title}`));
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#5865F2]/5 border-[#5865F2]'
                          : 'bg-[#1e1f22] border-border/70 hover:bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                        )}
                      >
                        {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Search my servers Input (Screenshot 3 & 4) */}
              <div className="relative pt-2">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none mt-1" />
                <Input
                  type="text"
                  placeholder={t('Search my servers')}
                  value={activityServerSearch}
                  onChange={(e) => setActivityServerSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-[#1e1f22] border-border/80 text-foreground"
                />
              </div>

              {/* Server List Controls: Order & Toggle All Off */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="relative">
                  <select
                    value={activityServerSortOrder}
                    onChange={(e) => setActivityServerSortOrder(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none pr-4"
                  >
                    <option value="order" className="bg-[#1e1f22] text-foreground">
                      {t('Server Order ⌵')}
                    </option>
                    <option value="name" className="bg-[#1e1f22] text-foreground">
                      {t('Server Name ⌵')}
                    </option>
                    <option value="members" className="bg-[#1e1f22] text-foreground">
                      {t('Member Count ⌵')}
                    </option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAllServers}
                  className="text-[#5865F2] hover:underline font-semibold cursor-pointer text-xs"
                >
                  {isAnyServerActivityOn ? t('Toggle All Off') : t('Toggle All On')}
                </button>
              </div>

              {/* Primary Servers List */}
              <div className="space-y-2">
                {primaryActivityServers.map((server) => {
                  const isShared = serverActivityEnabledMap[server.id] ?? true;
                  return (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center font-bold text-xs text-[#5865F2] shrink-0">
                          {server.avatarFallback}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{server.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {server.members.toLocaleString()} {t('members')}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isShared}
                        onCheckedChange={(checked) => {
                          setServerActivityEnabledMap((prev) => ({ ...prev, [server.id]: checked }));
                          toast.success(
                            checked
                              ? t(`Aktivitas dibagikan ke ${server.name}`)
                              : t(`Aktivitas tidak dibagikan ke ${server.name}`),
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Show 40 more servers Accordion (Screenshot 4) */}
              {secondaryActivityServers.length > 0 && (
                <div className="space-y-2">
                  <div
                    onClick={() => setShowMoreActivityServers(!showMoreActivityServers)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#e67e22]/20 border border-[#e67e22]/40 flex items-center justify-center text-sm shadow-inner">
                        🦊
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {showMoreActivityServers
                            ? t('Hide additional servers')
                            : t('Show 40 more servers')}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t('Moku, Wild Forest, Cerita Crypto, and +37 more servers')}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#2b2d31] flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          showMoreActivityServers && 'rotate-180',
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded secondary servers list */}
                  {showMoreActivityServers && (
                    <div className="space-y-2 pl-2 border-l-2 border-border/40 animate-in fade-in duration-150">
                      {secondaryActivityServers.map((server) => {
                        const isShared = serverActivityEnabledMap[server.id] ?? true;
                        return (
                          <div
                            key={server.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                                {server.avatarFallback}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-foreground truncate">
                                  {server.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {server.members.toLocaleString()} {t('members')}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={isShared}
                              onCheckedChange={(checked) => {
                                setServerActivityEnabledMap((prev) => ({
                                  ...prev,
                                  [server.id]: checked,
                                }));
                                toast.success(
                                  checked
                                    ? t(`Aktivitas dibagikan ke ${server.name}`)
                                    : t(`Aktivitas tidak dibagikan ke ${server.name}`),
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Related Settings Card leading to Data & Privacy (Screenshot 4) */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => onNavigateSection?.('privacy')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Data & Privacy')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'Control who can see your profile info — like your bio and connected accounts.',
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: ACTIVITY JOINING (Screenshot 4) */}
            <div id="activity-joining" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Activity Joining')}</h2>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {t("Some games allow users to join the game you're playing when viewing your activity.")}
                </div>
              </div>

              {/* 2 Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow friends to join my game')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Allows friends to join without sending a request.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowFriendsJoinGame}
                    onCheckedChange={(checked) => {
                      setAllowFriendsJoinGame(checked);
                      toast.success(
                        checked
                          ? t('Teman dapat bergabung ke game tanpa request')
                          : t('Teman harus mengirim request untuk bergabung'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow voice channel participants to join my game')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allow anyone in a shared voice channel to join my game without sending a request. This feature only works in non-Community enabled servers.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={allowVoiceParticipantsJoinGame}
                    onCheckedChange={(checked) => {
                      setAllowVoiceParticipantsJoinGame(checked);
                      toast.success(
                        checked
                          ? t('Peserta voice channel dapat bergabung ke game')
                          : t('Peserta voice channel tidak dapat bergabung otomatis'),
                      );
                    }}
                  />
                </div>
              </div>

              {/* Footer Note (Matching Screenshot 4) */}
              <div className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                {t(
                  'Looking for per-server controls? Navigate to the server, select the dropdown menu next to the server name, then select Privacy Settings. From there, you can toggle on or off Activity Joining for just that server.',
                )}
              </div>
            </div>
          </div>
      )}

      {activeSection === 'overlay' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: OVERVIEW (Screenshot 1) */}
            <div id="overlay-overview" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Game Overlay')}</h2>
              </div>

              {/* Card 1: Enable Overlay */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">{t('Enable Overlay')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'Lighter, faster, and more customizable. Requires Borderless display setting.',
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={enableOverlay}
                    onCheckedChange={(checked) => {
                      setEnableOverlay(checked);
                      toast.success(checked ? t('Overlay diaktifkan') : t('Overlay dinonaktifkan'));
                    }}
                  />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Card 2: Enable Legacy Overlay */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">
                    {t('Enable Legacy Overlay')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('Legacy Overlay available for all supported games.')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={enableLegacyOverlay}
                    onCheckedChange={(checked) => {
                      setEnableLegacyOverlay(checked);
                      toast.success(
                        checked
                          ? t('Legacy Overlay diaktifkan')
                          : t('Legacy Overlay dinonaktifkan'),
                      );
                    }}
                  />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Card 3: Report a Problem */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">{t('Report a Problem')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("If Overlay isn't working as expected, let us know so we can fix it.")}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    toast.success(
                      t('Terima kasih! Laporan masalah overlay telah dikirim ke tim pengembang.'),
                    )
                  }
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-5 h-9 rounded-lg font-semibold shrink-0 cursor-pointer"
                >
                  {t('Report')}
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-4">
                {/* Toggle Overlay Lock */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Toggle Overlay Lock')}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingOverlayKeybind ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={tempOverlayKeybind}
                          onChange={(e) => setTempOverlayKeybind(e.target.value.toUpperCase())}
                          className="h-8 w-32 text-xs font-mono bg-[#2b2d31] border-[#5865F2] text-foreground text-center"
                          autoFocus
                          placeholder="Tekan shortcut..."
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
                          onClick={() => {
                            if (tempOverlayKeybind.trim()) {
                              setOverlayLockKeybind(tempOverlayKeybind.trim());
                            }
                            setIsEditingOverlayKeybind(false);
                            toast.success(t('Shortcut lock overlay diperbarui!'));
                          }}
                        >
                          {t('Simpan')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-border/70 text-xs font-mono font-bold text-foreground tracking-wider">
                          {overlayLockKeybind}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setTempOverlayKeybind(overlayLockKeybind);
                            setIsEditingOverlayKeybind(true);
                          }}
                          className="h-8 px-3 text-xs bg-[#2b2d31] hover:bg-[#35373c] text-foreground font-semibold rounded-lg cursor-pointer"
                        >
                          {t('Edit Keybind')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Enable overlay clickable regions */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable overlay clickable regions')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allows areas of the overlay (ie notifications) to be clickable while the overlay is locked.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={enableClickableRegions}
                    onCheckedChange={(checked) => {
                      setEnableClickableRegions(checked);
                      toast.success(
                        checked
                          ? t('Clickable regions overlay aktif')
                          : t('Clickable regions overlay nonaktif'),
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: WIDGETS (Screenshot 2) */}
            <div id="overlay-widgets" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Widgets')}</h2>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('Choose what shows up in your overlay.')}
                </div>
              </div>

              {/* 7 Switches */}
              <div className="space-y-4">
                {[
                  {
                    id: 'voice',
                    label: t('Voice'),
                    desc: t("Who's talking in your call"),
                    checked: widgetVoice,
                    setter: setWidgetVoice,
                  },
                  {
                    id: 'quick-actions',
                    label: t('Quick Actions'),
                    desc: t('Mute, deafen and more'),
                    checked: widgetQuickActions,
                    setter: setWidgetQuickActions,
                  },
                  {
                    id: 'notifications',
                    label: t('Notifications'),
                    desc: t('Messages, calls and invites'),
                    checked: widgetNotifications,
                    setter: setWidgetNotifications,
                  },
                  {
                    id: 'chat',
                    label: t('Chat'),
                    desc: t('Chat without leaving your game'),
                    checked: widgetChat,
                    setter: setWidgetChat,
                  },
                  {
                    id: 'activity',
                    label: t('Activity'),
                    desc: t('What friends are playing'),
                    checked: widgetActivity,
                    setter: setWidgetActivity,
                  },
                  {
                    id: 'video',
                    label: t('Video'),
                    desc: t('Cameras in your call'),
                    checked: widgetVideo,
                    setter: setWidgetVideo,
                  },
                  {
                    id: 'streams',
                    label: t('Streams'),
                    desc: t('Streams in your call'),
                    checked: widgetStreams,
                    setter: setWidgetStreams,
                  },
                ].map((w, idx) => (
                  <div
                    key={w.id}
                    className={cn(
                      'flex items-center justify-between gap-4 py-2',
                      idx < 6 && 'border-b border-border/40',
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">{w.label}</div>
                      <div className="text-[11px] text-muted-foreground">{w.desc}</div>
                    </div>
                    <Switch
                      checked={w.checked}
                      onCheckedChange={(checked) => {
                        w.setter(checked);
                        toast.success(
                          checked
                            ? t(`Widget ${w.label} diaktifkan`)
                            : t(`Widget ${w.label} dinonaktifkan`),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Reset Default Layout Row (Screenshot 2) */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-xs font-semibold text-foreground">
                  {t('Reset Default Layout')}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetOverlayWidgets}
                  className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
                >
                  {t('Reset')}
                </Button>
              </div>
            </div>

            {/* SUB-SECTION 3: VOICE WIDGET (Screenshot 3) */}
            <div id="overlay-voice-widget" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Voice Widget')}</h2>
              </div>

              {/* Voice Widget Interactive Live Preview Container */}
              <div className="rounded-2xl border border-border/80 bg-[#1e1f22] p-8 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
                {/* Floating Mock Voice Overlay Card */}
                <div className="w-64 rounded-2xl bg-[#111214]/90 backdrop-blur-md border border-white/10 p-3.5 space-y-2.5 shadow-2xl">
                  {/* Participant 1: zmsta */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'rounded-full bg-[#2b2d31] flex items-center justify-center text-xs overflow-hidden shrink-0 border border-border/60',
                        overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                      )}
                    >
                      🐱
                    </div>
                    {overlayDisplayNames !== 'Never' && (
                      <span className="text-xs font-semibold text-white/90 truncate">zmsta</span>
                    )}
                  </div>

                  {/* Participant 2: Acetaminophen (Speaking state) */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0 ring-2 ring-emerald-500 shadow-sm shadow-emerald-500/50',
                        overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    {overlayDisplayNames !== 'Never' && (
                      <span className="text-xs font-bold text-emerald-400 truncate">
                        Acetaminophen
                      </span>
                    )}
                    <Mic className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                  </div>

                  {/* Participant 3: Kovanth */}
                  {overlayDisplayUsers === 'Always' && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                          overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      {overlayDisplayNames !== 'Never' && (
                        <span className="text-xs font-semibold text-white/90 truncate">
                          Kovanth
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participant 4: Scynder (Deafened state) */}
                  {overlayDisplayUsers === 'Always' && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                          overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      {overlayDisplayNames !== 'Never' && (
                        <span className="text-xs font-semibold text-white/90 truncate">
                          Scynder
                        </span>
                      )}
                      <Headphones className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />
                    </div>
                  )}

                  {/* Bottom Pill: Voice Channel & Pin */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
                      {t('Voice Channel')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVoiceWidgetPinned(!isVoiceWidgetPinned);
                        toast.success(
                          isVoiceWidgetPinned
                            ? t('Widget suara di-unpin')
                            : t('Widget suara di-pin ke overlay'),
                        );
                      }}
                      className={cn(
                        'size-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                        isVoiceWidgetPinned
                          ? 'bg-[#5865F2] text-white shadow-sm'
                          : 'bg-white/10 text-muted-foreground hover:bg-white/20',
                      )}
                      title={isVoiceWidgetPinned ? t('Pinned') : t('Unpinned')}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls Grid / Rows (Screenshot 3) */}
              <div className="space-y-4 pt-2">
                {/* Avatar Size */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">{t('Avatar Size')}</span>
                  <Select
                    value={overlayAvatarSize}
                    onValueChange={(val: 'Large' | 'Small') => {
                      setOverlayAvatarSize(val);
                      toast.success(t(`Ukuran avatar diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Large">{t('Large')}</SelectItem>
                      <SelectItem value="Small">{t('Small')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Names */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">
                    {t('Display Names')}
                  </span>
                  <Select
                    value={overlayDisplayNames}
                    onValueChange={(val: any) => {
                      setOverlayDisplayNames(val);
                      toast.success(t(`Tampilan nama diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Always">{t('Always')}</SelectItem>
                      <SelectItem value="Only While Speaking">
                        {t('Only While Speaking')}
                      </SelectItem>
                      <SelectItem value="Never">{t('Never')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Users */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">
                    {t('Display Users')}
                  </span>
                  <Select
                    value={overlayDisplayUsers}
                    onValueChange={(val: any) => {
                      setOverlayDisplayUsers(val);
                      toast.success(t(`Tampilan pengguna diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Always">{t('Always')}</SelectItem>
                      <SelectItem value="Only While Speaking">
                        {t('Only While Speaking')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Users Displayed Slider (Screenshot 3 & 4) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t('Max Users Displayed')}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#5865F2]">
                      {overlayMaxUsers === 0 ? t('Off') : overlayMaxUsers}
                    </span>
                  </div>
                  <div className="relative pt-2 pb-4">
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={overlayMaxUsers}
                      onChange={(e) => setOverlayMaxUsers(Number(e.target.value))}
                      className="w-full accent-[#5865F2] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                      <span>Off</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: NOTIFICATIONS (Screenshot 4) */}
            <div id="overlay-notifications" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Notifications')}</h2>
              </div>

              {/* 5 Switches */}
              <div className="space-y-4">
                {[
                  {
                    id: 'messages',
                    label: t('Messages'),
                    desc: t(
                      'For each text message notification, shows a notice that you can reply to.',
                    ),
                    checked: overlayNotifMessages,
                    setter: setOverlayNotifMessages,
                  },
                  {
                    id: 'welcome',
                    label: t('Welcome'),
                    desc: t(
                      'Shows a notice every time the overlay opens to let you know that the overlay is now active.',
                    ),
                    checked: overlayNotifWelcome,
                    setter: setOverlayNotifWelcome,
                  },
                  {
                    id: 'go-live',
                    label: t('Go Live'),
                    desc: t(
                      'Lets you know when you are able to stream a game when the overlay first opens.',
                    ),
                    checked: overlayNotifGoLive,
                    setter: setOverlayNotifGoLive,
                  },
                  {
                    id: 'game-activity',
                    label: t('Game Activity'),
                    desc: t(
                      'Shows friends who are currently playing, or have recently played the game you’re currently playing.',
                    ),
                    checked: overlayNotifGameActivity,
                    setter: setOverlayNotifGameActivity,
                  },
                  {
                    id: 'now-playing',
                    label: t('Now Playing'),
                    desc: t(
                      'Notifies you when a friend starts playing the game you are currently playing.',
                    ),
                    checked: overlayNotifNowPlaying,
                    setter: setOverlayNotifNowPlaying,
                  },
                ].map((n, idx) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-center justify-between gap-4 py-2',
                      idx < 4 && 'border-b border-border/40',
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">{n.label}</div>
                      <div className="text-[11px] text-muted-foreground">{n.desc}</div>
                    </div>
                    <Switch
                      checked={n.checked}
                      onCheckedChange={(checked) => {
                        n.setter(checked);
                        toast.success(
                          checked
                            ? t(`Notifikasi overlay ${n.label} diaktifkan`)
                            : t(`Notifikasi overlay ${n.label} dinonaktifkan`),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
      )}

      {activeSection === 'connected_apps' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: CONNECTIONS (Screenshot 1) */}
            <div id="connected-connections" className="scroll-mt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Connections')}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  {t(
                    "These are accounts from other platforms. Connecting them here can unlock new features on Discord, like the ability to share what you're currently listening to, get paid safely and securely, and more.",
                  )}
                </p>
              </div>

              {/* Add a new connection */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Add a new connection')}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availablePlatforms.map((p) => {
                    const isConnected = userConnections.some((c) => c.platformId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isConnected) {
                            toast.info(t(`Akun ${p.name} sudah terhubung!`));
                            return;
                          }
                          setUserConnections((prev) => [
                            ...prev,
                            {
                              id: `conn-${p.id}`,
                              platformId: p.id,
                              accountName: currentUserName || 'User',
                              platformName: p.name,
                              icon: p.icon,
                              displayOnProfile: true,
                              displayStatus: true,
                            },
                          ]);
                          toast.success(t(`Akun ${p.name} berhasil dihubungkan!`));
                        }}
                        className={cn(
                          'size-10 rounded-xl border border-border/70 flex items-center justify-center text-lg transition-all cursor-pointer shadow-sm relative group',
                          isConnected
                            ? 'bg-[#5865F2]/20 border-[#5865F2] ring-1 ring-[#5865F2]'
                            : 'bg-[#1e1f22] hover:bg-[#2b2d31] hover:border-border hover:scale-105',
                        )}
                        title={isConnected ? `${p.name} (Terhubung)` : `Hubungkan ${p.name}`}
                      >
                        <span>{p.icon}</span>
                        {isConnected && (
                          <div className="absolute -top-1 -right-1 size-3.5 bg-[#5865F2] rounded-full text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Connections List */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {userConnections.length} {t('connection')}
                </div>

                <div className="space-y-3">
                  {userConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="rounded-2xl border border-border/80 bg-[#1e1f22] p-4 space-y-4"
                    >
                      {/* Top Header Row with Icon, Names, and X button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-[#1ed760] text-black flex items-center justify-center text-lg font-bold shadow-sm">
                            {conn.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {conn.accountName}
                            </div>
                            <div className="text-xs text-muted-foreground">{conn.platformName}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUserConnections((prev) => prev.filter((c) => c.id !== conn.id));
                            toast.success(t(`Koneksi ${conn.platformName} diputuskan`));
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                          title={t('Disconnect')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Switches inside connection card */}
                      <div className="space-y-3 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {t('Display on profile')}
                          </span>
                          <Switch
                            checked={conn.displayOnProfile}
                            onCheckedChange={(checked) => {
                              setUserConnections((prev) =>
                                prev.map((c) =>
                                  c.id === conn.id ? { ...c, displayOnProfile: checked } : c,
                                ),
                              );
                              toast.success(
                                checked
                                  ? t(`Tampilkan ${conn.platformName} di profil`)
                                  : t(`Sembunyikan ${conn.platformName} dari profil`),
                              );
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {t(`Display ${conn.platformName} as your status`)}
                          </span>
                          <Switch
                            checked={conn.displayStatus}
                            onCheckedChange={(checked) => {
                              setUserConnections((prev) =>
                                prev.map((c) =>
                                  c.id === conn.id ? { ...c, displayStatus: checked } : c,
                                ),
                              );
                              toast.success(
                                checked
                                  ? t(`Status aktivitas ${conn.platformName} aktif`)
                                  : t(`Status aktivitas ${conn.platformName} nonaktif`),
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: AUTHORIZED APPS (Screenshot 2) */}
            <div id="connected-authorized-apps" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Authorized Apps')}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  {t(
                    "These include third-party services you've given permission to access your Discord account. You can review what each app can do and revoke access anytime.",
                  )}
                </p>
              </div>

              {/* Search Installed Apps */}
              <div className="relative pt-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none mt-0.5" />
                <Input
                  type="text"
                  placeholder={t('Search installed apps')}
                  value={authorizedAppSearch}
                  onChange={(e) => setAuthorizedAppSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-[#1e1f22] border-border/80 text-foreground"
                />
              </div>

              {/* Authorized App Cards */}
              <div className="space-y-3">
                {authorizedApps
                  .filter((a) => a.name.toLowerCase().includes(authorizedAppSearch.toLowerCase()))
                  .map((app) => {
                    const isAboutOpen = expandedAppAbout[app.id] ?? false;
                    const isPermsOpen = expandedAppPerms[app.id] ?? false;

                    return (
                      <div
                        key={app.id}
                        className="rounded-2xl border border-border/80 bg-[#1e1f22] overflow-hidden transition-all"
                      >
                        {/* App Header Row */}
                        <div className="p-4 flex items-center justify-between border-b border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-[#2b2d31] border border-border/60 flex items-center justify-center text-xl shadow-inner">
                              {app.icon}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{app.name}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {t('Authorized on')} {app.authorizedDate}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* About and Policies Accordion Row */}
                        <div className="border-b border-border/40">
                          <div
                            onClick={() =>
                              setExpandedAppAbout((prev) => ({
                                ...prev,
                                [app.id]: !isAboutOpen,
                              }))
                            }
                            className="p-3.5 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                          >
                            <span className="text-xs font-semibold text-foreground">
                              {t('About and Policies')}
                            </span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                                isAboutOpen && 'rotate-180',
                              )}
                            />
                          </div>

                          {isAboutOpen && (
                            <div className="px-4 pb-3.5 space-y-2 text-xs text-muted-foreground animate-in fade-in duration-150">
                              <p>{app.aboutInfo}</p>
                              <div>
                                <a
                                  href={app.policiesUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-1"
                                >
                                  {t('Terms & Privacy Policy')}
                                  <ExternalLink className="w-3 h-3 inline" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Permissions Accordion Row */}
                        <div className="border-b border-border/40">
                          <div
                            onClick={() =>
                              setExpandedAppPerms((prev) => ({
                                ...prev,
                                [app.id]: !isPermsOpen,
                              }))
                            }
                            className="p-3.5 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                          >
                            <div>
                              <span className="text-xs font-semibold text-foreground">
                                {t('Permissions')}
                              </span>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {app.permissionsCount} {t('Permissions enabled')}
                              </div>
                            </div>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                                isPermsOpen && 'rotate-180',
                              )}
                            />
                          </div>

                          {isPermsOpen && (
                            <div className="px-4 pb-3.5 space-y-1.5 animate-in fade-in duration-150">
                              {app.permissionsList.map((perm, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-foreground/80"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>{perm}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Deauthorize Button Footer */}
                        <div className="p-3.5 flex justify-end bg-black/10">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAuthorizedApps((prev) => prev.filter((a) => a.id !== app.id));
                              toast.success(t(`Akses untuk ${app.name} telah dicabut`));
                            }}
                            className="text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-xs font-semibold px-4 h-8 rounded-lg cursor-pointer"
                          >
                            {t('Deauthorize')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
      )}
    </>
  );
}
