/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse imports test files at module load time — exclude from webpack bundling
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

module.exports = nextConfig
