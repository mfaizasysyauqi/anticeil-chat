import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony } from '@/chat/chat-types';

interface DeleteColonyTabProps {
  activeColony: Colony;
  onDeleteHub: (hub: Colony) => void;
  onClose: () => void;
  onNavigateSection?: (section: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DeleteColonyTab({
  activeColony,
  onDeleteHub,
  onClose,
  onNavigateSection,
  t,
}: DeleteColonyTabProps) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmName.trim() === activeColony.name.trim();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      onClose();
      onDeleteHub(activeColony);
      toast.success(t(`Server "${activeColony.name}" berhasil dihapus.`));
    } catch {
      toast.error(t('Gagal menghapus server'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg pb-16 text-foreground">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-destructive">
          {t("Delete '{{name}}'", { name: activeColony.name })}
        </h2>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-destructive/30 shadow-2xl space-y-5">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {t(
              'Are you sure you want to delete {{name}}? This action cannot be undone.',
              { name: activeColony.name }
            )}
          </p>
        </div>

        {/* Enter Server Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t('Enter Server Name')}
          </label>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={activeColony.name}
            className="text-xs bg-muted border-border h-9"
          />
          <span className="text-[11px] text-muted-foreground block">
            {t('Ketik')} <span className="font-bold text-foreground font-mono">"{activeColony.name}"</span> {t('untuk mengonfirmasi penghapusan.')}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onNavigateSection ? onNavigateSection('profile') : onClose()}
            className="text-xs h-9 px-4 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t('Cancel')}
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className={cn(
              'text-xs font-semibold h-9 px-5 rounded-lg cursor-pointer transition-colors',
              isConfirmed
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                : 'bg-red-950/40 text-red-400/40 border border-red-900/30 cursor-not-allowed'
            )}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {isDeleting ? t('Deleting...') : t('Delete Server')}
          </Button>
        </div>
      </div>
    </div>
  );
}
