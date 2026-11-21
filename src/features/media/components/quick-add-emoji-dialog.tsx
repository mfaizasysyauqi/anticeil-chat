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
import { useTranslation } from '@/core/i18n';
import type { Colony } from '@/chat/chat-types';

export interface QuickAddEmojiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeColony: Colony | null;
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
  activeColony,
  quickEmojiName,
  setQuickEmojiName,
  quickEmojiCode,
  setQuickEmojiCode,
  quickEmojiUrl,
  setQuickEmojiUrl,
  isSubmittingServerMedia,
  onQuickAddEmoji,
}: QuickAddEmojiDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            ✨ {t('Tambah Emoji Kustom ke Server')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t(
              'Emoji ini akan disimpan ke database server {{name}} dan dapat digunakan oleh anggota server.',
              { name: activeColony?.name || '' }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">{t('Nama Emoji')}</label>
            <input
              type="text"
              value={quickEmojiName}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setQuickEmojiName(clean);
                setQuickEmojiCode(`:${clean}:`);
              }}
              placeholder={t('contoh: api_anticeil')}
              className="w-full bg-muted/50 border border-border focus:border-ring rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">{t('Kode Emoji')}</label>
            <input
              type="text"
              value={quickEmojiCode}
              onChange={(e) => setQuickEmojiCode(e.target.value)}
              placeholder={t(':api_anticeil:')}
              className="w-full bg-muted/50 border border-border focus:border-ring rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">{t('URL Gambar Emoji (atau Karakter Unicode)')}</label>
            <input
              type="text"
              value={quickEmojiUrl}
              onChange={(e) => setQuickEmojiUrl(e.target.value)}
              placeholder={t('https://images.unsplash.com/... atau karakter 🚀')}
              className="w-full bg-muted/50 border border-border focus:border-ring rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Quick Pick Samples */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block">{t('Pilih Cepat Simbol:')}</label>
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
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-accent border border-border/60 flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('Batal')}
          </Button>
          <Button
            type="button"
            disabled={!quickEmojiName.trim() || !quickEmojiUrl.trim() || isSubmittingServerMedia}
            onClick={onQuickAddEmoji}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-bold"
          >
            {isSubmittingServerMedia ? t('Menyimpan...') : t('Simpan Emoji ke DB')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
