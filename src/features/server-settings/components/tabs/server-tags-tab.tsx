import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CommunityHub } from '@/chat/chat-types';

interface ServerTagsTabProps {
  activeHub: CommunityHub;
  serverTags: string[];
  setServerTags: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  t: (key: string) => string;
}

export function ServerTagsTab({
  activeHub,
  serverTags,
  setServerTags,
  onUpdateHub,
  t,
}: ServerTagsTabProps) {
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !serverTags.includes(clean)) {
      setServerTags((prev) => [...prev, clean]);
      setNewTagInput('');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Tag Server')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Tambahkan tag untuk memudahkan anggota menemukan topik dan kategori server Anda.')}
      </p>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card/40 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
            {t('Tag Server Saat Ini')} ({serverTags.length})
          </label>
          <div className="flex flex-wrap gap-2 min-h-10 items-center">
            {serverTags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t('Belum ada tag yang ditambahkan.')}</p>
            ) : (
              serverTags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1.5 py-1 pl-3 pr-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 shadow-2xs transition-all"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => setServerTags((prev) => prev.filter((tItem) => tItem !== tag))}
                    className="size-4 rounded-full flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary transition-all cursor-pointer"
                    title={t('Hapus Tag')}
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Tambah Tag Baru')}
          </label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="cth: automasi, devops, ai-agent..."
              className="text-sm"
            />
            <Button type="button" onClick={handleAddTag}>
              <Plus className="w-4 h-4 mr-1.5" />
              {t('Tambah')}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
            {t('Rekomendasi Tag Populer')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['automasi', 'workflow', 'devops', 'support', 'ai-agents', 'community', 'integrasi', 'activepieces'].map(
              (tName) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => {
                    if (!serverTags.includes(tName)) {
                      setServerTags((prev) => [...prev, tName]);
                    }
                  }}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-all text-left cursor-pointer',
                    serverTags.includes(tName)
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground',
                  )}
                >
                  #{tName}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={async () => {
              await onUpdateHub(activeHub.id, { tags: serverTags });
              toast.success(t('Tag server berhasil disimpan! 🏷️'));
            }}
          >
            {t('Simpan Tag')}
          </Button>
        </div>
      </div>
    </div>
  );
}
