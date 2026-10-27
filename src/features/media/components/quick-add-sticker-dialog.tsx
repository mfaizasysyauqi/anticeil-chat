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

export interface QuickAddStickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeHub: CommunityHub | null;
  quickStickerName: string;
  setQuickStickerName: (name: string) => void;
  quickStickerUrl: string;
  setQuickStickerUrl: (url: string) => void;
  isSubmittingServerMedia: boolean;
  onQuickAddSticker: () => void;
}

export function QuickAddStickerDialog({
  open,
  onOpenChange,
  activeHub,
  quickStickerName,
  setQuickStickerName,
  quickStickerUrl,
  setQuickStickerUrl,
  isSubmittingServerMedia,
  onQuickAddSticker,
}: QuickAddStickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[#313338] border-white/10 text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            🏷️ Tambah Stiker Kustom ke Server
          </DialogTitle>
          <DialogDescription className="text-xs text-[#949ba4]">
            Stiker ini akan disimpan ke database PostgreSQL server {activeHub?.name || ''} dan dapat dikirim langsung ke obrolan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <label className="text-xs font-semibold text-[#dbdee1] mb-1.5 block">Nama Stiker</label>
            <input
              type="text"
              value={quickStickerName}
              onChange={(e) => setQuickStickerName(e.target.value)}
              placeholder="contoh: Happy Bear Wave"
              className="w-full bg-[#1e1f22] border border-transparent focus:border-primary rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#dbdee1] mb-1.5 block">URL Gambar Stiker (PNG/WebP/GIF)</label>
            <input
              type="text"
              value={quickStickerUrl}
              onChange={(e) => setQuickStickerUrl(e.target.value)}
              placeholder="https://... (URL gambar stiker transparan)"
              className="w-full bg-[#1e1f22] border border-transparent focus:border-primary rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors"
            />
          </div>

          {quickStickerUrl.trim() && (
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1e1f22] border border-white/5">
              <span className="text-[11px] text-[#949ba4] mb-2">Preview Stiker:</span>
              <img
                src={quickStickerUrl}
                alt="Preview"
                className="w-24 h-24 object-contain filter drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
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
            disabled={!quickStickerName.trim() || !quickStickerUrl.trim() || isSubmittingServerMedia}
            onClick={onQuickAddSticker}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-bold"
          >
            {isSubmittingServerMedia ? 'Menyimpan...' : 'Simpan Stiker ke DB'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
