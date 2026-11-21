import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { ColonyMember, ColonyCustomRole } from '@/chat/chat-types';

export type MentionOptionType = 'member' | 'special' | 'role';

export interface MentionOption {
  id: string;
  type: MentionOptionType;
  label: string;
  value: string;
  name: string;
  tag?: string;
  avatar?: string | null;
  status?: 'online' | 'idle' | 'offline';
  description?: string;
  color?: string;
}

interface MentionAutocompleteProps {
  isOpen: boolean;
  query: string;
  members?: ColonyMember[];
  roles?: ColonyCustomRole[];
  selectedIndex: number;
  onSelect: (item: MentionOption) => void;
  onHoverIndex?: (index: number) => void;
}

export function MentionAutocomplete({
  isOpen,
  query,
  members = [],
  roles = [],
  selectedIndex,
  onSelect,
  onHoverIndex,
}: MentionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanQuery = (query || '').toLowerCase().trim();

  // 1. Build members list
  const memberOptions = useMemo<MentionOption[]>(() => {
    return members.map((m) => {
      const cleanName = m.name?.trim() || 'Pengguna';
      const handle = m.username
        ? `_${m.username.replace(/^@/, '')}_`
        : m.email
        ? `_${m.email.split('@')[0]}_`
        : undefined;

      return {
        id: `member_${m.id}`,
        type: 'member',
        label: cleanName,
        value: `@${cleanName}`,
        name: cleanName,
        tag: handle,
        avatar: m.avatar,
        status: m.status || 'offline',
      };
    });
  }, [members]);

  // 2. Special Mentions matching Discord
  const specialOptions = useMemo<MentionOption[]>(() => {
    return [
      {
        id: 'special_everyone',
        type: 'special',
        label: '@everyone',
        value: '@everyone',
        name: '@everyone',
        description: 'Notify everyone who has permission to view this channel.',
      },
      {
        id: 'special_here',
        type: 'special',
        label: '@here',
        value: '@here',
        name: '@here',
        description: 'Notify everyone online who has permission to view this channel.',
      },
      {
        id: 'special_game',
        type: 'special',
        label: '@game',
        value: '@game',
        name: '@game',
        description: 'Mention a game',
      },
      {
        id: 'special_time',
        type: 'special',
        label: '@time',
        value: '@time',
        name: '@time',
        description: "Refer to a time dynamically in the viewer's time zone",
      },
    ];
  }, []);

  // 3. Roles list
  const roleOptions = useMemo<MentionOption[]>(() => {
    const list: MentionOption[] = [];
    const validRoles = roles.length > 0 ? roles : [
      {
        id: 'role_new_role',
        colonyId: 'colony-1',
        name: 'new role',
        color: '#94a3b8',
        permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      },
    ];

    validRoles.forEach((r) => {
      const roleName = r.name.replace(/^@/, '').trim();
      list.push({
        id: `role_${r.id}`,
        type: 'role',
        label: `@${roleName}`,
        value: `@${roleName}`,
        name: `@${roleName}`,
        description: 'Notify users with this role who have permission to view this channel.',
        color: r.color || '#94a3b8',
      });
    });

    return list;
  }, [roles]);

  // Filter based on cleanQuery
  const filteredMembers = useMemo(() => {
    if (!cleanQuery) return memberOptions;
    return memberOptions.filter((m) =>
      m.name.toLowerCase().includes(cleanQuery) ||
      (m.tag && m.tag.toLowerCase().includes(cleanQuery))
    );
  }, [memberOptions, cleanQuery]);

  const filteredSpecial = useMemo(() => {
    if (!cleanQuery) return specialOptions;
    return specialOptions.filter((s) =>
      s.label.toLowerCase().includes(cleanQuery) ||
      s.label.replace(/^@/, '').toLowerCase().includes(cleanQuery)
    );
  }, [specialOptions, cleanQuery]);

  const filteredRoles = useMemo(() => {
    if (!cleanQuery) return roleOptions;
    return roleOptions.filter((r) =>
      r.label.toLowerCase().includes(cleanQuery) ||
      r.label.replace(/^@/, '').toLowerCase().includes(cleanQuery)
    );
  }, [roleOptions, cleanQuery]);

  // Combined flat list for keyboard navigation
  const flatItems = useMemo(() => {
    return [...filteredMembers, ...filteredSpecial, ...filteredRoles];
  }, [filteredMembers, filteredSpecial, filteredRoles]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen || flatItems.length === 0) return null;

  let currentIndexTracker = 0;

  return (
    <div
      ref={containerRef}
      className="w-full mb-2 bg-[#111214] border border-white/10 shadow-2xl rounded-xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar p-1.5 z-50 select-none animate-in slide-in-from-bottom-2 duration-150"
    >
      {/* 1. Members Section */}
      {filteredMembers.length > 0 && (
        <div className="mb-1">
          <div className="text-[11px] font-bold text-muted-foreground/80 uppercase px-3 py-1 tracking-wider">
            Members
          </div>
          <div className="space-y-0.5">
            {filteredMembers.map((item) => {
              const itemIdx = currentIndexTracker++;
              const isSelected = itemIdx === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHoverIndex?.(itemIdx)}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-[#35373c] text-white'
                      : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <CommunityAvatar
                      imageUrl={item.avatar}
                      name={item.name}
                      size={24}
                      status={item.status}
                      showStatus={true}
                      className="w-6 h-6 rounded-full shrink-0"
                    />
                    <span className="font-semibold text-sm truncate">{item.name}</span>
                  </div>
                  {item.tag && (
                    <span className="text-xs text-muted-foreground/80 font-mono shrink-0">
                      {item.tag}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Special Mentions Section */}
      {filteredSpecial.length > 0 && (
        <div className="mb-1 space-y-0.5">
          {filteredSpecial.map((item) => {
            const itemIdx = currentIndexTracker++;
            const isSelected = itemIdx === selectedIndex;

            return (
              <div
                key={item.id}
                data-selected={isSelected}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHoverIndex?.(itemIdx)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors gap-3',
                  isSelected
                    ? 'bg-[#35373c] text-white'
                    : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                )}
              >
                <span className="font-semibold text-sm shrink-0">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs text-muted-foreground/80 text-right truncate">
                    {item.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Roles Section */}
      {filteredRoles.length > 0 && (
        <div className="space-y-0.5">
          {filteredRoles.map((item) => {
            const itemIdx = currentIndexTracker++;
            const isSelected = itemIdx === selectedIndex;

            return (
              <div
                key={item.id}
                data-selected={isSelected}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHoverIndex?.(itemIdx)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors gap-3',
                  isSelected
                    ? 'bg-[#35373c] text-white'
                    : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                )}
              >
                <span
                  className="font-semibold text-sm shrink-0"
                  style={{ color: item.color || '#94a3b8' }}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs text-muted-foreground/80 text-right truncate">
                    {item.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
