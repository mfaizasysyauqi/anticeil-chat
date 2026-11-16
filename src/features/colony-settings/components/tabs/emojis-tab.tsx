import React, { useState, useRef } from 'react';
import { Upload, Trash2, Smile, Sparkles, Plus, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, CommunityCustomEmoji } from '@/chat/chat-types';

interface EmojisTabProps {
  activeColony: Colony;
  serverEmojis: CommunityCustomEmoji[];
  setServerEmojis: React.Dispatch<React.SetStateAction<CommunityCustomEmoji[]>>;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

export function EmojisTab({
  activeColony,
  serverEmojis,
  setServerEmojis,
  onUpdateColony,
  t,
}: EmojisTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 50 - serverEmojis.length;
    if (remainingSlots <= 0) {
      toast.error(t('Batas maksimal 50 emoji telah tercapai.'));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newEmojis: CommunityCustomEmoji[] = [];

    filesToProcess.forEach((file, index) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(
          t(`File ${file.name} melebihi batas 256 KB / 2 MB. Dilewati.`),
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = e.target?.result as string;
        if (url) {
          const rawName = file.name.split('.')[0] || 'custom_emoji';
          const cleanName = rawName
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 32);

          const emItem: CommunityCustomEmoji = {
            id: `emoji_${Date.now()}_${index}`,
            name: cleanName || 'emoji',
            url: url,
            char: '',
          };

          newEmojis.push(emItem);

          if (
            newEmojis.length === filesToProcess.length ||
            index === filesToProcess.length - 1
          ) {
            const next = [...serverEmojis, ...newEmojis];
            setServerEmojis(next);
            await onUpdateColony(activeColony.id, { emojis: next });
            toast.success(
              t(`${newEmojis.length} emoji berhasil diunggah! ✨`),
            );
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPreset = async (name: string, char: string) => {
    if (serverEmojis.length >= 50) {
      toast.error(t('Batas maksimal 50 emoji telah tercapai.'));
      return;
    }
    const newEm: CommunityCustomEmoji = {
      id: `emoji_${Date.now()}`,
      name,
      char,
    };
    const next = [...serverEmojis, newEm];
    setServerEmojis(next);
    await onUpdateColony(activeColony.id, { emojis: next });
    toast.success(t(`Emoji :${name}: berhasil ditambahkan!`));
  };

  return (
    <div
      className="w-full max-w-2xl space-y-6"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
      }}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Header (Discord 1:1 Parity) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Emoji')}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t(
              'Add up to 50 custom emoji that anyone can use in this server. Animated GIF emoji may be used by members with Discord Nitro.',
            )}
          </p>
        </div>

        <div>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-4 h-9 rounded-lg cursor-pointer"
          >
            {t('Upload Emoji')}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t(
            'If you want to upload multiple emojis or skip the editor, drag and drop the file(s) onto this page. The emojis will be named using the file name.',
          )}
        </p>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* Empty State or Emojis Table */}
      {serverEmojis.length === 0 ? (
        <div
          className={cn(
            'py-16 px-4 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center transition-colors',
            isDragging
              ? 'border-[#5865F2] bg-[#5865F2]/10'
              : 'border-border/60 bg-[#1e1f22]/50',
          )}
        >
          <div className="size-14 rounded-2xl bg-[#2b2d31] flex items-center justify-center text-2xl mb-3 shadow-md">
            ✨
          </div>
          <h3 className="text-sm font-bold text-foreground">{t('No Emoji')}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('Get the party started by uploading an emoji')}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <span className="text-[10px] text-muted-foreground self-center mr-1">
              {t('Atau pilih cepat:')}
            </span>
            {[
              { name: 'fire', char: '🔥' },
              { name: 'rocket', char: '🚀' },
              { name: 'robot', char: '🤖' },
              { name: 'party', char: '🎉' },
              { name: 'pepe_pog', char: '🐸' },
              { name: 'skull', char: '💀' },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleAddPreset(p.name, p.char)}
                className="px-2.5 py-1 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-xs flex items-center gap-1.5 cursor-pointer border border-border/50 transition-colors"
              >
                <span>{p.char}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  :{p.name}:
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>
              {t('EMOJI')} ({serverEmojis.length}/50)
            </span>
            <span className="text-[11px] text-muted-foreground">
              {50 - serverEmojis.length} {t('slots remaining')}
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-[#1e1f22] overflow-hidden divide-y divide-border/60">
            {serverEmojis.map((em) => (
              <div
                key={em.id}
                className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-9 rounded-lg bg-[#2b2d31] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {em.url ? (
                      <img
                        src={em.url}
                        alt={em.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">{em.char || '✨'}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-foreground">
                      :{em.name}:
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {t('Uploaded by')} {activeColony.name || 'Member'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = serverEmojis.filter((e) => e.id !== em.id);
                      setServerEmojis(next);
                      await onUpdateColony(activeColony.id, { emojis: next });
                      toast.success(t(`Emoji :${em.name}: berhasil dihapus.`));
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title={t('Hapus Emoji')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
