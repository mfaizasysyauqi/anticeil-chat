import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Laptop,
  Smartphone,
  Globe,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  securityApi,
  type SessionDevice,
} from '@/features/user-settings/api/security-api';

export interface AccountDevicesViewProps {
  onBack: () => void;
  onSessionCountChange?: (count: number) => void;
}

export function AccountDevicesView({
  onBack,
  onSessionCountChange,
}: AccountDevicesViewProps) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<SessionDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await securityApi.getSessions();
      setSessions(data);
      onSessionCountChange?.(data.length);
    } catch {
      toast.error(t('Gagal memuat daftar perangkat aktif'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSingle = async (session: SessionDevice) => {
    if (session.isCurrent) {
      toast.info(t('Untuk keluar dari perangkat ini, gunakan menu Log Out di pojok kiri bawah.'));
      return;
    }

    if (
      !confirm(
        t('Apakah Anda yakin ingin mengeluarkan sesi dari perangkat "{{name}}"?', {
          name: session.deviceName,
        }),
      )
    ) {
      return;
    }

    setRevokingId(session.id);
    try {
      await securityApi.revokeSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      onSessionCountChange?.(sessions.length - 1);
      toast.success(t('Sesi perangkat berhasil dihentikan.'));
    } catch {
      toast.error(t('Gagal menghentikan sesi perangkat'));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    const otherCount = sessions.filter((s) => !s.isCurrent).length;
    if (otherCount === 0) {
      toast.info(t('Tidak ada perangkat lain yang sedang aktif.'));
      return;
    }

    if (
      !confirm(
        t(
          'Apakah Anda yakin ingin mengeluarkan semua {{count}} perangkat lain yang sedang masuk?',
          { count: otherCount },
        ),
      )
    ) {
      return;
    }

    setIsRevokingAll(true);
    try {
      await securityApi.revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      onSessionCountChange?.(1);
      toast.success(t('Semua perangkat lain telah berhasil dikeluarkan.'));
    } catch {
      toast.error(t('Gagal mengeluarkan perangkat lain'));
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getPlatformIcon = (platform: SessionDevice['platform']) => {
    switch (platform) {
      case 'android':
      case 'ios':
        return <Smartphone className="w-5 h-5 text-primary" />;
      case 'browser':
        return <Globe className="w-5 h-5 text-primary" />;
      default:
        return <Laptop className="w-5 h-5 text-primary" />;
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('Account / Logged-in Devices')}</span>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={loadSessions}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          <span>{t('Segarkan')}</span>
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-foreground">
          {t('Perangkat yang Sedang Masuk')}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
          {t(
            'Berikut adalah daftar seluruh perangkat yang saat ini memiliki akses aktif ke akun Anticeil Anda. Anda dapat memeriksa lokasi, browser, dan mencabut sesi yang tidak dikenali.',
          )}
        </p>
      </div>

      {/* ── 1. Current Active Device Card ─────────────────────────────────── */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Sesi Saat Ini')}
        </div>

        {currentSession ? (
          <div className="p-4 rounded-xl border border-primary/40 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                {getPlatformIcon(currentSession.platform)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">
                    {currentSession.deviceName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t('Perangkat Ini')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-foreground/90">
                    {currentSession.browser}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    {currentSession.location} ({currentSession.ipAddress})
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    {currentSession.lastActive}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t('Aman & Aktif')}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-border bg-card/60 text-xs text-muted-foreground">
            {t('Memuat detail sesi saat ini...')}
          </div>
        )}
      </div>

      {/* ── 2. Other Active Devices List ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Perangkat Lainnya')} ({otherSessions.length})
          </div>

          {otherSessions.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllOthers}
              disabled={isRevokingAll}
              className="h-8 text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('Keluar dari Semua Perangkat Lain')}</span>
            </Button>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-1">
            <div className="text-xs font-bold text-foreground">
              {t('Tidak ada perangkat lain yang sedang masuk')}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t('Akun Anda saat ini hanya aktif di perangkat ini saja.')}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
            {otherSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 shrink-0">
                    {getPlatformIcon(session.platform)}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-foreground">
                      {session.deviceName}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-foreground/80">
                        {session.browser}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        {session.location} ({session.ipAddress})
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        {session.lastActive}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSingle(session)}
                    disabled={revokingId === session.id}
                    className="h-8 text-xs font-semibold hover:border-red-500/50 hover:text-red-400 gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>
                      {revokingId === session.id ? t('Mengeluarkan...') : t('Keluar')}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Info notice */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">
            {t('Melihat perangkat yang tidak dikenal?')}
          </span>{' '}
          {t(
            'Segera klik tombol Keluar pada sesi tersebut dan ubah password akun Anda untuk mencegah akses tidak sah.',
          )}
        </div>
      </div>
    </div>
  );
}
