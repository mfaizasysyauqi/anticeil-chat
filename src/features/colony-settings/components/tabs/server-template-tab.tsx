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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel } from '@/chat/chat-types';

interface ServerTemplateTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

export function ServerTemplateTab({
  activeColony,
  channels = [],
  onUpdateColony,
  t,
}: ServerTemplateTabProps) {
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

  const templateUrl = `${window.location.origin}/template/${templateCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(templateUrl);
    setIsCopied(true);
    toast.success(t('Tautan templat server berhasil disalin! 📋'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncTemplate = async () => {
    setIsSyncing(true);
    try {
      await onUpdateColony(activeColony.id, {
        templateSettings: {
          name: templateName,
          description: templateDescription,
          code: templateCode,
          lastSyncedAt: new Date().toISOString(),
        },
      });
      toast.success(t('Templat server berhasil disinkronkan dengan konfigurasi terbaru! 🚀'));
    } catch {
      toast.error(t('Gagal menyinkronkan templat server'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await onUpdateColony(activeColony.id, {
        templateSettings: undefined,
      });
      toast.info(t('Tautan templat server telah dihapus.'));
    } catch {
      toast.error(t('Gagal menghapus templat server'));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-20 text-foreground">
      {/* Header (Discord 1:1 Parity) */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {t('Server Template')}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            "Server templates allow anyone to create a server just like yours! Changes to your server won't update your template link until you manually sync."
          )}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-[#1e1f22] p-5 space-y-5 shadow-xl">
        {/* Template Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Template Title')}
          </label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-xs bg-[#111214] border-border/80 h-9"
          />
        </div>

        {/* Template Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Template Description')}
          </label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={2}
            className="w-full p-2 text-xs bg-[#111214] border border-border/80 text-foreground resize-none rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Template Link Bar */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Template Link')}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-9 px-3 rounded-lg bg-[#111214] border border-border/80 flex items-center font-mono text-xs text-foreground truncate select-all">
              {templateUrl}
            </div>
            <Button
              type="button"
              onClick={handleCopyLink}
              className="h-9 px-4 text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg cursor-pointer shrink-0"
            >
              {isCopied ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {t('Copied!')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  {t('Copy')}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDeleteTemplate}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-red-400 gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('Delete Template')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleSyncTemplate}
            disabled={isSyncing}
            className="h-8 px-4 text-xs font-semibold bg-[#2b2d31] hover:bg-[#35373c] text-white border border-border/70 rounded-lg cursor-pointer gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? t('Syncing...') : t('Sync Template')}</span>
          </Button>
        </div>
      </div>

      {/* Snapshot Preview Card */}
      <div className="p-4 rounded-xl border border-border/70 bg-[#1e1f22] space-y-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {t('Template Snapshot Content')}
        </span>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#111214] border border-border/60 flex items-center gap-2.5">
            <Hash className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-sm font-bold text-foreground block">
                {channels.filter((c) => c.type !== 'voice').length}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Text Channels')}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#111214] border border-border/60 flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-sm font-bold text-foreground block">
                {channels.filter((c) => c.type === 'voice').length}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Voice Channels')}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#111214] border border-border/60 flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-sm font-bold text-foreground block">
                @everyone + Custom
              </span>
              <span className="text-[10px] text-muted-foreground">{t('Roles & Permissions')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
