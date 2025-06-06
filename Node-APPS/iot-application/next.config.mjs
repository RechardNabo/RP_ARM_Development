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
  experimental: {
    // Enable optimization features for ARM processors
    optimizeCss: true,
    // Compress assets for ARM architecture
    optimizePackageImports: ['react-icons', 'lucide-react', '@radix-ui', 'recharts'],
  },
}

export default nextConfig
