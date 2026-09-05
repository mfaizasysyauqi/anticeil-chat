export type TierId = 'free' | 'starter' | 'pro' | 'enterprise';

export interface LocalizedFeatureValue {
  en: string | boolean;
  id: string | boolean;
}

export interface PricingTier {
  id: TierId;
  name: string;
  priceUsd: number | null;
  priceIdr: number | null;
  periodUsd: string;
  periodIdr: string;
  subtitleEn: string;
  subtitleId: string;
  isPopular?: boolean;
  features: {
    dailyAiCredits: LocalizedFeatureValue;
    monthlyAiCredits: LocalizedFeatureValue;
    byok: LocalizedFeatureValue;
    omniRoute: LocalizedFeatureValue;
    databaseStorage: LocalizedFeatureValue;
    multiDeviceSync: LocalizedFeatureValue;
    fastLane: LocalizedFeatureValue;
    dataSovereignty: LocalizedFeatureValue;
    exportBackup: LocalizedFeatureValue;
    teamAccess: LocalizedFeatureValue;
  };
  ctaLabelEn: string;
  ctaLabelId: string;
  ctaLink: string;
}

export const FEATURE_KEYS = [
  'dailyAiCredits',
  'monthlyAiCredits',
  'byok',
  'omniRoute',
  'databaseStorage',
  'multiDeviceSync',
  'fastLane',
  'dataSovereignty',
  'exportBackup',
  'teamAccess',
] as const;

export type FeatureKey = typeof FEATURE_KEYS[number];

export const FEATURE_LABELS: Record<'en' | 'id', Record<FeatureKey | 'mostPopular' | 'active', string>> = {
  en: {
    dailyAiCredits: 'Daily AI Credits',
    monthlyAiCredits: 'Monthly AI Credits',
    byok: 'Personal Keys',
    omniRoute: 'OmniRoute',
    databaseStorage: 'Storage',
    multiDeviceSync: 'Multi-Device',
    fastLane: 'Fast Lane',
    dataSovereignty: 'Data Sovereignty',
    exportBackup: '.json Backup',
    teamAccess: 'Team Access',
    mostPopular: 'Most Popular',
    active: 'Active Plan',
  },
  id: {
    dailyAiCredits: 'Kredit AI Harian',
    monthlyAiCredits: 'Kredit AI Bulanan',
    byok: 'Kunci Pribadi',
    omniRoute: 'OmniRoute',
    databaseStorage: 'Penyimpanan',
    multiDeviceSync: 'Multi-Device',
    fastLane: 'Fast Lane',
    dataSovereignty: 'Kedaulatan Data',
    exportBackup: 'Cadangan .json',
    teamAccess: 'Akses Tim',
    mostPopular: 'Paling Populer',
    active: 'Paket Aktif',
  },
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Community',
    priceUsd: 0,
    priceIdr: 0,
    periodUsd: '/forever',
    periodIdr: '/selamanya',
    subtitleEn: '100% Private in Browser',
    subtitleId: '100% Privat di Browser',
    features: {
      dailyAiCredits: { en: '50 / day', id: '50 / hari' },
      monthlyAiCredits: { en: '—', id: '—' },
      byok: { en: '1 Active Key', id: '1 Kunci Aktif' },
      omniRoute: { en: 'Unlimited *', id: 'Tanpa Batas *' },
      databaseStorage: { en: 'Unlimited Local', id: 'Tanpa Batas (Lokal)' },
      multiDeviceSync: { en: false, id: false },
      fastLane: { en: false, id: false },
      dataSovereignty: { en: 'Private Local', id: 'Privat Lokal' },
      exportBackup: { en: true, id: true },
      teamAccess: { en: false, id: false },
    },
    ctaLabelEn: 'Get started free',
    ctaLabelId: 'Mulai Gratis',
    ctaLink: '/chat',
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    priceUsd: 3,
    priceIdr: 49000,
    periodUsd: '/month',
    periodIdr: '/bulan',
    subtitleEn: '5 GB Supabase Cloud Sync',
    subtitleId: 'Sinkron 5 GB Supabase Cloud',
    features: {
      dailyAiCredits: { en: '50 / day', id: '50 / hari' },
      monthlyAiCredits: { en: '150 / mo', id: '150 / bln' },
      byok: { en: 'Unlimited (Multi-Key)', id: 'Tanpa Batas (Multi-Key)' },
      omniRoute: { en: 'Unlimited *', id: 'Tanpa Batas *' },
      databaseStorage: { en: '5 GB Cloud', id: '5 GB Cloud' },
      multiDeviceSync: { en: true, id: true },
      fastLane: { en: false, id: false },
      dataSovereignty: { en: 'Encrypted Cloud', id: 'Cloud Enkripsi' },
      exportBackup: { en: true, id: true },
      teamAccess: { en: false, id: false },
    },
    ctaLabelEn: 'Get Starter Plan',
    ctaLabelId: 'Beli Starter Plan',
    ctaLink: '/register?plan=starter',
  },
  {
    id: 'pro',
    name: 'Pro Power User',
    priceUsd: 8,
    priceIdr: 129000,
    periodUsd: '/month',
    periodIdr: '/bulan',
    subtitleEn: '10 GB Cloud R2 + Supabase',
    subtitleId: '10 GB Cloud R2 + Supabase',
    isPopular: true,
    features: {
      dailyAiCredits: { en: '50 / day', id: '50 / hari' },
      monthlyAiCredits: { en: '750 / mo', id: '750 / bln' },
      byok: { en: 'Unlimited (Multi-Key)', id: 'Tanpa Batas (Multi-Key)' },
      omniRoute: { en: 'Unlimited *', id: 'Tanpa Batas *' },
      databaseStorage: { en: '10 GB Cloud R2', id: '10 GB Cloud R2' },
      multiDeviceSync: { en: true, id: true },
      fastLane: { en: true, id: true },
      dataSovereignty: { en: 'Encrypted Cloud', id: 'Cloud Enkripsi' },
      exportBackup: { en: true, id: true },
      teamAccess: { en: false, id: false },
    },
    ctaLabelEn: 'Get Pro Power',
    ctaLabelId: 'Beli Pro Power',
    ctaLink: '/register?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise BYOD',
    priceUsd: 32,
    priceIdr: 499000,
    periodUsd: '/month',
    periodIdr: '/bulan',
    subtitleEn: 'Zero-Trust Private Database',
    subtitleId: 'Database Privat Zero-Trust',
    features: {
      dailyAiCredits: { en: '50 / day', id: '50 / hari' },
      monthlyAiCredits: { en: 'Dedicated Pool', id: 'Dedicated Pool' },
      byok: { en: 'Unlimited (Multi-Key)', id: 'Tanpa Batas (Multi-Key)' },
      omniRoute: { en: 'Unlimited *', id: 'Tanpa Batas *' },
      databaseStorage: { en: 'Unlimited (BYOD)', id: 'Unlimited (BYOD)' },
      multiDeviceSync: { en: true, id: true },
      fastLane: { en: true, id: true },
      dataSovereignty: { en: '100% Zero-Trust', id: '100% Zero-Trust' },
      exportBackup: { en: true, id: true },
      teamAccess: { en: true, id: true },
    },
    ctaLabelEn: 'Get Enterprise Plan',
    ctaLabelId: 'Beli Enterprise Plan',
    ctaLink: '/register?plan=enterprise',
  },
];
