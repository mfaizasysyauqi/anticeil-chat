import React, { useState, useEffect } from 'react';
import { Trash2, Code2, MessageSquare, Pencil, Pin, PinOff, Zap, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import type { AiCreditsStatus } from '../services/ai-credits-service';

export interface AtlasAgentHeaderProps {
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  activeSessionTitle?: string;
  modelName?: string;
  onOpenGroqSettings?: () => void;
  onClearSessionMessages?: () => void;
  onDeleteSession?: () => void;
  onCreateNewSession?: () => void;
  hasMessages?: boolean;
  hasActiveArtifact?: boolean;
  onToggleArtifactPanel?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onRename?: (newTitle: string) => void;
  creditsStatus?: AiCreditsStatus;
  onOpenCreditsDialog?: () => void;
}

/**
 * Clean Atlas Agent App Bar Header
 * Minimal, symmetric, and distraction-free with Atlas mascot branding.
 */
export function AtlasAgentHeader({
  onOpenSidebar,
  horizontalPadding = LAYOUT_PAGE_SPACING.HORIZONTAL,
  activeSessionTitle,
  onClearSessionMessages,
  onDeleteSession,
  hasMessages = false,
  hasActiveArtifact = false,
  onToggleArtifactPanel,
  isPinned = false,
  onTogglePin,
  onRename,
  creditsStatus,
  onOpenCreditsDialog,
}: AtlasAgentHeaderProps) {
  const { t } = useTranslation();

  const handleDelete = onDeleteSession || onClearSessionMessages;
  const canDelete = Boolean(onDeleteSession || (hasMessages && onClearSessionMessages));
  const displayTitle = activeSessionTitle || t('Percakapan Baru');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(activeSessionTitle || '');

  useEffect(() => {
    setEditTitleInput(activeSessionTitle || '');
  }, [activeSessionTitle]);

  const handleSaveTitle = () => {
    if (editTitleInput.trim() && onRename) {
      onRename(editTitleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      className={cn(
        'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden',
        horizontalPadding
      )}
    >
      {/* Left: Mobile Sidebar Trigger + Conversation Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <SidebarNavToggle onClick={onOpenSidebar} />

        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0 max-w-xs sm:max-w-sm flex-1">
              <input
                autoFocus
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditTitleInput(activeSessionTitle || '');
                  }
                }}
                className="h-7 px-2 text-xs bg-muted/80 text-foreground border border-primary/50 rounded-md outline-none w-full"
                placeholder={t('Judul obrolan...')}
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                title={t('Simpan')}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditTitleInput(activeSessionTitle || '');
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
                title={t('Batal')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span
                className="text-sm font-semibold text-foreground truncate min-w-0 block"
                title={displayTitle}
              >
                {displayTitle}
              </span>
              {isPinned && (
                <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle Artifact Panel Button */}
        {hasActiveArtifact && onToggleArtifactPanel && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleArtifactPanel}
                className="h-8 px-2.5 text-xs text-primary font-semibold hover:bg-primary/10 gap-1.5 cursor-pointer rounded-lg border border-primary/20"
                title={t('Tampilkan / Sembunyikan Panel Artifact')}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Artifact')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Toggle Panel Artifact')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* AI Credit Indicator Pill Button */}
        {creditsStatus && onOpenCreditsDialog && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenCreditsDialog}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs select-none shrink-0",
                  creditsStatus.remainingToday === 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 animate-pulse"
                    : creditsStatus.remainingToday <= 5
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                )}
                title={
                  creditsStatus.isUnlimited
                    ? t('Kredit AI Tanpa Batas (Royal Enterprise)')
                    : `${t('Sisa Kredit AI Hari Ini')}: ${creditsStatus.remainingToday}/${creditsStatus.dailyLimit} (${creditsStatus.planName}) - ${t('Klik untuk upgrade paket')}`
                }
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span className="font-mono text-[10px] sm:text-[11px]">
                  {creditsStatus.isUnlimited ? 'Unlimited' : `${creditsStatus.remainingToday}/${creditsStatus.dailyLimit}`}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {creditsStatus.isUnlimited
                ? t('Kredit AI Tanpa Batas (Royal Enterprise)')
                : `${t('Sisa Kredit AI Hari Ini')}: ${creditsStatus.remainingToday}/${creditsStatus.dailyLimit} (${creditsStatus.planName})`}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Pin / Unpin Conversation Button */}
        {onTogglePin && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onTogglePin}
                className={cn(
                  "h-8 w-8 transition-colors cursor-pointer",
                  isPinned
                    ? "text-primary hover:text-primary/80 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                title={isPinned ? t('Lepas Sematan Percakapan') : t('Sematkan Percakapan')}
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {isPinned ? t('Lepas Sematan Percakapan') : t('Sematkan Percakapan')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Edit / Rename Conversation Button */}
        {onRename && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setEditTitleInput(activeSessionTitle || '');
                  setIsEditingTitle((prev) => !prev);
                }}
                className={cn(
                  "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer",
                  isEditingTitle && "text-primary bg-primary/10"
                )}
                title={t('Ubah Judul Percakapan')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Ubah Judul Percakapan')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Delete / Clear Conversation Button */}
        {canDelete && handleDelete && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleDelete}
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-accent/50 cursor-pointer"
                title={t('Hapus Percakapan Ini')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Hapus Percakapan')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// Backward compatibility alias
export const AiCommandCenterHeader = AtlasAgentHeader;
export type { AtlasAgentHeaderProps as AiCommandCenterHeaderProps };
