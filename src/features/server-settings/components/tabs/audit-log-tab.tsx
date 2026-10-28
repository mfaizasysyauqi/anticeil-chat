import React, { useState } from 'react';
import { RefreshCw, Users, KeyRound, Zap, Ban, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { communityApi } from '@/chat/chat-api';
import type { CommunityHub, CommunityAuditEntry } from '@/chat/chat-types';

interface AuditLogTabProps {
  activeHub: CommunityHub;
  serverAuditLogs: CommunityAuditEntry[];
  setServerAuditLogs: React.Dispatch<React.SetStateAction<CommunityAuditEntry[]>>;
  t: (key: string) => string;
}

export function AuditLogTab({
  activeHub,
  serverAuditLogs,
  setServerAuditLogs,
  t,
}: AuditLogTabProps) {
  const [auditLogFilter, setAuditLogFilter] = useState<string>('ALL');

  const filteredLogs = serverAuditLogs.filter((log) => {
    if (auditLogFilter === 'ALL') return true;
    if (auditLogFilter === 'HUB') return log.action.includes('HUB') || log.action.includes('BOOST');
    if (auditLogFilter === 'MEMBER') return log.action.includes('MEMBER');
    if (auditLogFilter === 'ROLE') return log.action.includes('ROLE');
    if (auditLogFilter === 'INVITE') return log.action.includes('INVITE');
    return true;
  });

  return (
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
      <p className="text-sm text-muted-foreground mb-4">
        {t('Riwayat tindakan administratif dan perubahan di server ini.')}
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['ALL', 'HUB', 'MEMBER', 'ROLE', 'INVITE'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setAuditLogFilter(f)}
            className={cn(
              'px-2.5 py-1 rounded text-xs transition-colors',
              auditLogFilter === f
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted',
            )}
          >
            {f === 'ALL'
              ? t('Semua')
              : f === 'HUB'
                ? t('Server')
                : f === 'MEMBER'
                  ? t('Anggota')
                  : f === 'ROLE'
                    ? t('Peran')
                    : t('Undangan')}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filteredLogs.map((log) => (
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
                  {log.action === 'HUB_CREATED'
                    ? t('membuat server')
                    : log.action === 'HUB_UPDATED'
                      ? t('memperbarui profil server')
                      : log.action === 'SERVER_BOOST'
                        ? t('melakukan server boost')
                        : log.action === 'MEMBER_ROLE_CHANGE'
                          ? t('mengubah peran anggota')
                          : log.action === 'MEMBER_KICK'
                            ? t('mengeluarkan anggota')
                            : log.action === 'MEMBER_BAN'
                              ? t('memblokir anggota')
                              : log.action === 'MEMBER_UNBAN'
                                ? t('membatalkan blokir')
                                : log.action === 'ROLE_CREATED'
                                  ? t('membuat peran baru')
                                  : log.action === 'ROLE_DELETED'
                                    ? t('menghapus peran')
                                    : log.action === 'INVITE_CREATE'
                                      ? t('membuat link undangan')
                                      : log.action === 'INVITE_REVOKE'
                                        ? t('membatalkan link undangan')
                                        : log.action}
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
  );
}
