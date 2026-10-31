import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Colony, CommunityCustomEmoji } from '@/chat/chat-types';

interface EmojisTabProps {
  activeColony: Colony;
  serverEmojis: CommunityCustomEmoji[];
  setServerEmojis: React.Dispatch<React.SetStateAction<CommunityCustomEmoji[]>>;
  onUpdateHub: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

export function EmojisTab({
  activeColony,
  serverEmojis,
  setServerEmojis,
  onUpdateHub,
  t,
}: EmojisTabProps) {
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiChar, setNewEmojiChar] = useState('');

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Emoji Kustom')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Tambahkan emoji kustom yang dapat digunakan oleh semua anggota di server ini.')}
      </p>

      <div className="space-y-6">
        {/* Grid of emojis */}
        <div className="rounded-lg border bg-card/40 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
            {t('Daftar Emoji Server')} ({serverEmojis.length})
          </label>
          {serverEmojis.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">{t('Belum ada emoji kustom.')}</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {serverEmojis.map((em) => (
                <div
                  key={em.id}
                  className="group relative rounded-lg border bg-background/60 p-2.5 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors"
                >
                  <span className="text-2xl mb-1">{em.char || '✨'}</span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate w-full">:{em.name}:</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = serverEmojis.filter((e) => e.id !== em.id);
                      setServerEmojis(next);
                      await onUpdateHub(activeColony.id, { emojis: next });
                      toast.success(t(`Emoji :${em.name}: dihapus`));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Emoji Card */}
        <div className="rounded-lg border bg-card/40 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Tambah Emoji Baru')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">{t('Nama Emoji')}</label>
              <Input
                value={newEmojiName}
                onChange={(e) => setNewEmojiName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="cth: api_anticeil"
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">{t('Karakter Emoji')}</label>
              <Input
                value={newEmojiChar}
                onChange={(e) => setNewEmojiChar(e.target.value)}
                placeholder="cth: 🚀 atau 🔥"
                className="text-xs"
              />
            </div>
          </div>

          {/* Quick pick emoji */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">{t('Pilih Cepat')}</label>
            <div className="flex gap-2">
              {['🚀', '🔥', '🤖', '⚡', '🎉', '💡', '🏆', '💎', '🎯'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setNewEmojiChar(sym)}
                  className="w-8 h-8 rounded-md border bg-muted/40 hover:bg-muted flex items-center justify-center text-sm"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            disabled={!newEmojiName.trim() || !newEmojiChar.trim()}
            onClick={async () => {
              if (!newEmojiName.trim() || !newEmojiChar.trim()) return;
              const newEm: CommunityCustomEmoji = {
                id: `emoji_${Date.now()}`,
                name: newEmojiName.trim(),
                char: newEmojiChar.trim(),
              };
              const next = [...serverEmojis, newEm];
              setServerEmojis(next);
              setNewEmojiName('');
              setNewEmojiChar('');
              await onUpdateHub(activeColony.id, { emojis: next });
              toast.success(t(`Emoji :${newEm.name}: berhasil ditambahkan! ✨`));
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('Tambah ke Server')}
          </Button>
        </div>
      </div>
    </div>
  );
}
