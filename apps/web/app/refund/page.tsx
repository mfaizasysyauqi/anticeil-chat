'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';

export default function RefundPage() {
  const language = useSettingsStore((s) => s.language);
  const isId = language === 'id';

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#181B34', fontFamily: 'inherit' }}>
      {/* Header Bar */}
      <header
        style={{
          borderBottom: '1px solid #E6E9EF',
          background: '#FFFFFF',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0073EA',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            <ArrowLeft size={16} />
            <span>{isId ? 'Kembali ke Beranda' : 'Back to Home'}</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#5F6377' }}>
            <RefreshCw size={16} color="#0073EA" />
            <span>{isId ? 'Kebijakan Pengembalian Dana' : 'Refund & Cancellation'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px 24px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6E9EF',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#00C875',
                background: 'rgba(0, 200, 117, 0.1)',
                padding: '4px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {isId ? 'Garansi 14 Hari Tanpa Syarat' : '14-Day Money Back Guarantee'}
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#181B34', margin: '12px 0 6px 0', letterSpacing: '-0.02em' }}>
              {isId ? 'Kebijakan Pengembalian Dana & Pembatalan' : 'Refund & Cancellation Policy'}
            </h1>
            <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Kami berkomitmen memberikan pengalaman terbaik bagi pengguna. Jika Anda tidak puas dengan layanan cloud kami, kami memberikan jaminan pengembalian dana 100% dalam 14 hari pertama.'
                : 'We want you to be completely satisfied with Anticeil. If you are not happy with our cloud services, we offer a 100% refund within the first 14 days.'}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E6E9EF', margin: 0 }} />

          {/* Section 1 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '1. Garansi Uang Kembali 14 Hari (Pro & Team Plan)' : '1. 14-Day Money Back Guarantee (Pro & Team)'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Jika dalam 14 hari sejak pembayaran paket langganan Pro atau Team pertama kali Anda merasa layanan ini tidak sesuai kebutuhan, Anda berhak mengajukan pengembalian dana penuh tanpa pertanyaan rumit.'
                : 'If within 14 days of your initial subscription purchase you find that Anticeil Pro or Team does not meet your requirements, you are eligible for a full refund.'}
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '2. Pembatalan Langganan Kapan Saja' : '2. Cancel Anytime with One Click'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Anda dapat membatalkan langganan kapan saja melalui menu Pengaturan > Kelola Langganan. Setelah dibatalkan, Anda tetap dapat menggunakan fitur Pro hingga periode penagihan aktif saat ini berakhir, dan kartu Anda tidak akan ditagih lagi di bulan berikutnya.'
                : 'You can cancel your subscription at any time via Settings > Manage Subscription. Once cancelled, your Pro features remain active until the end of the current billing cycle with no future renewals.'}
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '3. Cara Mengajukan Pengembalian Dana' : '3. How to Request a Refund'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Cukup kirimkan email ke support@anticeil.com dengan menyertakan alamat email akun Anda dan ID transaksi/bukti pembayaran. Tim kami akan memproses pengembalian dana dalam 1–3 hari kerja.'
                : 'Simply email support@anticeil.com with your account email address and receipt ID. Our team will process your refund within 1–3 business days.'}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
