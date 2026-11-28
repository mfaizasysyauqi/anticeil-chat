import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Timer,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/core/i18n';
import { getSocket } from '@/providers/socket-provider';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { toast } from 'sonner';

export interface QrCodeLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSwitchToSso?: () => void;
}

export function QrCodeLogin({ onLoginSuccess, onSwitchToSso }: QrCodeLoginProps) {
  const { t } = useTranslation();
  const [ticketId, setTicketId] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [status, setStatus] = useState<'waiting' | 'scanned' | 'authorizing' | 'success' | 'expired'>('waiting');
  const [isSimulating, setIsSimulating] = useState(false);
  const timerRef = useRef<any>(null);

  // Generate new session ticket
  const generateNewTicket = useCallback(() => {
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'atc_qr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    setTicketId(newId);
    setTimeLeft(120);
    setStatus('waiting');

    // Build auth URL and JSON payload
    const authUrl = `${window.location.origin}/ai?qr_ticket=${newId}`;
    const payload = JSON.stringify({
      app: 'anticeil',
      action: 'qr_login',
      ticket: newId,
      url: authUrl,
      timestamp: Date.now(),
    });

    QRCode.toDataURL(payload, {
      width: 256,
      margin: 1.5,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, []);

  // Initial generation
  useEffect(() => {
    generateNewTicket();
  }, [generateNewTicket]);

  // Countdown timer
  useEffect(() => {
    if (status === 'success') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ticketId, status]);

  // Real-time listener: BroadcastChannel, localStorage, and Socket.IO
  useEffect(() => {
    if (!ticketId || status === 'success') return;

    const handleSuccessfulAuth = (user: any, token: string) => {
      setStatus('success');
      toast.success(
        t('Login berhasil via QR Code! Selamat datang kembali, {{name}} 🎉', {
          name: user.name || user.email || 'Pengguna Anticeil',
        })
      );
      setTimeout(() => {
        onLoginSuccess(user, token);
      }, 600);
    };

    // 1. BroadcastChannel (between tabs or windows on same machine)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('anticeil_qr_auth');
      channel.onmessage = (event) => {
        const data = event.data;
        if (data?.ticketId === ticketId && data?.token) {
          handleSuccessfulAuth(data.user, data.token);
        }
      };
    } catch {}

    // 2. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `anticeil_qr_auth_${ticketId}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data?.token) {
            handleSuccessfulAuth(data.user, data.token);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Socket.IO event
    const socket = getSocket();
    const handleSocketAuth = (data: any) => {
      if ((data?.ticketId === ticketId || data?.ticket === ticketId) && data?.token) {
        handleSuccessfulAuth(data.user, data.token);
      }
    };

    if (socket) {
      socket.on(`qr:authorized:${ticketId}`, handleSocketAuth);
      socket.on('qr:login_authorized', handleSocketAuth);
    }

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      if (socket) {
        socket.off(`qr:authorized:${ticketId}`, handleSocketAuth);
        socket.off('qr:login_authorized', handleSocketAuth);
      }
    };
  }, [ticketId, status, onLoginSuccess, t]);

  // Demo Mobile Scan Simulator
  const handleSimulateMobileScan = () => {
    if (status === 'expired' || isSimulating) return;

    setIsSimulating(true);
    setStatus('scanned');

    setTimeout(() => {
      setStatus('authorizing');

      setTimeout(() => {
        // Pick current user or mock demo user
        const storedUser = localStorage.getItem('anticeil_current_user');
        let authUser: any = null;
        if (storedUser) {
          try {
            authUser = JSON.parse(storedUser);
          } catch {}
        }
        if (!authUser) {
          authUser = {
            id: 'usr_mobile_' + Math.random().toString(36).slice(2, 7),
            name: 'Anticeil Mobile User',
            email: 'user@anticeil.com',
            firstName: 'Mobile',
            lastName: 'Explorer',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=anticeil_mobile',
            imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=anticeil_mobile',
            role: 'MEMBER',
          };
        }

        const token = `qr_jwt_${authUser.id}_${Date.now()}`;

        // Broadcast to trigger handshake
        try {
          const channel = new BroadcastChannel('anticeil_qr_auth');
          channel.postMessage({ ticketId, token, user: authUser });
          channel.close();
        } catch {}

        localStorage.setItem(`anticeil_qr_auth_${ticketId}`, JSON.stringify({ token, user: authUser }));

        setStatus('success');
        setIsSimulating(false);
        toast.success(t('Login berhasil via QR Code!'));
        setTimeout(() => {
          onLoginSuccess(authUser, token);
        }, 500);
      }, 1000);
    }, 900);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="w-full flex flex-col items-center text-center space-y-4">
      {/* Visual QR Code Container */}
      <div className="relative group">
        <div className="relative size-56 sm:size-60 bg-white p-3.5 rounded-2xl border-2 border-primary/40 shadow-xl flex items-center justify-center overflow-hidden">
          {qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt="Anticeil QR Code Login"
                className="size-full object-contain rounded-lg"
              />

              {/* Center Anticeil Logo Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="size-11 rounded-xl bg-black border-2 border-primary/50 shadow-md flex items-center justify-center p-1.5 backdrop-blur-md">
                  <AnticeilLogo className="size-full text-primary" />
                </div>
              </div>

              {/* Laser Scanning Line Animation */}
              {status === 'waiting' && (
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#026fe4] animate-[pulse_1.5s_ease-in-out_infinite] animate-bounce pointer-events-none" />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center size-full">
              <RefreshCw className="size-7 text-muted-foreground animate-spin" />
            </div>
          )}

          {/* Scanned / Authorizing Overlay */}
          {(status === 'scanned' || status === 'authorizing') && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in fade-in duration-200">
              <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-pulse">
                <Smartphone className="size-6" />
              </div>
              <div className="text-xs font-bold text-foreground">
                {status === 'scanned' ? t('Perangkat Terdeteksi!') : t('Mengotorisasi akun...')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Menghubungkan sesi desktop dengan perangkat mobile Anda.')}
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {status === 'success' && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-7" />
              </div>
              <div className="text-xs font-bold text-emerald-400">
                {t('Login Berhasil!')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Mengarahkan ke Anticeil...')}
              </div>
            </div>
          )}

          {/* Expired Overlay */}
          {status === 'expired' && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2.5 animate-in fade-in duration-200">
              <div className="size-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
                <Timer className="size-5" />
              </div>
              <div className="text-xs font-bold text-foreground">
                {t('Kode QR Kedaluwarsa')}
              </div>
              <p className="text-[10px] text-muted-foreground max-w-[180px] leading-tight">
                {t('Kode disegarkan berkala untuk menjaga keamanan akun Anda.')}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={generateNewTicket}
                className="h-7 text-xs font-semibold gap-1.5 border-primary/40 hover:bg-primary/10 cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>{t('Segarkan Kode QR')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Timer & Security Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge
          variant="outline"
          className={`text-[11px] py-0.5 px-2.5 gap-1.5 font-medium border-border/80 ${
            timeLeft < 30 ? 'text-destructive border-destructive/40' : 'text-muted-foreground'
          }`}
        >
          <Timer className="size-3" />
          <span>{status === 'expired' ? t('Kedaluwarsa') : `${t('Kedaluwarsa dalam')} ${timeFormatted}`}</span>
        </Badge>
        {status !== 'expired' && status !== 'success' && (
          <button
            type="button"
            onClick={generateNewTicket}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            title={t('Segarkan Kode QR')}
          >
            <RefreshCw className="size-3" />
            <span>{t('Segarkan')}</span>
          </button>
        )}
      </div>

      {/* 3-Step Scan Instructions */}
      <div className="w-full bg-card/50 border border-border/70 rounded-xl p-3 text-left space-y-2">
        <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Smartphone className="size-3.5 text-primary" />
          <span>{t('Cara Masuk dengan QR Code:')}</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="size-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>{t('Buka kamera ponsel atau aplikasi Anticeil di ponsel Anda')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="size-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>{t('Arahkan kamera ke kode QR ini')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="size-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>{t('Konfirmasi otorisasi untuk masuk secara instan')}</span>
          </div>
        </div>
      </div>

      {/* Simulator Button for Instant Local Testing & Feedback */}
      <div className="w-full pt-1 flex flex-col items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={status === 'expired' || status === 'success' || isSimulating}
          onClick={handleSimulateMobileScan}
          className="w-full h-8 text-[11px] font-semibold border-primary/30 hover:border-primary hover:bg-primary/10 text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="size-3.5 text-amber-400" />
          <span>{isSimulating ? t('Memproses Otorisasi Mobile...') : t('Simulasikan Otorisasi Mobile (Demo)')}</span>
        </Button>

        {onSwitchToSso && (
          <button
            type="button"
            onClick={onSwitchToSso}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-4"
          >
            {t('Atau masuk menggunakan Google / SSO Perusahaan →')}
          </button>
        )}
      </div>
    </div>
  );
}
