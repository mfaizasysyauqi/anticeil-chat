import React, { useState } from 'react';
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
} from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { CallLogItem, CallsTab } from '../types';
import type { FriendMember } from '@/features/friends';

export interface CallsViewProps {
  calls: CallLogItem[];
  friends: FriendMember[];
  onStartCall: (friend: FriendMember, isVideo?: boolean) => void;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
}

export function CallsView({
  calls,
  friends,
  onStartCall,
  onOpenSidebar,
  horizontalPadding = 'px-4 sm:px-6',
}: CallsViewProps) {
  const [activeTab, setActiveTab] = useState<CallsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCalls = calls.filter((c) => {
    const matchesSearch = c.peerName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'missed') return c.type === 'missed';
    return true;
  });

  const missedCount = calls.filter((c) => c.type === 'missed').length;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Discord Style Single App Bar (h-12) ─────────────────────────── */}
      <div className={cn('h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2', horizontalPadding)}>
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 mr-0.5 cursor-pointer shrink-0"
            title="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Panggilan</span>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
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
              onClick={() => setActiveTab('missed')}
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
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-36 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari riwayat..."
              className="h-7 pl-7 text-xs bg-muted/40 border-sidebar-border"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4 sm:p-6 space-y-6">
        {/* Speed Dial / Kontak Cepat Section */}
        {friends && friends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
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
                    <CommunityAvatar name={f.name} imageUrl={f.imageUrl || f.avatar} size={44} />
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 size-3 rounded-full border-2 border-card',
                        f.status === 'online'
                          ? 'bg-emerald-500'
                          : f.status === 'idle'
                          ? 'bg-amber-500'
                          : f.status === 'dnd'
                          ? 'bg-red-500'
                          : 'bg-muted-foreground/40'
                      )}
                    />
                  </div>

                  <div className="min-w-0 w-full">
                    <h3 className="text-xs font-bold text-foreground truncate">{f.name}</h3>
                    <p className="text-[10px] text-muted-foreground truncate capitalize">
                      {f.status || 'Offline'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onStartCall(f, false)}
                      title={`Panggil Suara ${f.name}`}
                      className="size-7 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onStartCall(f, true)}
                      title={`Panggil Video ${f.name}`}
                      className="size-7 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border-blue-500/30 cursor-pointer"
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
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Riwayat Panggilan Terakhir ({filteredCalls.length})
            </h2>

            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kontak..."
                className="h-7 pl-8 text-xs bg-card border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredCalls.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl">
                <Phone className="w-8 h-8 stroke-1 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">
                  {activeTab === 'missed'
                    ? 'Tidak ada panggilan terlewat'
                    : 'Belum ada riwayat panggilan'}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Mulai obrolan suara atau video dengan teman dari menu Speed Dial.
                </p>
              </div>
            ) : (
              filteredCalls.map((call) => {
                const friendMatch = friends.find((f) => f.id === call.peerId) || {
                  id: call.peerId,
                  name: call.peerName,
                  avatar: call.peerAvatar,
                };

                return (
                  <div
                    key={call.id}
                    className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <CommunityAvatar
                          name={call.peerName}
                          imageUrl={call.peerAvatar}
                          size={40}
                        />
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              'text-sm font-bold text-foreground truncate',
                              call.type === 'missed' && 'text-red-400'
                            )}
                          >
                            {call.peerName}
                          </h3>
                          {call.isVideo && (
                            <span className="text-[10px] text-blue-400 font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 flex items-center gap-1">
                              <Video className="w-2.5 h-2.5" /> Video
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{dayjs(call.timestamp).format('DD MMM YYYY, HH:mm')}</span>
                          {call.duration && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{call.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStartCall(friendMatch as any, call.isVideo)}
                        className="h-8 gap-1.5 text-xs font-semibold cursor-pointer hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Panggil Balik</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
