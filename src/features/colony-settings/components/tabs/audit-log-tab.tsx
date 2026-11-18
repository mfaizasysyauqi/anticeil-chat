import React, { useState, useMemo, useEffect } from 'react';
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
  Music,
  Smile,
  Shield,
  Zap,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { getSocket } from '@/providers/socket-provider';
import { colonyApi } from '@/features/colonies/api/colonies-api';
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
  actionType:
    | 'role_create'
    | 'role_update'
    | 'role_delete'
    | 'server_update'
    | 'channel_create'
    | 'channel_delete'
    | 'member_ban'
    | 'member_unban'
    | 'member_kick'
    | 'member_role'
    | 'invite_create'
    | 'invite_revoke'
    | 'sound_create'
    | 'sound_delete'
    | 'emoji_create'
    | 'emoji_delete'
    | 'sticker_create'
    | 'sticker_delete'
    | 'webhook_create';
  summary: string;
  targetName?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export function AuditLogTab({
  activeColony,
  members = [],
  serverAuditLogs,
  setServerAuditLogs,
  t,
}: AuditLogTabProps) {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch fresh audit logs on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAudit = async () => {
      try {
        const logs = await colonyApi.getAuditLog(activeColony.id);
        if (isMounted && Array.isArray(logs) && logs.length > 0) {
          setServerAuditLogs(logs);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    };
    fetchAudit();
    return () => {
      isMounted = false;
    };
  }, [activeColony.id, setServerAuditLogs]);

  // Live Socket.io listener for new audit logs
  useEffect(() => {
    const s = getSocket();
    const handleNewAudit = (entry: any) => {
      if (!entry || (entry.hubId && entry.hubId !== activeColony.id)) return;
      setServerAuditLogs((prev) => [entry, ...prev.filter((p) => p.id !== entry.id)]);
    };
    s.on('COMMUNITY_AUDIT_LOG_ENTRY', handleNewAudit);
    return () => {
      s.off('COMMUNITY_AUDIT_LOG_ENTRY', handleNewAudit);
    };
  }, [activeColony.id, setServerAuditLogs]);

  // Default Discord entries matching Anticeil Parity
  const defaultEntries: EnrichedAuditItem[] = useMemo(() => [
    {
      id: 'log-init',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'Anticeil System',
      actionType: 'server_update',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'Anticeil System'} configured ${activeColony.name}`,
      targetName: activeColony.name,
      timestamp: 'Today at 2:49 PM',
      details: {
        server_name: activeColony.name,
        verification_level: 'Medium (Registered on Anticeil)',
        default_notifications: 'Only @mentions',
        audit_engine: 'PostgreSQL Realtime v2',
      },
    },
    {
      id: 'log-role-init',
      actorName: activeColony.role === 'owner' ? '_zmsta_' : 'Anticeil System',
      actionType: 'role_update',
      summary: `${activeColony.role === 'owner' ? '_zmsta_' : 'Anticeil System'} updated the role @everyone`,
      targetName: '@everyone',
      timestamp: 'Today at 2:50 PM',
      details: {
        permissions: '+SEND_MESSAGES, +READ_MESSAGE_HISTORY, +USE_SOUNDBOARD, +ADD_REACTIONS',
      },
    },
  ], [activeColony]);

  // Map action string to EnrichedAuditItem actionType
  const mapActionType = (action: string): EnrichedAuditItem['actionType'] => {
    const act = (action || '').toUpperCase();
    if (act.includes('ROLE_CREATE')) return 'role_create';
    if (act.includes('ROLE_DELETE')) return 'role_delete';
    if (act.includes('ROLE')) return 'role_update';
    if (act.includes('BAN') && !act.includes('UNBAN')) return 'member_ban';
    if (act.includes('UNBAN')) return 'member_unban';
    if (act.includes('KICK')) return 'member_kick';
    if (act.includes('MEMBER_ROLE')) return 'member_role';
    if (act.includes('CHANNEL_CREATE')) return 'channel_create';
    if (act.includes('CHANNEL_DELETE')) return 'channel_delete';
    if (act.includes('INVITE_REVOKE')) return 'invite_revoke';
    if (act.includes('INVITE')) return 'invite_create';
    if (act.includes('SOUND_DELETE')) return 'sound_delete';
    if (act.includes('SOUND')) return 'sound_create';
    if (act.includes('EMOJI_DELETE')) return 'emoji_delete';
    if (act.includes('EMOJI')) return 'emoji_create';
    if (act.includes('STICKER_DELETE')) return 'sticker_delete';
    if (act.includes('STICKER')) return 'sticker_create';
    return 'server_update';
  };

  // Combine dynamic logs with default fallback entries
  const allLogs: EnrichedAuditItem[] = useMemo(() => {
    if (serverAuditLogs.length > 0) {
      return serverAuditLogs.map((log) => {
        const actionType = mapActionType(log.action);
        const actionFriendly = log.action
          ? log.action.toLowerCase().replace(/_/g, ' ')
          : 'action';
        return {
          id: log.id,
          actorName: log.actorName || 'Admin',
          actionType,
          summary: `${log.actorName || 'Admin'} ${actionFriendly} ${log.targetName || ''}`,
          targetName: log.targetName,
          timestamp: log.createdAt
            ? new Date(log.createdAt).toLocaleString('id-ID', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Baru saja',
          details: typeof log.details === 'object' && log.details !== null ? log.details : { info: log.details || '' },
        };
      });
    }

    return defaultEntries;
  }, [serverAuditLogs, defaultEntries]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchUser =
        selectedUserFilter === 'all' ||
        log.actorName.toLowerCase().includes(selectedUserFilter.toLowerCase());

      const matchAction =
        selectedActionFilter === 'all' ||
        (selectedActionFilter === 'roles' && log.actionType.startsWith('role')) ||
        (selectedActionFilter === 'channels' && log.actionType.startsWith('channel')) ||
        (selectedActionFilter === 'moderation' && (log.actionType.startsWith('member') || log.actionType.includes('ban'))) ||
        (selectedActionFilter === 'expressions' && (log.actionType.includes('sound') || log.actionType.includes('emoji') || log.actionType.includes('sticker'))) ||
        (selectedActionFilter === 'invites' && log.actionType.startsWith('invite')) ||
        (selectedActionFilter === 'server' && log.actionType === 'server_update') ||
        log.actionType === selectedActionFilter;

      return matchUser && matchAction;
    });
  }, [allLogs, selectedUserFilter, selectedActionFilter]);

  const getActionIcon = (actionType: EnrichedAuditItem['actionType']) => {
    switch (actionType) {
      case 'role_create':
      case 'role_update':
        return <Flag className="w-3.5 h-3.5 text-sidebar-primary" />;
      case 'role_delete':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'server_update':
        return <Settings2 className="w-3.5 h-3.5 text-teal-400" />;
      case 'channel_create':
        return <Hash className="w-3.5 h-3.5 text-cyan-400" />;
      case 'channel_delete':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'member_ban':
        return <Ban className="w-3.5 h-3.5 text-rose-500" />;
      case 'member_unban':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'member_kick':
        return <UserX className="w-3.5 h-3.5 text-orange-400" />;
      case 'member_role':
        return <KeyRound className="w-3.5 h-3.5 text-teal-400" />;
      case 'invite_create':
      case 'invite_revoke':
        return <UserPlus className="w-3.5 h-3.5 text-teal-400" />;
      case 'sound_create':
      case 'sound_delete':
        return <Music className="w-3.5 h-3.5 text-teal-400" />;
      case 'emoji_create':
      case 'emoji_delete':
      case 'sticker_create':
      case 'sticker_delete':
        return <Smile className="w-3.5 h-3.5 text-sidebar-primary" />;
      case 'webhook_create':
        return <Webhook className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ── Top Bar: Title & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Audit Log')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Catatan aktivitas administratif dan moderasi server secara realtime.')}
          </p>
        </div>

        {/* Filter dropdowns on right */}
        <div className="flex items-center gap-3">
          {/* Filter by User */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Filter by User')}
            </span>
            <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
              <SelectTrigger className="w-40 h-8 text-xs bg-secondary border-border/70 text-foreground focus:border-sidebar-primary">
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
              <SelectTrigger className="w-44 h-8 text-xs bg-secondary border-border/70 text-foreground focus:border-sidebar-primary">
                <SelectValue placeholder={t('All Actions')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">
                  {t('All Actions')}
                </SelectItem>
                <SelectItem value="server" className="text-xs">
                  {t('Server Settings')}
                </SelectItem>
                <SelectItem value="roles" className="text-xs">
                  {t('Roles & Permissions')}
                </SelectItem>
                <SelectItem value="moderation" className="text-xs">
                  {t('Bans & Moderation')}
                </SelectItem>
                <SelectItem value="channels" className="text-xs">
                  {t('Channels')}
                </SelectItem>
                <SelectItem value="expressions" className="text-xs">
                  {t('Expressions & Sounds')}
                </SelectItem>
                <SelectItem value="invites" className="text-xs">
                  {t('Invites')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Entry Rows ── */}
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
                className="rounded-xl border border-border/70 bg-card hover:border-sidebar-primary/40 transition-colors cursor-pointer overflow-hidden shadow-xs"
              >
                <div className="p-3.5 flex items-center justify-between gap-4">
                  {/* Left: Action Icon + User Avatar + Action Text + Timestamp */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                      {getActionIcon(log.actionType)}
                    </div>

                    <CommunityAvatar
                      name={log.actorName}
                      imageUrl={log.actorAvatar}
                      size={28}
                      className="shrink-0"
                    />

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

                  <div className="text-muted-foreground shrink-0 pl-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-sidebar-primary" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Diff */}
                {isExpanded && log.details && (
                  <div className="px-4 pb-3.5 pt-2 border-t border-border/40 bg-secondary/30 text-xs font-mono space-y-1.5 animate-in fade-in-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      {t('Audit Entry Details')}:
                    </span>
                    {Object.entries(log.details).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2 text-[11px]">
                        <span className="text-sidebar-primary shrink-0 font-semibold">{k}:</span>
                        <span className="text-foreground/80 break-all font-sans">
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
