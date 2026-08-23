'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';

export default function TermsPage() {
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
            <FileText size={16} color="#0073EA" />
            <span>{isId ? 'Ketentuan Layanan' : 'Terms of Service'}</span>
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
                color: '#0073EA',
                background: 'rgba(0, 115, 234, 0.08)',
                padding: '4px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {isId ? 'Terakhir Diperbarui: 23 Agustus 2026' : 'Last Updated: August 23, 2026'}
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#181B34', margin: '12px 0 6px 0', letterSpacing: '-0.02em' }}>
              {isId ? 'Syarat & Ketentuan Layanan ChatByok' : 'ChatByok Terms of Service'}
            </h1>
            <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Harap baca ketentuan layanan ini dengan saksama sebelum menggunakan platform dan ekosistem ChatByok.'
                : 'Please read these terms of service carefully before accessing or using the ChatByok platform and services.'}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E6E9EF', margin: 0 }} />

          {/* Section 1 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '1. Model Arsitektur Bring Your Own Key (BYOK)' : '1. Bring Your Own Key (BYOK) Architecture'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'ChatByok adalah antarmuka klien dan sistem operasi kerja AI yang beroperasi dengan model Bring Your Own Key (BYOK). Anda bertanggung jawab penuh atas kunci API resmi (OpenAI, Anthropic, Google Gemini, Groq, dll.) yang Anda masukkan ke dalam aplikasi. ChatByok tidak memungut biaya margin atas konsumsi token API pihak ketiga Anda.'
                : 'ChatByok is a client-side interface and AI work operating system operating under the Bring Your Own Key (BYOK) paradigm. You are solely responsible for official developer API keys (OpenAI, Anthropic, Google Gemini, Groq, etc.) configured in your client. ChatByok charges zero intermediary token margin on your third-party API usage.'}
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '2. Akun & Langganan Layanan Cloud' : '2. Accounts & Cloud Subscriptions'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Paket Free Community disediakan $0 selamanya. Pengguna dapat memilih untuk meningkatkan ke paket berbayar (Pro atau Team) untuk mendapatkan fitur infrastruktur cloud tambahan seperti Cloudflare R2 Storage, kuota eksekusi Cloud Automation Runs, dan Browser Agent Runner.'
                : 'The Free Community plan is provided at $0 forever. Users may voluntarily upgrade to paid tiers (Pro or Team) to access cloud infrastructure add-ons including Cloudflare R2 zero-egress storage, Cloud Automation Runs quotas, and realtime Browser Agent runners.'}
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '3. Penggunaan yang Diperbolehkan' : '3. Acceptable Use Policy'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Anda setuju untuk tidak menyalahgunakan platform ChatByok untuk aktivitas ilegal, mendistribusikan malware, melakukan serangan penolakan layanan (DDoS), atau melanggar hak kekayaan intelektual pihak lain.'
                : 'You agree not to misuse the ChatByok platform for unlawful activities, distributing malicious software, conducting denial of service attacks, or infringing on any intellectual property rights.'}
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#181B34', margin: 0 }}>
              {isId ? '4. Kontak Bantuan & Dukungan Resmi' : '4. Support & Contact Information'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.7, margin: 0 }}>
              {isId
                ? 'Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi tim kami di support@chatbyok.com.'
                : 'If you have any questions regarding these Terms, please contact our support team at support@chatbyok.com.'}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
