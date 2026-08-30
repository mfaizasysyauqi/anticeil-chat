'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Image,
  Music,
  Video,
  ShieldCheck,
  KeyRound,
  Layers,
} from 'lucide-react';
import { TierPricingCards } from './TierPricingCards';
import { type TierId } from '../constants/pricingTiers';
import { useCreditStore, CREDIT_PACKS, CreditPack } from '../../credits/store/useCreditStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function PricingModal() {
  const isOpen = useCreditStore((s) => s.isPricingModalOpen);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const addPaidCredits = useCreditStore((s) => s.addPaidCredits);
  const pricingModalInitialTab = useCreditStore((s) => s.pricingModalInitialTab);

  const tier = useAuthStore((s) => s.tier);
  const setTier = useAuthStore((s) => s.setTier);

  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const language = useSettingsStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'topup' | 'tiers'>('topup');
  const [currency, setCurrency] = useState<'idr' | 'usd'>('idr');
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Sync active tab when modal opens from a specific source
  useEffect(() => {
    if (isOpen) {
      setActiveTab(pricingModalInitialTab);
    }
  }, [isOpen, pricingModalInitialTab]);

  if (!isOpen || !mounted) return null;

  const handleTopup = async (pack: CreditPack) => {
    setActionId(pack.id);
    await new Promise((r) => setTimeout(r, 600));
    addPaidCredits(pack.credits);
    setActionId(null);
    setSuccessMsg(
      language === 'id'
        ? `✓ Berhasil top-up +${pack.credits.toLocaleString()} kredit AI!`
        : `✓ Successfully topped up +${pack.credits.toLocaleString()} AI credits!`
    );
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSwitchTier = async (planId: TierId) => {
    if (planId === tier) return;
    setActionId(planId);
    await new Promise((r) => setTimeout(r, 600));
    await setTier(planId as any);
    if (planId === 'starter') addPaidCredits(100);
    if (planId === 'pro') addPaidCredits(600);
    setActionId(null);
    setSuccessMsg(
      language === 'id'
        ? `✓ Berhasil beralih ke paket ${planId.toUpperCase()}!`
        : `✓ Successfully switched to ${planId.toUpperCase()} plan!`
    );
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const useCases = [
    {
      icon: <MessageSquare size={15} color="#38bdf8" />,
      title: 'Chat & Reasoning',
      desc: language === 'id' ? '1 kredit / pesan' : '1 credit / message',
    },
    {
      icon: <Image size={15} color="#a78bfa" />,
      title: 'Image Generation',
      desc: language === 'id' ? '5 kredit / gambar' : '5 credits / image',
    },
    {
      icon: <Music size={15} color="#34d399" />,
      title: 'Audio & Speech',
      desc: language === 'id' ? '5 kredit / suara' : '5 credits / audio',
    },
    {
      icon: <Video size={15} color="#f43f5e" />,
      title: 'Video Generation',
      desc: language === 'id' ? '15 kredit / video' : '15 credits / video',
    },
  ];

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={() => setPricingModalOpen(false)}
    >
      <style>{`
        .anticeil-pricing-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          align-items: stretch;
        }
        @media (max-width: 960px) {
          .anticeil-pricing-grid-4 {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }
        @media (max-width: 560px) {
          .anticeil-pricing-grid-4 {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-surface, #18181b)',
          border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute Top-Right Exit/Close Button (Always pinned in top-right corner on mobile, tablet & desktop) */}
        <button
          type="button"
          onClick={() => setPricingModalOpen(false)}
          aria-label={language === 'id' ? 'Tutup' : 'Close'}
          title={language === 'id' ? 'Tutup' : 'Close'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            zIndex: 30,
            background: 'var(--bg-subtle, rgba(255,255,255,0.06))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-main, rgba(255,255,255,0.14))';
            e.currentTarget.style.borderColor = 'var(--border-strong, rgba(255,255,255,0.25))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-subtle, rgba(255,255,255,0.06))';
            e.currentTarget.style.borderColor = 'var(--border-subtle, rgba(255,255,255,0.1))';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div
          style={{
            padding: '18px 60px 14px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  borderRadius: '8px',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Zap size={16} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {language === 'id' ? 'Kredit AI & Paket Anticeil' : 'Anticeil AI Credits & Plans'}
              </h2>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {language === 'id'
                ? 'Kredit tambahan tanpa batas waktu expired · BYOK & OmniRoute selalu 100% tanpa batas.'
                : 'Non-expiring stackable credits · BYOK & OmniRoute always 100% unlimited.'}
            </p>
          </div>

          {/* Controls: View Switcher & Currency Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {/* View Switcher: Top-up vs Tiers */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('topup')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'topup' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'topup' ? '#f59e0b' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTab === 'topup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Zap size={12} />
                <span>{language === 'id' ? 'Top-up Kredit' : 'Top-up Credits'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tiers')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'tiers' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'tiers' ? 'var(--brand-primary, #3b82f6)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTab === 'tiers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={12} />
                <span>{language === 'id' ? 'Paket & Storage' : 'Plans & Storage'}</span>
              </button>
            </div>

            {/* Currency Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px',
              }}
            >
              {(['idr', 'usd'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: 'none',
                    background: currency === c ? 'var(--bg-surface)' : 'transparent',
                    color: currency === c ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: currency === c ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {c === 'idr' ? 'Rp IDR' : '$ USD'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            margin: '12px 22px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            <ShieldCheck size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body with smooth vertical scroll */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 22px' }}>
          {/* ── TAB 1: TOP-UP PACKS (Chatwoot Captain AI Style) ── */}
          {activeTab === 'topup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="anticeil-pricing-grid-4">
                {CREDIT_PACKS.map((pack) => {
                  const isBusy = actionId === pack.id;
                  const priceStr = currency === 'usd' ? `$${pack.priceUsd}` : `Rp ${pack.priceIdr.toLocaleString('id-ID')}`;

                  return (
                    <div
                      key={pack.id}
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        border: pack.popular ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                        background: pack.popular
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--bg-surface) 100%)'
                          : 'var(--bg-card, rgba(255,255,255,0.02))',
                        boxShadow: pack.popular ? '0 12px 32px -4px rgba(245, 158, 11, 0.16)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        padding: '20px 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      {pack.tag && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '12px',
                          background: pack.popular ? '#f59e0b' : 'var(--bg-main)',
                          border: pack.popular ? 'none' : '1px solid var(--border-subtle)',
                          color: pack.popular ? '#000' : 'var(--text-secondary)',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}>
                          {pack.tag}
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {pack.name} Pack
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>
                            {pack.credits.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>kredit</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 800 }}>
                          {priceStr}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {language === 'id' ? 'Sekali bayar · Tanpa expired' : 'One-time · No expiry'}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-main)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px 6px',
                        lineHeight: 1.4,
                      }}>
                        <div style={{ whiteSpace: 'nowrap' }}>💬 ~{pack.credits.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} chat</div>
                        <div style={{ whiteSpace: 'nowrap' }}>🎨 ~{Math.floor(pack.credits / 5).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} {language === 'id' ? 'gambar' : 'img'}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>🎵 ~{Math.floor(pack.credits / 5).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} audio</div>
                        <div style={{ whiteSpace: 'nowrap' }}>🎬 ~{Math.floor(pack.credits / 15).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} video</div>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTopup(pack)}
                        style={{
                          marginTop: 'auto',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: pack.popular
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : '#1E6BEB',
                          color: pack.popular ? '#000' : '#fff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        {isBusy ? 'Memproses...' : (language === 'id' ? 'Top-up Sekarang' : 'Top-up Now')}
                        {!isBusy && <ChevronRight size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rate Matrix */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  {language === 'id' ? 'BIAYA PENGGUNAAN KREDIT AI ANTICEIL:' : 'CREDIT USAGE RATES:'}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '8px',
                }}>
                  {useCases.map((uc, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {uc.icon}
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 650 }}>{uc.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{uc.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: TIER PLANS & STORAGE ── */}
          {activeTab === 'tiers' && (
            <TierPricingCards
              lang={language as 'en' | 'id'}
              currency={currency}
              currentTier={tier as TierId}
              onSelectTier={handleSwitchTier}
              actionLoadingId={actionId}
            />
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px 22px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          background: 'var(--bg-main)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#10b981" />
            <span>
              {language === 'id'
                ? 'Jatah gratis 50 kredit/hari tetap aktif tiap pukul 00:00.'
                : 'Free 50 daily credits reset every day at 00:00.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPricingModalOpen(false);
              openSettingsTab('keys');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary, #60a5fa)',
              fontSize: '11px',
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            <KeyRound size={12} />
            <span>{language === 'id' ? 'Gunakan API Key Sendiri (BYOK) — Gratis' : 'Use Personal API Key (BYOK) — Free'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
