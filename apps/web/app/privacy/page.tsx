'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';

export default function PrivacyPage() {
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
            <ShieldCheck size={16} color="#00C875" />
            <span>{isId ? 'Kebijakan Privasi' : 'Privacy Policy'}</span>
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
              {isId ? 'Privasi 100% Sisi Klien' : '100% Client-Side Privacy'}
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#181B34', margin: '12px 0 6px 0', letterSpacing: '-0.02em' }}>
              {isId ? 'Kebijakan Privasi ChatByok' : 'ChatByok Privacy Policy'}
            </h1>
            <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Kami menghargai privasi Anda sepenuhnya. ChatByok dibangun dari awal dengan arsitektur Zero-Knowledge & Local-First.'
                : 'We prioritize your privacy above all else. ChatByok is engineered with a Zero-Knowledge & Local-First architecture.'}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E6E9EF', margin: 0 }} />

          {/* Highlights Box */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(0, 200, 117, 0.06)',
              border: '1px solid rgba(0, 200, 117, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#181B34' }}>
              🛡️ {isId ? 'Prinsip Inti Privasi Kami:' : 'Our Core Privacy Guarantees:'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#5F6377' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#00C875" />
                <span>{isId ? 'Kunci API disimpan terenkripsi di browser lokal (AES-256-GCM).' : 'API keys encrypted locally in browser memory (AES-256-GCM).'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#00C875" />
                <span>{isId ? 'Pesan chat mengalir langsung dari browser ke API Provider tanpa perantara server.' : 'Chat streams directly from client to AI provider endpoints.'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#00C875" />
                <span>{isId ? 'File PDF & Studio Dokumen diproses 100% secara lokal di memori browser.' : 'PDF & Document tools processed 100% client-side in RAM.'}</span>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '1. Informasi yang Kami Kumpulkan' : '1. Information We Collect'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Untuk pengguna Free Community (tanpa akun), kami sama sekali tidak menyimpan data pribadi Anda di database server kami. Untuk pengguna berbayar atau akun terdaftar, kami hanya menyimpan alamat email dan ID referensi pembayaran dari gateway pembayaran untuk mengelola langganan Anda.'
                : 'For Free Community users (without an account), we store zero personal data on external servers. For registered or paid users, we collect only your email address and payment transaction identifiers necessary to provision cloud features.'}
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '2. Penyimpanan Kunci API & Riwayat Obrolan' : '2. Storage of API Keys & Chat Logs'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Kunci API dan riwayat obrolan Anda tersimpan di penyimpanan lokal browser Anda (LocalStorage / IndexedDB). Kami tidak dapat membaca, melihat, atau memonetisasi konten percakapan Anda.'
                : 'Your API keys and conversations reside solely within your browser local cache (LocalStorage / IndexedDB). We cannot read, inspect, or monetize your prompt data.'}
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '3. Pertanyaan & Permintaan Penghapusan Data' : '3. Data Deletion Requests'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Anda dapat menghapus seluruh data Anda kapan saja melalui menu Pengaturan > Hapus Semua Kunci & Riwayat di aplikasi, atau mengirimkan email ke support@chatbyok.com.'
                : 'You can erase all your data at any time via Settings > Clear Storage in the app, or by emailing support@chatbyok.com.'}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
