import React, { useState, useEffect } from 'react';
import { CreditCard, Info, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    billingApi.getPaymentMethods().then(setSavedPaymentMethods);
    billingApi.getTransactions().then(setTransactions);
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

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-xl font-bold text-foreground">{t('Billing')}</h2>

      {/* 1. Payment Methods */}
      <div id="billing-payment-methods" className="space-y-3 scroll-mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t('Payment Methods')}
            </h3>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <span>Country/Region: Indonesia</span>
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
                    <CreditCard className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {pm.name}
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

      {/* 2. Transaction History */}
      <div id="billing-transaction-history" className="space-y-3 scroll-mt-4">
        <h3 className="text-sm font-bold text-foreground">
          {t('Transaction History')}
        </h3>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
            <div className="text-xs text-muted-foreground">
              {t("You haven't made any transactions yet.")}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{tx.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {tx.paymentMethod} • {new Date(tx.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs font-extrabold text-foreground font-mono">
                  {tx.currency} {tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
