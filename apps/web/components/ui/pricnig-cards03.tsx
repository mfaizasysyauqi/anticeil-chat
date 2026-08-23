'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';

interface Pricing03Props {
  lang?: 'en' | 'id';
}

const PRICING_CONTENT = {
  id: {
    recommended: 'Paling Direkomendasikan',
    plans: [
      {
        title: 'Paket Pemula - Core Gateway',
        price: 'Rp 0',
        billing: 'gratis selamanya • 100% direct',
        features: [
          'Koneksi kunci API BYOK tanpa batas',
          'Akses ke OpenAI GPT-4o, Claude 3.7, Gemini 2.0 & Groq',
          'Dukungan model lokal 100% offline via Ollama',
          'Vault kunci terenkripsi AES-256 di browser',
          'Gunakan semua model tanpa markup harga token',
        ],
        button: 'Mulai Gratis',
        link: '/chat',
      },
      {
        title: 'Paket Pro - Akses Lengkap',
        price: 'Rp 149.000',
        billing: 'per bulan • ditagih tahunan',
        recommended: true,
        features: [
          'Semua fitur pada Paket Pemula',
          'Pencarian Web Langsung Otonom & kutipan sumber',
          'Pengurai dokumen cerdas Multi-Berkas & PDF',
          'Studio Visual & Video AI (Flux.1 / Luma Ray 2)',
          'Visual Workflow Automations & cloud runner',
          'Live Artifact Code Sandbox & Preview Instan',
        ],
        button: 'Coba Gratis Pro 14 Hari',
        link: '/register',
      },
      {
        title: 'Paket Tim & Enterprise',
        price: 'Rp 449.000',
        billing: 'per pengguna / bulan • ditagih tahunan',
        features: [
          'Semua fitur pada Paket Pro',
          'Penyimpanan workspace Cloudflare R2 tanpa batas',
          'Shared Model Context Protocol (MCP) konektor (GitHub, Notion, Drive)',
          'Eksekusi otomatisasi pipeline cloud 24/7 tanpa batas',
          'Hingga 50 anggota tim dengan kontrol hak akses berbasis peran',
          'Dukungan prioritas 24/7 & integrasi custom provider',
        ],
        button: 'Dapatkan Paket Enterprise',
        link: '/register?plan=enterprise',
      },
    ],
  },
  en: {
    recommended: 'Recommended for Power Users',
    plans: [
      {
        title: 'Starter Pack - Core Gateway',
        price: '$0',
        billing: 'forever free • 100% direct',
        features: [
          'Unlimited direct BYOK API key connections',
          'Access to OpenAI GPT-4o, Claude 3.7, Gemini 2.0 & Groq',
          '100% offline local model support via Ollama',
          'Client-side AES-256 encrypted key vault',
          'Continue using all models with zero data markup',
        ],
        button: 'Get Started Free',
        link: '/chat',
      },
      {
        title: 'Pro Pack - Lifetime Access',
        price: '$9',
        billing: 'per month • billed annually',
        recommended: true,
        features: [
          'Everything from the Starter plan',
          'Autonomous Live Web Grounding search & citations',
          'Multi-File PDF & Document Intelligence parsing suite',
          'AI Image & Video Studio (Flux.1 / Luma Ray 2)',
          'Visual Workflow Automations & Cloud pipeline runner',
          'Live Artifact Code Sandbox & Instant Preview',
        ],
        button: 'Start 14-Day Free Pro Trial',
        link: '/register',
      },
      {
        title: 'Enterprise Pack',
        price: '$29',
        billing: 'per user / month • billed annually',
        features: [
          'Everything from the Pro plan',
          'Shared Cloudflare R2 zero-latency workspace storage',
          'Shared Model Context Protocol (MCP) connectors (GitHub, Notion, Drive)',
          'Unlimited 24/7 background cloud workflow executions',
          'Up to 50 team members included with role-based access',
          'Priority 24/7 dedicated support & custom provider onboarding',
        ],
        button: 'Get Enterprise Suite',
        link: '/register?plan=enterprise',
      },
    ],
  },
};

export default function Pricing_03({ lang: propLang }: Pricing03Props) {
  const storeLang = useSettingsStore((s) => s.language);
  const activeLang = propLang || (storeLang === 'id' ? 'id' : 'en');
  const t = PRICING_CONTENT[activeLang];

  return (
    <section style={{ maxWidth: '960px', margin: '0 auto', padding: '20px 16px 40px 16px' }}>
      {/* Top 2 Cards Row with 4 Corner Pins */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* 4 Corner Pins */}
        <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', left: '-4px', bottom: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />

        {t.plans.slice(0, 2).map((plan, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '0px',
              background: '#FFFFFF',
              border: plan.recommended ? '4px solid #BBF7D0' : '1px solid #E4E4E7',
              boxShadow: plan.recommended ? '0 20px 35px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.02)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              padding: '32px 28px',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
          >
            <div>
              {plan.recommended && (
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#16A34A', marginBottom: '12px' }}>
                  {t.recommended}
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#181B34', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                  {plan.title}
                </h3>
                <p style={{ fontSize: '38px', fontWeight: 800, color: '#181B34', margin: '0', letterSpacing: '-0.03em' }}>
                  {plan.price}
                </p>
                <p style={{ fontSize: '13.5px', color: '#71717A', margin: '4px 0 20px 0' }}>
                  {plan.billing}
                </p>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14.5px', color: '#27272A', lineHeight: 1.5 }}>
                    <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link
                href={plan.link}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '6px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: plan.recommended ? '#0073EA' : '#181B34',
                  color: '#FFFFFF',
                  boxShadow: plan.recommended ? '0 4px 14px rgba(0, 115, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {plan.button}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 1 Full-Width Card with 4 Corner Pins */}
      <div style={{ position: 'relative' }}>
        {/* 4 Corner Pins */}
        <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', left: '-4px', bottom: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />
        <div style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#71717A', zIndex: 10 }} />

        <div
          style={{
            borderRadius: '0px',
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            padding: '36px 32px',
            transition: 'all 0.3s ease',
          }}
        >
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#181B34', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              {t.plans[2].title}
            </h3>
            <p style={{ fontSize: '40px', fontWeight: 800, color: '#181B34', margin: '0', letterSpacing: '-0.03em' }}>
              {t.plans[2].price}
            </p>
            <p style={{ fontSize: '13.5px', color: '#71717A', margin: '4px 0 20px 0' }}>
              {t.plans[2].billing}
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {t.plans[2].features.map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14.5px', color: '#27272A', lineHeight: 1.5 }}>
                  <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div style={{ position: 'relative', width: '100%' }}>
              <Link
                href={t.plans[2].link}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  background: '#181B34',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(24, 27, 52, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.plans[2].button}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
