import React from 'react';
import { Volume2, Sparkles, Copy, Check, MessageSquare, Send } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CommunityChannel, CommunityHub } from '@/chat/chat-types';

export interface VoiceInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: CommunityChannel;
  activeHub?: CommunityHub | null;
  callInviteUrl: string;
  copiedVoiceCallLink: boolean;
  onCopyCallLink: () => void;
}

export function VoiceInviteDialog({
  open,
  onOpenChange,
  channel,
  activeHub,
  callInviteUrl,
  copiedVoiceCallLink,
  onCopyCallLink,
}: VoiceInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden bg-popover border border-border/80 text-popover-foreground shadow-2xl rounded-[16px]">
        {/* Header (pr-12 ensures title never collides with the top-right close button) */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex items-center pr-12">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                Undang Teman ke Panggilan
              </h3>
              <span className="text-[11px] text-muted-foreground truncate">
                {activeHub?.name || 'Server'} • #{channel.name}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          <div className="p-2.5 px-3 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Bagikan link ini ke teman Anda. Saat membuka link, mereka akan{' '}
              <strong className="text-foreground">otomatis bergabung ke server</strong> dan{' '}
              <strong className="text-emerald-500 font-semibold">langsung masuk ke panggilan</strong> di channel ini.
            </span>
          </div>

          {/* Direct Link Input + Copy Button */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Link Panggilan Langsung
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={callInviteUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-tight focus:outline-none focus:border-primary select-all truncate"
                />
              </div>
              <Button
                onClick={onCopyCallLink}
                className={cn(
                  'h-9 px-3.5 text-xs font-semibold transition-all shrink-0 gap-1.5 shadow-sm rounded-xl cursor-pointer',
                  copiedVoiceCallLink
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                )}
              >
                {copiedVoiceCallLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedVoiceCallLink ? 'Tersalin!' : 'Salin Link'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Atau Bagikan Cepat Melalui
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `Halo! Ayo bergabung ke voice/video call saya di Anticeil: ${callInviteUrl}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(callInviteUrl)}&text=${encodeURIComponent('Ayo gabung ke panggilan suara & video Anticeil!')}`,
                    '_blank',
                  );
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
