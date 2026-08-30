'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { TierPricingCards } from '@/features/pricing/components/TierPricingCards';

interface Pricing03Props {
  lang?: 'en' | 'id';
}

const ADDON_PACKS = [
  { id: '100', credits: 100, priceUsd: '$1', priceIdr: 'Rp 15.000', labelEn: 'Mini Top-up', labelId: 'Paling Hemat' },
  { id: '350', credits: 350, priceUsd: '$3', priceIdr: 'Rp 45.000', labelEn: '+16% Bonus', labelId: '+16% Bonus' },
  { id: '600', credits: 600, priceUsd: '$5', priceIdr: 'Rp 75.000', isPopular: true, labelEn: 'Most Popular', labelId: '⭐ Paling Populer' },
  { id: '1500', credits: 1500, priceUsd: '$10', priceIdr: 'Rp 150.000', labelEn: '🔥 Best Value (+50%)', labelId: '🔥 Best Value (+50%)' },
];

export default function Pricing_03({ lang: propLang }: Pricing03Props) {
  const storeLang = useSettingsStore((s) => s.language);
  const activeLang: 'en' | 'id' = propLang || (storeLang === 'id' ? 'id' : 'en');
  const [currency, setCurrency] = useState<'idr' | 'usd'>('idr');

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '10px 0 30px 0' }}>
      {/* Currency Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-flex',
            background: '#F3F4F6',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            gap: '3px',
          }}
        >
          {(['idr', 'usd'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: currency === c ? '#FFFFFF' : 'transparent',
                color: currency === c ? '#111827' : '#6B7280',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: currency === c ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {c === 'idr' ? 'Rp Rupiah (IDR)' : '$ US Dollar (USD)'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 Main Plan Cards (Shared DRY Component) ── */}
      <TierPricingCards
        lang={activeLang}
        currency={currency}
        isLinkMode={true}
      />

      {/* ── Add-on AI Credits Section ── */}
      <div
        style={{
          marginTop: '40px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                borderRadius: '8px',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Zap size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                {activeLang === 'id' ? 'Add-on Kredit AI (Top-up Tambahan)' : 'Add-on AI Credits (Pay-as-you-go)'}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#6B7280' }}>
              {activeLang === 'id'
                ? '⚡ Kredit tambahan tanpa batas waktu expired & otomatis ditumpuk (stackable). Beli kapan saja tanpa harus upgrade paket langganan.'
                : '⚡ Additional credits that never expire and stack automatically. Buy anytime without changing your monthly tier.'}
            </p>
          </div>

          <div style={{
            fontSize: '11.5px',
            color: '#059669',
            fontWeight: 700,
            background: '#ECFDF5',
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid #A7F3D0',
          }}>
            ✓ {activeLang === 'id' ? 'Jatah gratis 50 kredit / hari tetap aktif' : 'Free 50 daily credits still included'}
          </div>
        </div>

        {/* 4 Add-on Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          {ADDON_PACKS.map((pack) => {
            const price = currency === 'usd' ? pack.priceUsd : pack.priceIdr;
            const label = activeLang === 'id' ? pack.labelId : pack.labelEn;

            return (
              <div
                key={pack.id}
                style={{
                  background: pack.isPopular ? '#FFFBEB' : '#F9FAFB',
                  border: pack.isPopular ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: pack.isPopular ? '#D97706' : '#6B7280' }}>
                    {label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>
                    {pack.credits.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>kredit</span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E6BEB' }}>
                  {price}
                </div>

                <div style={{ fontSize: '10.5px', color: '#6B7280', marginTop: '2px' }}>
                  {activeLang === 'id' ? 'Sekali bayar · Tanpa expired' : 'One-time · No expiry'}
                </div>

                <div style={{
                  fontSize: '10.5px',
                  color: '#4B5563',
                  background: '#F3F4F6',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '3px 6px',
                  lineHeight: 1.35,
                }}>
                  <div style={{ whiteSpace: 'nowrap' }}>💬 ~{pack.credits.toLocaleString(activeLang === 'id' ? 'id-ID' : 'en-US')} chat</div>
                  <div style={{ whiteSpace: 'nowrap' }}>🎨 ~{Math.floor(pack.credits / 5).toLocaleString(activeLang === 'id' ? 'id-ID' : 'en-US')} {activeLang === 'id' ? 'gambar' : 'img'}</div>
                  <div style={{ whiteSpace: 'nowrap' }}>🎵 ~{Math.floor(pack.credits / 5).toLocaleString(activeLang === 'id' ? 'id-ID' : 'en-US')} audio</div>
                  <div style={{ whiteSpace: 'nowrap' }}>🎬 ~{Math.floor(pack.credits / 15).toLocaleString(activeLang === 'id' ? 'id-ID' : 'en-US')} video</div>
                </div>

                <Link
                  href="/chat"
                  style={{
                    marginTop: 'auto',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: pack.isPopular ? '#F59E0B' : '#111827',
                    color: pack.isPopular ? '#000' : '#FFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  {activeLang === 'id' ? 'Top-up Sekarang' : 'Top-up Now'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
