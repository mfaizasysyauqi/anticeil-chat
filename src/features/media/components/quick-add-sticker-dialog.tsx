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
import type { Colony } from '@/chat/chat-types';

export interface QuickAddStickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeColony: Colony | null;
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
  activeColony,
  quickStickerName,
  setQuickStickerName,
  quickStickerUrl,
  setQuickStickerUrl,
  isSubmittingServerMedia,
  onQuickAddSticker,
}: QuickAddStickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            🏷️ Tambah Stiker Kustom ke Server
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Stiker ini akan disimpan ke database PostgreSQL server {activeColony?.name || ''} dan dapat dikirim langsung ke obrolan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">Nama Stiker</label>
            <input
              type="text"
              value={quickStickerName}
              onChange={(e) => setQuickStickerName(e.target.value)}
              placeholder="contoh: Happy Bear Wave"
              className="w-full bg-muted/50 border border-border focus:border-ring rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">URL Gambar Stiker (PNG/WebP/GIF)</label>
            <input
              type="text"
              value={quickStickerUrl}
              onChange={(e) => setQuickStickerUrl(e.target.value)}
              placeholder="https://... (URL gambar stiker transparan)"
              className="w-full bg-muted/50 border border-border focus:border-ring rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {quickStickerUrl.trim() && (
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-[11px] text-muted-foreground mb-2">Preview Stiker:</span>
              <img
                src={quickStickerUrl}
                alt="Preview"
                className="w-20 h-20 object-contain filter drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
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
