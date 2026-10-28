import React from 'react';
import { RefreshCw, MessageSquare, Hash, Users, Bot, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { communityApi } from '@/chat/chat-api';
import type { CommunityHub, CommunityHubStats, CommunityChannel, CommunityMember } from '@/chat/chat-types';

interface AnalyticsTabProps {
  activeHub: CommunityHub;
  serverStats: CommunityHubStats | null;
  setServerStats: React.Dispatch<React.SetStateAction<CommunityHubStats | null>>;
  channels: CommunityChannel[];
  members: CommunityMember[];
  t: (key: string) => string;
}

export function AnalyticsTab({
  activeHub,
  serverStats,
  setServerStats,
  channels,
  members,
  t,
}: AnalyticsTabProps) {
  return (
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
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {t('Status Komunitas: Sangat Sehat & Aktif 🚀')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Interaksi real-time berjalan normal dengan webhook automasi aktif.')}
          </p>
        </div>
      </div>

      {/* Channel Activity */}
      <div className="rounded-lg border bg-card/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t('Peringkat Aktivitas Saluran')}
        </p>
        {serverStats?.channelActivity && serverStats.channelActivity.length > 0 ? (
          <div className="space-y-2.5">
            {serverStats.channelActivity.map((ch, idx) => (
              <div key={ch.channelId || idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    {ch.channelName}
                  </span>
                  <span className="text-muted-foreground">
                    {ch.messageCount} {t('pesan')}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, (ch.messageCount / (serverStats.totalMessages || 1)) * 100),
                      )}%`,
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
  );
}
