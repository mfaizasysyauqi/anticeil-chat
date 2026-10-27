import React from 'react';
import { Hash, Volume2, MessagesSquare, Smile, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { CommunityHub } from '@/chat/chat-types';

export interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeHub: CommunityHub | null;
  newChannelCategory: string;
  newChannelType: 'text' | 'voice' | 'forum';
  setNewChannelType: (type: 'text' | 'voice' | 'forum') => void;
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
  activeHub,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-[#313338] border-[#232428] text-white rounded-[16px]">
        <form onSubmit={onCreateChannelSubmit} className="flex flex-col">
          {/* Header */}
          <div className="p-4 pb-2 pr-12">
            <DialogTitle className="text-lg font-bold text-white tracking-tight">
              {t('Create Channel')}
            </DialogTitle>
            <p className="text-xs text-[#949ba4] mt-0.5">
              in {newChannelCategory === 'CHANNELS' ? (activeHub?.name || 'Text Channels') : 'Direct Messages'}
            </p>
          </div>

          {/* Body */}
          <div className="px-4 py-2 space-y-3.5 max-h-[70vh] overflow-y-auto [scrollbar-width:thin]">
            {/* 1. CHANNEL TYPE */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] block mb-2">
                {t('CHANNEL TYPE')}
              </label>
              <div className="space-y-2">
                {/* Option 1: Text */}
                <div
                  onClick={() => setNewChannelType('text')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                    newChannelType === 'text'
                      ? 'bg-[#3b3e45] border-primary text-white'
                      : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#dbdee1]',
                  )}
                >
                  {/* Radio dot */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    newChannelType === 'text' ? 'border-primary bg-primary text-primary-foreground' : 'border-[#80848e]',
                  )}>
                    {newChannelType === 'text' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <Hash className="w-6 h-6 text-[#949ba4] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">Text</div>
                    <div className="text-xs text-[#949ba4] leading-snug">
                      Send messages, images, GIFs, emoji, opinions, and puns
                    </div>
                  </div>
                </div>

                {/* Option 2: Voice */}
                <div
                  onClick={() => setNewChannelType('voice')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                    newChannelType === 'voice'
                      ? 'bg-[#3b3e45] border-primary text-white'
                      : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#dbdee1]',
                  )}
                >
                  {/* Radio dot */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    newChannelType === 'voice' ? 'border-primary bg-primary text-primary-foreground' : 'border-[#80848e]',
                  )}>
                    {newChannelType === 'voice' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <Volume2 className="w-6 h-6 text-[#949ba4] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">Voice</div>
                    <div className="text-xs text-[#949ba4] leading-snug">
                      Hang out together with voice, video, and screen share
                    </div>
                  </div>
                </div>

                {/* Option 3: Forum */}
                <div
                  onClick={() => setNewChannelType('forum')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                    newChannelType === 'forum'
                      ? 'bg-[#3b3e45] border-primary text-white'
                      : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-[#dbdee1]',
                  )}
                >
                  {/* Radio dot */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    newChannelType === 'forum' ? 'border-primary bg-primary text-primary-foreground' : 'border-[#80848e]',
                  )}>
                    {newChannelType === 'forum' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <MessagesSquare className="w-6 h-6 text-[#949ba4] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">Forum</div>
                    <div className="text-xs text-[#949ba4] leading-snug">
                      Create a space for organized discussions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CHANNEL NAME */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] block mb-2">
                {t('CHANNEL NAME')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]">
                  {newChannelType === 'text' && <Hash className="w-4 h-4" />}
                  {newChannelType === 'voice' && <Volume2 className="w-4 h-4" />}
                  {newChannelType === 'forum' && <MessagesSquare className="w-4 h-4" />}
                </div>
                <Input
                  value={newChannelName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewChannelName(newChannelType === 'voice' ? val : val.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="new-channel"
                  className="pl-9 pr-9 bg-[#1e1f22] border-none text-white placeholder:text-[#80848e] rounded-md h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                  required
                />
                <Smile className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#949ba4] pointer-events-none" />
              </div>
            </div>

            {/* 3. PRIVATE CHANNEL SWITCH */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-white mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Private Channel
                    </div>
                    <p className="text-xs text-[#949ba4] leading-snug">
                      Only selected members and roles will be able to view this channel.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={newChannelIsPrivate}
                  onCheckedChange={setNewChannelIsPrivate}
                  className="data-[state=checked]:bg-primary text-primary-foreground"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-[#2b2d31] flex items-center justify-end gap-2.5 mt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white hover:text-white hover:bg-white/10 text-xs font-semibold h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newChannelName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-semibold h-9 px-5 rounded-md shadow-sm transition-all"
            >
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
