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
import { CommunityChannel, CommunityHub } from '@/chat/chat-types';
import { DiscordAppDefinition } from '../data/discord-activities';
import { toast } from 'sonner';

export interface VoiceInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: CommunityChannel;
  activeHub?: CommunityHub | null;
  callInviteUrl: string;
  copiedVoiceCallLink?: boolean;
  onCopyCallLink?: () => void;
  currentActiveApp?: DiscordAppDefinition | null;
}

export function VoiceInviteDialog({
  open,
  onOpenChange,
  channel,
  activeHub,
  callInviteUrl,
  copiedVoiceCallLink: externalCopied,
  onCopyCallLink,
  currentActiveApp,
}: VoiceInviteDialogProps) {
  const [localCopied, setLocalCopied] = useState(false);
  const copied = externalCopied ?? localCopied;

  const handleCopy = () => {
    if (onCopyCallLink) {
      onCopyCallLink();
    } else if (callInviteUrl) {
      navigator.clipboard.writeText(callInviteUrl);
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
    const msg = `Halo! Ayo bergabung ke panggilan suara/video saya${activityText} di Anticeil: ${callInviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const activityText = currentActiveApp ? ` & main ${currentActiveApp.title}` : '';
    const msg = `Ayo gabung ke panggilan suara & video Anticeil${activityText}! ${callInviteUrl}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(callInviteUrl)}&text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 bg-background text-foreground border-border shadow-2xl rounded-2xl">
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
                <span>{activeHub?.name || 'Server'} • #{channel.name}</span>
                {currentActiveApp && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 shrink-0">
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
                <strong className="text-emerald-500 font-semibold">{currentActiveApp.title}</strong> bersama.
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
                value={callInviteUrl}
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
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>
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
