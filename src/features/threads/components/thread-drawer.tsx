import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { useTranslation } from '@/core/i18n';
import type { CommunityThread, CommunityMessage } from '@/chat/messages-types';

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeThread: CommunityThread | null;
  threadMessages: CommunityMessage[];
  onSendMessage: (content: string) => Promise<void>;
  renderFormattedMessage?: (content: string) => React.ReactNode;
}

export function ThreadDrawer({
  isOpen,
  onClose,
  activeThread,
  threadMessages,
  onSendMessage,
  renderFormattedMessage,
}: ThreadDrawerProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      const content = inputText.trim();
      setInputText('');
      await onSendMessage(content);
    } catch (err) {
      console.error('Failed to send thread message', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[420px] sm:w-[460px] p-0 bg-[#313338] text-white border-l border-black/40 flex flex-col shadow-2xl">
        {/* Thread Drawer Header */}
        <div className="h-14 px-4 border-b border-black/30 flex items-center justify-between bg-[#2b2d31] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M5.5 4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 4h-13zm2 3h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{activeThread?.name}</h3>
              <p className="text-[11px] text-[#949ba4] truncate">
                {t('Thread dimulai oleh')} {activeThread?.creatorName || 'Member'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#949ba4] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thread Drawer Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Thread starter banner */}
          <div className="p-3.5 rounded-xl bg-[#2b2d31]/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {t('Awal dari Thread')}
            </span>
            <h4 className="text-sm font-bold text-white">{activeThread?.name}</h4>
            <p className="text-xs text-[#949ba4]">
              {t('Dibuat oleh')} <span className="text-white font-medium">{activeThread?.creatorName || 'Member'}</span> • {t('Semua pesan di sini terhubung langsung ke database.')}
            </p>
          </div>

          {threadMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#949ba4]">
              {t('Belum ada pesan di thread ini. Kirim pesan pertama Anda di bawah!')}
            </div>
          ) : (
            threadMessages.map((tMsg) => (
              <div key={tMsg.id} className="flex gap-2.5 group">
                <CommunityAvatar
                  name={tMsg.senderName}
                  imageUrl={tMsg.senderAvatar}
                  size={32}
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{tMsg.senderName}</span>
                    <span className="text-[10px] text-[#949ba4]">
                      {dayjs(tMsg.createdAt).format('HH:mm')}
                    </span>
                  </div>
                  <div className="text-xs text-[#dbdee1] mt-0.5 break-words">
                    {renderFormattedMessage ? renderFormattedMessage(tMsg.content) : tMsg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Thread Drawer Message Input */}
        <div className="p-3 bg-card border-t border-border shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={`${t('Kirim pesan ke')} #${activeThread?.name || 'thread'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/70 border border-border text-foreground placeholder:text-muted-foreground text-xs h-9 rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() || isSending}
              className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
