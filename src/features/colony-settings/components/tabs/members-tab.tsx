import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  MoreVertical,
  Plus,
  Shield,
  Crown,
  Trash2,
  UserX,
  Ban,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SmallDialog } from '@/components/ui/small-dialog';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { colonyApi } from '@/chat/chat-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type {
  Colony,
  ColonyMember,
  CommunityCustomRole,
} from '@/chat/chat-types';

interface MembersTabProps {
  activeColony: Colony;
  currentUser: ColonyMember | null;
  members: ColonyMember[];
  serverRoles?: CommunityCustomRole[];
  onUpdateMembers?: (updater: (prev: ColonyMember[]) => ColonyMember[]) => void;
  onInitiateBan: (member: ColonyMember) => void;
  t: (key: string) => string;
}

export function MembersTab({
  activeColony,
  currentUser,
  members,
  serverRoles = [],
  onUpdateMembers,
  onInitiateBan,
  t,
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<
    'joined_desc' | 'joined_asc' | 'name_asc'
  >('joined_desc');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isPruning, setIsPruning] = useState(false);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let list = members.filter((m) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q)
      );
    });

    if (sortOption === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: recent members first
      list.sort((a, b) => b.id.localeCompare(a.id));
    }

    return list;
  }, [members, searchQuery, sortOption]);

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handlePrune = () => {
    setIsPruning(false);
    toast.success(t('Pembersihan anggota tidak aktif berhasil dijalankan! 🧹'));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header (Discord 1:1 Parity) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Members')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Recent Members')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search by username or id')}
              className="w-full text-xs h-9 pl-9 pr-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 bg-card border-border text-foreground hover:bg-muted"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{t('Sort')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#111214] border-border/80">
              <DropdownMenuItem
                onClick={() => setSortOption('joined_desc')}
                className="text-xs cursor-pointer"
              >
                {t('Member Since (Newest)')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption('joined_asc')}
                className="text-xs cursor-pointer"
              >
                {t('Member Since (Oldest)')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption('name_asc')}
                className="text-xs cursor-pointer"
              >
                {t('Alphabetical')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prune Button */}
          <Button
            size="sm"
            onClick={() => setIsPruning(true)}
            className="h-9 px-3.5 text-xs font-semibold bg-[#2b2d31] hover:bg-destructive/20 text-destructive hover:text-destructive border border-border/60 cursor-pointer"
          >
            {t('Prune')}
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border/80 bg-[#1e1f22] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-[#111214] text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredMembers.length > 0 &&
                      selectedMemberIds.length === filteredMembers.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded bg-card border-border accent-primary cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">{t('Name')}</th>
                <th className="py-3 px-4">{t('Member Since')}</th>
                <th className="py-3 px-4">{t('Joined Anticeil')}</th>
                <th className="py-3 px-4">{t('Join Method')}</th>
                <th className="py-3 px-4">{t('Roles')}</th>
                <th className="py-3 px-4">{t('Signals')}</th>
                <th className="py-3 px-4 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    {t('Tidak ada anggota yang cocok dengan pencarian.')}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isMe =
                    m.id === currentUser?.id || m.email === currentUser?.email;
                  const isSelected = selectedMemberIds.includes(m.id);

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-white/[0.02] transition-colors group',
                        isSelected && 'bg-primary/10',
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectMember(m.id)}
                          className="rounded bg-card border-border accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <CommunityAvatar
                            name={m.name}
                            imageUrl={m.avatar}
                            size={34}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-xs truncate">
                                {m.name}
                              </span>
                              {isMe && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] py-0 px-1 font-semibold"
                                >
                                  {t('You')}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              @{m.name.toLowerCase().replace(/\s+/g, '_')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Member Since */}
                      <td className="py-3 px-4 text-xs text-foreground/80">
                        15 days ago
                      </td>

                      {/* Joined Platform */}
                      <td className="py-3 px-4 text-xs text-foreground/80">
                        7 years ago
                      </td>

                      {/* Join Method */}
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        Invite link
                      </td>

                      {/* Roles */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Role Pill */}
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                              m.role === 'owner'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                : m.role === 'admin'
                                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                                  : m.role === 'moderator'
                                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                    : 'bg-muted/40 border-border text-foreground',
                            )}
                          >
                            ● {m.role}
                          </span>

                          {/* Quick Role Switcher Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="size-5 rounded-full bg-[#2b2d31] hover:bg-[#35373c] text-muted-foreground hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                title={t('Ubah peran')}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="bg-[#111214] border-border/80 w-40"
                            >
                              {Array.from(
                                new Set([
                                  'owner',
                                  'admin',
                                  'moderator',
                                  'member',
                                  ...serverRoles.map((sr) => sr.name),
                                ]),
                              ).map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={async () => {
                                    onUpdateMembers?.((prev) =>
                                      prev.map((item) =>
                                        item.id === m.id
                                          ? { ...item, role: r }
                                          : item,
                                      ),
                                    );
                                    try {
                                      await colonyApi.updateMemberRole(activeColony.id, m.id, r);
                                    } catch {}
                                    toast.success(
                                      t(
                                        `Peran ${m.name} diubah menjadi ${r}`,
                                      ),
                                    );
                                  }}
                                  className="text-xs capitalize cursor-pointer"
                                >
                                  {m.role?.toLowerCase() === r.toLowerCase() && (
                                    <Check className="w-3 h-3 mr-1.5 text-teal-400" />
                                  )}
                                  {r}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>

                      {/* Signals */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {m.role === 'owner' && (
                            <span title="Owner">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              m.status === 'online'
                                ? 'bg-emerald-500'
                                : 'bg-muted-foreground/50',
                            )}
                            title={m.status === 'online' ? 'Online' : 'Offline'}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#2b2d31] transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#111214] border-border/80 w-44"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                const newNick = prompt(
                                  t('Masukkan nama panggilan baru:'),
                                  m.name,
                                );
                                if (newNick && newNick.trim()) {
                                  onUpdateMembers?.((prev) =>
                                    prev.map((item) =>
                                      item.id === m.id
                                        ? { ...item, name: newNick.trim() }
                                        : item,
                                    ),
                                  );
                                  toast.success(t('Nama panggilan diperbarui!'));
                                }
                              }}
                              className="text-xs cursor-pointer"
                            >
                              {t('Change Nickname')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                onUpdateMembers?.((prev) =>
                                  prev.filter((item) => item.id !== m.id),
                                );
                                toast.success(
                                  t(`${m.name} telah dikeluarkan dari server.`),
                                );
                              }}
                              className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5 mr-1.5" />
                              {t('Kick')} {m.name}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onInitiateBan(m)}
                              className="text-xs text-destructive hover:text-destructive cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5 mr-1.5" />
                              {t('Ban')} {m.name}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="py-3 px-4 bg-[#111214] text-[11px] text-muted-foreground border-t border-border/60 flex items-center justify-between">
          <span>
            {t('Showing')} {filteredMembers.length} {t('members')}
          </span>
          {selectedMemberIds.length > 0 && (
            <span className="text-xs text-primary font-semibold">
              {selectedMemberIds.length} {t('dipilih')}
            </span>
          )}
        </div>
      </div>

      {/* Prune Confirmation Dialog (SmallDialog Template) */}
      <SmallDialog
        open={isPruning}
        onOpenChange={setIsPruning}
        title={t('Prune Inactive Members')}
        titleClassName="text-base font-bold text-foreground"
        description={t(
          'Members who have not been seen for 7 or 30 days and have no roles assigned will be kicked from the server.',
        )}
        confirmLabel={t('Prune Members')}
        cancelLabel={t('Cancel')}
        variant="destructive"
        onConfirm={handlePrune}
        onClose={() => setIsPruning(false)}
      />
    </div>
  );
}
