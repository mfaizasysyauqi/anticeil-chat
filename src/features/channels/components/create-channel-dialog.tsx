import React, { useState, useEffect } from 'react';
import {
  Hash,
  Volume2,
  MessagesSquare,
  Smile,
  Lock,
  Columns3,
  Megaphone,
  Podcast,
  Shield,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import type { Colony, ColonyChannelType, CommunityCustomRole } from '@/chat/chat-types';
import type { ColonyCategory } from '../api/categories-api';

export interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeColony: Colony | null;
  newChannelCategory: string;
  newChannelType: ColonyChannelType;
  setNewChannelType: (type: ColonyChannelType) => void;
  newChannelName: string;
  setNewChannelName: (name: string) => void;
  newChannelIsPrivate: boolean;
  setNewChannelIsPrivate: (isPrivate: boolean) => void;
  onCreateChannelSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
  categories?: ColonyCategory[];
  roles?: CommunityCustomRole[];
  targetCategoryId?: string;
  setTargetCategoryId?: (id: string) => void;
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
  categories,
  roles = [],
  targetCategoryId,
  setTargetCategoryId,
}: CreateChannelDialogProps) {
  const [stageStep, setStageStep] = useState<1 | 2>(1);
  const [selectedModRoles, setSelectedModRoles] = useState<string[]>([]);
  const [modSearch, setModSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setStageStep(1);
      setSelectedModRoles([]);
      setModSearch('');
    }
  }, [open]);

  const channelTypes = [
    {
      type: 'text' as const,
      icon: Hash,
      title: t('Text'),
      description: t('Send messages, images, GIFs, emoji, opinions, and puns'),
    },
    {
      type: 'voice' as const,
      icon: Volume2,
      title: t('Voice'),
      description: t('Hang out together with voice, video, and screen share'),
    },
    {
      type: 'forum' as const,
      icon: MessagesSquare,
      title: t('Forum'),
      description: t('Create a space for organized discussions'),
    },
    {
      type: 'announcement' as const,
      icon: Megaphone,
      title: t('Announcement'),
      description: t('Important updates for people in and out of the server'),
    },
    {
      type: 'stage' as const,
      icon: Podcast,
      title: t('Stage'),
      description: t('Host events, panels, and Q&As for an audience'),
    },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelType === 'stage' && stageStep === 1) {
      setStageStep(2);
      return;
    }
    onCreateChannelSubmit(e);
  };

  const displayRoles = roles.length > 0 ? roles : [
    { id: 'role_mod', name: 'Moderator', color: '#5865F2', colonyId: activeColony?.id || 'col', permissions: [] },
    { id: 'role_admin', name: 'Admin', color: '#f23f43', colonyId: activeColony?.id || 'col', permissions: [] },
    { id: 'role_new', name: 'new role', color: '#23a55a', colonyId: activeColony?.id || 'col', permissions: [] },
  ];

  const filteredRoles = displayRoles.filter((r) =>
    r.name.toLowerCase().includes(modSearch.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className={cn(LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
        <form onSubmit={handleFormSubmit} className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
              {stageStep === 2 ? t('Add Stage moderators') : t('Create Channel')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {stageStep === 2 ? (
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <Podcast className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{newChannelName}</span>
                </span>
              ) : (
                <>
                  {t('in')} {newChannelCategory === 'CHANNELS' ? (activeColony?.name || t('Channels')) : t('Direct Messages')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          {stageStep === 1 ? (
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

              {/* 1.5 CATEGORY SELECTION */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t('KATEGORI')}
                </label>
                <Select
                  value={targetCategoryId || 'none'}
                  onValueChange={(val) => setTargetCategoryId?.(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full bg-muted/40 hover:bg-muted/60 border border-border text-foreground rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-primary shadow-xs">
                    <SelectValue placeholder={t('Tanpa Kategori (Uncategorized)')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground shadow-2xl rounded-xl z-[60]">
                    <SelectItem value="none" className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer">
                      {t('Tanpa Kategori (Uncategorized)')}
                    </SelectItem>
                    {(categories || []).map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      >
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {newChannelType === 'announcement' && <Megaphone className="w-3.5 h-3.5" />}
                    {newChannelType === 'stage' && <Podcast className="w-3.5 h-3.5" />}
                  </div>
                  <Input
                    value={newChannelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewChannelName(newChannelType === 'voice' ? val : val.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder={newChannelType === 'stage' ? 'new-stage' : t('new-channel')}
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
                        {t('Private Channel')}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {t('Only selected members and roles will be able to view this channel.')}
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
          ) : (
            <DialogBody className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  "Stage moderators are Speakers who can add and remove other Speakers. They can also start the Stage event. Stage moderators don't have to be mods of the server.",
                )}
              </p>

              {/* Search Box */}
              <div className="space-y-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={modSearch}
                    onChange={(e) => setModSearch(e.target.value)}
                    placeholder="e.g. Moderators, @wumpus"
                    className="pl-8.5 bg-muted/40 border-border text-xs h-9 rounded-lg"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  {t('Add individual members by starting with @, or type a role name')}
                </span>
              </div>

              {/* Roles List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Roles')}
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredRoles.map((role) => {
                    const isChecked = selectedModRoles.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        onClick={() => {
                          setSelectedModRoles((prev) =>
                            isChecked ? prev.filter((id) => id !== role.id) : [...prev, role.id],
                          );
                        }}
                        className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {}}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground">
                            {role.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                          {t('Role')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogBody>
          )}

          {/* Footer */}
          <DialogFooter className="pt-3 mt-2 border-t border-border/40">
            {stageStep === 2 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStageStep(1)}
                  className="text-xs font-semibold h-8 px-3 cursor-pointer"
                >
                  {t('Back')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-5 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  {selectedModRoles.length > 0 ? t('Create Channel') : t('Skip')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs font-semibold h-8 px-3 cursor-pointer"
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newChannelName.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  {newChannelType === 'stage' ? t('Next') : t('Create Channel')}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
