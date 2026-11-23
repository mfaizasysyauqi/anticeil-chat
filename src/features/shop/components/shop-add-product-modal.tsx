import React from 'react';
import {
  Pencil,
  Plus,
  UploadCloud,
  Trash2,
  Loader2,
  Check,
  Sparkles,
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
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
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
              {newProductForm.category === 'avatar_decoration'
                ? t('File Animasi Bingkai / Avatar Decoration (GIF / PNG)')
                : newProductForm.category === 'nameplate'
                ? t('File Animasi Nameplate / Strip Profil (GIF / PNG / WebP)')
                : newProductForm.category === 'profile_effect'
                ? t('File Animasi Efek Profil / Profile Effect (GIF / PNG / WebP)')
                : t('File Animasi GIF / Gambar (Upload ke Cloudflare R2)')}
            </label>
            <input
              ref={productFileInputRef}
              type="file"
              accept="image/gif,image/png,image/webp,image/*"
              onChange={onProductFileChange}
              className="hidden"
            />

            {/* ── Discord-Style Mannequin Avatar Preview for Avatar Decorations ── */}
            {newProductForm.category === 'avatar_decoration' ? (
              <div className="rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-muted/20 p-3.5 flex flex-col items-center justify-center space-y-2.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Pratinjau Manekin Avatar (Discord Style)')}</span>
                </div>

                {/* Circular Mannequin Avatar with Anticeil Logo */}
                <div
                  onClick={() => productFileInputRef.current?.click()}
                  className="relative size-24 sm:size-26 rounded-full bg-[#1e1f22] border-2 border-border/80 flex items-center justify-center shadow-2xl z-10 select-none cursor-pointer group/mannequin transition-transform hover:scale-105"
                  title={t('Klik untuk upload / ganti file dekorasi avatar')}
                >
                  {/* Anticeil Logo Silhouette (mirroring Discord Clyde mannequin) */}
                  <div className="size-12 text-muted-foreground/45 flex items-center justify-center pointer-events-none select-none transition-colors group-hover/mannequin:text-muted-foreground/70">
                    <AnticeilLogo className="size-full fill-current" />
                  </div>

                  {/* Overlaid Animated Decoration / Frame */}
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Avatar Decoration Preview"
                      className="absolute -inset-4 sm:-inset-4.5 size-[calc(100%+32px)] sm:size-[calc(100%+36px)] object-contain pointer-events-none select-none z-20 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200"
                    />
                  ) : (
                    <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-primary/40 pointer-events-none select-none animate-pulse" />
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center max-w-[280px] leading-tight">
                  {productImagePreview
                    ? t('Bingkai dekorasi dipasang mengelilingi avatar manekin logo Anticeil.')
                    : t('Klik lingkaran manekin atau tombol di bawah untuk upload animasi bingkai avatar.')}
                </p>

                {/* Actions / Upload Bar */}
                {productImagePreview ? (
                  <div className="flex items-center gap-2 pt-1">
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
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => productFileInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{t('Pilih File Dekorasi (GIF / PNG)')}</span>
                  </Button>
                )}
              </div>
            ) : newProductForm.category === 'nameplate' ? (
              /* ── Discord-Style Mannequin Capsule Preview for Nameplates ── */
              <div className="rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-muted/20 p-3.5 flex flex-col items-center justify-center space-y-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Pratinjau Manekin Nameplate (Discord Style)')}</span>
                </div>

                {/* Nameplate Strip Container (identical to Discord nameplate mannequin) */}
                <div
                  onClick={() => productFileInputRef.current?.click()}
                  className="relative w-full max-w-[340px] h-14 sm:h-15 rounded-2xl bg-[#111214] border border-border/80 flex items-center px-3.5 gap-3 overflow-hidden shadow-2xl z-10 select-none cursor-pointer group/nameplate transition-transform hover:scale-[1.02]"
                  title={t('Klik untuk upload / ganti file animasi nameplate')}
                >
                  {/* Background Graphic / Animation of the Nameplate */}
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Nameplate Preview"
                      className="absolute inset-0 size-full object-cover pointer-events-none select-none z-0 opacity-95 animate-in fade-in duration-200"
                    />
                  ) : (
                    <div className="absolute inset-0 size-full bg-gradient-to-r from-purple-900/20 via-primary/15 to-blue-900/20 border-2 border-dashed border-primary/30 rounded-2xl pointer-events-none" />
                  )}

                  {/* Scrim overlay to ensure avatar and text stand out crisp like Discord */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none z-[1]" />

                  {/* Left Mannequin Circular Avatar with Anticeil Logo */}
                  <div className="relative size-8 sm:size-9 rounded-full bg-[#2b2d31] border border-black/40 flex items-center justify-center shrink-0 z-10 shadow-md">
                    <div className="size-4.5 sm:size-5 text-muted-foreground/60 flex items-center justify-center pointer-events-none">
                      <AnticeilLogo className="size-full fill-current" />
                    </div>
                    {/* Status Dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#23a55a] border-2 border-[#111214]" />
                  </div>

                  {/* Translucent Rounded Pill Placeholder for Username (Exactly like Discord) */}
                  <div className="w-28 sm:w-36 h-4 sm:h-4.5 rounded-full bg-white/20 backdrop-blur-md z-10" />
                </div>

                <p className="text-[10px] text-muted-foreground text-center max-w-[300px] leading-tight">
                  {productImagePreview
                    ? t('Desain nameplate terpasang pada strip profil dengan manekin logo Anticeil.')
                    : t('Klik strip manekin di atas atau tombol di bawah untuk upload desain nameplate.')}
                </p>

                {/* Actions / Upload Bar */}
                {productImagePreview ? (
                  <div className="flex items-center gap-2 pt-0.5">
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
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => productFileInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{t('Pilih File Nameplate (GIF / PNG)')}</span>
                  </Button>
                )}
              </div>
            ) : newProductForm.category === 'profile_effect' ? (
              /* ── Discord-Style Mannequin Card Preview for Profile Effects ── */
              <div className="rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-muted/20 p-3.5 flex flex-col items-center justify-center space-y-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Pratinjau Manekin Efek Profil (Discord Style)')}</span>
                </div>

                {/* Profile Card Mockup Container (Identical to Discord Profile Effect Mannequin) */}
                <div
                  onClick={() => productFileInputRef.current?.click()}
                  className="relative w-full max-w-[280px] sm:max-w-[300px] rounded-2xl bg-[#1e1f22] border border-border/80 overflow-hidden shadow-2xl z-10 select-none cursor-pointer group/profileeffect transition-transform hover:scale-[1.02]"
                  title={t('Klik untuk upload / ganti file efek profil')}
                >
                  {/* Top Banner area */}
                  <div className="h-16 bg-[#111214] border-b border-white/5 relative" />

                  {/* Body area */}
                  <div className="p-3 pt-0 relative">
                    {/* Left Avatar Overlapping Banner */}
                    <div className="relative -mt-6 size-14 sm:size-15 rounded-full bg-[#2b2d31] border-[3px] border-[#1e1f22] flex items-center justify-center shrink-0 z-10 shadow-lg">
                      <div className="size-7 sm:size-8 text-muted-foreground/60 flex items-center justify-center pointer-events-none">
                        <AnticeilLogo className="size-full fill-current" />
                      </div>
                      {/* Status Dot */}
                      <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-[#23a55a] border-2 border-[#1e1f22]" />
                    </div>

                    {/* Discord Placeholder Lines for Name & Bio */}
                    <div className="mt-2.5 space-y-1.5">
                      <div className="w-28 sm:w-32 h-3.5 rounded-full bg-white/20" />
                      <div className="w-18 sm:w-20 h-2.5 rounded-full bg-white/10" />
                      <div className="pt-1.5 space-y-1">
                        <div className="w-44 sm:w-48 h-2 rounded-full bg-white/10" />
                        <div className="w-32 sm:w-36 h-2 rounded-full bg-white/5" />
                      </div>
                    </div>
                  </div>

                  {/* Overlaid Animated Profile Effect (cascading across the card like Discord) */}
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Profile Effect Preview"
                      className="absolute inset-0 size-full object-cover pointer-events-none select-none z-20 pointer-events-none mix-blend-screen drop-shadow-[0_0_16px_rgba(0,0,0,0.8)] animate-in fade-in duration-200"
                    />
                  ) : (
                    <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-2xl pointer-events-none animate-pulse" />
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center max-w-[300px] leading-tight">
                  {productImagePreview
                    ? t('Efek profil terpasang pada kartu profil manekin logo Anticeil.')
                    : t('Klik kartu manekin di atas atau tombol di bawah untuk upload animasi efek profil.')}
                </p>

                {/* Actions / Upload Bar */}
                {productImagePreview ? (
                  <div className="flex items-center gap-2 pt-0.5">
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
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => productFileInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{t('Pilih File Efek Profil (GIF / PNG)')}</span>
                  </Button>
                )}
              </div>
            ) : productImagePreview ? (
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
