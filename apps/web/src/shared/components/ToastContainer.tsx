'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore, ToastType } from '../hooks/useToast';

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10B981', icon: '#10B981' },
  error:   { bg: 'rgba(239, 68,  68,  0.12)', border: '#EF4444', icon: '#EF4444' },
  info:    { bg: 'rgba(59,  130, 246, 0.12)', border: '#3B82F6', icon: '#3B82F6' },
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckCircle2 size={15} />;
  if (type === 'error')   return <AlertCircle  size={15} />;
  return <Info size={15} />;
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '360px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const c = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface, #1e2130)',
              border: `1px solid ${c.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              lineHeight: '1.4',
              pointerEvents: 'auto',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, paddingTop: '1px' }}>
              <ToastIcon type={toast.type} />
            </span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
