import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Package, Copy, ExternalLink, Share2, Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { giftsApi, loadMidtransSnap, type GiftItem } from '@/features/billing/api/gifts-api';

const GIFT_OPTIONS = [
  {
    id: 'nectar_basic',
    name: 'Pollen Pass (1 Bulan)',
    price: 'Rp 29.000',
    description: 'Batas upload 50MB, badge Pollen 🌼 di profil & member list.',
    icon: '🌼',
    badge: 'Starter Gift',
  },
  {
    id: 'nectar_boost',
    name: 'Nectar VIP Pass (1 Bulan)',
    price: 'Rp 85.000',
    description: 'Batas pesan 4.000 karakter, 500MB upload, 2x Colony Boost, badge VIP 🍯.',
    icon: '🍯',
    badge: 'Paling Populer',
  },
  {
    id: 'boost_1m',
    name: '2x Colony Boost Pass (1 Bulan)',
    price: 'Rp 65.000',
    description: 'Langsung berikan 2 slot boost server untuk koloni favorit penerima.',
    icon: '💎',
    badge: 'Server Boost',
  },
  {
    id: 'nectar_1y',
    name: 'Nectar VIP Pass (1 Tahun)',
    price: 'Rp 850.000',
    description: '12 bulan akses penuh Nectar VIP + hemat 16% + badge eksklusif.',
    icon: '👑',
    badge: 'Best Value',
  },
];

