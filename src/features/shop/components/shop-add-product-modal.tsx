import React from 'react';
import {
  Pencil,
  Plus,
  UploadCloud,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormDropdown } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { DIALOG_STYLES } from '@/lib/layout-constants';
import type { ShopItem } from '../api/shop-api';

export interface ShopAddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: ShopItem | null;
  newProductForm: any;
  setNewProductForm: React.Dispatch<React.SetStateAction<any>>;
  productImagePreview: string | null;
  productImageFile: File | null;
  isCreatingProduct: boolean;
  onSaveProduct: (e: React.FormEvent) => void;
  onProductFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveProductImage: () => void;
  productFileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ShopAddProductModal({
  open,
  onOpenChange,
  editingProduct,
  newProductForm,
  setNewProductForm,
  productImagePreview,
  productImageFile,
  isCreatingProduct,
  onSaveProduct,
  onProductFileChange,
  onRemoveProductImage,
  productFileInputRef,
}: ShopAddProductModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_STYLES.MODAL_STANDARD}>
        <DialogHeader>
          <DialogTitle className={DIALOG_STYLES.HEADER_TITLE}>
            {editingProduct ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            <span>{editingProduct ? t('Edit Item Katalog Shop') : t('Tambah Produk ke Database Shop')}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSaveProduct} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">{t('Nama Produk')}</label>
            <Input
              value={newProductForm.name}
              onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
              placeholder="Contoh: Neon Cyber Shield"
              className="h-8 text-xs bg-muted/40 border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <FormDropdown
              label={t('Kategori')}
              value={newProductForm.category}
              onChange={(val) => setNewProductForm({ ...newProductForm, category: val as any })}
              size="sm"
              options={[
                { value: 'avatar_decoration', label: 'Bingkai Profil (Animated Frame)' },
                { value: 'profile_effect', label: 'Overlay Profil (Animated Effect)' },
                { value: 'nameplate', label: 'Namecard (Animated Nameplate)' },
                { value: 'bundle', label: 'Bundel Animasi (3pc)' },
              ]}
            />

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Koleksi Anticeil')}</label>
              <Input
                value={newProductForm.collection}
                onChange={(e) => setNewProductForm({ ...newProductForm, collection: e.target.value })}
                placeholder="Contoh: Anticeil Cyber Core"
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>
          </div>

          {/* Toggle Allow Dew vs Only IDR */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/20">
            <div className="space-y-0.5 pr-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                <span>💧 {t('Bisa Dibeli dengan Dew')}</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                {newProductForm.allowDew
                  ? t('Item ini bisa dibeli menggunakan Dew maupun Uang Asli (IDR).')
                  : t('Item ini eksklusif hanya bisa dibeli menggunakan Uang Asli (IDR).')}
              </p>
            </div>
            <Switch
              checked={newProductForm.allowDew}
              onCheckedChange={(checked) =>
                setNewProductForm((f: any) => ({
                  ...f,
                  allowDew: checked,
                  priceDew: checked ? (f.priceDew || 500) : 0,
                }))
              }
            />
          </div>

          <div className={cn("grid gap-3", newProductForm.allowDew ? "grid-cols-2" : "grid-cols-1")}>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">{t('Harga IDR (Uang Asli)')}</label>
              <Input
                type="number"
                value={newProductForm.priceIdr}
                onChange={(e) => setNewProductForm({ ...newProductForm, priceIdr: Number(e.target.value) })}
                className="h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            {newProductForm.allowDew && (
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">{t('Harga Dew (Poin)')}</label>
                <Input
                  type="number"
                  value={newProductForm.priceDew}
                  onChange={(e) => setNewProductForm({ ...newProductForm, priceDew: Number(e.target.value) })}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              {t('File Animasi GIF / Gambar (Upload ke Cloudflare R2)')}
            </label>
            <input
              ref={productFileInputRef}
              type="file"
              accept="image/gif,image/png,image/webp,image/*"
              onChange={onProductFileChange}
              className="hidden"
            />

            {productImagePreview ? (
              <div className="relative group rounded-xl border border-border/80 bg-muted/20 overflow-hidden p-2">
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-black/50 flex items-center justify-center p-2">
                  <img
                    src={productImagePreview}
                    alt="Product Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => productFileInputRef.current?.click()}
                      className="h-7 text-xs gap-1.5 shadow-md cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{t('Ganti File')}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={onRemoveProductImage}
                      className="h-7 text-xs gap-1.5 shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('Hapus')}</span>
                    </Button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span className="truncate max-w-[240px]">
                    {productImageFile ? productImageFile.name : t('File animasi tersimpan')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium shrink-0">
                    {productImageFile ? t('Pratinjau lokal • disimpan ke R2') : t('Tersimpan di Cloudflare R2')}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => productFileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer p-3 group"
              >
                <div className="p-1.5 rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    {t('Klik untuk upload file animasi GIF atau gambar')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('Format GIF (transparan / loop), PNG, WebP. Pratinjau lokal sebelum disimpan ke Cloudflare R2.')}
                  </p>
                </div>
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">{t('Deskripsi Singkat')}</label>
            <Input
              value={newProductForm.description}
              onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
              placeholder="Efek visual neon berkilau untuk kartu profil Anticeil..."
              className="h-8 text-xs bg-muted/40 border-border"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreatingProduct}
              className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer"
            >
              {isCreatingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{t('Simpan ke Database')}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
