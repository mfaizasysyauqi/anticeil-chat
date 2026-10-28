import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Server,
  Volume2,
  Hash,
  Play,
  Search,
  Check,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { DiscordAppDefinition } from '@/features/voice/data/discord-activities';
import type { CommunityChannel, CommunityHub, CommunityMember } from '@/chat/chat-types';

export interface ActivityDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: DiscordAppDefinition | null;
  hubs: CommunityHub[];
  channels: CommunityChannel[];
  members?: CommunityMember[];
  onConfirmLaunch: (options: {
    targetType: 'dm' | 'server';
    hubId?: string;
    channelId: string;
    targetName: string;
    appId: string;
    member?: CommunityMember;
  }) => void;
}

export function ActivityDestinationDialog({
  open,
  onOpenChange,
  app,
  hubs,
  channels,
  members = [],
  onConfirmLaunch,
}: ActivityDestinationDialogProps) {
  const [targetType, setTargetType] = useState<'server' | 'dm'>('server');
  const [searchQuery, setSearchQuery] = useState('');

  // Server & Channel Selection
  const availableServers = useMemo(() => {
    return hubs.filter((h) => h.id !== 'anticeil');
  }, [hubs]);

  const [selectedHubId, setSelectedHubId] = useState<string>(() => {
    return availableServers[0]?.id || '';
  });

  // Update selectedHubId if none selected
  React.useEffect(() => {
    if (!selectedHubId && availableServers.length > 0) {
      setSelectedHubId(availableServers[0].id);
    }
  }, [selectedHubId, availableServers]);

  const selectedHub = useMemo(() => {
    return availableServers.find((h) => h.id === selectedHubId) || availableServers[0];
  }, [availableServers, selectedHubId]);

  // Channels for the selected server
  const serverChannels = useMemo(() => {
    if (!selectedHubId) return [];
    return channels.filter((c) => (c.hubId || 'anticeil') === selectedHubId && !c.isDirectMessage);
  }, [channels, selectedHubId]);

  const voiceChannels = useMemo(() => {
    return serverChannels.filter((c) => c.type === 'voice');
  }, [serverChannels]);

  const textChannels = useMemo(() => {
    return serverChannels.filter((c) => c.type === 'text' || !c.type);
  }, [serverChannels]);

  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Default selected channel: prefer first voice channel, otherwise first text channel
  React.useEffect(() => {
    if (voiceChannels.length > 0) {
      setSelectedChannelId(voiceChannels[0].id);
    } else if (serverChannels.length > 0) {
      setSelectedChannelId(serverChannels[0].id);
    } else {
      setSelectedChannelId('');
    }
  }, [selectedHubId, voiceChannels, serverChannels]);

  // DM / Friends Selection
  const availableDMs = useMemo(() => {
    return channels.filter((c) => c.category === 'DIRECT MESSAGES' || c.isDirectMessage);
  }, [channels]);

  const [selectedDMId, setSelectedDMId] = useState<string>(() => {
    return availableDMs[0]?.id || '';
  });

  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);

  // Filtered members / DMs for search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  if (!app) return null;

  const handleLaunch = () => {
    if (targetType === 'server') {
      const ch = serverChannels.find((c) => c.id === selectedChannelId) || voiceChannels[0] || serverChannels[0];
      if (!ch) return;
      onConfirmLaunch({
        targetType: 'server',
        hubId: selectedHubId,
        channelId: ch.id,
        targetName: `${selectedHub?.name || 'Server'} - #${ch.name}`,
        appId: app.id,
      });
    } else {
      // DM launch
      if (selectedMember) {
        onConfirmLaunch({
          targetType: 'dm',
          channelId: `dm-${selectedMember.id}`,
          targetName: selectedMember.name,
          appId: app.id,
          member: selectedMember,
        });
      } else {
        const dm = availableDMs.find((c) => c.id === selectedDMId) || availableDMs[0];
        if (!dm) return;
        onConfirmLaunch({
          targetType: 'dm',
          channelId: dm.id,
          targetName: dm.name,
          appId: app.id,
        });
      }
    }
    onOpenChange(false);
  };

  const AppIcon = app.icon || Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-card shadow-2xl">
        {/* ── App Header Banner ─────────────────────────────────── */}
        <div
          className={cn(
            'p-4 sm:p-5 relative flex items-center justify-between bg-gradient-to-r select-none border-b border-border/40',
            app.bannerGradient || 'from-indigo-950 via-zinc-900 to-zinc-950'
          )}
        >
          <div className="flex items-center gap-3 z-10">
            <div
              className={cn(
                'size-11 rounded-xl flex items-center justify-center shadow-md',
                app.iconBg || 'bg-primary',
                app.iconColor || 'text-white'
              )}
            >
              <AppIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                  {app.developer}
                </span>
                {app.badge && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-white/20 text-white border-0 backdrop-blur-md">
                    {app.badge}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-black text-white leading-tight">
                {app.title}
              </h3>
            </div>
          </div>
        </div>

        {/* ── Destination Type Switcher (Pesan Langsung vs Server) ─ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Pilih Tempat Peluncuran
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setTargetType('server')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  targetType === 'server'
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Server className="w-4 h-4" />
                <span>Ke Server</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('dm')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  targetType === 'dm'
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Pesan Langsung</span>
              </button>
            </div>
          </div>

          {/* ── SERVER MODE ────────────────────────────────────────── */}
          {targetType === 'server' && (
            <div className="space-y-3.5">
              {availableServers.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center text-xs text-muted-foreground">
                  Belum ada server yang Anda ikuti. Buat atau gabung ke server terlebih dahulu.
                </div>
              ) : (
                <>
                  {/* Step 1: Choose Server */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>1. Pilih Server</span>
                      <span className="text-[10px] font-mono text-muted-foreground/70">
                        {availableServers.length} Server
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto [scrollbar-width:thin] p-0.5">
                      {availableServers.map((hub) => {
                        const isSelected = selectedHubId === hub.id;
                        return (
                          <div
                            key={hub.id}
                            onClick={() => setSelectedHubId(hub.id)}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-left select-none',
                              isSelected
                                ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                                : 'bg-muted/30 border-border/50 hover:bg-muted/70 text-muted-foreground'
                            )}
                          >
                            <div className="size-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                              {hub.iconUrl ? (
                                <img src={hub.iconUrl} alt={hub.name} className="w-full h-full rounded-md object-cover" />
                              ) : (
                                (hub.initials || hub.name.slice(0, 2)).toUpperCase()
                              )}
                            </div>
                            <span className="text-xs font-semibold truncate leading-tight flex-1">
                              {hub.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Choose Channel in Selected Server */}
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>2. Pilih Saluran di {selectedHub?.name}</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        Disarankan: Saluran Suara
                      </span>
                    </label>

                    <div className="space-y-1 max-h-36 overflow-y-auto [scrollbar-width:thin]">
                      {/* Voice channels first */}
                      {voiceChannels.map((ch) => {
                        const isSelected = selectedChannelId === ch.id;
                        return (
                          <div
                            key={ch.id}
                            onClick={() => setSelectedChannelId(ch.id)}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all select-none',
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-foreground ring-1 ring-emerald-500/30'
                                : 'bg-muted/20 border-border/40 hover:bg-muted/60 text-muted-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-xs font-semibold truncate text-foreground">
                                {ch.name}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                Voice
                              </Badge>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </div>
                        );
                      })}

                      {/* Text channels */}
                      {textChannels.map((ch) => {
                        const isSelected = selectedChannelId === ch.id;
                        return (
                          <div
                            key={ch.id}
                            onClick={() => setSelectedChannelId(ch.id)}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all select-none',
                              isSelected
                                ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                                : 'bg-muted/20 border-border/40 hover:bg-muted/60 text-muted-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium truncate text-foreground">
                                {ch.name}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                        );
                      })}

                      {serverChannels.length === 0 && (
                        <div className="p-3 text-center text-xs text-muted-foreground italic">
                          Tidak ada channel ditemukan di server ini.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── DIRECT MESSAGE MODE ─────────────────────────────────── */}
          {targetType === 'dm' && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari teman atau percakapan langsung..."
                  className="h-8 pl-8 text-xs bg-muted/40"
                />
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto [scrollbar-width:thin]">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelected = selectedMember?.id === member.id || selectedDMId === `dm-${member.id}`;
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedMember(member);
                          setSelectedDMId(`dm-${member.id}`);
                        }}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all select-none',
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                            : 'bg-muted/20 border-border/40 hover:bg-muted/60 text-muted-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-zinc-800 text-white">
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-foreground block truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {member.username ? `@${member.username}` : member.email || 'Teman Anticeil'}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    Tidak ada teman yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Action Buttons ──────────────────────────────────────── */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleLaunch}
              className="text-xs h-8 px-4 font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Luncurkan Aktivitas</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
