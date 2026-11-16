import React, { useState } from 'react';
import {
  LineChart,
  Info,
  ExternalLink,
  Users,
  MessageSquare,
  TrendingUp,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel } from '@/chat/chat-types';

interface ServerInsightsTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  t: (key: string) => string;
}

export function ServerInsightsTab({
  activeColony,
  channels = [],
  t,
}: ServerInsightsTabProps) {
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl pb-20 text-foreground">
      {/* ── Header (Screenshot 5 Discord Parity) ── */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-foreground">
          {t('Server Insights')}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            "We've put together a bunch of helpful data to help you better run your community. Learn how active your community is, where new members are coming from, and much more. Use what you learn to make informed decisions to improve your server's engagement!"
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('Analytics about Announcement Channels, Server Discovery, and Welcome Screen also live here.')}
        </p>
      </div>

      {/* ── Blue Info Alert Banner (Screenshot 5) ── */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/90 leading-relaxed">
          {t(
            "Looks like your server isn't quite ready to see full insights. You will only have access to Announcement Channels and Welcome Screen analytics."
          )}
        </p>
      </div>

      {/* ── External Link Callout (Screenshot 5) ── */}
      <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-xs text-muted-foreground max-w-md">
          {t(
            "Server Insights is hosted on a separate website so that it's easier to share links and browse cross platform."
          )}
        </p>

        <Button
          onClick={() => {
            setShowDashboardModal((prev) => !prev);
            toast.success(t('Membuka dasbor Server Insights interaktif... 📊'));
          }}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-9 px-6 rounded-lg cursor-pointer shadow-md"
        >
          {t('Go to Server Insights')}
        </Button>
      </div>

      {/* ── Live Colony Analytics Preview ── */}
      <div className="p-6 rounded-2xl bg-[#1e1f22] border border-border/70 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              {t('Ringkasan Metrik Komunitas (30 Hari Terakhir)')}
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {activeColony.name}
          </span>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#111214] border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {t('Communicators')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {activeColony.membersCount || 12}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">+18%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#111214] border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {t('New Member Retention')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">78%</span>
              <span className="text-[10px] text-emerald-400 font-semibold">+6%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#111214] border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {t('Welcome Completion')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">92%</span>
              <span className="text-[10px] text-emerald-400 font-semibold">↑</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#111214] border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {t('Announcement Views')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">148</span>
              <span className="text-[10px] text-emerald-400 font-semibold">+24%</span>
            </div>
          </div>
        </div>

        {/* Activity SVG Chart */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {t('Tren Aktivitas Percakapan Harian')}
          </span>
          <div className="h-32 w-full rounded-xl bg-[#111214] border border-border/60 p-3 flex items-end justify-between gap-1">
            {[40, 65, 30, 85, 95, 70, 110, 80, 120, 140, 95, 130, 160, 180].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  style={{ height: `${(h / 180) * 100}%` }}
                  className="w-full bg-[#5865F2] hover:bg-primary transition-all rounded-t-sm"
                  title={`Hari ke-${i + 1}: ${h} pesan`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
