import { api } from '@/lib/api';

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'e-wallet' | 'card' | 'bank_transfer';
  details: string;
  isDefault: boolean;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: 'settlement' | 'pending' | 'failed';
  date: string;
  paymentMethod: string;
}

const PM_STORAGE_KEY = 'anticeil_payment_methods';
const TX_STORAGE_KEY = 'anticeil_billing_transactions';

const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [];
const DEFAULT_TRANSACTIONS: TransactionItem[] = [];

export const billingApi = {
  getPaymentMethods: async (): Promise<PaymentMethodItem[]> => {
    try {
      const data = await api.get<PaymentMethodItem[]>('/v1/billing/payment-methods');
      if (Array.isArray(data)) {
        const clean = data.filter((p) => p && p.id !== 'pm-qris');
        localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(clean));
        return clean;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(PM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id !== 'pm-qris');
        }
      }
    } catch {}

    return DEFAULT_PAYMENT_METHODS;
  },

  addPaymentMethod: async (
    method: Omit<PaymentMethodItem, 'id' | 'createdAt'>
  ): Promise<PaymentMethodItem> => {
    const newPm: PaymentMethodItem = {
      ...method,
      id: `pm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/v1/billing/payment-methods', newPm);
    } catch {}

    const current = await billingApi.getPaymentMethods();
    const updated = [newPm, ...current];
    localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(updated));
    return newPm;
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    try {
      await api.delete(`/v1/billing/payment-methods/${id}`);
    } catch {}

    const current = await billingApi.getPaymentMethods();
    const updated = current.filter((pm) => pm.id !== id);
    localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(updated));
  },

  getTransactions: async (): Promise<TransactionItem[]> => {
    try {
      const data = await api.get<TransactionItem[]>('/v1/billing/transactions');
      if (Array.isArray(data)) {
        const clean = data.filter((t) => t && t.id !== 'trx_init_01');
        localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(clean));
        return clean;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(TX_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((t) => t && t.id !== 'trx_init_01');
        }
      }
    } catch {}

    return DEFAULT_TRANSACTIONS;
  },

  createTransaction: async (tx: Omit<TransactionItem, 'id' | 'date'>): Promise<TransactionItem> => {
    const newTx: TransactionItem = {
      ...tx,
      id: `trx_${Date.now()}`,
      date: new Date().toISOString(),
    };

    try {
      await api.post('/v1/billing/transactions', newTx);
    } catch {}

    const current = await billingApi.getTransactions();
    const updated = [newTx, ...current];
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(updated));
    return newTx;
  },
};
