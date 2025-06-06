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
  // Set output to standalone for better caching and reduced memory usage
  output: 'standalone',
  // Use only supported experimental features
  experimental: {
    // Enable optimization features for ARM processors
    optimizeCss: true,
  },
}

export default nextConfig
