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
  // Allow cross-origin requests from local network
  allowedDevOrigins: [
    '192.168.18.9',  // Add the specific IP that's trying to access
    /192\.168\.\d+\.\d+/,  // Allow all 192.168.*.* addresses
  ],
}

export default nextConfig
