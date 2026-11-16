import React from 'react';
import {
  ChevronDown,
  Plus,
  CheckCheck,
  BellOff,
  Pencil,
  Trash2,
  Hash,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColonyCategory } from '../../api/categories-api';
import type { ColonyChannel } from '@/chat/chat-types';

export interface SidebarCategoryGroupProps {
  category: ColonyCategory;
  channels: ColonyChannel[];
  isCollapsed: boolean;
  isDragOver: boolean;
  onToggleCollapse: () => void;
  onCollapseAll: () => void;
  onOpenCreateChannel: (category: string, type: any, categoryId?: string) => void;
  onEditCategory: (category: ColonyCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  renderChannel: (ch: ColonyChannel) => React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SidebarCategoryGroup: React.FC<SidebarCategoryGroupProps> = ({
  category: cat,
  channels: catChannels,
  isCollapsed,
  isDragOver,
  onToggleCollapse,
  onCollapseAll,
  onOpenCreateChannel,
  onEditCategory,
  onDeleteCategory,
  onDragOver,
  onDragLeave,
  onDrop,
  renderChannel,
  t,
}) => {
  return (
    <div
      key={cat.id}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'space-y-1 mb-2 p-1 -m-1 rounded-lg transition-all duration-150',
        isDragOver && 'ring-2 ring-primary/80 bg-primary/10 shadow-xs',
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={onToggleCollapse}
            className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
          >
            <div className="flex items-center gap-1 min-w-0">
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform duration-200 shrink-0',
                  isCollapsed && '-rotate-90',
                )}
              />
              <span className="truncate">{cat.name}</span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                ({catChannels.length})
              </span>
            </div>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateChannel('CHANNELS', 'text', cat.id);
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                  title={t('Buat Channel')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                {t('Buat Channel')}
              </TooltipContent>
            </Tooltip>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56 bg-card border-border text-foreground">
          <ContextMenuItem
            onClick={() => toast.success(t('Semua channel di kategori ini ditandai telah dibaca'))}
            className="cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 mr-1 text-muted-foreground" />
            <span>{t('Mark As Read')}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuCheckboxItem
            checked={isCollapsed}
            onCheckedChange={onToggleCollapse}
            className="cursor-pointer"
          >
            <span>{t('Collapse Category')}</span>
          </ContextMenuCheckboxItem>

          <ContextMenuItem
            onClick={onCollapseAll}
            className="cursor-pointer"
          >
            <span>{t('Collapse All Categories')}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuSub>
            <ContextMenuSubTrigger className="cursor-pointer">
              <BellOff className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>{t('Mute Category')}</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-card border-border">
              {['15 Menit', '1 Jam', '8 Jam', '24 Jam', 'Sampai diaktifkan kembali'].map((duration) => (
                <ContextMenuItem
                  key={duration}
                  onClick={() => toast.success(t(`Kategori dibisukan selama ${duration}`))}
                  className="cursor-pointer"
                >
                  {duration}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => onEditCategory(cat)}
            className="cursor-pointer"
          >
            <Pencil className="w-4 h-4 mr-1 text-muted-foreground" />
            <span>{t('Edit Category')}</span>
          </ContextMenuItem>

          <ContextMenuItem
            variant="destructive"
            onClick={() => {
              if (confirm(t('Hapus kategori ini? Channel di dalamnya tidak akan terhapus.'))) {
                onDeleteCategory(cat.id);
              }
            }}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-1 text-destructive" />
            <span>{t('Delete Category')}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => {
              navigator.clipboard.writeText(cat.id);
              toast.success(t('Category ID disalin ke papan klip'));
            }}
            className="cursor-pointer"
          >
            <Hash className="w-4 h-4 mr-1 text-muted-foreground" />
            <span>{t('Copy Category ID')}</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {!isCollapsed && (
        <div className="space-y-0.5">
          {catChannels.length === 0 ? (
            <div className="px-3 py-1 text-[11px] text-muted-foreground/50 italic">
              {t('Belum ada channel')}
            </div>
          ) : (
            catChannels.map(renderChannel)
          )}
        </div>
      )}
    </div>
  );
};
