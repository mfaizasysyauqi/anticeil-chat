'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useStorageStore, formatStorageBytes } from '../store/useStorageStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { ShieldAlert, Download, Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';

export function CloudGracePeriodBanner() {
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const sources = useStorageStore((s) => s.sources);
  const isGracePeriodDismissed = useStorageStore((s) => s.isGracePeriodDismissed);
  const dismissGracePeriod = useStorageStore((s) => s.dismissGracePeriod);
  const isMigrating = useStorageStore((s) => s.isMigratingCloudToLocal);
  const migrateAndPurge = useStorageStore((s) => s.migrateCloudToLocalAndPurge);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);

  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null);

  // Total cloud bytes currently held
  const cloudBytes = (sources?.databaseBytes || 0) + (sources?.r2Bytes || 0);

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
      setMigrationSuccess(`Berhasil memindahkan ${res.count} data ke browser lokal! Cloud storage telah dikosongkan.`);
      setTimeout(() => {
        dismissGracePeriod();
      }, 4000);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.28)',
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
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#f59e0b',
          }}
        >
          {migrationSuccess ? <CheckCircle2 size={18} color="#10b981" /> : <ShieldAlert size={18} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
              }}
            >
              Masa Tenggang Pro
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f4f6' }}>
              {migrationSuccess
                ? migrationSuccess
                : `Data Cloud Anda (${formatStorageBytes(cloudBytes)}) Tersimpan Aman`}
            </span>
          </div>
          {!migrationSuccess && (
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(209, 213, 219, 0.85)', lineHeight: 1.4 }}>
              Langganan Pro berakhir. Pindahkan seluruh obrolan & file ke database lokal browser (IndexedDB) atau perpanjang paket untuk melanjutkan Cloud Sync.
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
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#f59e0b',
              color: '#000',
              border: 'none',
              cursor: isMigrating ? 'not-allowed' : 'pointer',
              opacity: isMigrating ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {isMigrating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memindahkan ke Lokal...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Pindah ke Lokal & Kosongkan Cloud</span>
              </>
            )}
          </button>

          <button
            onClick={() => setPricingModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e5e7eb',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} color="#60a5fa" />
            <span>Perpanjang Pro</span>
          </button>

          <button
            onClick={dismissGracePeriod}
            title="Tutup banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(156, 163, 175, 0.8)',
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
