import React, { useState } from 'react';
import {
  Layers,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  Hash,
  Volume2,
  KeyRound,
  Sparkles,
  LayoutGrid,
  MessagesSquare,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

interface ColonyTemplateTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

export type ServerTemplateTabProps = ColonyTemplateTabProps;

export function ColonyTemplateTab({
  activeColony,
  channels = [],
  onUpdateColony,
  t,
}: ColonyTemplateTabProps) {
  const [templateName, setTemplateName] = useState(
    activeColony.templateSettings?.name || `${activeColony.name} Template`
  );
  const [templateDescription, setTemplateDescription] = useState(
    activeColony.templateSettings?.description ||
      `Templat resmi untuk ${activeColony.name}, lengkap dengan struktur channel, permission, dan peran.`
  );
  const [templateCode, setTemplateCode] = useState(
    activeColony.templateSettings?.code || `tpl-${activeColony.id.substring(0, 6)}`
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const templateUrl = `${window.location.origin}/template/${templateCode}`;

  const textChannels = channels.filter((c) => c.type === 'text' || !c.type);
  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const otherChannels = channels.filter((c) => c.type === 'forum' || c.type === 'kanban');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(templateUrl);
    setIsCopied(true);
    toast.success(t('Tautan templat server berhasil disalin! 📋'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncTemplate = async () => {
    setIsSyncing(true);
    try {
      await colonyApi.syncColonyTemplate(activeColony.id, {
        name: templateName,
        description: templateDescription,
        code: templateCode,
      });

      const updatedSettings = {
        name: templateName,
        description: templateDescription,
        code: templateCode,
        lastSyncedAt: new Date().toISOString(),
      };

      await onUpdateColony(activeColony.id, {
        templateSettings: updatedSettings,
      });
      toast.success(t('Templat server berhasil disinkronkan dengan konfigurasi terbaru! 🚀'));
    } catch {
      toast.error(t('Gagal menyinkronkan templat server'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTemplate = async () => {
    setIsDeleting(true);
    try {
      await colonyApi.deleteColonyTemplate(activeColony.id);
      await onUpdateColony(activeColony.id, {
        templateSettings: undefined,
      });
      toast.info(t('Tautan templat server telah dihapus.'));
    } catch {
      toast.error(t('Gagal menghapus templat server'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-20 text-foreground">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sidebar-primary" />
          <h2 className="text-xl font-bold text-foreground">
            {t('Server Template & Blueprint')}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            'Templat server memungkinkan siapapun membuat server persis seperti ini! Perubahan baru tidak akan mengubah tautan templat Anda sampai Anda melakukan sinkronisasi manual.'
          )}
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-5 shadow-xl">
        {/* Template Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Judul Templat')}
          </label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-xs bg-muted/40 border-border h-9 rounded-xl focus:border-sidebar-primary"
            placeholder={t('Contoh: Gaming Hub Starter Pack')}
          />
        </div>

        {/* Template Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Deskripsi Templat')}
          </label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={2}
            className="w-full p-2.5 text-xs bg-muted/40 border border-border text-foreground resize-none rounded-xl focus:outline-none focus:border-sidebar-primary"
            placeholder={t('Jelaskan tujuan dan fitur utama templat server ini...')}
          />
        </div>

        {/* Template Link Bar */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Tautan Templat Publik')}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-9 px-3.5 rounded-xl bg-muted/40 border border-border flex items-center font-mono text-xs text-foreground truncate select-all">
              {templateUrl}
            </div>
            <Button
              type="button"
              variant="teal"
              onClick={handleCopyLink}
              className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{t('Tersalin!')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('Salin Tautan')}</span>
                </>
              )}
            </Button>
          </div>
          {activeColony.templateSettings?.lastSyncedAt && (
            <p className="text-[10px] text-muted-foreground italic pt-0.5">
              {t('Terakhir disinkronkan:')}{' '}
              {new Date(activeColony.templateSettings.lastSyncedAt).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDeleteTemplate}
            disabled={isDeleting}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive gap-1.5 cursor-pointer rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? t('Menghapus...') : t('Hapus Templat')}</span>
          </Button>

          <Button
            type="button"
            variant="teal"
            onClick={handleSyncTemplate}
            disabled={isSyncing}
            className="h-8 px-4 text-xs font-bold rounded-xl cursor-pointer gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? t('Menyinkronkan...') : t('Sinkronkan Templat')}</span>
          </Button>
        </div>
      </div>

      {/* Snapshot Preview Card */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t('Komposisi Blueprint Server')}
          </span>
          <span className="text-[10px] text-sidebar-primary font-bold bg-sidebar-primary/10 px-2 py-0.5 rounded-full border border-sidebar-primary/20">
            {channels.length} {t('Saluran')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block">
                {textChannels.length}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Saluran Teks')}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block">
                {voiceChannels.length}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Saluran Suara')}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground block">
                {otherChannels.length}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Forum & Kanban')}</span>
            </div>
          </div>
        </div>

        {/* Channel Previews List */}
        <div className="pt-2 space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            {t('Pratinjau Saluran yang Tersemat dalam Templat:')}
          </span>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin]">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/40 text-xs text-foreground"
              >
                <div className="flex items-center gap-2 truncate">
                  {ch.type === 'voice' ? (
                    <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : ch.type === 'kanban' ? (
                    <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="truncate">{ch.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">
                  {ch.category || 'CHANNELS'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ServerTemplateTab = ColonyTemplateTab;
