import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  eslint: { ignoreDuringBuilds: true },
  // ESLint disabled during builds
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
