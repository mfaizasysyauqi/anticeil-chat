'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';

interface Pricing03Props {
  lang?: 'en' | 'id';
}

type FeatureValue = string | boolean;

interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  billingSubtitle: string;
  isPopular?: boolean;
  features: {
    conversations: FeatureValue;
    channels: FeatureValue;
    voice: FeatureValue;
    captainAi: FeatureValue;
    helpCenter: FeatureValue;
    teams: FeatureValue;
    automationRules: FeatureValue;
    ssoSaml: FeatureValue;
    auditLogs: FeatureValue;
    dataRetention: FeatureValue;
  };
  buttonText: string;
  link: string;
}

const FEATURE_LABELS = {
  en: {
    conversations: 'Conversations',
    channels: 'Channels',
    voice: 'Voice',
    captainAi: 'Captain AI',
    helpCenter: 'Help center',
    teams: 'Teams',
    automationRules: 'Automation rules',
    ssoSaml: 'SSO / SAML',
    auditLogs: 'Audit logs',
    dataRetention: 'Data retention',
    mostPopular: 'Most popular',
  },
  id: {
    conversations: 'Percakapan',
    channels: 'Kanal Akses',
    voice: 'Dikte Suara',
    captainAi: 'Captain AI',
    helpCenter: 'Pusat Bantuan',
    teams: 'Kolaborasi Tim',
    automationRules: 'Aturan Otomasi',
    ssoSaml: 'SSO / SAML',
    auditLogs: 'Log Audit',
    dataRetention: 'Retensi Data',
    mostPopular: 'Paling Populer',
  },
};

const PLANS_DATA: Record<'en' | 'id', PlanTier[]> = {
  en: [
    {
      id: 'hacker',
      name: 'Hacker',
      price: '$0',
      period: '/agent/month',
      billingSubtitle: 'Up to 2 agents',
      features: {
        conversations: '500/month',
        channels: 'Live chat',
        voice: false,
        captainAi: false,
        helpCenter: false,
        teams: false,
        automationRules: false,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '30 days',
      },
      buttonText: 'Get started free',
      link: '/chat',
    },
    {
      id: 'startups',
      name: 'Startups',
      price: '$19',
      period: '/agent/month',
      billingSubtitle: 'billed annually',
      features: {
        conversations: 'Unlimited *',
        channels: 'All',
        voice: false,
        captainAi: '300 credits',
        helpCenter: true,
        teams: false,
        automationRules: false,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '1 year',
      },
      buttonText: 'Buy Startups',
      link: '/register?plan=startups',
    },
    {
      id: 'business',
      name: 'Business',
      price: '$39',
      period: '/agent/month',
      billingSubtitle: 'billed annually',
      isPopular: true,
      features: {
        conversations: 'Unlimited *',
        channels: 'All',
        voice: true,
        captainAi: '500 credits',
        helpCenter: true,
        teams: true,
        automationRules: true,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '2 years',
      },
      buttonText: 'Buy Business',
      link: '/register?plan=business',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/agent/month',
      billingSubtitle: 'billed annually',
      features: {
        conversations: 'Unlimited *',
        channels: 'All',
        voice: true,
        captainAi: '800 credits',
        helpCenter: true,
        teams: true,
        automationRules: true,
        ssoSaml: true,
        auditLogs: true,
        dataRetention: '3 years',
      },
      buttonText: 'Buy Enterprise',
      link: '/register?plan=enterprise',
    },
  ],
  id: [
    {
      id: 'hacker',
      name: 'Hacker',
      price: 'Rp 0',
      period: '/agen/bulan',
      billingSubtitle: 'Hingga 2 agen',
      features: {
        conversations: '500/bulan',
        channels: 'Live chat',
        voice: false,
        captainAi: false,
        helpCenter: false,
        teams: false,
        automationRules: false,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '30 hari',
      },
      buttonText: 'Mulai Gratis',
      link: '/chat',
    },
    {
      id: 'startups',
      name: 'Startups',
      price: 'Rp 149.000',
      period: '/agen/bulan',
      billingSubtitle: 'ditagih tahunan',
      features: {
        conversations: 'Tanpa Batas *',
        channels: 'Semua',
        voice: false,
        captainAi: '300 kredit',
        helpCenter: true,
        teams: false,
        automationRules: false,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '1 tahun',
      },
      buttonText: 'Beli Startups',
      link: '/register?plan=startups',
    },
    {
      id: 'business',
      name: 'Business',
      price: 'Rp 299.000',
      period: '/agen/bulan',
      billingSubtitle: 'ditagih tahunan',
      isPopular: true,
      features: {
        conversations: 'Tanpa Batas *',
        channels: 'Semua',
        voice: true,
        captainAi: '500 kredit',
        helpCenter: true,
        teams: true,
        automationRules: true,
        ssoSaml: false,
        auditLogs: false,
        dataRetention: '2 tahun',
      },
      buttonText: 'Beli Business',
      link: '/register?plan=business',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Rp 799.000',
      period: '/agen/bulan',
      billingSubtitle: 'ditagih tahunan',
      features: {
        conversations: 'Tanpa Batas *',
        channels: 'Semua',
        voice: true,
        captainAi: '800 kredit',
        helpCenter: true,
        teams: true,
        automationRules: true,
        ssoSaml: true,
        auditLogs: true,
        dataRetention: '3 tahun',
      },
      buttonText: 'Beli Enterprise',
      link: '/register?plan=enterprise',
    },
  ],
};

