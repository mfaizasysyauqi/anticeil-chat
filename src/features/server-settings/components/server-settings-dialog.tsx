import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Tag,
  BarChart3,
  Zap,
  Smile,
  Users,
  KeyRound,
  UserPlus,
  Webhook,
  ScrollText,
  Ban,
  Trash2,
  X,
  Camera,
  Plus,
  Search,
  ChevronDown,
  UserX,
  Copy,
  Send,
  RefreshCw,
  Award,
  Hash,
  MessageSquare,
  Bot,
  Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { communityApi } from '@/chat/messages-api';
import { CommunityAvatar } from '@/chat/messages-avatar';
import type {
  CommunityHub,
  CommunityMember,
  CommunityCustomRole,
  CommunityInvite,
  CommunityBan,
  CommunityAuditEntry,
  CommunityHubStats,
  CommunityCustomEmoji,
  CommunityChannel,
} from '@/chat/messages-types';

export type ServerSettingsSection =
  | 'profile'
  | 'server-tag'
  | 'engagement'
  | 'boost'
  | 'emoji'
  | 'members'
  | 'roles'
  | 'invites'
  | 'integrations'
  | 'audit-log'
  | 'bans'
  | 'delete';

interface ServerSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeHub: CommunityHub | null;
  currentUser: CommunityMember | null;
  members: CommunityMember[];
  channels: CommunityChannel[];
  initialSection?: ServerSettingsSection;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  onDeleteHub: (hub: CommunityHub) => void;
  onOpenWebhooks?: () => void;
  onUpdateMembers?: (updater: (prev: CommunityMember[]) => CommunityMember[]) => void;
}

