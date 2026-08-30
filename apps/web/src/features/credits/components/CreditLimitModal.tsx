'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Clock, KeyRound, Network, X, Sparkles, ChevronRight } from 'lucide-react';
import { useCreditStore, CREDIT_COSTS } from '../store/useCreditStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} jam ${minutes} menit`;
}

export function CreditLimitModal() {
  const isOpen = useCreditStore((s) => s.isLimitModalOpen);
  const attemptedAction = useCreditStore((s) => s.attemptedAction);
  const setLimitModalOpen = useCreditStore((s) => s.setLimitModalOpen);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const language = useSettingsStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setCountdown(getTimeUntilMidnight()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !mounted) return null;

  const cost = attemptedAction ? CREDIT_COSTS[attemptedAction] : 1;

  const actionName =
    attemptedAction === 'chat'
      ? (language === 'id' ? 'Chat & Reasoning' : 'Chat & Reasoning')
      : attemptedAction === 'image'
      ? (language === 'id' ? 'Generasi Gambar' : 'Image Generation')
      : attemptedAction === 'video'
      ? (language === 'id' ? 'Generasi Video' : 'Video Generation')
      : (language === 'id' ? 'Sintesis Audio & Musik' : 'Audio & Music Synthesis');

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
      onClick={() => setLimitModalOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface, #18181b)',
          border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setLimitModalOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {language === 'id' ? 'Kredit Harian Anticeil Habis' : 'Daily Free Credits Reached'}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {language === 'id'
                ? `Aksi ${actionName} membutuhkan ${cost} kredit.`
                : `${actionName} requires ${cost} credits.`}
            </p>
          </div>
        </div>

        {/* Countdown Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: '10px',
            fontSize: '12.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Clock size={14} color="#f59e0b" />
            <span>{language === 'id' ? 'Isi ulang 50 kredit dalam:' : '50 Credits refill in:'}</span>
          </div>
          <span style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
            {countdown}
          </span>
        </div>

        {/* Solution Options Header */}
        <div style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)' }}>
          {language === 'id' ? '💡 Lanjutkan tanpa batasan kuota:' : '💡 Continue with zero limits:'}
        </div>

        {/* Option 0: Top-up Credits */}
        <div
          onClick={() => {
            setLimitModalOpen(false);
            setPricingModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, var(--bg-main, rgba(255,255,255,0.03)) 100%)',
            border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f59e0b')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                {language === 'id' ? 'Top-up Kredit AI — Mulai $1 (Rp 15.000)' : 'Top-up AI Credits — From $1 (Rp 15,000)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {language === 'id' ? '100+ kredit saldo · Tanpa kadaluarsa · Otomatis ditumpuk.' : '100+ credits · Never expires · Stackable.'}
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="#f59e0b" />
        </div>

        {/* Option 1: BYOK */}
        <div
          onClick={() => {
            setLimitModalOpen(false);
            openSettingsTab('keys');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-main, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary, #0073ea)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 115, 234, 0.12)',
                color: '#0073ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 650 }}>
                {language === 'id' ? 'Gunakan API Key Sendiri (BYOK)' : 'Use Personal API Key (BYOK)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {language === 'id' ? 'Bebas kuota selamanya untuk Gemini, OpenAI, Groq, dll.' : '100% unmetered for Gemini, OpenAI, Groq, etc.'}
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>

        {/* Option 2: OmniRoute Gateway */}
        <div
          onClick={() => {
            setLimitModalOpen(false);
            openSettingsTab('keys');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-main, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f43f5e')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.12)',
                color: '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Network size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 650 }}>OmniRoute Gateway</span>
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>PORT 20128</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {language === 'id' ? 'Jalankan router lokal tanpa batas kuota di perangkat Anda.' : 'Run local model router with zero limits.'}
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
