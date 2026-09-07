import { Suspense } from 'react';
import { Clock } from 'lucide-react';
import PaymentSuccessContent from './PaymentSuccessContent';

function PaymentSuccessFallback() {
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
            background: 'rgba(107,114,128,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={48} color="#6b7280" />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0 }}>
          Memproses...
        </h1>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
