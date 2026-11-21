import React, { useState } from 'react';
import { UserPlus, Copy, Check, MessageSquare, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColonyChannel, Colony } from '@/chat/chat-types';
import { DiscordAppDefinition } from '../data/voice-activities';
import { channelWatchStateCache } from './activities/hooks/use-youtube-player';
import { toast } from 'sonner';

export interface VoiceInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ColonyChannel;
  activeColony?: Colony | null;
  callInviteUrl: string;
  copiedVoiceCallLink?: boolean;
  onCopyCallLink?: () => void;
  currentActiveApp?: DiscordAppDefinition | null;
}

export function VoiceInviteDialog({
  open,
  onOpenChange,
  channel,
  activeColony,
  callInviteUrl,
  copiedVoiceCallLink: externalCopied,
  onCopyCallLink,
  currentActiveApp,
}: VoiceInviteDialogProps) {
  const [localCopied, setLocalCopied] = useState(false);
  const [guestCopied, setGuestCopied] = useState(false);
  const copied = externalCopied ?? localCopied;

  // Enrich invite link with active video ID if Watch Together is running
  const activeVideoId =
    channelWatchStateCache.get(channel?.id || '')?.videoId ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('v') || new URLSearchParams(window.location.search).get('videoId')
      : null);

  const finalCallInviteUrl = React.useMemo(() => {
    if (!callInviteUrl) return '';
    if (
      activeVideoId &&
      (currentActiveApp?.id === 'watch-together' ||
        currentActiveApp?.id === 'youtube' ||
        callInviteUrl.includes('activity=watch-together') ||
        callInviteUrl.includes('activity=youtube')) &&
      !callInviteUrl.includes('&v=')
    ) {
      return `${callInviteUrl}&v=${encodeURIComponent(activeVideoId)}`;
    }
    return callInviteUrl;
  }, [callInviteUrl, activeVideoId, currentActiveApp?.id]);

  const guestInviteUrl = finalCallInviteUrl
    ? `${finalCallInviteUrl}${finalCallInviteUrl.includes('?') ? '&' : '?'}guest=1`
    : '';

  const handleCopyGuestLink = () => {
    if (!guestInviteUrl) return;
    navigator.clipboard.writeText(guestInviteUrl);
    setGuestCopied(true);
    toast.success('Link Tamu (Guest Mode) disalin! Teman Anda bisa langsung join tanpa login.');
    setTimeout(() => setGuestCopied(false), 2000);
  };

  const handleCopy = () => {
    if (onCopyCallLink) {
      onCopyCallLink();
    } else if (finalCallInviteUrl) {
      navigator.clipboard.writeText(finalCallInviteUrl);
      setLocalCopied(true);
      toast.success(
        currentActiveApp
          ? `Link panggilan & aktivitas ${currentActiveApp.title} disalin!`
          : 'Link panggilan berhasil disalin!'
      );
      setTimeout(() => setLocalCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const activityText = currentActiveApp ? ` untuk ${currentActiveApp.title}` : '';
    const msg = `Halo! Ayo bergabung ke panggilan suara/video saya${activityText} di Anticeil: ${finalCallInviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const activityText = currentActiveApp ? ` & main ${currentActiveApp.title}` : '';
    const msg = `Ayo gabung ke panggilan suara & video Anticeil${activityText}! ${finalCallInviteUrl}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(finalCallInviteUrl)}&text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-5 bg-background text-foreground border-border shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold tracking-tight truncate">
                Undang Teman ke Panggilan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <span>{activeColony?.name || 'Colony'} • #{channel.name}</span>
                {currentActiveApp && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20 shrink-0">
                    🎮 {currentActiveApp.title}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-1">
          {/* Compact Helper Note */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentActiveApp ? (
              <>
                Bagikan link ini ke rekan Anda. Saat membuka link, mereka akan{' '}
                <strong className="text-foreground">otomatis bergabung ke server</strong>,{' '}
                <strong className="text-foreground">langsung masuk ke panggilan</strong>, dan langsung membuka aktivitas{' '}
                <strong className="text-primary font-semibold">{currentActiveApp.title}</strong> bersama.
              </>
            ) : (
              <>
                Bagikan link ini ke rekan Anda. Saat membuka link, mereka akan{' '}
                <strong className="text-foreground">otomatis bergabung ke server</strong> dan{' '}
                <strong className="text-foreground">langsung masuk ke panggilan</strong> di channel ini.
              </>
            )}
          </p>

          {/* Reusable Input + Button */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground tracking-wide">
              Link Panggilan Langsung
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={finalCallInviteUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="h-9 text-xs font-mono select-all bg-muted/50 border-input focus-visible:ring-1"
              />
              <Button
                type="button"
                onClick={handleCopy}
                size="sm"
                className={cn(
                  'h-9 px-3.5 text-xs font-semibold transition-all shrink-0 gap-1.5 shadow-sm rounded-lg cursor-pointer',
                  copied
                    ? 'bg-primary/80 text-primary-foreground'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>
          </div>

          {/* Guest Mode Instant Link */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/20">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <span>👤 Link Tamu Cepat (Guest Join)</span>
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Teman Anda dapat langsung join & tonton tanpa perlu login Google.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyGuestLink}
              className={cn(
                'h-7 px-2.5 text-[11px] font-medium shrink-0 rounded-lg cursor-pointer transition-all',
                guestCopied
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'hover:bg-primary hover:text-primary-foreground border-border'
              )}
            >
              {guestCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              <span>{guestCopied ? 'Tersalin' : 'Salin Link Tamu'}</span>
            </Button>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-[11px] font-semibold text-muted-foreground tracking-wide">
              Atau Bagikan Cepat Melalui
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="h-8.5 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent hover:text-accent-foreground"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <span>WhatsApp</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareTelegram}
                className="h-8.5 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent hover:text-accent-foreground"
              >
                <Send className="w-3.5 h-3.5 text-[#0088cc] shrink-0" />
                <span>Telegram</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
