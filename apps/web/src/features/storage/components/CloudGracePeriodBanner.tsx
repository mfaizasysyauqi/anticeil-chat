'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useStorageStore, formatStorageBytes } from '../store/useStorageStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ShieldAlert, Download, Sparkles, X, Loader2, CheckCircle2, Timer } from 'lucide-react';

const GRACE_PERIOD_STORAGE_KEY = 'anticeil_cloud_grace_deadline';
const DEFAULT_GRACE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function CloudGracePeriodBanner() {
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const sources = useStorageStore((s) => s.sources);
  const isGracePeriodDismissed = useStorageStore((s) => s.isGracePeriodDismissed);
  const dismissGracePeriod = useStorageStore((s) => s.dismissGracePeriod);
  const isMigrating = useStorageStore((s) => s.isMigratingCloudToLocal);
  const migrateAndPurge = useStorageStore((s) => s.migrateCloudToLocalAndPurge);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);

  const language = useSettingsStore((s) => s.language);
  const isId = language === 'id';

  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(DEFAULT_GRACE_DURATION_MS);

  // Total cloud bytes currently held
  const cloudBytes = (sources?.databaseBytes || 0) + (sources?.r2Bytes || 0);

  // Initialize and tick countdown timer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetTimestamp: number;
    const stored = localStorage.getItem(GRACE_PERIOD_STORAGE_KEY);
    if (stored && !isNaN(Number(stored))) {
      targetTimestamp = Number(stored);
    } else {
      targetTimestamp = Date.now() + DEFAULT_GRACE_DURATION_MS;
      localStorage.setItem(GRACE_PERIOD_STORAGE_KEY, String(targetTimestamp));
    }

    const updateTimer = () => {
      const remaining = Math.max(0, targetTimestamp - Date.now());
      setTimeLeftMs(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatted countdown string
  const countdownFormatted = useMemo(() => {
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (days > 0) {
      return isId
        ? `${days}h ${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`
        : `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return isId
      ? `${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }, [timeLeftMs, isId]);

  // Only show if:
  // 1. User has an active logged in session
  // 2. Current tier is 'free'
  // 3. User still has cloud data (> 0 bytes)
  // 4. Banner is not dismissed in this session
  if (!session?.access_token || tier !== 'free' || cloudBytes <= 0 || isGracePeriodDismissed) {
    return null;
  }

  const handleMigrateToLocal = async () => {
    if (!session?.access_token || isMigrating) return;
    const res = await migrateAndPurge(session.access_token);
    if (res.success) {
      setMigrationSuccess(
        isId
          ? `Berhasil memindahkan ${res.count} data ke browser lokal! Cloud storage telah dikosongkan.`
          : `Successfully transferred ${res.count} items to local browser! Cloud storage has been purged.`
      );
      setTimeout(() => {
        dismissGracePeriod();
      }, 4000);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(226, 68, 92, 0.08) 0%, rgba(253, 171, 61, 0.07) 50%, var(--bg-surface) 100%)',
        borderBottom: '1px solid var(--border-strong)',
        backdropFilter: 'blur(12px)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        zIndex: 30,
        position: 'relative',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Left info badge & message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 260, flex: 1 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: 'rgba(226, 68, 92, 0.12)',
            border: '1px solid rgba(226, 68, 92, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--accent-danger, #e2445c)',
          }}
        >
          {migrationSuccess ? <CheckCircle2 size={18} color="var(--accent-success, #00c875)" /> : <ShieldAlert size={18} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: 'rgba(253, 171, 61, 0.15)',
                border: '1px solid rgba(253, 171, 61, 0.3)',
                color: 'var(--accent-warning, #d97706)',
              }}
            >
              {isId ? 'Masa Tenggang Pro' : 'Pro Grace Period'}
            </span>

            {/* Scarcity Countdown Badge */}
            {!migrationSuccess && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(226, 68, 92, 0.12)',
                  border: '1px solid rgba(226, 68, 92, 0.3)',
                  color: 'var(--accent-danger, #e2445c)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <Timer size={12} className="animate-pulse" style={{ color: 'var(--accent-danger, #e2445c)' }} />
                <span>
                  {isId ? `Dihapus dalam: ${countdownFormatted}` : `Auto-purge in: ${countdownFormatted}`}
                </span>
              </div>
            )}

            <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)' }}>
              {migrationSuccess
                ? migrationSuccess
                : isId
                ? `Data Cloud Anda (${formatStorageBytes(cloudBytes)}) Akan Dihapus Otomatis`
                : `Your Cloud Data (${formatStorageBytes(cloudBytes)}) Will Be Auto-Purged`}
            </span>
          </div>
          {!migrationSuccess && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {isId
                ? 'Langganan Pro berakhir. Segera pindahkan seluruh obrolan & file ke database lokal browser (IndexedDB) atau perpanjang paket Pro sebelum data cloud dihapus permanen.'
                : 'Pro subscription has expired. Transfer all chats & files to local browser database (IndexedDB) or renew Pro before cloud data is permanently deleted.'}
            </p>
          )}
        </div>
      </div>

      {/* Right action CTAs */}
      {!migrationSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleMigrateToLocal}
            disabled={isMigrating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '7px',
              fontSize: 12,
              fontWeight: 650,
              backgroundColor: '#f59e0b',
              color: '#111827',
              border: 'none',
              cursor: isMigrating ? 'not-allowed' : 'pointer',
              opacity: isMigrating ? 0.7 : 1,
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
            }}
          >
            {isMigrating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isId ? 'Memindahkan ke Lokal...' : 'Moving to Local...'}</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>{isId ? 'Pindah ke Lokal & Kosongkan Cloud' : 'Move to Local & Purge Cloud'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setPricingModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '7px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} color="var(--brand-primary, #0073ea)" />
            <span>{isId ? 'Perpanjang Pro' : 'Renew Pro'}</span>
          </button>

          <button
            onClick={dismissGracePeriod}
            title={isId ? 'Tutup banner' : 'Dismiss banner'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
