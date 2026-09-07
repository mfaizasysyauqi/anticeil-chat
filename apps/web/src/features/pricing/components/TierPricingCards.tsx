'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  PRICING_TIERS,
  FEATURE_KEYS,
  FEATURE_LABELS,
  type TierId,
} from '../constants/pricingTiers';

const RESPONSIVE_GRID_CSS = `
  .anticeil-tier-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-items: stretch;
  }
  @media (max-width: 960px) {
    .anticeil-tier-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
  }
  @media (max-width: 600px) {
    .anticeil-tier-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
`;

interface TierPricingCardsProps {
  lang?: 'en' | 'id';
  currency?: 'usd' | 'idr';
  /** Current active tier (for modals) */
  currentTier?: TierId | null;
  /** Callback when a tier button is clicked (modals) */
  onSelectTier?: (tierId: TierId) => void | Promise<void>;
  /** ID of the tier currently loading */
  actionLoadingId?: string | null;
  /** Render CTA as <Link href> instead of <button> (landing page) */
  isLinkMode?: boolean;
  /** Extra padding applied to the outer wrapper */
  outerPadding?: string;
}

export function TierPricingCards({
  lang = 'en',
  currency = 'idr',
  currentTier,
  onSelectTier,
  actionLoadingId,
  isLinkMode = false,
  outerPadding = '0',
}: TierPricingCardsProps) {
  const labels = FEATURE_LABELS[lang];

  return (
    <div style={{ padding: outerPadding }}>
      <style>{RESPONSIVE_GRID_CSS}</style>

      <div className="anticeil-tier-grid">
        {PRICING_TIERS.map((plan) => {
          const isHighlight = !!plan.isPopular;
          const isCurrent = currentTier === plan.id;
          const isBusy = actionLoadingId === plan.id;

          const priceStr =
            currency === 'usd'
              ? (plan.priceUsd === null || plan.priceUsd === undefined
                  ? (lang === 'id' ? 'Khusus' : 'Dedicated')
                  : plan.priceUsd === 0
                  ? '$0'
                  : `$${plan.priceUsd}`)
              : (plan.priceIdr === null || plan.priceIdr === undefined
                  ? (lang === 'id' ? 'Khusus' : 'Dedicated')
                  : plan.priceIdr === 0
                  ? 'Rp 0'
                  : `Rp ${plan.priceIdr.toLocaleString('id-ID')}`);

          const period = currency === 'usd' ? plan.periodUsd : (lang === 'id' ? plan.periodIdr : plan.periodUsd);
          const subtitle = lang === 'id' ? plan.subtitleId : plan.subtitleEn;
          const ctaLabel = lang === 'id' ? plan.ctaLabelId : plan.ctaLabelEn;

          const ctaText = isBusy
            ? (lang === 'id' ? 'Memproses...' : 'Processing...')
            : isCurrent
            ? `✓ ${labels.active}`
            : ctaLabel;

          const cardBorder = isHighlight
            ? '2px solid var(--brand-primary)'
            : isCurrent
            ? '2px solid var(--accent-success)'
            : '1px solid var(--border-subtle)';

          const cardShadow = isHighlight
            ? 'var(--shadow-lg)'
            : 'var(--shadow-sm)';

          const btnBg = isCurrent
            ? 'var(--bg-main)'
            : isHighlight
            ? 'var(--brand-primary)'
            : 'var(--bg-subtle)';

          const btnColor = isCurrent
            ? 'var(--text-muted)'
            : isHighlight
            ? '#FFFFFF'
            : 'var(--text-primary)';

          const btnShadow = isHighlight && !isCurrent
            ? '0 4px 14px rgba(0, 115, 234, 0.35)'
            : 'none';

          return (
            <div
              key={plan.id}
              style={{
                position: 'relative',
                borderRadius: '16px',
                border: cardBorder,
                boxShadow: cardShadow,
                background: 'var(--bg-surface)',
                padding: '22px 18px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              {/* Popular badge */}
              {isHighlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '14px',
                    background: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '999px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {labels.mostPopular}
                </div>
              )}

              <div>
                {/* Title row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '26px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: 'rgba(0, 200, 117, 0.15)',
                        color: 'var(--accent-success)',
                      }}
                    >
                      {lang === 'id' ? 'Aktif' : 'Active'}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                    }}
                  >
                    {priceStr}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginLeft: '4px',
                    }}
                  >
                    {period}
                  </span>
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    marginBottom: '18px',
                  }}
                >
                  {subtitle}
                </div>

                {/* Feature rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {FEATURE_KEYS.map((key, keyIdx) => {
                    const label = labels[key];
                    const val = plan.features[key][lang];

                    return (
                      <React.Fragment key={key}>
                        {/* Divider after the AI credit section (after monthlyAiCredits) */}
                        {keyIdx === 2 && (
                          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              flexShrink: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {label}
                          </span>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              flexShrink: 0,
                            }}
                          >
                            {typeof val === 'boolean' ? (
                              val ? (
                                <Check size={15} color="var(--accent-success)" strokeWidth={2.6} />
                              ) : (
                                <span
                                  style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '14px',
                                    lineHeight: 1,
                                  }}
                                >
                                  —
                                </span>
                              )
                            ) : (
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                  fontSize: '12px',
                                }}
                              >
                                {val}
                              </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              {isLinkMode ? (
                <Link
                  href={plan.ctaLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    background: isHighlight ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: isHighlight ? '#FFFFFF' : 'var(--text-primary)',
                    border: isHighlight ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: isHighlight
                      ? '0 4px 14px rgba(0, 115, 234, 0.35)'
                      : 'none',
                  }}
                >
                  {ctaLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || isBusy}
                  onClick={() => onSelectTier?.(plan.id)}
                  style={{
                    marginTop: 'auto',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: isHighlight ? 'none' : '1px solid var(--border-subtle)',
                    background: btnBg,
                    color: btnColor,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isCurrent || isBusy ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    width: '100%',
                    boxShadow: btnShadow,
                  }}
                >
                  {ctaText}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
