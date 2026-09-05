'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, Sparkles } from 'lucide-react';
import { useStorageStore, formatStorageBytes } from '../store/useStorageStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { getTierStorageName } from '@anticeil/core';

interface StorageMeterProps {
  compact?: boolean;
  onManageClick?: () => void;
}

export function StorageMeter({ compact = false, onManageClick }: StorageMeterProps) {
  const [mounted, setMounted] = useState(false);
  const usedBytes = useStorageStore((s) => s.usedBytes);
  const limitBytes = useStorageStore((s) => s.limitBytes);
  const language = useSettingsStore((s) => s.language);
  const tier = useAuthStore((s) => s.tier);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isFreeTier = tier === 'free' || !tier;
  const isStarter = tier === 'starter';
  const isPro = tier === 'pro';
  const isEnterprise = tier === 'enterprise';

  const effectiveLimitBytes = isStarter
    ? 5 * 1024 * 1024 * 1024
    : isPro
    ? 10 * 1024 * 1024 * 1024
    : isEnterprise
    ? 100 * 1024 * 1024 * 1024
    : 0;

  const percentage = isFreeTier
    ? 0
    : Math.min(100, Math.round((usedBytes / effectiveLimitBytes) * 100));

  const isNearLimit = !isFreeTier && percentage >= 85;
  const isFull = !isFreeTier && percentage >= 98;

  const barColor = isFreeTier
    ? 'var(--accent-success, #00C875)'
    : isFull
    ? 'var(--accent-danger, #EF4444)'
    : isNearLimit
    ? 'var(--accent-warning, #F59E0B)'
    : isStarter
    ? '#f59e0b'
    : isEnterprise
    ? '#8B5CF6'
    : 'var(--brand-primary, #0073EA)';

  if (compact) {
    return (
      <div
        onClick={onManageClick}
        title={
          isFreeTier
            ? (language === 'id' ? 'Penyimpanan Lokal Browser (Tanpa Batas) — Klik untuk Upgrade ke Cloud' : 'Unlimited Local Browser Storage — Click to Upgrade to Cloud')
            : (language === 'id' ? 'Kapasitas Cloud — Klik untuk Kelola' : 'Cloud Storage Quota — Click to Manage')
        }
        className={onManageClick ? 'clickable-pill' : ''}
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          cursor: onManageClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', gap: '4px', minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 0, overflow: 'hidden' }}>
            <HardDrive size={12} color={barColor} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isFreeTier
                ? (language === 'id' ? 'Penyimpanan' : 'Storage')
                : isStarter
                ? 'Starter Cloud'
                : isPro
                ? 'Pro Cloud'
                : 'Enterprise'}
            </span>
          </span>
          <span style={{ fontWeight: 700, color: isFull ? 'var(--accent-danger)' : 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {isFreeTier
              ? `${formatStorageBytes(usedBytes)} (Lokal)`
              : isEnterprise
              ? `${formatStorageBytes(usedBytes)} (BYOD)`
              : `${formatStorageBytes(usedBytes)} / ${formatStorageBytes(effectiveLimitBytes)}`}
          </span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: isFreeTier ? '100%' : `${percentage}%`,
              height: '100%',
              backgroundColor: barColor,
              opacity: isFreeTier ? 0.35 : 1,
              borderRadius: '9999px',
              transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-lg, 12px)',
        backgroundColor: 'var(--bg-main)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isFreeTier ? 'rgba(0, 200, 117, 0.1)' : 'rgba(0, 115, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFreeTier ? '#00C875' : 'var(--brand-primary)',
            }}
          >
            <HardDrive size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isFreeTier
                ? (language === 'id' ? 'Penyimpanan Lokal Browser' : 'Local Browser Storage')
                : (language === 'id' ? 'Kuota Penyimpanan Ruang Kerja' : 'Workspace Storage Quota')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {getTierStorageName(tier, language as 'en' | 'id')}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: barColor,
            backgroundColor: 'var(--bg-surface)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {isFreeTier
            ? (language === 'id' ? '100% Privat Lokal' : '100% Private Local')
            : isEnterprise
            ? 'BYOD Dedicated'
            : `${percentage}% ${language === 'id' ? 'Terpakai' : 'Used'}`}
        </span>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '9999px',
          backgroundColor: 'var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: isFreeTier ? '100%' : `${percentage}%`,
            height: '100%',
            backgroundColor: barColor,
            opacity: isFreeTier ? 0.35 : 1,
            borderRadius: '9999px',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
        {isFreeTier ? (
          <>
            <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'tersimpan di browser Anda' : 'stored in your browser'}</span>
            <span style={{ color: '#00C875', fontWeight: 600 }}>{language === 'id' ? 'Tanpa Batas Server' : 'Unlimited Local'}</span>
          </>
        ) : isEnterprise ? (
          <>
            <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'terpakai' : 'used'}</span>
            <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Custom BYOD</span>
          </>
        ) : (
          <>
            <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'dari' : 'of'} {formatStorageBytes(effectiveLimitBytes)}</span>
            <span>{formatStorageBytes(Math.max(0, effectiveLimitBytes - usedBytes))} {language === 'id' ? 'tersisa' : 'remaining'}</span>
          </>
        )}
      </div>
    </div>
  );
}
