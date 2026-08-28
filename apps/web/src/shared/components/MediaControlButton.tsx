'use client';

import React from 'react';

interface MediaControlButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  brandColor?: string;
}

export function MediaControlButton({
  label,
  isSelected,
  onClick,
  brandColor = 'var(--brand-primary)',
}: MediaControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: 'none',
        background: isSelected ? brandColor : 'var(--bg-subtle)',
        color: isSelected ? '#fff' : 'var(--text-muted)',
        fontSize: '13px',
        fontWeight: isSelected ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-card)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-subtle)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      {label}
    </button>
  );
}
