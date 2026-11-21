import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  User,
  Plus,
  Trash2,
  Check,
  X,
  Slash,
  Users,
  Hash,
  Volume2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { channelsApi } from '../../api/channels-api';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import type {
  ColonyChannel,
  ChannelPermissionOverwrite,
  CommunityCustomRole,
  ColonyMember,
} from '@/chat/chat-types';

interface ChannelPermissionsTabProps {
  channel: ColonyChannel;
  roles?: CommunityCustomRole[];
  members?: ColonyMember[];
  onUpdateChannel?: (channelId: string, updates: Partial<ColonyChannel>) => Promise<void>;
  t: (key: string) => string;
}

interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
}

const GENERAL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'VIEW_CHANNEL',
    name: 'Melihat Channel',
    description: 'Anggota dapat melihat saluran ini (jika dinonaktifkan, saluran akan tersembunyi).',
  },
  {
    key: 'MANAGE_CHANNELS',
    name: 'Mengelola Channel',
    description: 'Anggota dapat mengubah nama, deskripsi, topik, atau menghapus saluran ini.',
  },
  {
    key: 'MANAGE_PERMISSIONS',
    name: 'Mengelola Hak Akses',
    description: 'Anggota dapat mengubah aturan izin saluran ini.',
  },
];

const TEXT_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'SEND_MESSAGES',
    name: 'Mengirim Pesan',
    description: 'Anggota dapat mengirim pesan teks di saluran ini.',
  },
  {
    key: 'SEND_MESSAGES_IN_THREADS',
    name: 'Kirim Pesan di Thread',
    description: 'Anggota dapat membalas di dalam thread percakapan.',
  },
  {
    key: 'CREATE_PUBLIC_THREADS',
    name: 'Membuat Thread Publik',
    description: 'Anggota dapat memulai thread baru di forum/teks.',
  },
  {
    key: 'EMBED_LINKS',
    name: 'Sematkan Tautan',
    description: 'Tautan yang dikirim akan menampilkan pratinjau kaya.',
  },
  {
    key: 'ATTACH_FILES',
    name: 'Melampirkan File',
    description: 'Anggota dapat mengunggah gambar, video, dan berkas.',
  },
  {
    key: 'ADD_REACTIONS',
    name: 'Menambahkan Reaksi',
    description: 'Anggota dapat memberi reaksi emoji baru ke pesan.',
  },
  {
    key: 'USE_EXTERNAL_EMOJIS',
    name: 'Gunakan Emoji Eksternal',
    description: 'Gunakan emoji kustom dari server atau channel lain.',
  },
  {
    key: 'MENTION_EVERYONE',
    name: 'Sebut @everyone',
    description: 'Dapat menggunakan @everyone dan @here untuk menotifikasi seluruh server.',
  },
  {
    key: 'READ_MESSAGE_HISTORY',
    name: 'Membaca Riwayat Pesan',
    description: 'Anggota dapat membaca pesan yang dikirim sebelum mereka bergabung.',
  },
];

const VOICE_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'CONNECT',
    name: 'Terhubung ke Suara',
    description: 'Anggota dapat bergabung ke saluran suara ini.',
  },
  {
    key: 'SPEAK',
    name: 'Berbicara',
    description: 'Anggota dapat berbicara dan mengirim audio mikrofon.',
  },
  {
    key: 'VIDEO',
    name: 'Video & Berbagi Layar',
    description: 'Anggota dapat menyalakan webcam atau berbagi layar.',
  },
  {
    key: 'USE_VOICE_ACTIVITY',
    name: 'Aktivitas Suara Otomatis',
    description: 'Bicara tanpa harus menggunakan Push-to-Talk.',
  },
  {
    key: 'MUTE_MEMBERS',
    name: 'Bisukan Anggota',
    description: 'Dapat mematikan mikrofon anggota lain di saluran ini.',
  },
  {
    key: 'DEAFEN_MEMBERS',
    name: 'Tulikan Anggota',
    description: 'Dapat mematikan pendengaran anggota lain di saluran ini.',
  },
  {
    key: 'MOVE_MEMBERS',
    name: 'Pindahkan Anggota',
    description: 'Dapat memindahkan anggota antar saluran suara.',
  },
];

