import React, { useState, useMemo } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Menu,
  Clock,
  Search,
  Users,
  Volume2,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyIcon } from '@/features/colonies/components/colony-icon';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import type { CallLogItem, CallsTab } from '../types';
import type { FriendMember } from '@/features/friends';
import type { Colony } from '@/chat/chat-types';

export interface CallsViewProps {
  calls: CallLogItem[];
  friends: FriendMember[];
  colonies?: Colony[];
  onStartCall: (friend: FriendMember, isVideo?: boolean) => void;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
}

const PAGE_SIZE = 10;

export function CallsView({
  calls,
  friends,
  colonies = [],
  onStartCall,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
}: CallsViewProps) {
  const [activeTab, setActiveTab] = useState<CallsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered Calls based on Tab, Search Query, and Date Filter
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchesSearch =
        c.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.hubName && c.hubName.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      if (activeTab === 'missed' && c.type !== 'missed') return false;
      if (filterDate && dayjs(c.timestamp).format('YYYY-MM-DD') !== filterDate) return false;
      return true;
    });
  }, [calls, searchQuery, activeTab, filterDate]);

  const missedCount = useMemo(() => calls.filter((c) => c.type === 'missed').length, [calls]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCalls = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCalls.slice(start, start + PAGE_SIZE);
  }, [filteredCalls, safePage]);

  // Group paginated calls by date sections
  const groupedCalls = useMemo(() => {
    const groups: { dateKey: string; title: string; items: CallLogItem[] }[] = [];
    const todayStr = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    paginatedCalls.forEach((call) => {
      const callDate = dayjs(call.timestamp);
      const dateKey = callDate.format('YYYY-MM-DD');

      let title = callDate.locale('id').format('dddd, DD MMMM YYYY');
      if (dateKey === todayStr) {
        title = 'Hari Ini';
      } else if (dateKey === yesterdayStr) {
        title = 'Kemarin';
      }

      let grp = groups.find((g) => g.dateKey === dateKey);
      if (!grp) {
        grp = { dateKey, title, items: [] };
        groups.push(grp);
      }
      grp.items.push(call);
    });

    return groups;
  }, [paginatedCalls]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Discord Style Single App Bar (h-12) ─────────────────────────── */}
      <div className={cn('h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2', horizontalPadding)}>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Panggilan</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Filter Tabs */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none] px-1">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors shrink-0',
              activeTab === 'all'
                ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Semua
          </button>
          <button
            onClick={() => {
              setActiveTab('missed');
              setCurrentPage(1);
            }}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
              activeTab === 'missed'
                ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>Terlewat</span>
            {missedCount > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-red-500 text-white">
                {missedCount}
              </span>
            )}
          </button>
        </div>

        {/* Actions: Date Filter & Search Input */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Date Picker Filter */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg px-2 h-8 text-xs shrink-0 focus-within:border-primary transition-colors">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-foreground outline-hidden cursor-pointer w-24 sm:w-28 [color-scheme:dark]"
              title="Filter tanggal panggilan"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => {
                  setFilterDate('');
                  setCurrentPage(1);
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded hover:bg-muted"
                title="Hapus filter tanggal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <ResponsiveSearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Cari riwayat..."
            inputWidth="w-28 sm:w-40 md:w-48"
          />
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto scrollbar-none py-4 sm:py-6 space-y-6', horizontalPadding)}>
        {/* Speed Dial / Kontak Cepat Section */}
        {friends && friends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Panggilan Cepat (Speed Dial)</span>
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {friends.slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="w-36 p-3 rounded-xl border border-border bg-card flex flex-col items-center text-center gap-2 shrink-0 hover:border-primary/40 transition-all shadow-xs group"
                >
                  <div className="relative">
                    <div className="size-11 rounded-[14px] bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {f.id === 'anticeil' || f.name === 'Anticeil Official' ? (
                        <AnticeilLogo className="size-6 text-foreground" />
                      ) : (
                        <CommunityAvatar
                          name={f.name}
                          imageUrl={f.imageUrl || f.avatar}
                          size={44}
                          className="rounded-[14px]"
                          variant="squircle"
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 size-3 rounded-full border-2 border-card',
                        f.status === 'online'
                          ? 'bg-emerald-500'
                          : f.status === 'idle'
                          ? 'bg-amber-500'
                          : f.status === 'dnd'
                          ? 'bg-rose-500'
                          : 'bg-zinc-500'
                      )}
                    />
                  </div>

                  <div className="w-full">
                    <span className="text-xs font-bold text-foreground truncate block">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block capitalize">
                      {f.status || 'Offline'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartCall(f, false)}
                      className="flex-1 h-7 px-0 text-[11px] gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      title="Panggilan Suara"
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartCall(f, true)}
                      className="flex-1 h-7 px-0 text-[11px] gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      title="Panggilan Video"
                    >
                      <Video className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call Logs Section */}
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span>Riwayat Panggilan Terakhir ({filteredCalls.length})</span>
              {filterDate && (
                <span className="text-[10px] normal-case font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  Filter: {dayjs(filterDate).locale('id').format('DD MMM YYYY')}
                </span>
              )}
            </h2>
            {filteredCalls.length > 0 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                Halaman {safePage} dari {totalPages}
              </span>
            )}
          </div>

          {filteredCalls.length === 0 ? (
            <EmptyState
              icon={<Phone className="w-8 h-8 stroke-[1.8] text-primary/80" />}
              title={
                filterDate
                  ? 'Tidak ada panggilan pada tanggal ini'
                  : activeTab === 'missed'
                  ? 'Tidak ada panggilan terlewat'
                  : 'Belum ada riwayat panggilan'
              }
              description={
                filterDate
                  ? 'Coba ganti atau hapus filter tanggal untuk melihat riwayat lainnya.'
                  : 'Mulai obrolan suara atau video dengan teman dari menu Speed Dial.'
              }
            />
          ) : (
            <div className="space-y-5">
              {groupedCalls.map((group) => (
                <div key={group.dateKey} className="space-y-2.5">
                  {/* Date Section Header */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({group.items.length})
                    </span>
                    <div className="h-px bg-border/60 flex-1 ml-2" />
                  </div>

                  {/* Call Items in this Date Section */}
                  <div className="space-y-2">
                    {group.items.map((call) => {
                      // Determine whether this is a Colony voice channel or Friend DM call
                      const isExplicitColony = Boolean(call.hubName || call.colonyId);
                      const isGeneralVoiceName =
                        call.peerName.toLowerCase().includes('voice') ||
                        call.peerName.toLowerCase() === 'general' ||
                        call.peerName.toLowerCase().startsWith('voice-');

                      const friendMatch = friends.find(
                        (f) =>
                          f.id === call.peerId ||
                          (!isGeneralVoiceName && f.name.toLowerCase() === call.peerName.toLowerCase())
                      );

                      const isColonyCall = isExplicitColony || (!friendMatch && isGeneralVoiceName) || (!friendMatch && !call.isDm);

                      // Find matching hub if it's a colony call
                      const matchedHub =
                        colonies.find(
                          (h) =>
                            (call.colonyId && h.id === call.colonyId) ||
                            (call.hubName && h.name.toLowerCase() === call.hubName.toLowerCase()) ||
                            h.id === call.peerId
                        ) || colonies.find((h) => h.id !== 'anticeil') || colonies[0];

                      const colonyName = call.hubName || (matchedHub?.id !== 'anticeil' ? matchedHub?.name : null) || 'Colony Komunitas';
                      const colonyIcon = call.hubIcon || (matchedHub?.id !== 'anticeil' ? matchedHub?.iconUrl : null) || null;

                      const displayName = isColonyCall
                        ? call.peerName
                        : friendMatch?.name || call.peerName;

                      const avatarName = isColonyCall ? colonyName : displayName;
                      const avatarUrl = isColonyCall
                        ? colonyIcon
                        : friendMatch?.avatar || friendMatch?.imageUrl || call.peerAvatar;

                      return (
                        <div
                          key={call.id}
                          className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative shrink-0">
                              {isColonyCall ? (
                                <div className="size-10 rounded-[14px] bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs font-bold text-sm text-foreground">
                                  <ColonyIcon
                                    hub={
                                      matchedHub || {
                                        id: call.colonyId || 'colony',
                                        name: colonyName,
                                        initials: colonyName.slice(0, 2).toUpperCase(),
                                        iconUrl: colonyIcon || undefined,
                                      }
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="size-10 rounded-[14px] bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                  <CommunityAvatar
                                    name={avatarName}
                                    imageUrl={avatarUrl}
                                    size={40}
                                    className="rounded-[14px]"
                                    variant="squircle"
                                  />
                                </div>
                              )}
                              <span
                                className={cn(
                                  'absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-card',
                                  call.type === 'missed'
                                    ? 'bg-red-500/20 text-red-500'
                                    : call.type === 'incoming'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                )}
                              >
                                {call.type === 'missed' ? (
                                  <PhoneMissed className="w-2.5 h-2.5" />
                                ) : call.type === 'incoming' ? (
                                  <PhoneIncoming className="w-2.5 h-2.5" />
                                ) : (
                                  <PhoneOutgoing className="w-2.5 h-2.5" />
                                )}
                              </span>
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isColonyCall && (
                                  <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                                <h3
                                  className={cn(
                                    'text-sm font-bold text-foreground truncate',
                                    call.type === 'missed' && 'text-red-400'
                                  )}
                                >
                                  {displayName}
                                </h3>

                                {/* Clear Badge identifying Colony vs Friend */}
                                {isColonyCall ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sidebar-accent text-foreground border border-sidebar-border flex items-center gap-1.5 shrink-0">
                                    <div className="size-3.5 rounded-[4px] bg-sidebar-accent border border-sidebar-border/40 flex items-center justify-center shrink-0 overflow-hidden text-[8px] font-bold">
                                      <ColonyIcon
                                        hub={
                                          matchedHub || {
                                            id: call.colonyId || 'colony',
                                            name: colonyName,
                                            initials: colonyName.slice(0, 2).toUpperCase(),
                                            iconUrl: colonyIcon || undefined,
                                          }
                                        }
                                      />
                                    </div>
                                    <span className="truncate max-w-[120px]">{colonyName}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1 shrink-0">
                                    <User className="w-3 h-3 text-primary" />
                                    <span>DM Langsung</span>
                                  </span>
                                )}

                                {call.isVideo && (
                                  <span className="text-[10px] text-blue-400 font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 flex items-center gap-1 shrink-0">
                                    <Video className="w-2.5 h-2.5" /> Video
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{dayjs(call.timestamp).locale('id').format('DD MMM YYYY, HH:mm')}</span>
                                {call.duration && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{call.duration}</span>
                                  </>
                                )}
                                <span className="text-muted-foreground/70 hidden sm:inline">
                                  • {isColonyCall ? `Voice Channel ${colonyName}` : 'Panggilan Suara Teman'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (isColonyCall) {
                                  onStartCall(
                                    {
                                      id: call.peerId,
                                      name: displayName,
                                      avatar: avatarUrl,
                                    } as any,
                                    call.isVideo
                                  );
                                } else {
                                  onStartCall(
                                    (friendMatch || {
                                      id: call.peerId,
                                      name: displayName,
                                      avatar: avatarUrl,
                                    }) as any,
                                    call.isVideo
                                  );
                                }
                              }}
                              className="h-8 gap-1.5 text-xs font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Panggil Balik</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Menampilkan {(safePage - 1) * PAGE_SIZE + 1}-
                    {Math.min(safePage * PAGE_SIZE, filteredCalls.length)} dari {filteredCalls.length} panggilan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </Button>
                    <span className="px-2 text-xs font-semibold text-foreground font-mono">
                      {safePage} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
