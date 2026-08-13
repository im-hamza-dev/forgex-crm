import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Fix HTTP 431 — increase header size for Supabase auth cookies
  experimental: {
    optimizeServerReact: true,
  },
}

export default nextConfig