export function GiftInventorySubtab() {
  const { t } = useTranslation();
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftingCount, setGiftingCount] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPurchaseGiftOpen, setIsPurchaseGiftOpen] = useState(false);
  const [purchasingType, setPurchasingType] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await giftsApi.getGiftsData();
      setGifts(data.gifts);
      setGiftingCount(data.giftingCount);
    } catch {
      const list = await giftsApi.getGifts();
      setGifts(list);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-fill redeem code from URL if present (?redeem=CODE)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('redeem');
      if (codeParam) {
        setRedeemCodeInput(codeParam.toUpperCase());
      }
    }
  }, []);

  const handleRedeemCode = async () => {
    if (!redeemCodeInput.trim()) {
      toast.error(t('Masukkan kode hadiah terlebih dahulu'));
      return;
    }
    setIsRedeeming(true);
    try {
      const res = await giftsApi.redeemCode(redeemCodeInput);
      if (res.success) {
        toast.success(t(res.message));
        setRedeemCodeInput('');
        await loadData();
      } else {
        toast.error(t(res.message));
      }
    } catch {
      toast.error(t('Gagal mengklaim kode hadiah'));
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleBuyGiftMidtrans = async (
    type: 'nectar_basic' | 'nectar_boost' | 'boost_1m' | 'nectar_1y',
  ) => {
    setPurchasingType(type);
    try {
      const tokenRes = await giftsApi.createGiftToken(type);
      if (!tokenRes.snapToken) {
        toast.error(t('Gagal mendapatkan token transaksi Midtrans'));
        return;
      }

      const clientKey = tokenRes.clientKey || import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
      await loadMidtransSnap(clientKey);

      if (window.snap) {
        window.snap.pay(tokenRes.snapToken, {
          onSuccess: async () => {
            toast.loading(t('Memverifikasi pembelian hadiah...'));
            const verifyRes = await giftsApi.verifyGiftPayment(tokenRes.orderId);
            toast.dismiss();
            if (verifyRes.success) {
              toast.success(
                t(`Hadiah berhasil dibeli! Kode voucher Anda: ${verifyRes.code || 'Tersedia di inventaris'}`),
                { duration: 8000 },
              );
              setIsPurchaseGiftOpen(false);
              await loadData();
            } else {
              toast.info(t('Pembayaran diterima, hadiah sedang diproses.'));
            }
          },
          onPending: async () => {
            toast.info(t('Menunggu penyelesaian pembayaran Midtrans...'));
            await giftsApi.verifyGiftPayment(tokenRes.orderId);
            await loadData();
          },
          onError: (err) => {
            toast.error(t('Pembayaran dibatalkan atau terjadi kesalahan'));
            console.error('Midtrans error:', err);
          },
          onClose: async () => {
            await giftsApi.verifyGiftPayment(tokenRes.orderId);
            await loadData();
          },
        });
      } else {
        // Fallback demo generation
        const gift = await giftsApi.purchaseGift(type);
        toast.success(t(`Hadiah demo dibuat! Kode: ${gift.code}`));
        setIsPurchaseGiftOpen(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.message || t('Gagal memproses pembelian hadiah'));
    } finally {
      setPurchasingType(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t('Kode hadiah disalin ke clipboard!'));
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dev-chat.anticeil.com';
    const link = `${origin}/?redeem=${code}`;
    navigator.clipboard.writeText(link);
    toast.success(t('Link klaim hadiah disalin ke clipboard! Bagikan ke teman Anda.'));
  };

  const BADGES = [
    { tier: 'Patron', required: 1, icon: '🎁', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30' },
    { tier: 'Champion', required: 2, icon: '💎', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
    { tier: 'Luminary', required: 3, icon: '🎀', color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30' },
    { tier: 'Icon', required: 6, icon: '🔮', color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' },
    { tier: 'Hero', required: 10, icon: '👑', color: 'from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
    { tier: 'Legend', required: 20, icon: '🏆', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Gift Inventory')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Kirim hadiah langganan Nectar ke teman dan klaim kode voucher unik.')}
          </p>
        </div>
        <Button
          variant="teal"
          size="sm"
          onClick={() => setIsPurchaseGiftOpen(true)}
          className="h-9 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Gift className="w-4 h-4" />
          <span>{t('Beli Hadiah Baru')}</span>
        </Button>
      </div>

      {/* 1. Redeem Codes */}
      <div id="gift-redeem-codes" className="space-y-3 scroll-mt-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{t('Redeem Codes')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            {t("Menerima kode hadiah Nectar atau Pollen? Masukkan kode unik Anda di bawah ini.")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
          <Input
            value={redeemCodeInput}
            onChange={(e) => setRedeemCodeInput(e.target.value)}
            placeholder="NECTAR-XXXX-YYYY"
            className="h-10 text-xs font-mono uppercase bg-card border-border tracking-wider"
          />
          <Button
            variant="teal"
            onClick={handleRedeemCode}
            disabled={isRedeeming || !redeemCodeInput.trim()}
            className="h-10 px-6 font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
          >
            {isRedeeming ? t('Mengklaim...') : t('Klaim Hadiah')}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* 2. The Gifting Badge */}
      <div id="gift-gifting-badge" className="space-y-3 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{t('The Gifting Badge')}</h3>
          <span className="text-xs font-semibold text-sidebar-primary">
            {giftingCount} {t('Hadiah Terkirim')}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
          {/* 6 Badges Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {BADGES.map((badge, idx) => {
              const isUnlocked = giftingCount >= badge.required;
              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded-2xl border p-3 flex flex-col items-center justify-between gap-2 bg-gradient-to-b shadow-2xs transition-all relative',
                    badge.color,
                    isUnlocked ? 'ring-2 ring-sidebar-primary scale-105' : 'opacity-60 grayscale-[30%]',
                  )}
                >
                  {isUnlocked && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                  <span className="text-2xl select-none">{badge.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{badge.tier}</div>
                    <div className="text-[10px] text-muted-foreground">{badge.required}x Gift</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
              {t('Badge Anda meningkat secara bertahap seiring banyaknya hadiah yang Anda kirimkan ke komunitas.')}
            </p>
            <Button
              size="sm"
              variant="teal"
              onClick={() => setIsPurchaseGiftOpen(true)}
              className="font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>{t('Send a Gift (Midtrans)')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* 3. Gifts I Purchased / Inventory */}
      <div id="gift-purchased" className="space-y-3 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{t('Gifts I Purchased')}</h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {gifts.length} {t('Voucher')}
          </span>
        </div>

        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-foreground">{t('Belum ada hadiah')}</div>
            <div className="text-[11px] text-muted-foreground">
              {t('Ingin berbagi kebahagiaan? Beli hadiah Nectar dan bagikan kodenya ke teman Anda!')}
            </div>
            <Button
              size="sm"
              variant="tealOutline"
              onClick={() => setIsPurchaseGiftOpen(true)}
              className="mt-3 text-xs"
            >
              + {t('Beli Hadiah Sekarang')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {gifts.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center text-sidebar-primary shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2 flex-wrap">
                      <span>{g.title}</span>
                      {g.redeemed ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {t('Telah Diklaim')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/40">
                          {t('Tersedia / Siap Dibagikan')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-sidebar-primary tracking-wider mt-1 select-all">
                      {g.code}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!g.redeemed && (
                    <>
                      <Button
                        size="sm"
                        variant="tealOutline"
                        onClick={() => handleCopyCode(g.code)}
                        className="h-8 text-xs font-semibold px-2.5 flex items-center gap-1.5"
                        title={t('Salin Kode Voucher')}
                      >
                        {copiedCode === g.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === g.code ? t('Tersalin') : t('Salin Kode')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="tealSecondary"
                        onClick={() => handleCopyLink(g.code)}
                        className="h-8 text-xs font-semibold px-2.5 flex items-center gap-1.5"
                        title={t('Salin Tautan Klaim')}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t('Bagikan')}</span>
                      </Button>
                    </>
                  )}
                  <div className="text-[10px] text-muted-foreground text-right pl-2 border-l border-border/60">
                    {new Date(g.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Purchase Gift via Midtrans Snap */}
      <Dialog open={isPurchaseGiftOpen} onOpenChange={setIsPurchaseGiftOpen}>
        <DialogContent
          showCloseButton={false}
          className="p-0 max-w-lg overflow-hidden bg-card border border-border rounded-2xl shadow-2xl z-[80]"
          overlayClassName="z-[80]"
        >
          <div className="p-5 border-b border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-sidebar-primary shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold text-foreground truncate">
                  {t('Beli Hadiah Langganan (Midtrans)')}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {t('Pilih paket hadiah untuk teman Anda. Kode voucher otomatis dibuat setelah pembayaran.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPurchaseGiftOpen(false)}
              className="size-8 flex items-center justify-center rounded-lg text-muted-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
              title={t('Tutup (ESC)')}
              aria-label={t('Tutup')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {GIFT_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className="p-4 rounded-xl border border-border/80 bg-background hover:border-sidebar-primary/60 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center text-xl shrink-0">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{opt.name}</span>
                      <span className="text-[10px] bg-sidebar-primary/20 text-sidebar-primary font-semibold px-1.5 py-0.5 rounded">
                        {opt.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</div>
                    <div className="text-xs font-bold text-sidebar-primary mt-1">{opt.price}</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => handleBuyGiftMidtrans(opt.id as any)}
                  disabled={purchasingType !== null}
                  className="h-8 text-xs font-bold px-3 shrink-0 cursor-pointer"
                >
                  {purchasingType === opt.id ? t('Memproses...') : t('Beli Sekarang')}
                </Button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>🔒 Didukung oleh Midtrans Sandbox QRIS & Bank Transfer</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
