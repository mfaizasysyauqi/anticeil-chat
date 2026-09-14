'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface StarterCardItem {
  category: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  badgeBg: string;
  title?: string;
  description?: string;
  prompt?: string;
  [key: string]: any;
}

export interface StarterCardGridProps<T extends StarterCardItem = StarterCardItem> {
  cards: T[];
  onSelect: (card: T, index: number) => void;
  header?: React.ReactNode;
}

export function StarterCardGrid<T extends StarterCardItem = StarterCardItem>({
  cards,
  onSelect,
  header,
}: StarterCardGridProps<T>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)', width: '100%' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          const text = card.description || card.prompt || '';
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(card, i)}
              className="hover-card"
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                height: '100%',
                boxSizing: 'border-box',
                boxShadow: 'var(--inner-glow)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: card.color,
                    background: card.badgeBg,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Icon size={12} color={card.color} />
                  {card.category}
                </span>
                <ArrowUpRight size={13} color="var(--text-muted)" />
              </div>
              {card.title ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 650,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {card.title}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: '17px',
                      minHeight: '34px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {text}
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    lineHeight: '18px',
                    minHeight: '36px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontWeight: 450,
                  }}
                >
                  {text}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}