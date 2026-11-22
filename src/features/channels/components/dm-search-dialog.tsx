import React from 'react';
import { Search, MessageSquare, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { ColonyChannel, ColonyMember } from '@/chat/chat-types';

export interface DmSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dmSearchQuery: string;
  setDmSearchQuery: (query: string) => void;
  dmChannels: ColonyChannel[];
  members: ColonyMember[];
  currentUser: any;
  onSelectDmChannel: (channelId: string) => void;
  onStartDM: (member: ColonyMember) => void;
  onOpenCreateGroupDm?: () => void;
  t: (key: string) => string;
}

export function DmSearchDialog({
  open,
  onOpenChange,
  dmSearchQuery,
  setDmSearchQuery,
  dmChannels,
  members,
  currentUser,
  onSelectDmChannel,
  onStartDM,
  onOpenCreateGroupDm,
  t,
}: DmSearchDialogProps) {
  const q = dmSearchQuery.trim().toLowerCase();

  // Existing DM channels
  const filteredDms = dmChannels.filter((dm) =>
    !q || dm.name.toLowerCase().includes(q),
  );

  // Members not yet in DM (excluding self)
  const filteredMembers = members.filter((m) => {
    if (m.id === currentUser?.id) return false;
    const hasDm = dmChannels.some((dm) => dm.id === `dm-${m.id}`);
    if (hasDm) return false;
    return !q || m.name.toLowerCase().includes(q);
  });

  const hasResults = filteredDms.length > 0 || filteredMembers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('Cari atau mulai percakapan')}</DialogTitle>
          <DialogDescription>{t('Cari anggota atau channel untuk memulai percakapan.')}</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={dmSearchQuery}
              onChange={(e) => setDmSearchQuery(e.target.value)}
              placeholder={t('Mau pergi ke mana?')}
              className="pl-9 text-sm bg-transparent border-none shadow-none focus-visible:ring-0 h-9"
              autoFocus
            />
          </div>
        </div>

        {/* Create Group DM shortcut */}
        {onOpenCreateGroupDm && (
          <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('Ingin mengobrol bersama beberapa teman?')}</span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenCreateGroupDm();
              }}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('Buat Group DM')}</span>
            </button>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
          {!hasResults ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('Tidak ada hasil ditemukan.')}
            </div>
          ) : (
            <div className="py-1">
              {/* Existing DM Channels */}
              {filteredDms.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {t('Percakapan Sebelumnya')}
                  </div>
                  {filteredDms.map((dm) => {
                    const isGroup = Boolean(dm.isGroupDm || dm.id.startsWith('gdm-'));
                    const member = members.find((m) => `dm-${m.id}` === dm.id);
                    return (
                      <button
                        key={dm.id}
                        onClick={() => {
                          onSelectDmChannel(dm.id);
                          onOpenChange(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors"
                      >
                        {isGroup ? (
                          <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <CommunityAvatar
                            name={member?.name || member?.username || dm.name || 'Pengguna'}
                            imageUrl={
                              member?.avatar ||
                              (member as any)?.imageUrl ||
                              (dm as any).avatar ||
                              (dm as any).imageUrl ||
                              (currentUser && (dm.dmUserId === currentUser.id || dm.name === currentUser.name)
                                ? currentUser.imageUrl || currentUser.avatar
                                : undefined)
                            }
                            size={28}
                            status={member?.status || (dm as any).status}
                            showStatus
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate text-foreground">{dm.name}</span>
                          {member?.customStatus && (
                            <span className="text-[10px] text-muted-foreground truncate">{member.customStatus}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* New DM - members without existing conversation */}
              {filteredMembers.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {t('Mulai Percakapan Baru')}
                  </div>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onStartDM(member);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <CommunityAvatar
                        name={member.name}
                        imageUrl={member.avatar}
                        size={28}
                        status={member.status}
                        showStatus
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium truncate text-foreground">{member.name}</span>
                        {member.customStatus && (
                          <span className="text-[10px] text-muted-foreground truncate">{member.customStatus}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-primary font-semibold">Tip:</span> {t('Ketik nama anggota untuk mencari dan memulai percakapan langsung.')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
