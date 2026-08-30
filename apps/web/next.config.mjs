/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@anticeil/core',
    '@univerjs/core',
    '@univerjs/design',
    '@univerjs/engine-render',
    '@univerjs/engine-formula',
    '@univerjs/ui',
    '@univerjs/docs',
    '@univerjs/docs-ui',
    '@univerjs/sheets',
    '@univerjs/sheets-ui',
    '@univerjs/sheets-formula',
  ],
  // Suppress development-only warnings in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config, { isServer }) => {
    // Handle Univer's ESM-only packages
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Exclude Univer from server-side bundle (it's browser-only: uses canvas/WebGL)
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        /@univerjs\/.*/,
      ];
    }

    return config;
  },
};

export default nextConfig;

