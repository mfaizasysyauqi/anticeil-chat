'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Download, ShieldCheck, Zap, Lock, Sparkles, Check } from 'lucide-react';
import { ProviderBrandLogo } from '@/shared/components/ProviderLogos';

interface CtaSection3Props {
  lang?: 'en' | 'id';
}

const CTA_DATA = {
  id: {
    badge: '✦ Siap Mengoptimalkan Kerja AI Anda?',
    title: 'Mulai Ekosistem AI Tanpa Batas Hari Ini',
    subtitle:
      'Hubungkan kunci API OpenAI, Claude 3.7, Gemini 2.0, DeepSeek-R1, Groq LPU, dan Ollama langsung ke browser Anda dengan privasi total dan zero markup.',
    primaryBtn: 'Mulai Gratis Sekarang',
    secondaryBtn: 'Unduh Aplikasi Desktop',
    trustItems: [
      'Tanpa kartu kredit',
      'Enkripsi AES-256 lokal',
      'Zero server proxy',
    ],
    liveStatus: 'Gateway Direct Aktif',
    metrics: [
      { label: 'Kecepatan', value: '500 tok/s', color: '#FDAB3D' },
      { label: 'Markup Biaya', value: '0% (Grosir)', color: '#00C875' },
      { label: 'Latensi Proxy', value: '0 ms', color: '#0073EA' },
    ],
  },
  en: {
    badge: '✦ Ready to Accelerate Your AI Workflow?',
    title: 'Start Building with Direct BYOK Today',
    subtitle:
      'Connect your OpenAI, Claude 3.7, Gemini 2.0, DeepSeek-R1, Groq LPU, and Ollama keys directly to your browser with 100% privacy and zero markup.',
    primaryBtn: 'Get Started Free',
    secondaryBtn: 'Download Desktop App',
    trustItems: [
      'No credit card required',
      'Local AES-256 encryption',
      'Zero server proxy',
    ],
    liveStatus: 'Direct Gateway Live',
    metrics: [
      { label: 'Throughput', value: '500 tok/s', color: '#FDAB3D' },
      { label: 'Cost Markup', value: '0% (Wholesale)', color: '#00C875' },
      { label: 'Proxy Latency', value: '0 ms', color: '#0073EA' },
    ],
  },
};

export default function CtaSection3({ lang = 'id' }: CtaSection3Props) {
  const t = CTA_DATA[lang] || CTA_DATA.id;

  return (
    <section
      style={{
        padding: '40px 24px 80px 24px',
        maxWidth: '1180px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #181B34 0%, #111322 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: 'clamp(32px, 5vw, 60px) clamp(24px, 4vw, 56px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), 0 0 40px rgba(0, 115, 234, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '30%',
            width: '320px',
            height: '240px',
            background: 'radial-gradient(ellipse at center, rgba(0, 115, 234, 0.3) 0%, rgba(120, 75, 209, 0.2) 60%, transparent 80%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Left Column: CTA Pitch */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 115, 234, 0.18)',
              border: '1px solid rgba(0, 115, 234, 0.4)',
              color: '#60A5FA',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            <span>{t.badge}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {t.title}
          </h2>

          <p
            style={{
              fontSize: '15.5px',
              color: '#B2B4C2',
              lineHeight: 1.65,
              marginBottom: '32px',
              maxWidth: '520px',
            }}
          >
            {t.subtitle}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <Link
              href="/chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '12px',
                background: '#0073EA',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(0, 115, 234, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t.primaryBtn}</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#download"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 24px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={16} color="#60A5FA" />
              <span>{t.secondaryBtn}</span>
            </a>
          </div>

          {/* Trust Items Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: '#9CA3AF' }}>
            {t.trustItems.map((item, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(0, 200, 117, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} color="#00C875" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Live Work OS Preview Terminal & Metrics Mockup */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'rgba(31, 35, 56, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Mock Terminal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#34D399', background: 'rgba(0, 200, 117, 0.15)', padding: '3px 10px', borderRadius: '9999px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C875', boxShadow: '0 0 6px #00C875' }} />
              <span>{t.liveStatus}</span>
            </div>
          </div>

          {/* 3 Live Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {t.metrics.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 800, color: m.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#9CA3AF' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Active Provider Connection Pills */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#9CA3AF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} color="#FDAB3D" />
              <span>Direct Multi-Provider Mesh Pipeline</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { name: 'Groq', provider: 'groq' as const },
                { name: 'DeepSeek', provider: 'deepseek' as const },
                { name: 'OpenAI', provider: 'openai' as const },
                { name: 'Claude', provider: 'anthropic' as const },
                { name: 'Gemini', provider: 'gemini' as const },
                { name: 'Ollama', provider: 'ollama' as const },
              ].map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#E5E7EB',
                  }}
                >
                  <ProviderBrandLogo provider={p.provider} size={14} />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
