import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  ChevronRight,
  ChevronDown,
  Flag,
  Settings2,
  Hash,
  KeyRound,
  Trash2,
  UserPlus,
  Ban,
  UserX,
  Webhook,
  Filter,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import type { Colony, CommunityAuditEntry, ColonyMember } from '@/chat/chat-types';

interface AuditLogTabProps {
  activeColony: Colony;
  members?: ColonyMember[];
  serverAuditLogs: CommunityAuditEntry[];
  setServerAuditLogs: React.Dispatch<React.SetStateAction<CommunityAuditEntry[]>>;
  t: (key: string) => string;
}

interface EnrichedAuditItem {
  id: string;
  actorName: string;
  actorAvatar?: string;
  actionType: 'role_create' | 'server_update' | 'channel_create' | 'role_update' | 'channel_delete' | 'member_ban' | 'invite_create' | 'webhook_create';
  summary: string;
  targetName?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export function AuditLogTab({
  activeColony,
  members = [],
  serverAuditLogs,
  t,
}: AuditLogTabProps) {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Default Discord entries matching Screenshot 2
  const defaultEntries: EnrichedAuditItem[] = useMemo(() => [
    {
      id: 'log-1',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'zmsta',
      actionType: 'role_create',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'zmsta'} created the role new role`,
      targetName: 'new role',
      timestamp: 'Today at 2:49 PM',
      details: {
        'role_name': 'new role',
        'color': '#99aab5',
        'hoist': false,
        'mentionable': false,
        'permissions': '+SEND_MESSAGES, +READ_MESSAGE_HISTORY',
      },
    },
    {
      id: 'log-2',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'zmsta',
      actionType: 'server_update',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'zmsta'} made changes to ${activeColony.name}`,
      targetName: activeColony.name,
      timestamp: '11/01/2026',
      details: {
        'verification_level': 'Medium (Must be registered on Discord for > 5 min)',
        'default_message_notifications': 'Only @mentions',
        'explicit_content_filter': 'Scan media from all members',
      },
    },
    {
      id: 'log-3',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'zmsta',
      actionType: 'channel_create',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'zmsta'} created a text channel #rules`,
      targetName: '#rules',
      timestamp: '11/01/2026',
      details: {
        'name': 'rules',
        'type': 'Guild Text Channel',
        'rate_limit_per_user': 0,
        'nsfw': false,
      },
    },
    {
      id: 'log-4',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'zmsta',
      actionType: 'role_update',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'zmsta'} updated the role @everyone`,
      targetName: '@everyone',
      timestamp: '11/01/2026',
      details: {
        'permissions': '-MENTION_EVERYONE, +ADD_REACTIONS, +USE_APPLICATION_COMMANDS',
      },
    },
    {
      id: 'log-5',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'zmsta',
      actionType: 'channel_delete',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'zmsta'} removed Text Channels`,
      targetName: 'Text Channels',
      timestamp: '11/01/2026',
      details: {
        'channel_type': 'Guild Category',
        'channels_contained': 0,
      },
    },
  ], [activeColony]);

  // Combine dynamic logs with default entries
  const allLogs: EnrichedAuditItem[] = useMemo(() => {
    const dynamicConverted: EnrichedAuditItem[] = serverAuditLogs.map((log) => ({
      id: log.id,
      actorName: log.actorName,
      actionType: log.action.includes('ROLE')
        ? 'role_update'
        : log.action.includes('BAN')
        ? 'member_ban'
        : log.action.includes('CHANNEL')
        ? 'channel_create'
        : log.action.includes('INVITE')
        ? 'invite_create'
        : 'server_update',
      summary: `${log.actorName} ${log.action.toLowerCase().replace(/_/g, ' ')} ${log.targetName || ''}`,
      targetName: log.targetName,
      timestamp: new Date(log.createdAt).toLocaleDateString(),
      details: typeof log.details === 'object' ? log.details : { raw: log.details },
    }));

    return [...dynamicConverted, ...defaultEntries];
  }, [serverAuditLogs, defaultEntries]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchUser =
        selectedUserFilter === 'all' ||
        log.actorName.toLowerCase().includes(selectedUserFilter.toLowerCase());

      const matchAction =
        selectedActionFilter === 'all' || log.actionType === selectedActionFilter;

      return matchUser && matchAction;
    });
  }, [allLogs, selectedUserFilter, selectedActionFilter]);

  const getActionIcon = (actionType: EnrichedAuditItem['actionType']) => {
    switch (actionType) {
      case 'role_create':
        return <Flag className="w-3.5 h-3.5 text-emerald-400" />;
      case 'server_update':
        return <Settings2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'channel_create':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'role_update':
        return <KeyRound className="w-3.5 h-3.5 text-purple-400" />;
      case 'channel_delete':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'member_ban':
        return <Ban className="w-3.5 h-3.5 text-red-500" />;
      case 'invite_create':
        return <UserPlus className="w-3.5 h-3.5 text-teal-400" />;
      case 'webhook_create':
        return <Webhook className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── Top Bar: Title & Filter Controls (Screenshot 2) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Audit Log')}</h2>
        </div>

        {/* Filter dropdowns on right */}
        <div className="flex items-center gap-3">
          {/* Filter by User */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Filter by User')}
            </span>
            <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
              <SelectTrigger className="w-40 h-8 text-xs bg-secondary border-border/70 text-foreground">
                <SelectValue placeholder={t('All Users')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">
                  {t('All Users')}
                </SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.name} className="text-xs">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Action */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Filter by Action')}
            </span>
            <Select value={selectedActionFilter} onValueChange={setSelectedActionFilter}>
              <SelectTrigger className="w-44 h-8 text-xs bg-secondary border-border/70 text-foreground">
                <SelectValue placeholder={t('All Actions')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">
                  {t('All Actions')}
                </SelectItem>
                <SelectItem value="server_update" className="text-xs">
                  {t('Update Server')}
                </SelectItem>
                <SelectItem value="channel_create" className="text-xs">
                  {t('Create Channel')}
                </SelectItem>
                <SelectItem value="channel_delete" className="text-xs">
                  {t('Delete Channel')}
                </SelectItem>
                <SelectItem value="role_create" className="text-xs">
                  {t('Create Role')}
                </SelectItem>
                <SelectItem value="role_update" className="text-xs">
                  {t('Update Role')}
                </SelectItem>
                <SelectItem value="member_ban" className="text-xs">
                  {t('Ban Member')}
                </SelectItem>
                <SelectItem value="invite_create" className="text-xs">
                  {t('Create Invite')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Entry Rows (Screenshot 2 Discord Parity) ── */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card p-12 text-center text-xs text-muted-foreground">
            {t('Tidak ada riwayat tindakan yang cocok dengan filter.')}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="rounded-xl border border-border/70 bg-card hover:border-border transition-colors cursor-pointer overflow-hidden shadow-xs"
              >
                <div className="p-3.5 flex items-center justify-between gap-4">
                  {/* Left: Action Icon + User Avatar + Action Text + Timestamp */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Small action icon badge */}
                    <div className="w-6 h-6 rounded-md bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
                      {getActionIcon(log.actionType)}
                    </div>

                    {/* Actor Avatar */}
                    <CommunityAvatar
                      name={log.actorName}
                      imageUrl={log.actorAvatar}
                      size={28}
                      className="shrink-0"
                    />

                    {/* Text block */}
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-medium truncate">
                        <span className="font-bold text-foreground">
                          {log.actorName}
                        </span>{' '}
                        {log.summary.replace(`${log.actorName} `, '')}
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Right: Chevron */}
                  <div className="text-muted-foreground shrink-0 pl-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Diff */}
                {isExpanded && log.details && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-border/40 bg-black/20 text-xs font-mono space-y-1 animate-in fade-in-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      {t('Audit Entry Details')}:
                    </span>
                    {Object.entries(log.details).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2 text-[11px]">
                        <span className="text-blue-400 shrink-0 font-semibold">{k}:</span>
                        <span className="text-muted-foreground break-all">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
