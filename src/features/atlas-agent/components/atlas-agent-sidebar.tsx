import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Pin,
  Bot,
  Pencil,
  Check,
  X,
  PanelLeftClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyIconBadge } from '@/components/ui/empty';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { AiSession } from '../types';
import { useOptionalAtlasAgentContext } from '../context/atlas-agent-context';

export interface AtlasAgentSidebarProps {
  sessions?: AiSession[];
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onCreateNewSession?: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onDeleteSession?: (id: string) => void;
  onTogglePinSession?: (id: string) => void;
  onSelectPromptPreset?: (prompt: string) => void;
  onOpenGroqSettings?: () => void;
  onToggleCollapseSidebar?: () => void;
  currentUser?: any;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
}

export function AtlasAgentSidebar(props: AtlasAgentSidebarProps) {
  const contextValue = useOptionalAtlasAgentContext();

  const sessions = props.sessions || contextValue?.sessions || [];
  const activeSessionId = props.activeSessionId ?? contextValue?.activeSessionId ?? null;
  const onSelectSession = props.onSelectSession || contextValue?.setActiveSessionId || (() => {});
  const onCreateNewSession = props.onCreateNewSession || contextValue?.handleCreateNewSession || (() => {});
  const onRenameSession = props.onRenameSession || contextValue?.handleRenameSession || (() => {});
  const onDeleteSession = props.onDeleteSession || contextValue?.handleDeleteSession || (() => {});
  const onTogglePinSession = props.onTogglePinSession || contextValue?.handleTogglePinSession || (() => {});
  const onOpenGroqSettings = props.onOpenGroqSettings || (() => contextValue?.setIsGroqSettingsOpen(true));
  const onSelectPromptPreset = props.onSelectPromptPreset;
  const currentUser = props.currentUser;
  const requireAuth = props.requireAuth;

  const handleCreateNewClick = () => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => onCreateNewSession?.(),
        t('Obrolan Baru Atlas'),
        t('Masuk ke Anticeil untuk membuat obrolan baru dengan Atlas Agent.'),
      );
      return;
    }
    onCreateNewSession?.();
  };

  const { t } = useTranslation();
  const onToggleCollapseSidebar = props.onToggleCollapseSidebar;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const title = typeof s?.title === 'string' ? s.title : '';
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      (Array.isArray(s?.messages) &&
        s.messages.some((m) => typeof m?.content === 'string' && m.content.toLowerCase().includes(query)))
    );
  });

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-sidebar select-none overflow-hidden">
      {/* Header: Search form and Collapse button (Matches Hub Fitur exactly) */}
      <div className="h-12 border-b border-sidebar-border px-2 flex items-center justify-between gap-1.5 font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
        <div className="flex-1 min-w-0 h-7 px-2 flex items-center gap-1.5 rounded-[4px] bg-muted/60 focus-within:bg-muted text-foreground text-[11px] transition-colors border border-border">
          <Search className="w-3 h-3 shrink-0 opacity-60 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari riwayat perintah...')}
            className="w-full bg-transparent border-0 outline-none p-0 text-foreground placeholder:text-muted-foreground text-[11px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              title={t('Hapus pencarian')}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {onToggleCollapseSidebar && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapseSidebar}
                className="hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent cursor-pointer shrink-0"
                title={t('Tutup Sidebar (Ctrl+B)')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {t('Tutup Sidebar')} <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">Ctrl+B</kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Sessions Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 pb-16 custom-scrollbar space-y-2">
        {/* Tombol Buat Percakapan Baru di Body */}
        <div className="mb-2">
          <button
            type="button"
            onClick={handleCreateNewClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 text-xs font-semibold transition-all cursor-pointer group shadow-2xs"
          >
            <div className="w-5 h-5 rounded-md bg-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="flex-1 text-left truncate">{t('Obrolan Baru')}</span>
            <Sparkles className="w-3.5 h-3.5 text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        </div>
        {/* Pinned Section */}
        {pinnedSessions.length > 0 && (
          <div className="mb-2">
            <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Disematkan
            </span>
            <div className="space-y-0.5 mt-1">
              {pinnedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => onSelectSession(session.id)}
                  onRename={(newTitle) => onRenameSession(session.id, newTitle)}
                  onDelete={() => onDeleteSession(session.id)}
                  onTogglePin={() => onTogglePinSession(session.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Sessions Section */}
        <div>
          <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Riwayat Percakapan ({regularSessions.length})
          </span>

          {regularSessions.length === 0 && pinnedSessions.length === 0 ? (
            <div className="py-6 px-3 flex flex-col items-center text-center animate-in fade-in duration-200">
              <div className="relative w-28 h-36 flex items-center justify-center mb-2 group">
                <img
                  src="/atlas-standing.png"
                  alt="Atlas Mascot"
                  className="size-full object-contain filter drop-shadow-[0_8px_16px_rgba(37,99,235,0.25)] transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/atlas-mascot.png';
                  }}
                />
              </div>
              <p className="text-xs font-semibold text-foreground mb-1">
                {t('Belum Ada Riwayat')}
              </p>
              <p className="text-[11px] text-muted-foreground mb-3 max-w-[180px] leading-relaxed">
                {t('Belum ada riwayat perintah AI.')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewClick}
                className="text-xs h-7 gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {t('Buat Obrolan')}
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 mt-1">
              {regularSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => onSelectSession(session.id)}
                  onRename={(newTitle) => onRenameSession(session.id, newTitle)}
                  onDelete={() => onDeleteSession(session.id)}
                  onTogglePin={() => onTogglePinSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}: {
  session: AiSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const displayTitle = typeof session?.title === 'string' && session.title.trim() ? session.title.trim() : 'Percakapan Baru';
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(displayTitle);

  useEffect(() => {
    setEditTitle(displayTitle);
  }, [displayTitle]);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-sidebar-accent">
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setEditTitle(displayTitle);
            }
          }}
          className="flex-1 bg-transparent text-xs text-foreground outline-hidden border-b border-primary"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
          title="Simpan"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setEditTitle(displayTitle);
          }}
          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Batal"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all',
        isActive
          ? 'bg-sidebar-accent text-foreground font-semibold shadow-xs'
          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50',
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span className="truncate leading-tight">{displayTitle}</span>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditTitle(session.title);
            setIsEditing(true);
          }}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Ubah Nama Percakapan"
        >
          <Pencil className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            'p-1 rounded hover:bg-white/10 transition-colors cursor-pointer',
            session.isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
          title={session.isPinned ? 'Lepas Sematan' : 'Sematkan'}
        >
          <Pin className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
          title="Hapus Percakapan"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Backward compatibility alias
export const AiCommandCenterSidebar = AtlasAgentSidebar;
export type { AtlasAgentSidebarProps as AiCommandCenterSidebarProps };

