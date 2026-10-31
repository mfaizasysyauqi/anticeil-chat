import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { CommunityHub, CommunityMember } from '@/chat/chat-types';

interface ProfileTabProps {
  activeHub: CommunityHub;
  members: CommunityMember[];
  serverTags: string[];
  serverSettingsEditName: string;
  setServerSettingsEditName: (val: string) => void;
  serverSettingsEditDesc: string;
  setServerSettingsEditDesc: (val: string) => void;
  serverSettingsEditColor: string;
  setServerSettingsEditColor: (val: string) => void;
  serverSettingsEditIconUrl: string;
  setServerSettingsEditIconUrl: (val: string) => void;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
}

export function ProfileTab({
  activeHub,
  members,
  serverTags,
  serverSettingsEditName,
  setServerSettingsEditName,
  serverSettingsEditDesc,
  setServerSettingsEditDesc,
  serverSettingsEditColor,
  setServerSettingsEditColor,
  serverSettingsEditIconUrl,
  setServerSettingsEditIconUrl,
  onUpdateHub,
  onClose,
  t,
}: ProfileTabProps) {
  const serverIconFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Profil Colony')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Atur bagaimana server Anda tampil di link undangan dan daftar server.')}
      </p>

      {/* Hidden File Input for Server Settings Icon Upload */}
      <input
        type="file"
        ref={serverIconFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            toast.error(t('Ukuran file maksimal 5 MB.'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = event.target?.result as string;
            if (res) {
              setServerSettingsEditIconUrl(res);
              toast.success(t('Foto server berhasil dimuat! Klik "Simpan Perubahan" untuk menerapkan.'));
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Preview card */}
      <div className="mb-6 rounded-xl overflow-hidden border bg-card/60 shadow-sm w-full max-w-sm">
        <div className={cn('h-24 bg-gradient-to-br from-primary/30 to-purple-600/30', serverSettingsEditColor)} />
        <div className="px-4 pb-4 -mt-8">
          <div
            onClick={() => serverIconFileInputRef.current?.click()}
            className="relative group/avatar w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-sm overflow-hidden cursor-pointer shrink-0 transition-transform active:scale-95"
            title={t('Klik untuk mengunggah foto server')}
          >
            {serverSettingsEditIconUrl ? (
              <img src={serverSettingsEditIconUrl} alt="Server icon" className="w-full h-full object-cover" />
            ) : (
              activeHub?.initials || activeHub?.name?.slice(0, 2) || 'SV'
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-semibold transition-opacity">
              <Camera className="w-4 h-4 mb-0.5" />
              <span>{t('Ganti')}</span>
            </div>
          </div>
          <p className="font-semibold mt-2 text-sm">{serverSettingsEditName || activeHub?.name || 'Server'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {members.length > 0
              ? `${members.filter((m) => m.status === 'online').length} Online • ${members.length} Anggota`
              : '1 Online • 1 Anggota'}
          </p>
          {(serverSettingsEditDesc || activeHub?.description) && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {serverSettingsEditDesc || activeHub?.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {serverTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Nama Colony')}
          </label>
          <Input
            value={serverSettingsEditName}
            onChange={(e) => setServerSettingsEditName(e.target.value)}
            placeholder="Nama Server"
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Deskripsi Singkat')}
          </label>
          <Input
            value={serverSettingsEditDesc}
            onChange={(e) => setServerSettingsEditDesc(e.target.value)}
            placeholder="Deskripsi komunitas ini..."
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
            {t('Tema Warna Header')}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Indigo', cls: 'bg-indigo-600' },
              { name: 'Purple', cls: 'bg-purple-600' },
              { name: 'Blue', cls: 'bg-blue-600' },
              { name: 'Emerald', cls: 'bg-emerald-600' },
              { name: 'Rose', cls: 'bg-rose-600' },
              { name: 'Amber', cls: 'bg-amber-600' },
              { name: 'Zinc', cls: 'bg-zinc-700' },
            ].map((c) => (
              <button
                key={c.cls}
                type="button"
                onClick={() => setServerSettingsEditColor(c.cls)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-transform',
                  c.cls,
                  serverSettingsEditColor === c.cls ? 'scale-125 border-white shadow-md' : 'border-transparent',
                )}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          onClick={async () => {
            await onUpdateHub(activeHub.id, {
              name: serverSettingsEditName,
              description: serverSettingsEditDesc,
              color: serverSettingsEditColor,
              iconUrl: serverSettingsEditIconUrl || undefined,
            });
            toast.success(t('Profil server berhasil diperbarui! ✅'));
            onClose();
          }}
        >
          {t('Simpan Perubahan')}
        </Button>
        <Button variant="outline" onClick={onClose}>
          {t('Batal')}
        </Button>
      </div>
    </div>
  );
}
