'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCreditStore } from '../../../src/features/credits/store/useCreditStore';

// Mirror of PACK_MAP in api/payment/create/route.ts
const PACK_CREDITS: Record<string, number> = {
  pack_100:  100,
  pack_350:  350,
  pack_600:  600,
  pack_1500: 1500,
};

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const addPaidCredits = useCreditStore((s) => s.addPaidCredits);
  const syncPaidCreditsToSupabase = useCreditStore((s) => s.syncPaidCreditsToSupabase);
  const creditAdded = useRef(false);
  const [status, setStatus] = useState<'success' | 'pending' | 'failed' | 'loading'>('loading');

  const orderId = params.get('order_id') ?? params.get('order-id') ?? '';
  const transactionStatus = params.get('transaction_status') ?? '';
  const type = params.get('type') ?? '';
  const item = params.get('item') ?? '';

  useEffect(() => {
    const isSuccess =
      !transactionStatus ||
      transactionStatus === 'settlement' ||
      transactionStatus === 'capture';

    if (isSuccess) {
      setStatus('success');
      // Add credits once — ref guard prevents StrictMode double-add
      if (type === 'topup' && item && !creditAdded.current) {
        const credits = PACK_CREDITS[item];
        if (credits) {
          addPaidCredits(credits);
          creditAdded.current = true;
          // Also persist to Supabase immediately (webhook may still be in-flight)
          syncPaidCreditsToSupabase();
        }
      }
    } else if (transactionStatus === 'pending') {
      setStatus('pending');
    } else {
      setStatus('failed');
    }

    // Auto-redirect after 4s
    const t = setTimeout(() => router.replace('/chat'), 4000);
    return () => clearTimeout(t);
  }, [transactionStatus, type, item, addPaidCredits, router]);

  const config = {
    success: {
      icon: <CheckCircle size={48} color="#10b981" />,
      title: 'Pembayaran Berhasil!',
      subtitle: type === 'topup'
        ? `+${(PACK_CREDITS[item] ?? 0).toLocaleString()} Kredit AI sudah ditambahkan.`
        : 'Langganan kamu sedang diaktifkan. Terima kasih!',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
    pending: {
      icon: <Clock size={48} color="#f59e0b" />,
      title: 'Menunggu Pembayaran',
      subtitle: 'Kredit akan ditambahkan otomatis setelah dikonfirmasi.',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
    failed: {
      icon: <XCircle size={48} color="#ef4444" />,
      title: 'Pembayaran Gagal',
      subtitle: 'Transaksi tidak berhasil. Silakan coba lagi.',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
    loading: {
      icon: <Clock size={48} color="#6b7280" />,
      title: 'Memproses...',
      subtitle: '',
      color: '#6b7280',
      bg: 'rgba(107,114,128,0.1)',
    },
  }[status];

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main, #0a0a0a)',
        padding: '24px',
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: 'var(--bg-surface, #111)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.icon}
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0 }}>
          {config.title}
        </h1>

        {config.subtitle && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #9ca3af)', margin: 0, lineHeight: 1.6 }}>
            {config.subtitle}
          </p>
        )}

        {orderId && (
          <div
            style={{
              background: 'var(--bg-subtle, rgba(255,255,255,0.04))',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '11px',
              color: 'var(--text-muted, #6b7280)',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {orderId}
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
          Kamu akan diarahkan kembali ke aplikasi dalam beberapa detik...
        </p>

        <Link
          href="/chat"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'var(--brand-primary, #0073ea)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Kembali ke Anticeil
        </Link>
      </div>
    </div>
  );
}
