import React from 'react';
import { Plus, Users, Compass, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColonyIcon } from './colony-icon';
import type { Colony } from '@/chat/chat-types';

interface ColoniesExploreTabProps {
  filteredExplore: Colony[];
  inviteCodeInput: string;
  setInviteCodeInput: (val: string) => void;
  handleJoinByCode: (e: React.FormEvent) => void;
  isJoiningByCode: boolean;
  isLoadingPublic: boolean;
  handleOpenCreateColony: () => void;
  handleJoinPublic: (pub: Colony) => void;
  t: (key: string) => string;
}

export function ColoniesExploreTab({
  filteredExplore,
  inviteCodeInput,
  setInviteCodeInput,
  handleJoinByCode,
  isJoiningByCode,
  isLoadingPublic,
  handleOpenCreateColony,
  handleJoinPublic,
  t,
}: ColoniesExploreTabProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Quick Invite Code / Link Join Banner */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {t('Punya Tautan atau Kode Undangan?')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('Masukkan kode atau tautan colony untuk langsung bergabung.')}
            </p>
          </div>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Input
            type="text"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            placeholder="Contoh: hub_xyz atau inv_abc"
            className="h-8 text-xs bg-sidebar-accent border-border w-full sm:w-56"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inviteCodeInput.trim() || isJoiningByCode}
            className="h-8 px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer"
          >
            {isJoiningByCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
            <span>{t('Gabung')}</span>
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Jelajahi Colony Komunitas')} ({filteredExplore.length})
        </h2>
      </div>

      {isLoadingPublic ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl w-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60 mb-2" />
          <p className="text-xs font-medium">{t('Memuat colony komunitas...')}</p>
        </div>
      ) : filteredExplore.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border border-border rounded-xl w-full">
          <Compass className="w-10 h-10 stroke-1 mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground">{t('Tidak Ada Colony Publik Lain')}</h3>
          <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
            {t('Semua colony komunitas saat ini sudah Anda ikuti, atau belum ada colony publik lain yang terdaftar.')}
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreateColony}
            className="mt-3.5 h-8 px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{t('Buat Colony Baru')}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExplore.map((pub) => (
            <div
              key={pub.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-3 shadow-xs group"
            >
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-[14px] bg-sidebar-accent border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                  <ColonyIcon hub={pub} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {pub.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {pub.description || t('Komunitas Anticeil untuk kolaborasi dan obrolan.')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Users className="w-3 h-3" />
                  <span>{pub.membersCount ? `${pub.membersCount.toLocaleString()} Anggota` : 'Komunitas Aktif'}</span>
                </span>

                <Button
                  size="sm"
                  onClick={() => handleJoinPublic(pub)}
                  className="h-7 px-3 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>{t('Gabung Colony')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
