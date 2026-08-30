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
        padding: '4px 10px',
        borderRadius: 'var(--radius-md, 6px)',
        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
        background: isSelected ? brandColor : 'var(--bg-subtle)',
        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: isSelected ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {label}
    </button>
  );
}
