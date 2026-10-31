import React from 'react';
import { Hash, Volume2, MessagesSquare, Smile, Lock, Columns3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Colony } from '@/chat/chat-types';

export interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeColony: Colony | null;
  newChannelCategory: string;
  newChannelType: 'text' | 'voice' | 'forum' | 'kanban';
  setNewChannelType: (type: 'text' | 'voice' | 'forum' | 'kanban') => void;
  newChannelName: string;
  setNewChannelName: (name: string) => void;
  newChannelIsPrivate: boolean;
  setNewChannelIsPrivate: (isPrivate: boolean) => void;
  onCreateChannelSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  activeColony,
  newChannelCategory,
  newChannelType,
  setNewChannelType,
  newChannelName,
  setNewChannelName,
  newChannelIsPrivate,
  setNewChannelIsPrivate,
  onCreateChannelSubmit,
  t,
}: CreateChannelDialogProps) {
  const channelTypes = [
    {
      type: 'text' as const,
      icon: Hash,
      title: 'Text',
      description: 'Send messages, images, GIFs, emoji, and opinions',
    },
    {
      type: 'voice' as const,
      icon: Volume2,
      title: 'Voice',
      description: 'Hang out together with voice, video, and screen share',
    },
    {
      type: 'forum' as const,
      icon: MessagesSquare,
      title: 'Forum',
      description: 'Create a space for organized discussions',
    },
    {
      type: 'kanban' as const,
      icon: Columns3,
      title: 'Kanban Board',
      description: 'Collaborate on tasks, sprints, cards, and team assignments',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-4 sm:p-5">
        <form onSubmit={onCreateChannelSubmit} className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
              {t('Create Channel')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              in {newChannelCategory === 'CHANNELS' ? (activeColony?.name || 'Channels') : 'Direct Messages'}
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <DialogBody className="space-y-3.5 py-2">
            {/* 1. CHANNEL TYPE */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('CHANNEL TYPE')}
              </label>
              <div className="space-y-1.5">
                {channelTypes.map(({ type, icon: Icon, title, description }) => {
                  const isSelected = newChannelType === type;
                  return (
                    <div
                      key={type}
                      onClick={() => setNewChannelType(type)}
                      className={cn(
                        'flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all border select-none',
                        isSelected
                          ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                          : 'bg-muted/40 border-border/50 hover:bg-muted/70 hover:border-border text-muted-foreground',
                      )}
                    >
                      {/* Radio dot */}
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40',
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>

                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isSelected ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />

                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-xs font-semibold leading-tight',
                            isSelected ? 'text-foreground' : 'text-foreground/90',
                          )}
                        >
                          {title}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight truncate">
                          {description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. CHANNEL NAME */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('CHANNEL NAME')}
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {newChannelType === 'text' && <Hash className="w-3.5 h-3.5" />}
                  {newChannelType === 'voice' && <Volume2 className="w-3.5 h-3.5" />}
                  {newChannelType === 'forum' && <MessagesSquare className="w-3.5 h-3.5" />}
                  {newChannelType === 'kanban' && <Columns3 className="w-3.5 h-3.5" />}
                </div>
                <Input
                  value={newChannelName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewChannelName(newChannelType === 'voice' ? val : val.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="new-channel"
                  className="pl-8 pr-8 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground rounded-lg h-9 text-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
                <Smile className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
              </div>
            </div>

            {/* 3. PRIVATE CHANNEL SWITCH */}
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      Private Channel
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Only selected members and roles will be able to view this channel.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={newChannelIsPrivate}
                  onCheckedChange={setNewChannelIsPrivate}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </DialogBody>

          {/* Footer */}
          <DialogFooter className="pt-3 mt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold h-8 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newChannelName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
