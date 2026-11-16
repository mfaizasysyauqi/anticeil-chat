import React from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { categoriesApi, type ColonyCategory } from '../../api/categories-api';

export interface SidebarEditCategoryDialogProps {
  editingCategory: ColonyCategory | null;
  onClose: () => void;
  onUpdateCategory?: (categoryId: string, name: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SidebarEditCategoryDialog: React.FC<SidebarEditCategoryDialogProps> = ({
  editingCategory,
  onClose,
  onUpdateCategory,
  t,
}) => {
  const [editCategoryName, setEditCategoryName] = React.useState('');

  React.useEffect(() => {
    if (editingCategory) {
      setEditCategoryName(editingCategory.name);
    }
  }, [editingCategory]);

  return (
    <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Pencil className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold">{t('Edit Kategori')}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t('Ubah nama kategori colony Anda.')}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingCategory || !editCategoryName.trim()) return;
            const newName = editCategoryName.trim().toUpperCase();
            if (onUpdateCategory) {
              onUpdateCategory(editingCategory.id, newName);
            } else {
              categoriesApi.updateCategory({
                ...editingCategory,
                name: newName,
              });
              toast.success(t(`Kategori berhasil diubah menjadi ${newName}`));
            }
            onClose();
          }}
        >
          <DialogBody className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t('NAMA KATEGORI')}
              </label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value.toUpperCase())}
                className="bg-muted/40 border-border text-foreground text-xs uppercase"
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
              onClick={onClose}
              className="text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!editCategoryName.trim()}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {t('Simpan Perubahan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
