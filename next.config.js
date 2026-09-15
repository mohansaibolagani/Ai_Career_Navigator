/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pdfjs-dist legacy build for browser compatibility
      config.resolve.alias.canvas = false;
      config.externals.push({ 'canvas': 'canvas' });
    }
    return config;
  },
};

module.exports = nextConfig;
