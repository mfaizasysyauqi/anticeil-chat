'use client';

import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { LLMProviderId } from '@anticeil/core';

export interface KeyLimitDialogData {
  isOpen: boolean;
  newProviderId?: LLMProviderId;
  newKey?: string;
  newUrl?: string;
  existingProviderId?: LLMProviderId;
  existingProviderName?: string;
  newProviderName?: string;
}

interface KeyLimitDialogProps {
  dialogData: KeyLimitDialogData | null;
  language: string;
  onClose: () => void;
  onConfirmReplace: () => void;
  onUpgrade: () => void;
}

export function KeyLimitDialog({
  dialogData,
  language,
  onClose,
  onConfirmReplace,
  onUpgrade,
}: KeyLimitDialogProps) {
  if (!dialogData?.isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100010,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          maxWidth: '460px',
          width: '100%',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Batas Kunci API Paket Free' : 'Free Tier API Key Limit'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {language === 'id'
                ? 'Maksimal 1 API Key aktif pada paket Free Community'
                : 'Max 1 active API Key on Free Community plan'}
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {language === 'id' ? (
            <>
              Kunci API Anda saat ini aktif untuk <strong>{dialogData.existingProviderName}</strong>.
              Pada paket Free Community, Anda dapat menggunakan semua model dari 1 provider aktif tersebut secara bebas.
              <br /><br />
              Ingin mengganti ke <strong>{dialogData.newProviderName}</strong> (menghapus kunci lama), atau upgrade ke Starter / Pro untuk multi-key tanpa batas?
            </>
          ) : (
            <>
              Your API Key is currently active for <strong>{dialogData.existingProviderName}</strong>.
              On the Free Community plan, all models for 1 active provider are fully unlocked.
              <br /><br />
              Would you like to replace it with <strong>{dialogData.newProviderName}</strong> (deletes previous key), or upgrade to Starter / Pro for unlimited multi-key support?
            </>
          )}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={onConfirmReplace}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? `Ganti Kunci (${dialogData.newProviderName})` : `Replace (${dialogData.newProviderName})`}
          </button>

          <button
            type="button"
            onClick={onUpgrade}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--brand-primary, #0073EA)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>{language === 'id' ? 'Lihat Paket' : 'Upgrade Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
