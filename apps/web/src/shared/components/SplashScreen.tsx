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
        @keyframes anticeil-shimmer-flat {
          0% {
            left: -40%;
          }
          100% {
            left: 120%;
          }
        }
        @keyframes anticeil-fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Center Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          position: 'relative',
          zIndex: 1,
          animation: 'anticeil-fade-in 0.25s ease-out',
        }}
      >
        {/* Anticeil Logo Mark (No Container Box / Border) */}
        <img
          src="/anticeil-logo.png"
          alt="Anticeil"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain',
            display: 'block',
          }}
        />

        {/* Brand Name & Subtitle */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span
            style={{
              fontSize: '17px',
              fontWeight: 750,
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

        {/* Flat Solid Progress Bar (No Gradient) */}
        <div
          style={{
            width: '160px',
            height: '3px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-subtle)',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '6px',
          }}
        >
          {progress !== undefined ? (
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: 'var(--brand-primary, #0073ea)',
                borderRadius: '9999px',
                transition: 'width 0.2s ease',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                height: '100%',
                width: '40%',
                backgroundColor: 'var(--brand-primary, #0073ea)',
                borderRadius: '9999px',
                animation: 'anticeil-shimmer-flat 1.2s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
