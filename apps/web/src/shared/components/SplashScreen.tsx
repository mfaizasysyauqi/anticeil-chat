'use client';

import React from 'react';

interface SplashScreenProps {
  title?: string;
  subtitle?: string;
  progress?: number; // Optional 0-100 or undefined for indeterminate
}

export function SplashScreen({
  title = 'Anticeil',
  subtitle = 'Memuat Workspace Dokumen...',
  progress,
}: SplashScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes anticeil-pulse-glow {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 16px rgba(0, 115, 234, 0.25));
          }
          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 28px rgba(0, 115, 234, 0.45));
          }
        }
        @keyframes anticeil-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
        @keyframes anticeil-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 115, 234, 0.12) 0%, rgba(120, 75, 209, 0.04) 50%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'anticeil-pulse-glow 3s ease-in-out infinite',
        }}
      />

      {/* Center Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          zIndex: 1,
          animation: 'anticeil-fade-in 0.3s ease-out',
        }}
      >
        {/* Anticeil Logo Mark */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'anticeil-pulse-glow 2.5s ease-in-out infinite',
          }}
        >
          <img
            src="/anticeil-logo.png"
            alt="Anticeil"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Brand Name & Subtitle */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div
          style={{
            width: '180px',
            height: '3.5px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-subtle)',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '8px',
          }}
        >
          {progress !== undefined ? (
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: 'linear-gradient(90deg, #0073EA 0%, #784BD1 100%)',
                borderRadius: '9999px',
                transition: 'width 0.2s ease',
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                width: '50%',
                background: 'linear-gradient(90deg, #0073EA 0%, #784BD1 50%, #00C875 100%)',
                borderRadius: '9999px',
                animation: 'anticeil-shimmer 1.4s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
