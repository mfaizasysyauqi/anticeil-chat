import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Pin,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AiSession } from '../types';
import { useAiCommandCenterContext } from '../context/ai-command-center-context';

export interface AiCommandCenterSidebarProps {
  sessions?: AiSession[];
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onCreateNewSession?: () => void;
  onDeleteSession?: (id: string) => void;
  onTogglePinSession?: (id: string) => void;
  onSelectPromptPreset?: (prompt: string) => void;
  onOpenGroqSettings?: () => void;
}

export function AiCommandCenterSidebar(props: AiCommandCenterSidebarProps) {
  let contextValue: any = null;
  try {
    contextValue = useAiCommandCenterContext();
  } catch {}

  const sessions = props.sessions || contextValue?.sessions || [];
  const activeSessionId = props.activeSessionId ?? contextValue?.activeSessionId ?? null;
  const onSelectSession = props.onSelectSession || contextValue?.setActiveSessionId || (() => {});
  const onCreateNewSession = props.onCreateNewSession || contextValue?.handleCreateNewSession || (() => {});
  const onDeleteSession = props.onDeleteSession || contextValue?.handleDeleteSession || (() => {});
  const onTogglePinSession = props.onTogglePinSession || contextValue?.handleTogglePinSession || (() => {});
  const onOpenGroqSettings = props.onOpenGroqSettings || (() => contextValue?.setIsGroqSettingsOpen(true));
  const onSelectPromptPreset = props.onSelectPromptPreset;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-sidebar select-none overflow-hidden">
      {/* Top Header: Title & New Session Button */}
      <div className="h-12 border-b border-sidebar-border px-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-foreground truncate">
            AI Command Center
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onCreateNewSession}
          className="h-7 px-2 text-xs font-semibold gap-1.5 border-sidebar-border hover:bg-sidebar-accent cursor-pointer shrink-0"
          title="Percakapan Baru"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Baru</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-sidebar-border/40 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari riwayat perintah..."
            className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border/60"
          />
        </div>
      </div>

      {/* Sessions Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
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
            <div className="py-8 px-3 text-center space-y-2">
              <Bot className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                Belum ada riwayat perintah AI.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNewSession}
                className="text-xs h-7 gap-1"
              >
                <Plus className="w-3 h-3" /> Buat Obrolan
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
                  onDelete={() => onDeleteSession(session.id)}
                  onTogglePin={() => onTogglePinSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        {onSelectPromptPreset && (
          <div className="pt-4 border-t border-sidebar-border/40 mt-3">
            <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Perintah Cepat
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectPromptPreset('Buka papan tulis Jamspace Whiteboard')}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors flex items-center gap-1.5"
              >
                <span>🎨</span>
                <span className="truncate">Buka Whiteboard</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPromptPreset('Buka YouTube Watch Together')}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors flex items-center gap-1.5"
              >
                <span>🎬</span>
                <span className="truncate">YouTube Watch Together</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPromptPreset('Kirim pesan ke channel general: Halo rekan-rekan!')}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors flex items-center gap-1.5"
              >
                <span>📢</span>
                <span className="truncate">Kirim Pesan ke Channel</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPromptPreset('Kirim DM ke teman')}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors flex items-center gap-1.5"
              >
                <span>✉️</span>
                <span className="truncate">Kirim Pesan Langsung (DM)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Groq Engine Status Pill */}
      {onOpenGroqSettings && (
        <div className="px-2.5 py-2 border-t border-sidebar-border/40 shrink-0">
          <div
            onClick={onOpenGroqSettings}
            className="w-full px-2 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-foreground truncate">
                Groq LPU Engine
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  session: AiSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
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
        <span className="truncate leading-tight">{session.title}</span>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            'p-1 rounded hover:bg-white/10 transition-colors',
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
          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          title="Hapus Percakapan"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
