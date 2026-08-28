/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@anticeil/core'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  async rewrites() {
    return [
      {
        source: '/home',
        destination: '/api/omniroute-proxy/dashboard',
      },
      {
        source: '/dashboard',
        destination: '/api/omniroute-proxy/dashboard',
      },
      {
        source: '/dashboard/:path*',
        destination: '/api/omniroute-proxy/dashboard/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
