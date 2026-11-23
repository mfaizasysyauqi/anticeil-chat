import React from 'react';
import { Trash2, Code2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';

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
}: AtlasAgentHeaderProps) {
  const { t } = useTranslation();

  const handleDelete = onDeleteSession || onClearSessionMessages;
  const canDelete = Boolean(onDeleteSession || (hasMessages && onClearSessionMessages));
  const displayTitle = activeSessionTitle || t('Percakapan Baru');

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
          <span
            className="text-sm font-semibold text-foreground truncate min-w-0 block"
            title={displayTitle}
          >
            {displayTitle}
          </span>
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
