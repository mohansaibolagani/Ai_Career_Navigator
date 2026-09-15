/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist optionally requires the native `canvas` package for
    // rendering. We only extract text, so alias it out on client AND server
    // (required on Linux CI where canvas isn't installed).
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