const FEATURE_KEYS: Array<keyof PlanTier['features']> = [
  'conversations',
  'channels',
  'voice',
  'captainAi',
  'helpCenter',
  'teams',
  'automationRules',
  'ssoSaml',
  'auditLogs',
  'dataRetention',
];

export default function Pricing_03({ lang: propLang }: Pricing03Props) {
  const storeLang = useSettingsStore((s) => s.language);
  const activeLang: 'en' | 'id' = (propLang || storeLang === 'id' ? 'id' : 'en');
  const labels = FEATURE_LABELS[activeLang];
  const plans = PLANS_DATA[activeLang];

  return (
    <div style={{ width: '100%', maxWidth: '1220px', margin: '0 auto', padding: '10px 0 20px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}
      >
        {plans.map((plan) => {
          const isHighlight = plan.isPopular;

          return (
            <div
              key={plan.id}
              style={{
                borderRadius: '16px',
                background: '#FFFFFF',
                border: isHighlight ? '2px solid #1E6BEB' : '1px solid #E5E7EB',
                boxShadow: isHighlight
                  ? '0 12px 32px -4px rgba(30, 107, 235, 0.16), 0 2px 6px rgba(0,0,0,0.04)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
                padding: '28px 22px 24px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                {/* Top Title & Optional Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '26px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {plan.name}
                  </h3>

                  {isHighlight && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        background: '#1E6BEB',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {labels.mostPopular}
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: 800,
                      color: '#111827',
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 400,
                      color: '#6B7280',
                      marginLeft: '4px',
                    }}
                  >
                    {plan.period}
                  </span>
                </div>

                {/* Billing Subtitle */}
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#6B7280',
                    marginTop: '4px',
                    marginBottom: '26px',
                  }}
                >
                  {plan.billingSubtitle}
                </div>

                {/* Comparison Key-Value Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {FEATURE_KEYS.map((key) => {
                    const label = labels[key];
                    const val = plan.features[key];

                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '22px',
                          fontSize: '12.5px',
                        }}
                      >
                        <span style={{ color: '#4B5563', fontWeight: 400 }}>{label}</span>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {typeof val === 'boolean' ? (
                            val ? (
                              <Check size={16} strokeWidth={2.6} color="#16A34A" />
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '15px', lineHeight: 1 }}>—</span>
                            )
                          ) : (
                            <span
                              style={{
                                color: '#111827',
                                fontWeight: 600,
                                fontSize: '12px',
                                textAlign: 'right',
                              }}
                            >
                              {val}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: '28px' }}>
                <Link
                  href={plan.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: '#1E6BEB',
                    color: '#FFFFFF',
                    boxShadow: isHighlight
                      ? '0 4px 14px rgba(30, 107, 235, 0.35)'
                      : '0 2px 6px rgba(30, 107, 235, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1557C0';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1E6BEB';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
