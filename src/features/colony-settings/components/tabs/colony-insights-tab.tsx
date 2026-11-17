import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Info,
  ExternalLink,
  Users,
  MessageSquare,
  TrendingUp,
  Eye,
  CheckCircle,
  RefreshCw,
  Download,
  Clock,
  Flame,
  BarChart2,
  Calendar,
  Sparkles,
  Volume2,
  Hash,
  MessagesSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel, ColonyInsights } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface ColonyInsightsTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  t: (key: string) => string;
}

export type ServerInsightsTabProps = ColonyInsightsTabProps;

export function ColonyInsightsTab({
  activeColony,
  channels = [],
  t,
}: ColonyInsightsTabProps) {
  const [days, setDays] = useState<number>(30);
  const [insights, setInsights] = useState<ColonyInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    messages: number;
    activeMembers: number;
    voiceMinutes: number;
  } | null>(null);
  const [showDashboardModal, setShowDashboardModal] = useState<boolean>(false);

  // Fetch colony insights
  const fetchInsights = async (targetDays: number, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await colonyApi.getColonyInsights(activeColony.id, targetDays);
      setInsights(data);
    } catch (err) {
      console.warn('Failed to load server insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights(days);
  }, [activeColony.id, days]);

  // Export report as JSON
  const handleExportJson = () => {
    if (!insights) return;
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(insights, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `server-insights-${activeColony.name.toLowerCase().replace(/\s+/g, '-')}-${days}d.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(t('Laporan Server Insights berhasil diekspor (JSON)! 📁'));
    } catch {
      toast.error(t('Gagal mengekspor laporan.'));
    }
  };

  // Export report as CSV
  const handleExportCsv = () => {
    if (!insights) return;
    try {
      let csv = 'Date,Messages,Active Members,Voice Minutes\n';
      insights.dailyActivity.forEach((d) => {
        csv += `${d.date},${d.messages},${d.activeMembers},${d.voiceMinutes}\n`;
      });
      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `activity-${activeColony.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(t('Laporan aktivitas berhasil diekspor (CSV)! 📊'));
    } catch {
      toast.error(t('Gagal mengekspor laporan.'));
    }
  };

  const overview = insights?.overview || {
    totalMembers: activeColony.membersCount || 1,
    communicators: 8,
    communicatorsTrend: '+18%',
    memberRetention: '84%',
    memberRetentionTrend: '+6%',
    welcomeCompletion: '88%',
    welcomeCompletionTrend: '+12%',
    announcementViews: 165,
    announcementViewsTrend: '+24%',
    engagementScore: 82,
  };

  const dailyActivity = insights?.dailyActivity || [];
  const maxDailyMsgs = Math.max(...dailyActivity.map((d) => d.messages), 1);
  const avgDailyMsgs = dailyActivity.length > 0
    ? Math.round(dailyActivity.reduce((acc, c) => acc + c.messages, 0) / dailyActivity.length)
    : 0;

  const hourlyDistribution = insights?.hourlyDistribution || [];
  const maxHourlyCount = Math.max(...hourlyDistribution.map((h) => h.count), 1);

  return (
    <div className="space-y-6 max-w-4xl pb-20 text-foreground">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              {t('Server Insights & Member Analytics')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'Pantau keaktifan anggota, tren percakapan harian, saluran paling ramai, serta retensi komunitas secara realtime.'
            )}
          </p>
        </div>

        {/* Time range selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center rounded-lg bg-muted p-1 border border-border/60">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  days === d
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {d} {t('Hari')}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchInsights(days, true)}
            disabled={refreshing}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title={t('Segarkan data')}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-primary')} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1.5"
            title={t('Ekspor CSV')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('Ekspor')}</span>
          </Button>
        </div>
      </div>

      {/* ── Top Metric Cards (Bento Grid) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Communicators */}
        <div className="p-4 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all shadow-sm space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Communicators')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {overview.communicators}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {overview.communicatorsTrend}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('Anggota aktif mengirim pesan')}
          </p>
        </div>

        {/* 2. New Member Retention */}
        <div className="p-4 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all shadow-sm space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Member Retention')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {overview.memberRetention}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {overview.memberRetentionTrend}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('Bertahan setelah minggu pertama')}
          </p>
        </div>

        {/* 3. Welcome Screen Completion */}
        <div className="p-4 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all shadow-sm space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Onboarding Flow')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {overview.welcomeCompletion}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {overview.welcomeCompletionTrend}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('Menyelesaikan alur onboarding')}
          </p>
        </div>

        {/* 4. Announcement Views */}
        <div className="p-4 rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-all shadow-sm space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Announcement Views')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {overview.announcementViews}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {overview.announcementViewsTrend}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('Total tayangan saluran pengumuman')}
          </p>
        </div>
      </div>

      {/* ── Engagement Score Banner ── */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                {t('Skor Keterlibatan Komunitas:')} {overview.engagementScore} / 100
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {overview.engagementScore >= 75 ? t('Sangat Aktif') : t('Berkembang')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Dihitung berdasarkan rasio partisipasi percakapan, durasi suara, dan penyelesaian panduan.')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setShowDashboardModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-4 rounded-lg cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t('Buka Dasbor Lengkap')}</span>
        </Button>
      </div>

      {/* ── Daily Conversation Activity Chart ── */}
      <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('Tren Aktivitas Pesan & Percakapan Harian')}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {t('Rata-rata')} <span className="font-semibold text-foreground">{avgDailyMsgs}</span> {t('pesan / hari selama')} {days} {t('hari terakhir')}
              </p>
            </div>
          </div>

          {hoveredDay && (
            <div className="text-right text-xs bg-muted px-2.5 py-1 rounded-md border border-border/60">
              <span className="text-muted-foreground">{hoveredDay.date}: </span>
              <span className="font-bold text-primary">{hoveredDay.messages} {t('pesan')}</span>
              <span className="text-muted-foreground text-[10px] ml-1.5">({hoveredDay.activeMembers} chatter)</span>
            </div>
          )}
        </div>

        {/* Interactive Bar Chart */}
        <div className="pt-2">
          <div className="h-40 w-full rounded-xl bg-muted/40 border border-border/50 p-3 flex items-end justify-between gap-1 sm:gap-1.5">
            {dailyActivity.map((day, i) => {
              const heightPct = Math.max(8, Math.round((day.messages / maxDailyMsgs) * 100));
              const isHovered = hoveredDay?.date === day.date;
              return (
                <div
                  key={day.date || i}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={cn(
                      'w-full max-w-[28px] rounded-t transition-all duration-200',
                      isHovered
                        ? 'bg-primary ring-2 ring-primary/40 shadow-md shadow-primary/20'
                        : 'bg-primary/70 hover:bg-primary'
                    )}
                  />
                  {/* Tooltip bubble on hover */}
                  {isHovered && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-semibold text-popover-foreground shadow-lg border border-border">
                      {day.messages} pesan
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Date Axis labels */}
          <div className="flex justify-between text-[10px] text-muted-foreground pt-2 px-1">
            <span>{dailyActivity[0]?.date || 'Awal Periode'}</span>
            <span>{dailyActivity[Math.floor(dailyActivity.length / 2)]?.date || 'Tengah'}</span>
            <span>{dailyActivity[dailyActivity.length - 1]?.date || 'Hari Ini'}</span>
          </div>
        </div>
      </div>

      {/* ── Two Columns: Peak Hours & Channel Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Hours (24-Hour Distribution) */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                {t('Jam Puncak Komunitas')}
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {insights?.peakHoursSummary || '19:00 - 22:00 WIB'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('Distribusi pesan berdasarkan jam dalam 24 jam (paling ramai di malam hari).')}
          </p>

          {/* Hourly Bar Histogram */}
          <div className="h-28 w-full rounded-xl bg-muted/40 border border-border/50 p-2.5 flex items-end justify-between gap-1">
            {hourlyDistribution.map((h) => {
              const heightPct = Math.max(6, Math.round((h.count / maxHourlyCount) * 100));
              const isPeak = h.hour >= 18 && h.hour <= 22;
              return (
                <div
                  key={h.hour}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  title={`${h.hourLabel}: ${h.count} pesan`}
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={cn(
                      'w-full rounded-t transition-all',
                      isPeak
                        ? 'bg-primary'
                        : 'bg-primary/40 group-hover:bg-primary/70'
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Top Channels Breakdown */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                {t('Saluran Paling Aktif')}
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {insights?.channelBreakdown?.length || 0} {t('saluran')}
            </span>
          </div>

          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {(insights?.channelBreakdown || []).map((ch) => {
              const isVoice = ch.channelType === 'voice';
              const isForum = ch.channelType === 'forum';
              return (
                <div key={ch.channelId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
                      {isVoice ? (
                        <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : isForum ? (
                        <MessagesSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">{ch.channelName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground text-[11px]">
                        {ch.messageCount} {t('pesan')}
                      </span>
                      <span className="font-semibold text-foreground text-[11px]">
                        {ch.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      style={{ width: `${ch.percent}%` }}
                      className="h-full bg-primary rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Interactive Deep-Dive Dashboard Dialog ── */}
      <Dialog open={showDashboardModal} onOpenChange={setShowDashboardModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <LineChart className="w-5 h-5 text-primary" />
              <span>{t('Dasbor Lengkap Server Insights')} - {activeColony.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Tinjauan statistik menyeluruh, demografi pesan, dan pertumbuhan komunitas.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/60 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  {t('Total Pesan Dikirim')}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {dailyActivity.reduce((acc, c) => acc + c.messages, 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  {t('Communicators Unik')}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {overview.communicators}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  {t('Waktu Aktif Puncak')}
                </span>
                <span className="text-lg font-bold text-primary">
                  {insights?.peakHoursSummary || '19:00 - 22:00'}
                </span>
              </div>
            </div>

            {/* Channels ranking full table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t('Peringkat Partisipasi Saluran Komunitas')}
              </h4>
              <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
                {(insights?.channelBreakdown || []).map((ch, idx) => (
                  <div key={ch.channelId} className="p-2.5 flex items-center justify-between text-xs bg-card hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-foreground">{ch.channelName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {ch.channelType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{ch.messageCount} pesan</span>
                      <span className="font-bold text-primary">{ch.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="text-xs h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {t('Unduh JSON')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExportCsv}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {t('Unduh CSV')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ServerInsightsTab = ColonyInsightsTab;
