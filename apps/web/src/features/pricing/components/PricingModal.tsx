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
  AlertCircle,
} from 'lucide-react';
import { TierPricingCards } from './TierPricingCards';
import { type TierId } from '../constants/pricingTiers';
import { useCreditStore, CREDIT_PACKS, CreditPack } from '../../credits/store/useCreditStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useMidtrans } from '../../payment/hooks/useMidtrans';

export function PricingModal() {
  const isOpen = useCreditStore((s) => s.isPricingModalOpen);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const addPaidCredits = useCreditStore((s) => s.addPaidCredits);
  const pricingModalInitialTab = useCreditStore((s) => s.pricingModalInitialTab);

  const tier = useAuthStore((s) => s.tier);
  const setTier = useAuthStore((s) => s.setTier);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const setIsModelSelectorOpen = useSettingsStore((s) => s.setIsModelSelectorOpen);
  const language = useSettingsStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'topup' | 'tiers'>('topup');
  const [currency, setCurrency] = useState<'idr' | 'usd'>('idr');
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { pay } = useMidtrans();

  useEffect(() => { setMounted(true); }, []);

  // Sync active tab when modal opens from a specific source
  useEffect(() => {
    if (isOpen) {
      setActiveTab(pricingModalInitialTab);
    }
  }, [isOpen, pricingModalInitialTab]);

  if (!isOpen || !mounted) return null;

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const createPayment = async (type: 'topup' | 'tier', itemId: string) => {
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        itemId,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.user_metadata?.name || user?.user_metadata?.full_name,
      }),
    });
    return res.json() as Promise<{ token?: string; credits?: number; orderId?: string; error?: string }>;
  };

  const handleTopup = async (pack: CreditPack) => {
    if (!user) {
      setPricingModalOpen(false);
      openAuthModal('login');
      return;
    }
    setActionId(pack.id);
    setErrorMsg(null);
    try {
      const data = await createPayment('topup', pack.id);
      if (!data.token) {
        showError(data.error || (language === 'id' ? 'Gagal membuat pembayaran' : 'Failed to create payment'));
        setActionId(null);
        return;
      }
      setPricingModalOpen(false);
      pay(data.token, {
        onSuccess: () => {
          addPaidCredits(pack.credits);
          setActionId(null);
          setSuccessMsg(
            language === 'id'
              ? `✓ Pembayaran berhasil! +${pack.credits.toLocaleString()} kredit AI ditambahkan.`
              : `✓ Payment successful! +${pack.credits.toLocaleString()} AI credits added.`
          );
          setTimeout(() => setSuccessMsg(null), 4000);
        },
        onPending: () => {
          setActionId(null);
          setSuccessMsg(
            language === 'id'
              ? '⏳ Menunggu konfirmasi pembayaran...'
              : '⏳ Waiting for payment confirmation...'
          );
          setTimeout(() => setSuccessMsg(null), 5000);
        },
        onError: () => {
          setActionId(null);
          showError(language === 'id' ? 'Pembayaran gagal. Coba lagi.' : 'Payment failed. Please try again.');
        },
        onClose: () => { setActionId(null); },
      });
    } catch {
      setActionId(null);
      showError(language === 'id' ? 'Terjadi kesalahan. Coba lagi.' : 'Something went wrong. Please try again.');
    }
  };

  const handleSwitchTier = async (planId: TierId) => {
    if (planId === tier) return;
    // Free tier → instant (no login required)
    if (planId === 'free') {
      await setTier('free');
      setSuccessMsg(language === 'id' ? '✓ Beralih ke Free tier.' : '✓ Switched to Free tier.');
      setTimeout(() => setSuccessMsg(null), 2500);
      return;
    }
    if (!user) {
      setPricingModalOpen(false);
      openAuthModal('login');
      return;
    }
    setActionId(planId);
    setErrorMsg(null);
    try {
      const data = await createPayment('tier', planId);
      if (!data.token) {
        showError(data.error || (language === 'id' ? 'Gagal membuat pembayaran' : 'Failed to create payment'));
        setActionId(null);
        return;
      }
      setPricingModalOpen(false);
      pay(data.token, {
        onSuccess: async () => {
          await setTier(planId as any);
          if (planId === 'starter') addPaidCredits(150);
          if (planId === 'pro') addPaidCredits(750);
          if (planId === 'enterprise') addPaidCredits(3000);
          setActionId(null);
          setSuccessMsg(
            language === 'id'
              ? `✓ Upgrade ke ${planId.toUpperCase()} berhasil! Kredit bonus ditambahkan.`
              : `✓ Upgraded to ${planId.toUpperCase()}! Bonus credits added.`
          );
          setTimeout(() => setSuccessMsg(null), 4000);
        },
        onPending: () => {
          setActionId(null);
          setSuccessMsg(
            language === 'id'
              ? '⏳ Menunggu konfirmasi pembayaran...'
              : '⏳ Waiting for payment confirmation...'
          );
          setTimeout(() => setSuccessMsg(null), 5000);
        },
        onError: () => {
          setActionId(null);
          showError(language === 'id' ? 'Pembayaran gagal. Coba lagi.' : 'Payment failed. Please try again.');
        },
        onClose: () => { setActionId(null); },
      });
    } catch {
      setActionId(null);
      showError(language === 'id' ? 'Terjadi kesalahan. Coba lagi.' : 'Something went wrong. Please try again.');
    }
  };

  const useCases = [
    {
      icon: <MessageSquare size={15} color="#38bdf8" />,
      title: language === 'id' ? 'Fast & Economy Chat' : 'Fast & Economy Chat',
      desc: language === 'id' ? '1 kredit (Gemini Flash, DeepSeek-V3)' : '1 credit (Gemini Flash, DeepSeek-V3)',
    },
    {
      icon: <Sparkles size={15} color="#fbbf24" />,
      title: language === 'id' ? 'Deep Reasoning / Code' : 'Deep Reasoning / Code',
      desc: language === 'id' ? '3 kredit (DeepSeek-R1, Gemini Pro)' : '3 credits (DeepSeek-R1, Gemini Pro)',
    },
    {
      icon: <Zap size={15} color="#f97316" />,
      title: language === 'id' ? 'Flagship Premium' : 'Flagship Premium',
      desc: language === 'id' ? '8 kredit (Claude 3.7 Sonnet, GPT-4o)' : '8 credits (Claude 3.7 Sonnet, GPT-4o)',
    },
    {
      icon: <Image size={15} color="#a78bfa" />,
      title: 'Image Generation',
      desc: language === 'id' ? '5 kredit / gambar' : '5 credits / image',
    },
    {
      icon: <Music size={15} color="#34d399" />,
      title: 'Audio & Speech',
      desc: language === 'id' ? '2 kredit / suara' : '2 credits / audio',
    },
    {
      icon: <Video size={15} color="#f43f5e" />,
      title: 'Video Generation',
      desc: language === 'id' ? '15 kredit / video' : '15 credits / video',
    },
  ];

  const content = (
    <div
      className="anticeil-pricing-overlay"
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
        .anticeil-pricing-modal {
          width: 100%;
          max-width: 1080px;
          max-height: 90vh;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          box-shadow: var(--shadow-2xl, 0 32px 64px -12px rgba(0, 0, 0, 0.7));
          display: flex;
          flex-direction: column;
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
        }
        .anticeil-pricing-header {
          padding: 18px 56px 14px 22px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .anticeil-pricing-body {
          overflow-y: auto;
          flex: 1;
          padding: 18px 22px;
          -webkit-overflow-scrolling: touch;
        }
        .anticeil-pricing-footer {
          padding: 12px 22px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-main);
        }
        .anticeil-pricing-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          align-items: stretch;
        }
        .anticeil-pricing-segmented {
          display: flex;
          background: var(--bg-main);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }
        .anticeil-pricing-segmented button {
          flex: 1;
          justify-content: center;
        }
        @media (max-width: 960px) {
          .anticeil-pricing-modal {
            max-height: 92vh;
          }
          .anticeil-pricing-grid-4 {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 600px) {
          .anticeil-pricing-overlay {
            padding: 8px !important;
          }
          .anticeil-pricing-modal {
            border-radius: 14px;
            max-height: 95vh;
          }
          .anticeil-pricing-header {
            padding: 14px 44px 12px 14px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .anticeil-pricing-segmented {
            width: 100%;
          }
          .anticeil-pricing-body {
            padding: 12px 12px;
          }
          .anticeil-pricing-footer {
            padding: 10px 14px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .anticeil-pricing-grid-4 {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>

      <div
        className="anticeil-pricing-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute Top-Right Exit/Close Button */}
        <button
          type="button"
          onClick={() => setPricingModalOpen(false)}
          aria-label={language === 'id' ? 'Tutup' : 'Close'}
          title={language === 'id' ? 'Tutup' : 'Close'}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 30,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="anticeil-pricing-header">
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
            <div className="anticeil-pricing-segmented">
              <button
                type="button"
                onClick={() => setActiveTab('topup')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'topup' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'topup' ? 'var(--accent-warning, #f59e0b)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTab === 'topup' ? 'var(--shadow-sm)' : 'none',
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
                  color: activeTab === 'tiers' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTab === 'tiers' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={12} />
                <span>{language === 'id' ? 'Paket & Storage' : 'Plans & Storage'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            margin: '12px 14px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(0, 200, 117, 0.15)',
            border: '1px solid rgba(0, 200, 117, 0.4)',
            color: 'var(--accent-success)',
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

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            margin: '12px 14px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: 'var(--accent-error, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body with smooth vertical scroll */}
        <div className="anticeil-pricing-body">
          {/* ── TAB 1: TOP-UP PACKS (Chatwoot Captain AI Style) ── */}
          {activeTab === 'topup' && (
            <div>
              <div className="anticeil-pricing-grid-4">
                {CREDIT_PACKS.map((pack) => {
                  const isBusy = actionId === pack.id;
                  const priceStr = `Rp ${pack.priceIdr.toLocaleString('id-ID')}`;

                  return (
                    <div
                      key={pack.id}
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        border: pack.popular ? '2px solid var(--accent-warning, #f59e0b)' : '1px solid var(--border-subtle)',
                        background: pack.popular
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--bg-surface) 100%)'
                          : 'var(--bg-surface)',
                        boxShadow: pack.popular ? '0 12px 32px -4px rgba(245, 158, 11, 0.16)' : 'var(--shadow-sm)',
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
                          background: pack.popular ? 'var(--accent-warning, #f59e0b)' : 'var(--bg-main)',
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
                          <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-warning, #f59e0b)' }}>
                            {pack.credits.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {language === 'id' ? 'kredit' : 'credits'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
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
                            : 'var(--brand-primary)',
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
                        {isBusy ? (language === 'id' ? 'Memproses...' : 'Processing...') : (language === 'id' ? 'Top-up Sekarang' : 'Top-up Now')}
                        {!isBusy && <ChevronRight size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rate Matrix */}
              <div style={{
                padding: '14px 16px',
                marginTop: '18px',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  {language === 'id' ? 'BIAYA PENGGUNAAN KREDIT AI ANTICEIL:' : 'CREDIT USAGE RATES:'}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
        <div className="anticeil-pricing-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--accent-success, #10b981)" />
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
              setIsModelSelectorOpen(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary)',
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
