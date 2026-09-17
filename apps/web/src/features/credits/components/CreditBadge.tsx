'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, KeyRound, ChevronRight, X, PlusCircle } from 'lucide-react';
import { useCreditStore, MAX_DAILY_CREDITS } from '../store/useCreditStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}j ${minutes}m`;
}

export function CreditBadge() {
  const dailyCredits = useCreditStore((s) => s.credits) || 0;
  const maxCredits = useCreditStore((s) => s.maxDailyCredits) || MAX_DAILY_CREDITS;
  const paidCredits = useCreditStore((s) => s.paidCredits) || 0;
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const setIsModelSelectorOpen = useSettingsStore((s) => s.setIsModelSelectorOpen);
  const language = useSettingsStore((s) => s.language);

  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const percentage = Math.min(100, Math.max(0, (dailyCredits / maxCredits) * 100));
  const isDailyLow = dailyCredits <= 5;
  const isDailyCritical = dailyCredits === 0;

  const badgeColor = paidCredits > 0
    ? '#f59e0b'
    : isDailyCritical
    ? '#ef4444'
    : isDailyLow
    ? '#f59e0b'
    : '#10b981';

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          background: paidCredits > 0
            ? 'rgba(245, 158, 11, 0.12)'
            : isDailyCritical
            ? 'rgba(239, 68, 68, 0.12)'
            : isDailyLow
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(16, 185, 129, 0.12)',
          border: `1px solid ${paidCredits > 0 ? 'rgba(245, 158, 11, 0.35)' : isDailyCritical ? 'rgba(239, 68, 68, 0.3)' : isDailyLow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Anticeil AI Credits"
      >
        <Zap size={13} color={badgeColor} fill={badgeColor} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
          <span style={{ color: badgeColor }}>
            {(dailyCredits || 0) + (paidCredits || 0)} credits
          </span>
        </div>
      </button>

      {/* Popover Breakdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '290px',
            background: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-strong, rgba(255,255,255,0.12))',
            borderRadius: '14px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55)',
            padding: '16px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: 'var(--text-primary)',
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Zap size={14} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                {language === 'id' ? 'Saldo Kredit AI' : 'AI Credit Balance'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Paid Credits Box (Never Expire) */}
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-subtle) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
                ⚡ {language === 'id' ? 'Saldo Top-up' : 'Top-up Balance'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {language === 'id' ? 'Tanpa expired · Ditumpuk' : 'No expiry · Stackable'}
              </div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
              {paidCredits.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 600 }}>kredit</span>
            </div>
          </div>

          {/* Daily Free Credits Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                🔄 {language === 'id' ? 'Gratis Harian' : 'Daily Free'}
              </span>
              <span style={{ fontWeight: 700, color: isDailyCritical ? '#ef4444' : '#10b981' }}>
                {dailyCredits} / {maxCredits}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.08))',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: isDailyCritical ? '#ef4444' : isDailyLow ? '#f59e0b' : '#10b981',
                  transition: 'width 0.3s ease',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Reset Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--bg-subtle, rgba(255,255,255,0.04))',
              borderRadius: '6px',
              fontSize: '10.5px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} color="var(--text-muted)" />
              <span>{language === 'id' ? 'Reset harian dalam:' : 'Daily reset in:'}</span>
            </div>
            <span style={{ fontWeight: 650, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {countdown} (00:00)
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Top-up Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPricingModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={13} />
              <span>{language === 'id' ? 'Top-up Kredit (Mulai $1 / Rp 15rb)' : 'Top-up Credits (From $1)'}</span>
              <ChevronRight size={12} />
            </button>

            {/* BYOK Notice */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsModelSelectorOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '5px 8px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <KeyRound size={11} />
              <span>{language === 'id' ? 'Pakai API Key Sendiri (BYOK) — Gratis' : 'Use Personal API Key (BYOK) — Free'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
