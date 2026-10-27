import React from 'react';
import { Search, Users, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#80848e]" />
        <Input
          value={friendsSearchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('Cari...')}
          className="pl-9 h-9 text-xs bg-[#111214] border-transparent focus:border-[#5865f2] text-white placeholder:text-[#80848e] rounded-[4px]"
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
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="w-16 h-16 text-white/20 mb-3 stroke-[1.2]" />
          <p className="text-xs text-muted-foreground font-medium mb-1">
            {friendsTab === 'online'
              ? t('Tidak ada teman yang sedang online saat ini.')
              : t('Belum ada teman. Tambahkan teman untuk memulai!')}
          </p>
          {friendsTab !== 'online' && (
            <Button
              size="sm"
              onClick={onSwitchToAddTab}
              className="mt-3 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              {t('Tambah Teman')}
            </Button>
          )}
        </div>
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
