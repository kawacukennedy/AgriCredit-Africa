const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  swcMinify: false,
  i18n: {
    locales: ['en', 'fr', 'ha', 'sw'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  /* config options here */
};

module.exports = nextConfig;