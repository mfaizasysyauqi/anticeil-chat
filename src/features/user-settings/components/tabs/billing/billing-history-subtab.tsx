import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Info,
  Trash2,
  FileText,
  Search,
  Check,
  Copy,
  Printer,
  Sparkles,
  Gem,
  Gift,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  billingApi,
  type PaymentMethodItem,
  type TransactionItem,
} from '@/features/billing/api/billing-api';

export function BillingHistorySubtab() {
  const { t } = useTranslation();
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'subscription' | 'boost' | 'gift'>('all');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadBillingData = async () => {
    try {
      const [pms, txs] = await Promise.all([
        billingApi.getPaymentMethods(),
        billingApi.getTransactions(),
      ]);
      setSavedPaymentMethods(pms);
      setTransactions(txs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleAddPaymentMethod = async () => {
    setIsAdding(true);
    try {
      const pm = await billingApi.addPaymentMethod({
        name: 'QRIS / GoPay (Midtrans)',
        type: 'e-wallet',
        details: 'Instant QRIS & GoPay Auto-Debit',
        isDefault: savedPaymentMethods.length === 0,
      });
      setSavedPaymentMethods((prev) => [...prev, pm]);
      toast.success(t('Metode pembayaran QRIS / GoPay berhasil ditambahkan!'));
    } catch {
      toast.error(t('Gagal menambahkan metode pembayaran'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await billingApi.deletePaymentMethod(id);
      setSavedPaymentMethods((prev) => prev.filter((p) => p.id !== id));
      toast.success(t('Metode pembayaran dihapus'));
    } catch {
      toast.error(t('Gagal menghapus metode pembayaran'));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(t('ID Transaksi disalin ke clipboard'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Category filter
      if (selectedCategory === 'subscription') {
        if (!tx.description.toLowerCase().includes('nectar') && !tx.description.toLowerCase().includes('pollen') && !tx.description.toLowerCase().includes('langganan')) {
          return false;
        }
      } else if (selectedCategory === 'boost') {
        if (!tx.description.toLowerCase().includes('boost')) return false;
      } else if (selectedCategory === 'gift') {
        if (!tx.description.toLowerCase().includes('hadiah') && !tx.description.toLowerCase().includes('gift')) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesMethod = tx.paymentMethod.toLowerCase().includes(q);
        if (!matchesDesc && !matchesId && !matchesMethod) return false;
      }

      return true;
    });
  }, [transactions, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Billing & Transactions')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t('Kelola metode pembayaran, tagihan langganan Nectar, Colony Boost, dan kuitansi transaksi resmi.')}
          </p>
        </div>
      </div>

      {/* ── 1. PAYMENT METHODS ── */}
      <div id="billing-payment-methods" className="space-y-3 scroll-mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t('Payment Methods')}
            </h3>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <span>Country/Region: Indonesia (Midtrans Gateway)</span>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          {savedPaymentMethods.length === 0 ? (
            <div>
              <div className="text-xs font-bold text-foreground">
                {t('No payment method saved')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t('Checkout faster by saving a payment method')}
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {savedPaymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between gap-3 pr-2">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>{pm.name}</span>
                        {pm.isDefault && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/30">
                            Utama
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {pm.details}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePaymentMethod(pm.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title={t('Hapus metode pembayaran')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleAddPaymentMethod}
            disabled={isAdding}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer shrink-0"
          >
            {isAdding ? t('Menambahkan...') : t('Add Payment Method')}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* ── 2. TRANSACTION HISTORY ── */}
      <div id="billing-transaction-history" className="space-y-4 scroll-mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t('Transaction History')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('Daftar riwayat pembayaran terverifikasi Midtrans Snap.')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari ID atau tagihan...')}
              className="h-8 pl-8 text-xs bg-muted/40 rounded-xl"
            />
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'all', label: 'Semua Transaksi' },
            { id: 'subscription', label: 'Langganan Nectar' },
            { id: 'boost', label: 'Colony Boost' },
            { id: 'gift', label: 'Hadiah / Gift' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Transactions Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2 shadow-xs">
            <div className="size-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-xl mx-auto shadow-2xs select-none">
              🧾
            </div>
            <div className="text-xs font-bold text-foreground">
              {searchQuery
                ? t('Tidak ada transaksi yang sesuai dengan pencarian.')
                : t("You haven't made any transactions yet.")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t('Semua transaksi pembelian paket Nectar atau Colony Boost akan tercatat di sini.')}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden shadow-xs">
            {filteredTransactions.map((tx) => {
              const isNectar =
                tx.description.toLowerCase().includes('nectar') ||
                tx.description.toLowerCase().includes('pollen');
              const isBoost = tx.description.toLowerCase().includes('boost');
              const isGift =
                tx.description.toLowerCase().includes('hadiah') ||
                tx.description.toLowerCase().includes('gift');

              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/15 transition-colors"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'size-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs',
                        isNectar
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : isBoost
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : isGift
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20',
                      )}
                    >
                      {isNectar ? (
                        <Sparkles className="w-5 h-5" />
                      ) : isBoost ? (
                        <Gem className="w-5 h-5 fill-current" />
                      ) : isGift ? (
                        <Gift className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{tx.description}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0 font-bold capitalize',
                            tx.status === 'settlement'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30',
                          )}
                        >
                          {tx.status === 'settlement' ? 'Berhasil' : tx.status}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(tx.id)}
                          className="font-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                          title={t('Salin ID Transaksi')}
                        >
                          <span>{tx.id}</span>
                          {copiedId === tx.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60" />
                          )}
                        </button>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                        <span>•</span>
                        <span>
                          {new Date(tx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Receipt View Button */}
                  <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-center shrink-0">
                    <div className="text-sm font-extrabold text-foreground font-mono">
                      {tx.currency} {tx.amount.toLocaleString('id-ID')}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="text-xs h-7 px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-muted/60"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>{t('Invoice')}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. INVOICE / RECEIPT MODAL DIALOG ── */}
      <Dialog
        open={Boolean(selectedTxForReceipt)}
        onOpenChange={(open) => !open && setSelectedTxForReceipt(null)}
      >
        <DialogContent className="max-w-md p-6 bg-card border-border rounded-2xl space-y-5">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
                  AC
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground">
                    {t('Bukti Pembayaran Resmi')}
                  </DialogTitle>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Anticeil Technologies Inc.
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                LUNAS (SETTLEMENT)
              </Badge>
            </div>
          </DialogHeader>

          {selectedTxForReceipt && (
            <div className="space-y-4 pt-1 text-xs">
              {/* Invoice Meta Grid */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('Nomor Invoice')}</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">
                    INV-{selectedTxForReceipt.id.replace('trx_', '').toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('Tanggal Transaksi')}</div>
                  <div className="font-medium text-foreground mt-0.5">
                    {new Date(selectedTxForReceipt.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('Metode Pembayaran')}</div>
                  <div className="font-medium text-foreground mt-0.5">
                    {selectedTxForReceipt.paymentMethod}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('Payment Gateway')}</div>
                  <div className="font-medium text-foreground mt-0.5">
                    Midtrans Snap API
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-foreground">{t('Rincian Pembelian')}</div>
                <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
                  <div className="p-2.5 flex items-center justify-between text-muted-foreground font-semibold text-[11px] bg-muted/20">
                    <span>{t('Item Deskripsi')}</span>
                    <span>{t('Subtotal')}</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between font-medium">
                    <span>{selectedTxForReceipt.description}</span>
                    <span className="font-mono font-bold">
                      {selectedTxForReceipt.currency} {selectedTxForReceipt.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>PPN (Bebas Pajak Digital / Termasuk)</span>
                    <span className="font-mono">Rp 0</span>
                  </div>
                  <div className="p-3 flex items-center justify-between font-bold text-foreground text-xs bg-muted/10">
                    <span>{t('Total Pembayaran')}</span>
                    <span className="text-primary font-mono text-sm">
                      {selectedTxForReceipt.currency} {selectedTxForReceipt.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print Receipt / Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('Cetak Invoice')}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleCopy(`INV-${selectedTxForReceipt.id.replace('trx_', '').toUpperCase()}`);
                    setSelectedTxForReceipt(null);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-4 rounded-xl cursor-pointer shadow-xs"
                >
                  {t('Selesai')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
