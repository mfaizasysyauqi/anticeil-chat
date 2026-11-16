import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { KanbanPriority } from '../types';
import type { ColonyMember } from '@/chat/chat-types';

export interface KanbanCardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  defaultColumnId: string;
  displayMembers: ColonyMember[];
  currentUser: any;
  isSubmitting: boolean;
  onSubmit: (cardData: {
    title: string;
    description?: string;
    columnId: string;
    priority: KanbanPriority;
    assigneeId: string;
    assigneeName: string;
    assigneeAvatar?: string;
    dueDate?: string;
    tags?: string[];
  }) => Promise<void>;
}

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export function KanbanCardDialog({
  isOpen,
  onOpenChange,
  channelName,
  defaultColumnId,
  displayMembers,
  currentUser,
  isSubmitting,
  onSubmit,
}: KanbanCardDialogProps) {
  const [targetColumnId, setTargetColumnId] = useState(defaultColumnId);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPriority, setCardPriority] = useState<KanbanPriority>('medium');
  const [cardAssigneeId, setCardAssigneeId] = useState(currentUser?.id || '');
  const [cardDueDate, setCardDueDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DD'));
  const [cardTags, setCardTags] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

    let assigneeName = currentUser?.firstName || 'Saya';
    let assigneeAvatar = currentUser?.imageUrl;

    if (cardAssigneeId !== (currentUser?.id || 'current-user')) {
      const assigned = displayMembers.find((m) => m.id === cardAssigneeId);
      if (assigned) {
        assigneeName = assigned.name;
        assigneeAvatar = assigned.avatar || undefined;
      }
    }

    const tagsArray = cardTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({
      title: cardTitle.trim(),
      description: cardDesc.trim() || undefined,
      columnId: targetColumnId,
      priority: cardPriority,
      assigneeId: cardAssigneeId,
      assigneeName,
      assigneeAvatar,
      dueDate: cardDueDate || undefined,
      tags: tagsArray,
    });

    setCardTitle('');
    setCardDesc('');
    setCardTags('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 bg-background border-border text-foreground shadow-2xl rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-3.5">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-sm font-bold text-foreground">
              Tambah Kartu Tugas
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tambahkan tugas baru ke papan #{channelName}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Judul Tugas *
              </label>
              <Input
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="Contoh: Implementasi sistem autentikasi"
                className="h-8 text-xs bg-muted/40 border-border"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Deskripsi Tugas
              </label>
              <textarea
                value={cardDesc}
                onChange={(e) => setCardDesc(e.target.value)}
                placeholder="Detail instruksi atau rincian pekerjaan..."
                className="w-full rounded-md border border-border bg-muted/40 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Kolom Status
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-8 justify-between text-xs bg-muted/40 hover:bg-muted/70 border-border font-normal text-foreground px-2.5 focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                    >
                      <span className="truncate">
                        {DEFAULT_COLUMNS.find((c) => c.id === targetColumnId)?.title || 'Pilih Kolom'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[150px] bg-card border-border text-foreground shadow-2xl p-1 z-[100]">
                    {DEFAULT_COLUMNS.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => setTargetColumnId(c.id)}
                        className={cn(
                          'text-xs cursor-pointer justify-between py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                          targetColumnId === c.id && 'bg-primary/15 text-primary font-semibold'
                        )}
                      >
                        <span>{c.title}</span>
                        {targetColumnId === c.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Tingkat Prioritas
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-8 justify-between text-xs bg-muted/40 hover:bg-muted/70 border-border font-normal text-foreground px-2.5 focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                    >
                      <span className="capitalize">{cardPriority}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[150px] bg-card border-border text-foreground shadow-2xl p-1 z-[100]">
                    {[
                      { id: 'low', label: 'Low', color: 'text-slate-400' },
                      { id: 'medium', label: 'Medium', color: 'text-blue-400' },
                      { id: 'high', label: 'High', color: 'text-amber-400' },
                      { id: 'urgent', label: 'Urgent', color: 'text-rose-400' },
                    ].map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => setCardPriority(p.id as KanbanPriority)}
                        className={cn(
                          'text-xs cursor-pointer justify-between py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                          cardPriority === p.id && 'bg-primary/15 text-primary font-semibold'
                        )}
                      >
                        <span className={p.color}>{p.label}</span>
                        {cardPriority === p.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Penerima Tugas
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-8 justify-between text-xs bg-muted/40 hover:bg-muted/70 border-border font-normal text-foreground px-2.5 focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                    >
                      <span className="truncate">
                        {cardAssigneeId === (currentUser?.id || 'current-user')
                          ? currentUser?.firstName || 'Saya Sendiri'
                          : displayMembers.find((m) => m.id === cardAssigneeId)?.name || 'Pilih Penerima'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[180px] max-h-56 overflow-y-auto bg-card border-border text-foreground shadow-2xl p-1 z-[100]">
                    <DropdownMenuItem
                      onClick={() => setCardAssigneeId(currentUser?.id || 'current-user')}
                      className={cn(
                        'text-xs cursor-pointer justify-between py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                        (cardAssigneeId === currentUser?.id || cardAssigneeId === 'current-user') && 'bg-primary/15 text-primary font-semibold'
                      )}
                    >
                      <span>{currentUser?.firstName || 'Saya Sendiri'}</span>
                      {(cardAssigneeId === currentUser?.id || cardAssigneeId === 'current-user') && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                    {displayMembers.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setCardAssigneeId(m.id)}
                        className={cn(
                          'text-xs cursor-pointer justify-between py-1.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                          cardAssigneeId === m.id && 'bg-primary/15 text-primary font-semibold'
                        )}
                      >
                        <span className="truncate">{m.name}</span>
                        {cardAssigneeId === m.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Tenggat Waktu
                </label>
                <Input
                  type="date"
                  value={cardDueDate}
                  onChange={(e) => setCardDueDate(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-border [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Label / Tag (Pisahkan koma)
              </label>
              <Input
                value={cardTags}
                onChange={(e) => setCardTags(e.target.value)}
                placeholder="Frontend, Bug, Priority"
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>
          </DialogBody>

          <DialogFooter className="pt-2.5 mt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !cardTitle.trim()}
              className="h-8 text-xs font-semibold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kartu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
