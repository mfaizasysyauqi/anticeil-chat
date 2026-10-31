import React from 'react';
import { FolderPlus } from 'lucide-react';
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

export interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  setCategoryName: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  categoryName,
  setCategoryName,
  onSubmit,
  t,
}: CreateCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FolderPlus className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              {t('Buat Kategori')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t('Kategori membantu mengelompokkan channel teks dan suara agar server lebih terorganisir.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('NAMA KATEGORI')}
              </label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value.toUpperCase())}
                placeholder="misal: INFORMASI atau GAMING"
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground text-xs uppercase"
                autoFocus
                required
              />
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!categoryName.trim()}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {t('Buat Kategori')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

