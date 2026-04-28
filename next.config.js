/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Allow large file uploads (20 MB)
  api: {
    bodyParser: false,
  },
};

module.exports = nextConfig;