export function ServerSettingsDialog({
  isOpen,
  onClose,
  activeHub,
  currentUser,
  members,
  channels,
  initialSection = 'profile',
  onUpdateHub,
  onDeleteHub,
  onOpenWebhooks,
  onUpdateMembers,
}: ServerSettingsDialogProps) {
  const { t } = useTranslation();

  const [serverSettingsSection, setServerSettingsSection] = useState<ServerSettingsSection>(initialSection);

  useEffect(() => {
    if (isOpen && initialSection) {
      setServerSettingsSection(initialSection);
    }
  }, [isOpen, initialSection]);
  const [serverSettingsEditName, setServerSettingsEditName] = useState('');
  const [serverSettingsEditDesc, setServerSettingsEditDesc] = useState('');
  const [serverSettingsEditColor, setServerSettingsEditColor] = useState('bg-indigo-600');
  const [serverSettingsEditIconUrl, setServerSettingsEditIconUrl] = useState('');
  const serverIconFileInputRef = useRef<HTMLInputElement | null>(null);

  const [serverTags, setServerTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const [serverEmojis, setServerEmojis] = useState<CommunityCustomEmoji[]>([]);
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiChar, setNewEmojiChar] = useState('');

  const [serverStats, setServerStats] = useState<CommunityHubStats | null>(null);
  const [serverInvites, setServerInvites] = useState<CommunityInvite[]>([]);
  const [newInviteMaxUses, setNewInviteMaxUses] = useState(0);
  const [newInviteExpiry, setNewInviteExpiry] = useState<'never' | '1d' | '7d' | '30d'>('7d');

  const [serverBans, setServerBans] = useState<CommunityBan[]>([]);
  const [serverRoles, setServerRoles] = useState<CommunityCustomRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#6366f1');

  const [serverAuditLogs, setServerAuditLogs] = useState<CommunityAuditEntry[]>([]);
  const [auditLogFilter, setAuditLogFilter] = useState<string>('ALL');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const [isBoostingServer, setIsBoostingServer] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  // Ban dialog sub-flow
  const [isBanningUser, setIsBanningUser] = useState(false);
  const [banTargetMember, setBanTargetMember] = useState<CommunityMember | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Load sub-data on open
  useEffect(() => {
    if (!isOpen || !activeHub) return;
    setServerSettingsEditName(activeHub.name || '');
    setServerSettingsEditDesc(activeHub.description || '');
    setServerSettingsEditColor(activeHub.color || 'bg-indigo-600');
    setServerSettingsEditIconUrl(activeHub.iconUrl || '');
    setServerTags(activeHub.tags || ['komunitas', 'anticeil']);
    setServerEmojis(
      activeHub.emojis || [
        { id: '1', name: 'rocket', char: '🚀' },
        { id: '2', name: 'fire', char: '🔥' },
        { id: '3', name: 'robot', char: '🤖' },
      ],
    );

    const loadData = async () => {
      try {
        const [rolesRes, invitesRes, bansRes, auditRes, statsRes] = await Promise.all([
          communityApi.getRoles(activeHub.id),
          communityApi.getInvites(activeHub.id),
          communityApi.getBans(activeHub.id),
          communityApi.getAuditLog(activeHub.id),
          communityApi.getHubStats(activeHub.id),
        ]);
        setServerRoles(rolesRes || []);
        setServerInvites(invitesRes || []);
        setServerBans(bansRes || []);
        setServerAuditLogs(auditRes || []);
        setServerStats(statsRes || null);
      } catch (err) {
        console.error('Failed to load server settings data', err);
      }
    };
    loadData();
  }, [isOpen, activeHub?.id]);

  if (!isOpen || !activeHub) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[900px] w-[calc(100vw-2rem)] h-[calc(100dvh-4rem)] max-h-[680px] gap-0 overflow-hidden p-0 flex">
          <DialogTitle className="sr-only">{t('Pengaturan Server')}</DialogTitle>

          {/* Left sidebar */}
          <aside className="w-56 shrink-0 flex flex-col border-r bg-muted/30 overflow-y-auto [scrollbar-width:thin]">
            <div className="px-3 pt-5 pb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-2 pb-1 truncate">
                {activeHub?.name || 'Server'}
              </p>
            </div>
            <nav className="px-2 pb-3 space-y-0.5">
              {[
                { id: 'profile', label: t('Profil Server'), icon: Globe },
                { id: 'server-tag', label: t('Tag Server'), icon: Tag },
                { id: 'engagement', label: t('Engagement'), icon: BarChart3 },
                { id: 'boost', label: t('Boost Perks'), icon: Zap },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setServerSettingsSection(id as ServerSettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    serverSettingsSection === id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">{t('Ekspresi')}</div>
              {[
                { id: 'emoji', label: t('Emoji'), icon: Smile },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setServerSettingsSection(id as ServerSettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    serverSettingsSection === id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">{t('Anggota')}</div>
              {[
                { id: 'members', label: t('Anggota'), icon: Users },
                { id: 'roles', label: t('Peran'), icon: KeyRound },
                { id: 'invites', label: t('Undangan'), icon: UserPlus },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setServerSettingsSection(id as ServerSettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    serverSettingsSection === id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">{t('Apps')}</div>
              {[
                { id: 'integrations', label: t('Integrasi'), icon: Webhook },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setServerSettingsSection(id as ServerSettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    serverSettingsSection === id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">{t('Moderasi')}</div>
              {[
                { id: 'audit-log', label: t('Log Audit'), icon: ScrollText },
                { id: 'bans', label: t('Ban'), icon: Ban },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setServerSettingsSection(id as ServerSettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                    serverSettingsSection === id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="my-2 border-t" />
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteHub(activeHub);
                }}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {t('Hapus Server')}
              </button>
            </nav>
          </aside>

          {/* Right content area */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-8 py-8 max-w-2xl">
              {/* 1. PROFIL SERVER */}
              {serverSettingsSection === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Profil Server')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Atur bagaimana server Anda tampil di link undangan dan daftar server.')}
                  </p>

                  {/* Hidden File Input for Server Settings Icon Upload */}
                  <input
                    type="file"
                    ref={serverIconFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error(t('Ukuran file maksimal 5 MB.'));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const res = event.target?.result as string;
                        if (res) {
                          setServerSettingsEditIconUrl(res);
                          toast.success(t('Foto server berhasil dimuat! Klik "Simpan Perubahan" untuk menerapkan.'));
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Preview card */}
                  <div className="mb-6 rounded-xl overflow-hidden border bg-card/60 shadow-sm w-full max-w-sm">
                    <div className={cn("h-24 bg-gradient-to-br from-primary/30 to-purple-600/30", serverSettingsEditColor)} />
                    <div className="px-4 pb-4 -mt-8">
                      <div
                        onClick={() => serverIconFileInputRef.current?.click()}
                        className="relative group/avatar w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-sm overflow-hidden cursor-pointer shrink-0 transition-transform active:scale-95"
                        title={t('Klik untuk mengunggah foto server')}
                      >
                        {serverSettingsEditIconUrl ? (
                          <img src={serverSettingsEditIconUrl} alt="Server icon" className="w-full h-full object-cover" />
                        ) : (
                          activeHub?.initials || activeHub?.name?.slice(0, 2) || 'SV'
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-semibold transition-opacity">
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span>{t('Ganti')}</span>
                        </div>
                      </div>
                      <p className="font-semibold mt-2 text-sm">{serverSettingsEditName || activeHub?.name || 'Server'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {members.length > 0 ? `${members.filter(m => m.status === 'online').length} Online • ${members.length} Anggota` : '1 Online • 1 Anggota'}
                      </p>
                      {(serverSettingsEditDesc || activeHub?.description) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{serverSettingsEditDesc || activeHub?.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {serverTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Nama Server')}</label>
                      <Input
                        value={serverSettingsEditName}
                        onChange={(e) => setServerSettingsEditName(e.target.value)}
                        placeholder="Nama Server"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Deskripsi Singkat')}</label>
                      <Input
                        value={serverSettingsEditDesc}
                        onChange={(e) => setServerSettingsEditDesc(e.target.value)}
                        placeholder="Deskripsi komunitas ini..."
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">{t('Tema Warna Header')}</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Indigo', cls: 'bg-indigo-600' },
                          { name: 'Purple', cls: 'bg-purple-600' },
                          { name: 'Blue', cls: 'bg-blue-600' },
                          { name: 'Emerald', cls: 'bg-emerald-600' },
                          { name: 'Rose', cls: 'bg-rose-600' },
                          { name: 'Amber', cls: 'bg-amber-600' },
                          { name: 'Zinc', cls: 'bg-zinc-700' },
                        ].map((c) => (
                          <button
                            key={c.cls}
                            type="button"
                            onClick={() => setServerSettingsEditColor(c.cls)}
                            className={cn(
                              'w-7 h-7 rounded-full border-2 transition-transform',
                              c.cls,
                              serverSettingsEditColor === c.cls ? 'scale-125 border-white shadow-md' : 'border-transparent',
                            )}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button
                      onClick={async () => {
                        await onUpdateHub(activeHub.id, {
                          name: serverSettingsEditName,
                          description: serverSettingsEditDesc,
                          color: serverSettingsEditColor,
                          iconUrl: serverSettingsEditIconUrl || undefined,
                        });
                        toast.success(t('Profil server berhasil diperbarui! ✅'));
                        onClose();
                      }}
                    >
                      {t('Simpan Perubahan')}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      {t('Batal')}
                    </Button>
                  </div>
                </div>
              )}

              {/* 2. TAG SERVER */}
              {serverSettingsSection === 'server-tag' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Tag Server')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Tambahkan tag untuk memudahkan anggota menemukan topik dan kategori server Anda.')}
                  </p>

                  <div className="space-y-6">
                    <div className="rounded-lg border bg-card/40 p-4">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                        {t('Tag Server Saat Ini')} ({serverTags.length})
                      </label>
                      <div className="flex flex-wrap gap-2 min-h-10 items-center">
                        {serverTags.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">{t('Belum ada tag yang ditambahkan.')}</p>
                        ) : (
                          serverTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs">
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => setServerTags((prev) => prev.filter((t) => t !== tag))}
                                className="text-muted-foreground hover:text-foreground rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Tambah Tag Baru')}</label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const clean = newTagInput.trim().replace(/^#/, '').toLowerCase();
                              if (clean && !serverTags.includes(clean)) {
                                setServerTags((prev) => [...prev, clean]);
                                setNewTagInput('');
                              }
                            }
                          }}
                          placeholder="cth: automasi, devops, ai-agent..."
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const clean = newTagInput.trim().replace(/^#/, '').toLowerCase();
                            if (clean && !serverTags.includes(clean)) {
                              setServerTags((prev) => [...prev, clean]);
                              setNewTagInput('');
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          {t('Tambah')}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                        {t('Rekomendasi Tag Populer')}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['automasi', 'workflow', 'devops', 'support', 'ai-agents', 'community', 'integrasi', 'activepieces'].map((tName) => (
                          <button
                            key={tName}
                            type="button"
                            onClick={() => {
                              if (!serverTags.includes(tName)) {
                                setServerTags((prev) => [...prev, tName]);
                              }
                            }}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border transition-all text-left",
                              serverTags.includes(tName)
                                ? "bg-primary/10 border-primary text-primary font-medium"
                                : "bg-muted/40 hover:bg-muted text-muted-foreground"
                            )}
                          >
                            #{tName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={async () => {
                          await onUpdateHub(activeHub.id, { tags: serverTags });
                          toast.success(t('Tag server berhasil disimpan! 🏷️'));
                        }}
                      >
                        {t('Simpan Tag')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ENGAGEMENT */}
              {serverSettingsSection === 'engagement' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold">{t('Engagement & Analitik')}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const stats = await communityApi.getHubStats(activeHub.id);
                        setServerStats(stats);
                        toast.success(t('Data analitik diperbarui! 📊'));
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('Segarkan')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Analisis aktivitas saluran, keaktifan anggota, dan volume pesan otomatis di server ini.')}
                  </p>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Card className="p-4 bg-card/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('Total Pesan')}</span>
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold mt-2">{serverStats?.totalMessages || 0}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t('Pesan di seluruh saluran')}</p>
                    </Card>

                    <Card className="p-4 bg-card/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('Saluran Aktif')}</span>
                        <Hash className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {serverStats?.totalChannels || channels.filter((c) => (c.hubId || 'anticeil') === activeHub?.id).length}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t('Saluran teks & DM')}</p>
                    </Card>

                    <Card className="p-4 bg-card/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('Anggota Server')}</span>
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold mt-2">{members.length}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {members.filter((m) => m.status === 'online').length} {t('sedang online')}
                      </p>
                    </Card>

                    <Card className="p-4 bg-card/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('Pesan Bot')}</span>
                        <Bot className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold mt-2">{serverStats?.botMessages || 0}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t('Dipicu otomatis oleh webhook')}</p>
                    </Card>
                  </div>

                  {/* Health Status */}
                  <div className="rounded-lg border bg-emerald-500/10 border-emerald-500/20 p-3.5 mb-6 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('Status Komunitas: Sangat Sehat & Aktif 🚀')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('Interaksi real-time berjalan normal dengan webhook automasi aktif.')}
                      </p>
                    </div>
                  </div>

                  {/* Channel Activity */}
                  <div className="rounded-lg border bg-card/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t('Peringkat Aktivitas Saluran')}</p>
                    {serverStats?.channelActivity && serverStats.channelActivity.length > 0 ? (
                      <div className="space-y-2.5">
                        {serverStats.channelActivity.map((ch, idx) => (
                          <div key={ch.channelId || idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                {ch.channelName}
                              </span>
                              <span className="text-muted-foreground">{ch.messageCount} {t('pesan')}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(10, (ch.messageCount / (serverStats.totalMessages || 1)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t('Belum ada data aktivitas saluran.')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 4. BOOST PERKS */}
              {serverSettingsSection === 'boost' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Server Boost Perks')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Tingkatkan performa server Anda untuk membuka batas kapasitas, audio HD, dan kustomisasi ekstra.')}
                  </p>

                  {/* Hero Boost Banner */}
                  <div className="rounded-xl border bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{t('Tingkat')} {activeHub?.boostTier || 0}</h3>
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                              {activeHub?.boostsCount || 0} {t('Boost Aktif')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(activeHub?.boostTier || 0) >= 3
                              ? t('Tingkat Maksimal Tercapai!')
                              : `${(activeHub?.boostTier || 0) === 2 ? 14 - (activeHub?.boostsCount || 0) : (activeHub?.boostTier || 0) === 1 ? 7 - (activeHub?.boostsCount || 0) : 2 - (activeHub?.boostsCount || 0)} boost lagi menuju Tingkat ${(activeHub?.boostTier || 0) + 1}`}
                          </p>
                        </div>
                      </div>

                      <Button
                        disabled={isBoostingServer}
                        onClick={async () => {
                          setIsBoostingServer(true);
                          try {
                            const res = await communityApi.boostHub(activeHub.id);
                            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                            await onUpdateHub(activeHub.id, {
                              boostsCount: res.boostsCount,
                              boostTier: res.boostTier,
                            });
                            toast.success(t(`Server berhasil di-boost! Sekarang di Tingkat ${res.boostTier} ⚡🎉`));
                          } catch {
                            toast.error(t('Gagal melakukan boost server.'));
                          } finally {
                            setIsBoostingServer(false);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {isBoostingServer ? t('Memproses...') : t('Boost Server Ini (+1 Boost)')}
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{t('Kemajuan Boost')}</span>
                        <span>{activeHub?.boostsCount || 0} / 14</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(5, ((activeHub?.boostsCount || 0) / 14) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Perks per tier */}
                  <div className="space-y-3">
                    {[
                      {
                        tier: 1,
                        boostsRequired: 2,
                        title: t('Tingkat 1 — Dasar Komunitas'),
                        perks: [t('+50 Slot Emoji Kustom Server'), t('Kualitas Audio Suara 128 Kbps'), t('Banner Server Kustom')],
                      },
                      {
                        tier: 2,
                        boostsRequired: 7,
                        title: t('Tingkat 2 — Performa Tinggi'),
                        perks: [t('+100 Slot Emoji Kustom Server'), t('Batas Upload File 50 MB'), t('Saluran Automasi Bot Khusus')],
                      },
                      {
                        tier: 3,
                        boostsRequired: 14,
                        title: t('Tingkat 3 — Eksklusif & Vanity'),
                        perks: [t('+250 Slot Emoji Kustom Server'), t('Batas Upload File 100 MB'), t('Link Undangan Vanity Kustom')],
                      },
                    ].map((tInfo) => {
                      const isUnlocked = (activeHub?.boostTier || 0) >= tInfo.tier;
                      return (
                        <div
                          key={tInfo.tier}
                          className={cn(
                            "rounded-lg border p-4 transition-colors",
                            isUnlocked ? "bg-purple-500/5 border-purple-500/20" : "bg-card/40 opacity-70"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm flex items-center gap-2">
                              <Award className={cn("w-4 h-4", isUnlocked ? "text-purple-400" : "text-muted-foreground")} />
                              {tInfo.title}
                            </span>
                            <Badge variant={isUnlocked ? "default" : "outline"} className={isUnlocked ? "bg-purple-600 text-[10px]" : "text-[10px]"}>
                              {isUnlocked ? t('Terbuka ✅') : `${tInfo.boostsRequired} Boost`}
                            </Badge>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            {tInfo.perks.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. EMOJI */}
              {serverSettingsSection === 'emoji' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Emoji Kustom')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Tambahkan emoji kustom yang dapat digunakan oleh semua anggota di server ini.')}
                  </p>

                  <div className="space-y-6">
                    {/* Grid of emojis */}
                    <div className="rounded-lg border bg-card/40 p-4">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                        {t('Daftar Emoji Server')} ({serverEmojis.length})
                      </label>
                      {serverEmojis.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-3">{t('Belum ada emoji kustom.')}</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {serverEmojis.map((em) => (
                            <div
                              key={em.id}
                              className="group relative rounded-lg border bg-background/60 p-2.5 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors"
                            >
                              <span className="text-2xl mb-1">{em.char || '✨'}</span>
                              <span className="text-[10px] font-mono text-muted-foreground truncate w-full">:{em.name}:</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = serverEmojis.filter((e) => e.id !== em.id);
                                  setServerEmojis(next);
                                  await onUpdateHub(activeHub.id, { emojis: next });
                                  toast.success(t(`Emoji :${em.name}: dihapus`));
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Emoji Card */}
                    <div className="rounded-lg border bg-card/40 p-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Tambah Emoji Baru')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">{t('Nama Emoji')}</label>
                          <Input
                            value={newEmojiName}
                            onChange={(e) => setNewEmojiName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="cth: api_anticeil"
                            className="text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">{t('Karakter Emoji')}</label>
                          <Input
                            value={newEmojiChar}
                            onChange={(e) => setNewEmojiChar(e.target.value)}
                            placeholder="cth: 🚀 atau 🔥"
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Quick pick emoji */}
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1.5 block">{t('Pilih Cepat')}</label>
                        <div className="flex gap-2">
                          {['🚀', '🔥', '🤖', '⚡', '🎉', '💡', '🏆', '💎', '🎯'].map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => setNewEmojiChar(sym)}
                              className="w-8 h-8 rounded-md border bg-muted/40 hover:bg-muted flex items-center justify-center text-sm"
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="button"
                        disabled={!newEmojiName.trim() || !newEmojiChar.trim()}
                        onClick={async () => {
                          if (!newEmojiName.trim() || !newEmojiChar.trim()) return;
                          const newEm: CommunityCustomEmoji = {
                            id: `emoji_${Date.now()}`,
                            name: newEmojiName.trim(),
                            char: newEmojiChar.trim(),
                          };
                          const next = [...serverEmojis, newEm];
                          setServerEmojis(next);
                          setNewEmojiName('');
                          setNewEmojiChar('');
                          await onUpdateHub(activeHub.id, { emojis: next });
                          toast.success(t(`Emoji :${newEm.name}: berhasil ditambahkan! ✨`));
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        {t('Tambah ke Server')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ANGGOTA (MEMBERS) */}
              {serverSettingsSection === 'members' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Anggota Server')}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t('Kelola hak akses peran, keluarkan, atau blokir anggota server.')}</p>

                  {/* Search & Filter */}
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Cari nama atau email anggota..."
                      className="pl-9 text-xs"
                    />
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {members.filter((m) =>
                      !memberSearchQuery ||
                      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">{t('Tidak ada anggota yang cocok.')}</p>
                    ) : (
                      members
                        .filter((m) =>
                          !memberSearchQuery ||
                          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                        )
                        .map((m) => {
                          const isMe = m.id === currentUser?.id || m.email === currentUser?.email;
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border bg-card/40 hover:bg-muted/40 transition-colors"
                            >
                              <CommunityAvatar name={m.name} imageUrl={m.avatar} size={32} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium truncate">{m.name}</p>
                                  {isMe && <Badge variant="secondary" className="text-[9px] py-0 px-1">{t('Anda')}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                              </div>

                              {/* Role dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs capitalize gap-1">
                                    {m.role}
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(['owner', 'admin', 'moderator', 'member'] as const).map((r) => (
                                    <DropdownMenuItem
                                      key={r}
                                      onClick={async () => {
                                        onUpdateMembers?.((prev) => prev.map((item) => (item.id === m.id ? { ...item, role: r } : item)));
                                        await communityApi.updateMemberRole(activeHub.id, m.id, r);
                                        toast.success(t(`Peran ${m.name} diubah menjadi ${r}`));
                                      }}
                                      className="capitalize cursor-pointer"
                                    >
                                      {r}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Kick / Ban actions */}
                              {!isMe && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <X className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        onUpdateMembers?.((prev) => prev.filter((item) => item.id !== m.id));
                                        await communityApi.kickMember(activeHub.id, m.id);
                                        toast.success(t(`${m.name} dikeluarkan dari server`));
                                      }}
                                      className="text-red-500 cursor-pointer"
                                    >
                                      <UserX className="w-4 h-4 mr-2" />
                                      {t('Keluarkan (Kick)')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setBanTargetMember(m);
                                        setBanReasonInput('Melanggar aturan komunitas server');
                                        setIsBanningUser(true);
                                      }}
                                      className="text-red-600 cursor-pointer"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      {t('Blokir (Ban)')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* 7. PERAN (ROLES) */}
              {serverSettingsSection === 'roles' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold">{t('Peran & Izin')}</h2>
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingRole(!isCreatingRole)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      {isCreatingRole ? t('Batal') : t('Peran Baru')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{t('Kelola peran dan hak akses anggota di server ini.')}</p>

                  {/* Create Role Form */}
                  {isCreatingRole && (
                    <div className="rounded-lg border bg-card/60 p-4 mb-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Buat Peran Baru')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">{t('Nama Peran')}</label>
                          <Input
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="cth: Moderator Utama, VIP..."
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1.5 block">{t('Warna Peran')}</label>
                          <div className="flex gap-2">
                            {['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'].map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setNewRoleColor(col)}
                                className={cn(
                                  "w-6 h-6 rounded-full border transition-transform",
                                  newRoleColor === col ? "scale-125 border-white ring-2 ring-primary" : "border-transparent"
                                )}
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        disabled={!newRoleName.trim()}
                        onClick={async () => {
                          if (!newRoleName.trim()) return;
                          const created = await communityApi.createRole(activeHub.id, {
                            name: newRoleName.trim(),
                            color: newRoleColor,
                          });
                          setServerRoles((prev) => [...prev, created]);
                          setNewRoleName('');
                          setIsCreatingRole(false);
                          toast.success(t(`Peran ${created.name} berhasil dibuat! 🛡️`));
                        }}
                        size="sm"
                      >
                        {t('Simpan Peran')}
                      </Button>
                    </div>
                  )}

                  {/* Roles List */}
                  <div className="space-y-2.5">
                    {serverRoles.map((role) => (
                      <div key={role.id} className="flex items-center gap-3 px-3.5 py-3 rounded-lg border bg-card/40">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold capitalize">{role.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(role.permissions || ['SEND_MESSAGES']).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-[9px] py-0 px-1 font-normal text-muted-foreground">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {members.filter((m) => m.role === role.name.toLowerCase()).length} {t('anggota')}
                        </Badge>
                        {role.name.toLowerCase() !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              setServerRoles((prev) => prev.filter((r) => r.id !== role.id));
                              await communityApi.deleteRole(activeHub.id, role.id);
                              toast.success(t(`Peran ${role.name} dihapus`));
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. UNDANGAN (INVITES) */}
              {serverSettingsSection === 'invites' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold">{t('Link Undangan')}</h2>
                    <Button size="sm" onClick={() => setIsCreatingInvite(!isCreatingInvite)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      {isCreatingInvite ? t('Batal') : t('Buat Link Baru')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{t('Kelola semua tautan undangan ke server ini.')}</p>

                  {/* Active URL Card */}
                  <div className="rounded-lg border bg-card/40 p-4 mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('Link Undangan Utama')}</p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/messages?invite=${activeHub?.inviteCode || activeHub?.id}`}
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/messages?invite=${activeHub?.inviteCode || activeHub?.id}`);
                          toast.success(t('Link undangan disalin! 📋'));
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Create New Invite Form */}
                  {isCreatingInvite && (
                    <div className="rounded-lg border bg-card/60 p-4 mb-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Buat Link Undangan Kustom')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">{t('Masa Berlaku')}</label>
                          <select
                            value={newInviteExpiry}
                            onChange={(e: any) => setNewInviteExpiry(e.target.value)}
                            className="w-full text-xs rounded-md border bg-background px-3 py-2"
                          >
                            <option value="1d">{t('24 Jam')}</option>
                            <option value="7d">{t('7 Hari')}</option>
                            <option value="30d">{t('30 Hari')}</option>
                            <option value="never">{t('Tanpa Batas Waktu')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground mb-1 block">{t('Maksimal Penggunaan')}</label>
                          <select
                            value={newInviteMaxUses}
                            onChange={(e: any) => setNewInviteMaxUses(Number(e.target.value))}
                            className="w-full text-xs rounded-md border bg-background px-3 py-2"
                          >
                            <option value={0}>{t('Tanpa Batas Penggunaan')}</option>
                            <option value={1}>1 {t('Penggunaan')}</option>
                            <option value={5}>5 {t('Penggunaan')}</option>
                            <option value={25}>25 {t('Penggunaan')}</option>
                          </select>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={async () => {
                          const expiryDate =
                            newInviteExpiry === 'never'
                              ? null
                              : new Date(Date.now() + (newInviteExpiry === '1d' ? 86400000 : newInviteExpiry === '7d' ? 7 * 86400000 : 30 * 86400000)).toISOString();
                          const inv = await communityApi.createInvite(activeHub.id, {
                            maxUses: newInviteMaxUses,
                            expiresAt: expiryDate,
                          });
                          setServerInvites((prev) => [inv, ...prev]);
                          setIsCreatingInvite(false);
                          toast.success(t(`Link undangan baru dibuat: ${inv.code} 🎉`));
                        }}
                      >
                        {t('Buat Tautan')}
                      </Button>
                    </div>
                  )}

                  {/* Invites list */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Daftar Tautan Undangan Aktif')}</p>
                    {serverInvites.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{t('Belum ada tautan undangan kustom.')}</p>
                    ) : (
                      serverInvites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/40 text-xs">
                          <div>
                            <p className="font-mono font-semibold text-primary">{inv.code}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {t('Dibuat oleh')} {inv.inviterName || 'Admin'} • {inv.uses} {t('digunakan')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/messages?invite=${inv.code}`);
                                toast.success(t('Tautan undangan disalin! 📋'));
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              {t('Salin')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={async () => {
                                setServerInvites((prev) => prev.filter((i) => i.id !== inv.id));
                                await communityApi.revokeInvite(activeHub.id, inv.id);
                                toast.success(t('Tautan undangan berhasil dibatalkan'));
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 9. INTEGRASI */}
              {serverSettingsSection === 'integrations' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Integrasi & Automasi')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Kelola bot, webhook, dan alur automasi Activepieces yang terhubung ke server ini.')}
                  </p>

                  <div className="space-y-4">
                    {/* Webhook Card */}
                    <div className="rounded-lg border bg-card/40 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Webhook className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{t('Incoming Webhooks')}</p>
                            <p className="text-xs text-muted-foreground">{t('Kirim pesan otomatis via HTTP POST dari automasi luar.')}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            onOpenWebhooks?.();
                          }}
                        >
                          {t('Buka Panel Webhook')}
                        </Button>
                      </div>

                      <div className="rounded bg-muted/50 p-2.5 flex items-center justify-between text-xs font-mono">
                        <span className="truncate pr-2">{`${window.location.origin}/api/v1/community/webhook?hubId=${activeHub?.id}`}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/v1/community/webhook?hubId=${activeHub?.id}`);
                            toast.success(t('URL Webhook disalin! 📋'));
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {t('Salin')}
                        </Button>
                      </div>
                    </div>

                    {/* Connected Bots */}
                    <div className="rounded-lg border bg-card/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Bot & Aplikasi Terhubung')}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={async () => {
                            await communityApi.testWebhook({
                              hubId: activeHub.id,
                              botName: 'Anticeil Integration Assistant',
                              content: `Halo! Integrasi automasi server #${activeHub.name} berjalan dengan normal. 🤖✨`,
                            });
                            toast.success(t('Pesan tes bot berhasil dikirim ke saluran! 🚀'));
                          }}
                        >
                          <Send className="w-3 h-3 mr-1.5" />
                          {t('Tes Bot')}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {[
                          { name: 'Anticeil Automation Bot', desc: 'Memproses triggers workflow Activepieces ke chat', status: 'Online', badge: 'bg-emerald-500' },
                          { name: 'Webhook Ingestion Assistant', desc: 'Menerima alert & webhook dari sistem eksternal', status: 'Aktif', badge: 'bg-blue-500' },
                        ].map((b, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border bg-background/50 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{b.name}</p>
                                <p className="text-[11px] text-muted-foreground">{b.desc}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className={cn("w-2 h-2 rounded-full", b.badge)} />
                              {b.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. LOG AUDIT */}
              {serverSettingsSection === 'audit-log' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold">{t('Log Audit')}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const logs = await communityApi.getAuditLog(activeHub.id);
                        setServerAuditLogs(logs);
                        toast.success(t('Log audit dimuat ulang! 📜'));
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('Segarkan')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t('Riwayat tindakan administratif dan perubahan di server ini.')}</p>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['ALL', 'HUB', 'MEMBER', 'ROLE', 'INVITE'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setAuditLogFilter(f)}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs transition-colors",
                          auditLogFilter === f
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {f === 'ALL' ? t('Semua') : f === 'HUB' ? t('Server') : f === 'MEMBER' ? t('Anggota') : f === 'ROLE' ? t('Peran') : t('Undangan')}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {serverAuditLogs
                      .filter((log) => {
                        if (auditLogFilter === 'ALL') return true;
                        if (auditLogFilter === 'HUB') return log.action.includes('HUB') || log.action.includes('BOOST');
                        if (auditLogFilter === 'MEMBER') return log.action.includes('MEMBER');
                        if (auditLogFilter === 'ROLE') return log.action.includes('ROLE');
                        if (auditLogFilter === 'INVITE') return log.action.includes('INVITE');
                        return true;
                      })
                      .map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/40 text-xs">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            {log.action.includes('MEMBER') ? (
                              <Users className="w-3.5 h-3.5 text-blue-400" />
                            ) : log.action.includes('ROLE') ? (
                              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                            ) : log.action.includes('BOOST') ? (
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                            ) : log.action.includes('BAN') ? (
                              <Ban className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">
                              {log.actorName}{' '}
                              <span className="font-normal text-muted-foreground">
                                {log.action === 'HUB_CREATED' ? t('membuat server') :
                                 log.action === 'HUB_UPDATED' ? t('memperbarui profil server') :
                                 log.action === 'SERVER_BOOST' ? t('melakukan server boost') :
                                 log.action === 'MEMBER_ROLE_CHANGE' ? t('mengubah peran anggota') :
                                 log.action === 'MEMBER_KICK' ? t('mengeluarkan anggota') :
                                 log.action === 'MEMBER_BAN' ? t('memblokir anggota') :
                                 log.action === 'MEMBER_UNBAN' ? t('membatalkan blokir') :
                                 log.action === 'ROLE_CREATED' ? t('membuat peran baru') :
                                 log.action === 'ROLE_DELETED' ? t('menghapus peran') :
                                 log.action === 'INVITE_CREATE' ? t('membuat link undangan') :
                                 log.action === 'INVITE_REVOKE' ? t('membatalkan link undangan') :
                                 log.action}
                              </span>{' '}
                              {log.targetName && <span className="font-semibold text-primary">{log.targetName}</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {dayjs(log.createdAt).format('DD MMM YYYY, HH:mm')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-mono">
                            {log.action}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 11. BAN */}
              {serverSettingsSection === 'bans' && (
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('Pengguna Diblokir')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Daftar pengguna yang telah diblokir dari server ini. Pengguna diblokir tidak dapat melihat atau bergabung ke saluran.')}
                  </p>

                  <div className="space-y-2">
                    {serverBans.length === 0 ? (
                      <div className="rounded-lg border bg-card/40 p-8 text-center">
                        <Ban className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm font-medium">{t('Tidak ada pengguna yang diblokir')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('Komunitas Anda bersih dan tertib! ✨')}</p>
                      </div>
                    ) : (
                      serverBans.map((ban) => (
                        <div key={ban.id} className="flex items-center justify-between p-3.5 rounded-lg border bg-card/40 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                              <Ban className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{ban.userName}</p>
                              <p className="text-muted-foreground text-[11px]">
                                {t('Alasan')}: {ban.reason || t('Melanggar aturan')} • {dayjs(ban.createdAt).format('DD MMM YYYY')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setServerBans((prev) => prev.filter((b) => b.userId !== ban.userId));
                              await communityApi.unbanUser(activeHub.id, ban.userId);
                              toast.success(t(`Blokir untuk ${ban.userName} telah dibatalkan! ✅`));
                            }}
                          >
                            {t('Batal Blokir')}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: BAN MEMBER SUB-MODAL */}
      <Dialog open={isBanningUser} onOpenChange={setIsBanningUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Ban className="w-5 h-5" />
              {t('Blokir Anggota dari Server')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Apakah Anda yakin ingin memblokir {{name}}? Pengguna ini akan dikeluarkan dan tidak dapat bergabung kembali menggunakan link undangan.',
                { name: banTargetMember?.name },
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <label className="text-xs font-semibold text-muted-foreground">{t('Alasan Pemblokiran')}</label>
            <Input
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="cth: Melanggar aturan komunitas / spam..."
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsBanningUser(false);
                setBanTargetMember(null);
              }}
            >
              {t('Batal')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!activeHub || !banTargetMember) return;
                const banned = await communityApi.banUser(activeHub.id, {
                  userId: banTargetMember.id,
                  userName: banTargetMember.name,
                  userEmail: banTargetMember.email,
                  reason: banReasonInput,
                });
                setServerBans((prev) => [banned, ...prev]);
                onUpdateMembers?.((prev) => prev.filter((m) => m.id !== banTargetMember.id));
                setIsBanningUser(false);
                setBanTargetMember(null);
                toast.success(t(`${banTargetMember.name} telah diblokir dari server 🚫`));
              }}
            >
              {t('Blokir & Keluarkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
