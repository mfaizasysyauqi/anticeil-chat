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

const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'pm-qris',
    name: 'QRIS / GoPay (Midtrans)',
    type: 'e-wallet',
    details: 'Instant QRIS & GoPay Auto-Debit',
    isDefault: true,
    createdAt: '2026-11-01T10:00:00.000Z',
  },
];

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'trx_init_01',
    description: 'Nectar Pass Monthly Subscription',
    amount: 149000,
    currency: 'IDR',
    status: 'settlement',
    date: '2026-11-01T10:05:00.000Z',
    paymentMethod: 'GoPay / QRIS',
  },
];

export const billingApi = {
  getPaymentMethods: async (): Promise<PaymentMethodItem[]> => {
    try {
      const data = await api.get<PaymentMethodItem[]>('/v1/billing/payment-methods');
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(PM_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
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
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(TX_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
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
