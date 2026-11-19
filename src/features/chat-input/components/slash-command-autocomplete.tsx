import React, { useMemo } from 'react';
import { Terminal, Bot, Sparkles, ChevronRight, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Colony, ColonyApp } from '@/chat/chat-types';
import { DIRECTORY_APPS } from '@/features/colony-settings/components/tabs/directory-apps-data';

export interface SlashCommandOption {
  botId: string;
  botName: string;
  botIcon?: string;
  command: string;
  description: string;
  isInstalled: boolean;
}

interface SlashCommandAutocompleteProps {
  inputText: string;
  activeColony: Colony | null;
  onSelectCommand: (cmd: string) => void;
  isOpen: boolean;
  selectedIndex: number;
}

export function SlashCommandAutocomplete({
  inputText,
  activeColony,
  onSelectCommand,
  isOpen,
  selectedIndex,
}: SlashCommandAutocompleteProps) {
  const installedApps: ColonyApp[] = useMemo(() => {
    return activeColony?.installedApps || [];
  }, [activeColony?.installedApps]);

  const allCommandOptions = useMemo(() => {
    const list: SlashCommandOption[] = [];

    // 1. Gather commands from installed apps
    installedApps.forEach((app) => {
      if (app.enabled === false) return;
      const commands = app.slashCommands || [];
      commands.forEach((cmd) => {
        list.push({
          botId: app.id,
          botName: app.name,
          botIcon: app.icon || '🤖',
          command: cmd,
          description: app.description || 'Perintah bot koloni terpasang',
          isInstalled: true,
        });
      });
    });

    // 2. Also offer marketplace bot commands if not yet installed
    DIRECTORY_APPS.forEach((dirApp) => {
      const alreadyInstalled = installedApps.some((a) => a.id === dirApp.id);
      if (!alreadyInstalled) {
        dirApp.commands.forEach((cmd) => {
          list.push({
            botId: dirApp.id,
            botName: dirApp.name,
            botIcon: dirApp.iconText || '🤖',
            command: cmd,
            description: dirApp.description,
            isInstalled: false,
          });
        });
      }
    });

    return list;
  }, [installedApps]);

  const filteredCommands = useMemo(() => {
    if (!inputText.startsWith('/')) return [];
    const query = inputText.slice(1).trim().toLowerCase();

    return allCommandOptions.filter((item) => {
      if (!query) return true;
      const rawCmd = item.command.replace(/^\//, '').toLowerCase();
      return (
        rawCmd.includes(query) ||
        item.botName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [inputText, allCommandOptions]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div className="w-full mb-2 bg-[#111214] border border-border/80 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-150 z-40 select-none">
      {/* Header */}
      <div className="px-3.5 py-2 border-b border-border/60 bg-[#1e1f22]/70 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="uppercase tracking-wider text-[11px]">
            Perintah Slash Command ({filteredCommands.length})
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/80 font-normal">
          Gunakan <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">↓</kbd> dan <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">Tab</kbd> / <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">Enter</kbd>
        </span>
      </div>

      {/* Commands List */}
      <div className="max-h-56 overflow-y-auto divide-y divide-border/40 p-1 custom-scrollbar">
        {filteredCommands.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={`${item.botId}-${item.command}`}
              onClick={() => onSelectCommand(item.command)}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group',
                isSelected
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'hover:bg-card/70 text-foreground'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center text-sm shrink-0 shadow-xs">
                  {item.botIcon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {item.command}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span>•</span>
                      <span>{item.botName}</span>
                    </span>
                    {item.isInstalled ? (
                      <span className="text-[9px] px-1 py-0.2 rounded-sm bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                        Bot
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 py-0.2 rounded-sm bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
                        Marketplace
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-md">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Pilih</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
