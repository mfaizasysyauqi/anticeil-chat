'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, Sparkles } from 'lucide-react';
import { useStorageStore, formatStorageBytes } from '../store/useStorageStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface StorageMeterProps {
  compact?: boolean;
  onManageClick?: () => void;
}

export function StorageMeter({ compact = false, onManageClick }: StorageMeterProps) {
  const [mounted, setMounted] = useState(false);
  const usedBytes = useStorageStore((s) => s.usedBytes);
  const limitBytes = useStorageStore((s) => s.limitBytes);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const isNearLimit = percentage >= 85;
  const isFull = percentage >= 98;

  const barColor = isFull
    ? 'var(--accent-danger, #EF4444)'
    : isNearLimit
    ? 'var(--accent-warning, #F59E0B)'
    : 'var(--brand-primary, #0073EA)';

  if (compact) {
    return (
      <div
        onClick={onManageClick}
        title={language === 'id' ? 'Kapasitas Penyimpanan — Klik untuk Upgrade / Kelola' : 'Personal Storage Quota — Click to Upgrade / Manage'}
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
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{language === 'id' ? 'Penyimpanan' : 'Storage'}</span>
          </span>
          <span style={{ fontWeight: 700, color: isFull ? 'var(--accent-danger)' : 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {formatStorageBytes(usedBytes)} / {formatStorageBytes(limitBytes)}
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
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: barColor,
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
              backgroundColor: 'rgba(0, 115, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <HardDrive size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Kuota Penyimpanan Ruang Kerja' : 'Workspace Storage Quota'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {language === 'id' ? 'Gratis 1 GB untuk seluruh dokumen, media, & canvas' : 'Free 1 GB for all docs, media, & canvas'}
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
          {percentage}% {language === 'id' ? 'Terpakai' : 'Used'}
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
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '9999px',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
        <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'dari' : 'of'} {formatStorageBytes(limitBytes)}</span>
        <span>{formatStorageBytes(Math.max(0, limitBytes - usedBytes))} {language === 'id' ? 'tersisa' : 'remaining'}</span>
      </div>
    </div>
  );
}
