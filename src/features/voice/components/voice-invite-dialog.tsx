import React from 'react';
import { Volume2, X, Sparkles, Copy, Check, MessageSquare, Send } from 'lucide-react';
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
      <DialogContent className="max-w-md p-0 overflow-hidden bg-popover border border-border text-popover-foreground shadow-2xl rounded-2xl">
        <div className="p-5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <Volume2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground tracking-wide">
                Undang Teman ke Panggilan
              </h3>
              <span className="text-xs text-muted-foreground">
                {activeHub?.name || 'Server'} • #{channel.name}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
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
                  className="w-full bg-muted/70 border border-border rounded-xl px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-tight focus:outline-none focus:border-primary select-all truncate"
                />
              </div>
              <Button
                onClick={onCopyCallLink}
                className={cn(
                  'h-10 px-4 text-xs font-bold transition-all shrink-0 gap-1.5 shadow-md cursor-pointer',
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
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Atau Bagikan Cepat Melalui
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `Halo! Ayo bergabung ke voice/video call saya di Anticeil: ${callInviteUrl}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold transition-all cursor-pointer shadow-xs"
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
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] text-xs font-semibold transition-all cursor-pointer shadow-xs"
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