export function ChannelPermissionsTab({
  channel,
  roles = [],
  members = [],
  onUpdateChannel,
  t,
}: ChannelPermissionsTabProps) {
  const [overwrites, setOverwrites] = useState<ChannelPermissionOverwrite[]>(
    channel.permissionOverwrites || [],
  );
  const [selectedTargetId, setSelectedTargetId] = useState<string>('@everyone');
  const [colonyRoles, setColonyRoles] = useState<CommunityCustomRole[]>(roles);
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing permissions and roles on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const perms = await channelsApi.getChannelPermissions(channel.id);
        if (isMounted && Array.isArray(perms)) {
          setOverwrites(perms);
        }

        if (channel.colonyId && colonyRoles.length === 0) {
          const fetchedRoles = await colonyApi.getRoles(channel.colonyId);
          if (isMounted && Array.isArray(fetchedRoles)) {
            setColonyRoles(fetchedRoles);
          }
        }
      } catch (err) {
        console.error('Failed to load channel permissions:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [channel.id, channel.colonyId]);

  // Selected overwrite or fallback for @everyone
  const activeOverwrite: ChannelPermissionOverwrite = useMemo(() => {
    const existing = overwrites.find((o) => o.id === selectedTargetId);
    if (existing) return existing;
    return {
      id: selectedTargetId,
      type: selectedTargetId === '@everyone' ? 'role' : 'role',
      name: selectedTargetId === '@everyone' ? '@everyone' : selectedTargetId,
      allow: selectedTargetId === '@everyone' ? ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'READ_MESSAGE_HISTORY'] : [],
      deny: [],
    };
  }, [overwrites, selectedTargetId]);

  // 3-way permission getter: 'allow' | 'deny' | 'inherit'
  const getPermissionState = (permKey: string): 'allow' | 'deny' | 'inherit' => {
    if (activeOverwrite.allow.includes(permKey)) return 'allow';
    if (activeOverwrite.deny.includes(permKey)) return 'deny';
    return 'inherit';
  };

  // Toggle permission value
  const handleSetPermission = async (permKey: string, nextState: 'allow' | 'deny' | 'inherit') => {
    const nextAllow = activeOverwrite.allow.filter((k) => k !== permKey);
    const nextDeny = activeOverwrite.deny.filter((k) => k !== permKey);

    if (nextState === 'allow') nextAllow.push(permKey);
    if (nextState === 'deny') nextDeny.push(permKey);

    const updatedOverwrite: ChannelPermissionOverwrite = {
      ...activeOverwrite,
      allow: nextAllow,
      deny: nextDeny,
    };

    const nextOverwrites = [
      ...overwrites.filter((o) => o.id !== selectedTargetId),
      updatedOverwrite,
    ];

    setOverwrites(nextOverwrites);
    setIsSaving(true);
    try {
      await channelsApi.updateChannelPermission(channel.id, updatedOverwrite);
      await onUpdateChannel?.(channel.id, { permissionOverwrites: nextOverwrites });
    } catch {
      toast.error(t('Gagal menyimpan izin channel.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Add new role or member overwrite
  const handleAddOverwrite = async (targetId: string, type: 'role' | 'member', name: string) => {
    if (overwrites.some((o) => o.id === targetId)) {
      setSelectedTargetId(targetId);
      setIsAddTargetOpen(false);
      return;
    }

    const newOverwrite: ChannelPermissionOverwrite = {
      id: targetId,
      type,
      name,
      allow: [],
      deny: [],
    };

    const nextOverwrites = [...overwrites, newOverwrite];
    setOverwrites(nextOverwrites);
    setSelectedTargetId(targetId);
    setIsAddTargetOpen(false);

    try {
      await channelsApi.updateChannelPermission(channel.id, newOverwrite);
      await onUpdateChannel?.(channel.id, { permissionOverwrites: nextOverwrites });
      toast.success(t(`Hak akses untuk ${name} ditambahkan.`));
    } catch {
      toast.error(t('Gagal menambahkan hak akses.'));
    }
  };

  // Delete custom overwrite
  const handleDeleteOverwrite = async (targetId: string) => {
    if (targetId === '@everyone') {
      // Reset @everyone to clean defaults
      const resetOverwrite: ChannelPermissionOverwrite = {
        id: '@everyone',
        type: 'role',
        name: '@everyone',
        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'READ_MESSAGE_HISTORY'],
        deny: [],
      };
      const nextOverwrites = [
        ...overwrites.filter((o) => o.id !== '@everyone'),
        resetOverwrite,
      ];
      setOverwrites(nextOverwrites);
      await channelsApi.updateChannelPermission(channel.id, resetOverwrite);
      await onUpdateChannel?.(channel.id, { permissionOverwrites: nextOverwrites });
      toast.success(t('Izin @everyone direset ke default.'));
      return;
    }

    const nextOverwrites = overwrites.filter((o) => o.id !== targetId);
    setOverwrites(nextOverwrites);
    setSelectedTargetId('@everyone');

    try {
      await channelsApi.deleteChannelPermission(channel.id, targetId);
      await onUpdateChannel?.(channel.id, { permissionOverwrites: nextOverwrites });
      toast.success(t('Hak akses kustom berhasil dihapus.'));
    } catch {
      toast.error(t('Gagal menghapus hak akses.'));
    }
  };

  const isVoice = channel.type === 'voice';
  const isAnnouncement = channel.type === 'announcement' || channel.isAnnouncement;

  const activeTextPermissions = useMemo(() => {
    return TEXT_PERMISSIONS.map((perm) => {
      if (perm.key === 'SEND_MESSAGES' && isAnnouncement) {
        return {
          ...perm,
          name: t('Send Messages'),
          description: t(
            'Allows members to publish their own messages to all servers following this Announcement Channel.',
          ),
        };
      }
      return perm;
    });
  }, [isAnnouncement, t]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {t('Channel Permissions')}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Atur hak akses terperinci untuk @everyone, peran server, dan anggota tertentu di channel ini.')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 border border-border/80 rounded-2xl bg-card overflow-hidden min-h-[460px]">
        {/* Left Column: Target Selector (Roles & Members) */}
        <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border/70 p-3 space-y-2 bg-secondary/30">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Roles / Members')}
            </span>
            <Button
              type="button"
              variant="teal"
              size="sm"
              onClick={() => setIsAddTargetOpen(true)}
              className="h-6 w-6 p-0 rounded-md cursor-pointer"
              title={t('Tambah Peran atau Anggota')}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            {/* Default @everyone item */}
            <button
              type="button"
              onClick={() => setSelectedTargetId('@everyone')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                selectedTargetId === '@everyone'
                  ? 'bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/40 shadow-xs'
                  : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">@everyone</span>
              </div>
            </button>

            {/* Custom Overwrites */}
            {overwrites
              .filter((o) => o.id !== '@everyone')
              .map((ow) => (
                <button
                  key={ow.id}
                  type="button"
                  onClick={() => setSelectedTargetId(ow.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left group',
                    selectedTargetId === ow.id
                      ? 'bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/40 shadow-xs'
                      : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {ow.type === 'member' ? (
                      <User className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{ow.name || ow.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOverwrite(ow.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                    title={t('Hapus')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
          </div>
        </div>

        {/* Right Column: Permission Toggles */}
        <div className="flex-1 p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Target Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sidebar-primary">
                {selectedTargetId === '@everyone' ? (
                  <Users className="w-4 h-4" />
                ) : activeOverwrite.type === 'member' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {activeOverwrite.name || selectedTargetId}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {selectedTargetId === '@everyone'
                    ? t('Izin dasar yang berlaku untuk semua anggota server.')
                    : t('Izin kustom yang menggantikan pengaturan bawaan server.')}
                </p>
              </div>
            </div>

            {selectedTargetId !== '@everyone' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteOverwrite(selectedTargetId)}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {t('Hapus Overwrite')}
              </Button>
            )}
          </div>

          {/* 1. General Channel Permissions */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Izin Channel Umum')}
            </h4>
            <div className="divide-y divide-border/50 border border-border/60 rounded-xl bg-background/50 overflow-hidden">
              {GENERAL_PERMISSIONS.map((perm) => (
                <PermissionRow
                  key={perm.key}
                  perm={perm}
                  state={getPermissionState(perm.key)}
                  onChange={(s) => handleSetPermission(perm.key, s)}
                />
              ))}
            </div>
          </div>

          {/* 2. Text / Voice Channel Permissions */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isVoice ? t('Izin Saluran Suara') : t('Izin Saluran Teks')}
            </h4>
            <div className="divide-y divide-border/50 border border-border/60 rounded-xl bg-background/50 overflow-hidden">
              {(isVoice ? VOICE_PERMISSIONS : activeTextPermissions).map((perm) => (
                <PermissionRow
                  key={perm.key}
                  perm={perm}
                  state={getPermissionState(perm.key)}
                  onChange={(s) => handleSetPermission(perm.key, s)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Target Modal */}
      <Dialog open={isAddTargetOpen} onOpenChange={setIsAddTargetOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Tambahkan Peran atau Anggota')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pilih peran atau anggota untuk membuat hak akses khusus di channel ini.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Roles Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Peran Server')}
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {colonyRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleAddOverwrite(role.id, 'role', role.name)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: role.color || '#0d9488' }}
                      />
                      <span>{role.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {role.permissions?.length || 0} izin
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Members Section */}
            {members.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Anggota')}
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAddOverwrite(member.id, 'member', member.name)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{member.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {member.role || 'Member'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 3-Way Segmented Permission Row Component ──
interface PermissionRowProps {
  perm: PermissionDefinition;
  state: 'allow' | 'deny' | 'inherit';
  onChange: (state: 'allow' | 'deny' | 'inherit') => void;
}

function PermissionRow({ perm, state, onChange }: PermissionRowProps) {
  return (
    <div className="flex items-center justify-between p-3.5 gap-4 hover:bg-accent/20 transition-colors">
      <div className="min-w-0 pr-2">
        <span className="text-xs font-bold text-foreground block">
          {perm.name}
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          {perm.description}
        </p>
      </div>

      {/* 3-Way Segmented Control: ✕ (Deny) | / (Inherit) | ✓ (Allow) */}
      <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/70 shrink-0">
        <button
          type="button"
          onClick={() => onChange('deny')}
          className={cn(
            'size-7 rounded-md flex items-center justify-center transition-all cursor-pointer',
            state === 'deny'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10',
          )}
          title="Tolak (Deny)"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onChange('inherit')}
          className={cn(
            'size-7 rounded-md flex items-center justify-center transition-all cursor-pointer',
            state === 'inherit'
              ? 'bg-card text-foreground shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
          )}
          title="Netral / Ikuti Peran (Inherit)"
        >
          <Slash className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => onChange('allow')}
          className={cn(
            'size-7 rounded-md flex items-center justify-center transition-all cursor-pointer',
            state === 'allow'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold'
              : 'text-muted-foreground hover:text-sidebar-primary hover:bg-sidebar-primary/10',
          )}
          title="Izinkan (Allow)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
