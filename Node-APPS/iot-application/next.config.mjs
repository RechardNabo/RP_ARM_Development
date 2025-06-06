/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize for Raspberry Pi with limited resources
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  distDir: '.next',
  // Raspberry Pi-specific optimizations
  experimental: {
    optimizeCss: true,
    legacyBrowsers: true,
  },
}

export default nextConfig
