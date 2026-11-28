/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_STORE_NAME: 'সুনাম শপ (SUNAM SHOP)',
    NEXT_PUBLIC_LOCATION: 'সুনামগঞ্জ সদর, বাংলাদেশ',
  },
};

module.exports = nextConfig;
