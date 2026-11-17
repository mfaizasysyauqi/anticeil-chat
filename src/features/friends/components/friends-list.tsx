import React from 'react';
import { Search, Users, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';
import { FriendItem } from './friend-item';
import type { FriendMember, FriendsTab } from '../types';

interface FriendsListProps {
  friendsTab: FriendsTab;
  friendsSearchQuery: string;
  onSearchChange: (query: string) => void;
  filteredFriends: FriendMember[];
  onStartDM: (member: FriendMember) => void;
  onSwitchToAddTab: () => void;
}

export function FriendsList({
  friendsTab,
  friendsSearchQuery,
  onSearchChange,
  filteredFriends,
  onStartDM,
  onSwitchToAddTab,
}: FriendsListProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={friendsSearchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('Cari...')}
          className="pl-9 h-9 text-xs bg-muted/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground rounded-[6px]"
        />
        {friendsSearchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase mb-3">
        {friendsTab === 'online' ? t('Online') : t('Semua Teman')} — {filteredFriends.length}
      </div>

      {filteredFriends.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 stroke-[1.8]" />}
          title={
            friendsTab === 'online'
              ? t('Tidak ada teman online')
              : t('Belum ada teman')
          }
          description={
            friendsTab === 'online'
              ? t('Saat teman Anda online, mereka akan muncul di sini.')
              : t('Tambahkan teman untuk mulai mengobrol dan berkolaborasi!')
          }
          action={
            friendsTab !== 'online' ? (
              <Button
                size="sm"
                onClick={onSwitchToAddTab}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-2xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                {t('Tambah Teman')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-0.5">
          {filteredFriends.map((member) => (
            <FriendItem key={member.id} member={member} onStartDM={onStartDM} />
          ))}
        </div>
      )}
    </div>
  );
}
