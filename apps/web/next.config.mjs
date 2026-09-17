import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'antsheet',
    '@anticeil/core',
    '@univerjs/core',
    '@univerjs/design',
    '@univerjs/ui',
    '@univerjs/docs',
    '@univerjs/docs-ui',
    '@univerjs/sheets',
    '@univerjs/sheets-ui',
    '@univerjs/sheets-formula',
    '@univerjs/sheets-formula-ui',
    '@univerjs/sheets-numfmt',
    '@univerjs/engine-formula',
    '@univerjs/engine-render',
    '@univerjs/icons',
  ],
  experimental: {
    webpackMemoryOptimizations: true,
  },
  // Suppress development-only warnings in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config, { isServer }) => {
    // Monorepo ant-sheet path aliases resolution
    // Use exact-match (`$`) for the bare `antsheet` key so it doesn't shadow subpath imports.
    const antsheetSrc = path.resolve(__dirname, '../../../antsheet/src');
    config.resolve.alias = {
      ...config.resolve.alias,
      'antsheet$': path.resolve(antsheetSrc, 'index.ts'),
      'antsheet/formula$': path.resolve(antsheetSrc, 'formula.ts'),
      'antsheet/xlsx$': path.resolve(antsheetSrc, 'xlsx.ts'),
      'antsheet/csv$': path.resolve(antsheetSrc, 'csv.ts'),
      'antsheet/parser$': path.resolve(antsheetSrc, 'parser.ts'),
      'antsheet/converter$': path.resolve(antsheetSrc, 'converter.ts'),
      'antsheet/serializer$': path.resolve(antsheetSrc, 'serializer.ts'),
      'antsheet/types$': path.resolve(antsheetSrc, 'types.ts'),
      'antsheet/chart$': path.resolve(antsheetSrc, 'chart.ts'),
      'antsheet/validator$': path.resolve(antsheetSrc, 'validator.ts'),
    };

    // Prioritaskan node_modules lokal apps/web (hindari resolve ke nested .pnpm/<pkg>/node_modules)
    const localNodeModules = path.resolve(__dirname, 'node_modules');
    const candidateModules = [localNodeModules];
    if (Array.isArray(config.resolve.modules)) {
      for (const m of config.resolve.modules) if (!candidateModules.includes(String(m))) candidateModules.push(String(m));
    } else {
      candidateModules.push('node_modules');
    }
    config.resolve.modules = candidateModules;

    // Exclude Univer dari server-side bundle (it's browser-only: uses canvas/WebGL)
    if (isServer) {
      const base = Array.isArray(config.externals) ? config.externals : (config.externals ? [config.externals] : []);
      config.externals = [
        ...base,
        ({ request }, callback) => {
          if (request && /^@univerjs(\/|$)/.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;

