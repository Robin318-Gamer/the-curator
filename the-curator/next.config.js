/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['xulrcvbfwhhdtggkpcge.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.hk01.com',
      },
      {
        protocol: 'https',
        hostname: 'static.mingpao.com',
      },
      {
        protocol: 'https',
        hostname: 'orientaldaily.on.cc',
      },
    ],
  },
  i18n: {
    locales: ['zh-TW'],
    defaultLocale: 'zh-TW',
  },
  // Required for @sparticuz/chromium to work on Vercel
  // Prevents webpack from bundling the chromium binary files
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium'],
  },
}

module.exports = nextConfig
