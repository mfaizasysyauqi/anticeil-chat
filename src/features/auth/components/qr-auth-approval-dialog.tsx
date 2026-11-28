import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { Laptop, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { getSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';

export function QrAuthApprovalDialog() {
  const { t } = useTranslation();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check if URL has qr_ticket param
    const checkParams = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const ticket = params.get('qr_ticket');
        if (ticket) {
          setTicketId(ticket);
          // Check if current user is logged in
          const storedUser = localStorage.getItem('anticeil_current_user');
          if (storedUser) {
            try {
              setCurrentUser(JSON.parse(storedUser));
            } catch {}
          }
          setIsOpen(true);
        }
      } catch {}
    };

    checkParams();
  }, []);

  const clearQueryParam = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('qr_ticket');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    } catch {}
  };

  const handleDeny = () => {
    setIsOpen(false);
    clearQueryParam();
    toast.info(t('Permintaan login desktop dibatalkan.'));
  };

  const handleApprove = () => {
    if (!ticketId) return;

    setIsApproving(true);
    const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || `qr_auth_${Date.now()}`;
    const user = currentUser || {
      id: 'usr_' + Date.now(),
      name: 'Pengguna Anticeil',
      email: 'user@anticeil.com',
    };

    // 1. BroadcastChannel
    try {
      const channel = new BroadcastChannel('anticeil_qr_auth');
      channel.postMessage({ ticketId, token, user });
      channel.close();
    } catch {}

    // 2. localStorage event
    try {
      localStorage.setItem(`anticeil_qr_auth_${ticketId}`, JSON.stringify({ token, user }));
    } catch {}

    // 3. Socket.IO event if available
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('qr:authorize', { ticketId, token, user });
        socket.emit(`qr:authorized:${ticketId}`, { ticketId, token, user });
      }
    } catch {}

    setTimeout(() => {
      setIsApproving(false);
      setIsOpen(false);
      clearQueryParam();
      toast.success(t('Login desktop berhasil diotorisasi! 🎉'));
    }, 600);
  };

  if (!isOpen || !ticketId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDeny()}>
      <DialogContent size="sm" className="bg-card border-border shadow-2xl p-6 text-center rounded-2xl select-none">
        <DialogHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-1 text-primary shadow-xs">
            <Laptop className="size-6" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            {t('Otorisasi Login Desktop')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {t('Perangkat desktop meminta izin untuk masuk ke akun Anticeil Anda.')}
          </DialogDescription>
        </DialogHeader>

        {/* User Badge Info */}
        {currentUser && (
          <div className="my-3 p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center gap-3 text-left">
            <div className="size-9 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser.avatar || currentUser.imageUrl ? (
                <img
                  src={currentUser.avatar || currentUser.imageUrl}
                  alt={currentUser.name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {(currentUser.name || currentUser.email || 'A').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">
                {currentUser.name || currentUser.username || 'Pengguna'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {currentUser.email || 'Akun Anticeil'}
              </div>
            </div>
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isApproving}
            onClick={handleDeny}
            className="h-9 text-xs font-semibold border-border hover:bg-muted cursor-pointer"
          >
            {t('Tolak')}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isApproving}
            onClick={handleApprove}
            className="h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
          >
            {isApproving ? t('Mengotorisasi...') : t('Izinkan Masuk')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
