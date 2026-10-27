import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CommunityHub } from '@/chat/messages-types';

export interface QuickAddEmojiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeHub: CommunityHub | null;
  quickEmojiName: string;
  setQuickEmojiName: (name: string) => void;
  quickEmojiCode: string;
  setQuickEmojiCode: (code: string) => void;
  quickEmojiUrl: string;
  setQuickEmojiUrl: (url: string) => void;
  isSubmittingServerMedia: boolean;
  onQuickAddEmoji: () => void;
}

export function QuickAddEmojiDialog({
  open,
  onOpenChange,
  activeHub,
  quickEmojiName,
  setQuickEmojiName,
  quickEmojiCode,
  setQuickEmojiCode,
  quickEmojiUrl,
  setQuickEmojiUrl,
  isSubmittingServerMedia,
  onQuickAddEmoji,
}: QuickAddEmojiDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[#313338] border-white/10 text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            ✨ Tambah Emoji Kustom ke Server
          </DialogTitle>
          <DialogDescription className="text-xs text-[#949ba4]">
            Emoji ini akan disimpan ke database PostgreSQL server {activeHub?.name || ''} dan dapat digunakan oleh anggota server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <label className="text-xs font-semibold text-[#dbdee1] mb-1.5 block">Nama Emoji</label>
            <input
              type="text"
              value={quickEmojiName}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setQuickEmojiName(clean);
                setQuickEmojiCode(`:${clean}:`);
              }}
              placeholder="contoh: api_anticeil"
              className="w-full bg-[#1e1f22] border border-transparent focus:border-primary rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#dbdee1] mb-1.5 block">Kode Emoji</label>
            <input
              type="text"
              value={quickEmojiCode}
              onChange={(e) => setQuickEmojiCode(e.target.value)}
              placeholder=":api_anticeil:"
              className="w-full bg-[#1e1f22] border border-transparent focus:border-primary rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#dbdee1] mb-1.5 block">URL Gambar Emoji (atau Karakter Unicode)</label>
            <input
              type="text"
              value={quickEmojiUrl}
              onChange={(e) => setQuickEmojiUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... atau karakter 🚀"
              className="w-full bg-[#1e1f22] border border-transparent focus:border-primary rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Pick Samples */}
          <div>
            <label className="text-[11px] font-semibold text-[#949ba4] mb-1.5 block">Pilih Cepat Simbol:</label>
            <div className="flex gap-2">
              {['🚀', '⚡', '🤖', '🔥', '🎉', '💡', '🏆', '💎'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setQuickEmojiUrl(sym);
                    if (!quickEmojiName) {
                      setQuickEmojiName('custom_' + Date.now().toString().slice(-4));
                      setQuickEmojiCode(`:custom_${Date.now().toString().slice(-4)}:`);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] border border-white/5 flex items-center justify-center text-sm cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-[#dbdee1] hover:bg-white/10"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={!quickEmojiName.trim() || !quickEmojiUrl.trim() || isSubmittingServerMedia}
            onClick={onQuickAddEmoji}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-bold"
          >
            {isSubmittingServerMedia ? 'Menyimpan...' : 'Simpan Emoji ke DB'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
