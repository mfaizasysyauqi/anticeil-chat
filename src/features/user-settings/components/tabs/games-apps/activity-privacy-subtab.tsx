import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  Users,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface ActivityServerItem {
  id: string;
  name: string;
  members: number;
  avatarFallback: string;
  isPrimary?: boolean;
}

export interface ActivityPrivacySubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function ActivityPrivacySubtab({
  onNavigateSection,
}: ActivityPrivacySubtabProps) {
  const { t } = useTranslation();

  const [shareMyActivity, setShareMyActivity] = useState(true);
  const [shareWhenOnline, setShareWhenOnline] = useState(true);
  const [shareWhenStreaming, setShareWhenStreaming] = useState(true);
  const [shareServerScope, setShareServerScope] = useState<
    'all' | 'small' | 'none'
  >('all');
  const [activityServerSearch, setActivityServerSearch] = useState('');
  const [activityServerSortOrder, setActivityServerSortOrder] = useState<
    'order' | 'name' | 'members'
  >('order');
  const [showMoreActivityServers, setShowMoreActivityServers] = useState(false);

  const [allowFriendsJoinGame, setAllowFriendsJoinGame] = useState(true);
  const [
    allowVoiceParticipantsJoinGame,
    setAllowVoiceParticipantsJoinGame,
  ] = useState(true);

  const initialActivityServers: ActivityServerItem[] = useMemo(
    () => [
      {
        id: 'hok-id',
        name: 'Honor of Kings Indonesia',
        members: 70494,
        avatarFallback: 'HOK',
        isPrimary: true,
      },
      {
        id: 'zmsta-srv',
        name: "zmsta's server",
        members: 1,
        avatarFallback: 'zs',
        isPrimary: true,
      },
      {
        id: 'fullz',
        name: '[FULLZ]',
        members: 9140,
        avatarFallback: 'FZ',
        isPrimary: true,
      },
      {
        id: 'nasgul',
        name: 'Nasgul Community',
        members: 132520,
        avatarFallback: 'NC',
        isPrimary: true,
      },
      {
        id: 'awd',
        name: 'awd',
        members: 4,
        avatarFallback: 'a',
        isPrimary: true,
      },
      { id: 'moku', name: 'Moku', members: 24500, avatarFallback: 'MK' },
      {
        id: 'wild-forest',
        name: 'Wild Forest',
        members: 18200,
        avatarFallback: 'WF',
      },
      {
        id: 'cerita-crypto',
        name: 'Cerita Crypto',
        members: 45310,
        avatarFallback: 'CC',
      },
      {
        id: 'genshin-id',
        name: 'Genshin Impact ID',
        members: 58920,
        avatarFallback: 'GI',
      },
      {
        id: 'valorant-sea',
        name: 'Valorant SEA',
        members: 89400,
        avatarFallback: 'VS',
      },
      {
        id: 'indonesia-dev',
        name: 'Developer Indonesia',
        members: 31200,
        avatarFallback: 'DI',
      },
    ],
    [],
  );

  const [serverActivityEnabledMap, setServerActivityEnabledMap] = useState<
    Record<string, boolean>
  >(() => {
    return {
      'hok-id': true,
      'zmsta-srv': true,
      fullz: true,
      nasgul: true,
      awd: true,
      moku: true,
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

  return (
    <div className="space-y-8 divide-y divide-border/50 pb-8">
      {/* SUB-SECTION 1: WHAT ACTIVITY I SHARE */}
      <div id="activity-what-i-share" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('What Activity I Share')}
          </h2>
        </div>

        {/* 3 Switches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">
                {t('Share my activity')}
              </div>
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
                  checked
                    ? t('Aktivitas akan dibagikan')
                    : t('Aktivitas tidak akan dibagikan'),
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
                {t(
                  'Allow friends to receive a push notification when you come online.',
                )}
              </div>
            </div>
            <Switch
              checked={shareWhenOnline}
              onCheckedChange={(checked) => {
                setShareWhenOnline(checked);
                toast.success(
                  checked
                    ? t('Notifikasi online aktif')
                    : t('Notifikasi online nonaktif'),
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
                  checked
                    ? t('Notifikasi streaming aktif')
                    : t('Notifikasi streaming nonaktif'),
                );
              }}
            />
          </div>
        </div>

        {/* Related Settings Card leading to Registered Games with Terraria tree icon */}
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
                <div className="text-xs font-bold text-foreground">
                  {t('Registered Games')}
                </div>
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

      {/* SUB-SECTION 2: WHERE I SHARE ACTIVITY */}
      <div id="activity-where-i-share" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Where I Share Activity')}
          </h2>
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
            {
              id: 'small',
              title: t('Share in servers with 200 or fewer members'),
            },
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
                    isSelected
                      ? 'border-[#5865F2]'
                      : 'border-muted-foreground/50',
                  )}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-[#5865F2]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {opt.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Search my servers Input */}
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
              onChange={(e) =>
                setActivityServerSortOrder(e.target.value as any)
              }
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
            {isAnyServerActivityOn
              ? t('Toggle All Off')
              : t('Toggle All On')}
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

        {/* Show 40 more servers Accordion */}
        {secondaryActivityServers.length > 0 && (
          <div className="space-y-2">
            <div
              onClick={() =>
                setShowMoreActivityServers(!showMoreActivityServers)
              }
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
                    {t(
                      'Moku, Wild Forest, Cerita Crypto, and +37 more servers',
                    )}
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
                              : t(
                                  `Aktivitas tidak dibagikan ke ${server.name}`,
                                ),
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

        {/* Related Settings Card leading to Data & Privacy */}
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
                <div className="text-xs font-bold text-foreground">
                  {t('Data & Privacy')}
                </div>
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

      {/* SUB-SECTION 3: ACTIVITY JOINING */}
      <div id="activity-joining" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Activity Joining')}
          </h2>
          <div className="text-[11px] text-muted-foreground mt-1">
            {t(
              "Some games allow users to join the game you're playing when viewing your activity.",
            )}
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
                    : t(
                        'Peserta voice channel tidak dapat bergabung otomatis',
                      ),
                );
              }}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-[11px] text-muted-foreground leading-relaxed pt-2">
          {t(
            'Looking for per-server controls? Navigate to the server, select the dropdown menu next to the server name, then select Privacy Settings. From there, you can toggle on or off Activity Joining for just that server.',
          )}
        </div>
      </div>
    </div>
  );
}
