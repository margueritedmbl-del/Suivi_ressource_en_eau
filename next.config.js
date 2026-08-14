const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }] },
      { source: "/api/version", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/ouvrages", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
  webpack(config) {
    // Force the @ alias independently of the host build environment.
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/dashboard/points-eau': ['./public/data/points-eau-inventaire.csv'],
      '/api/map/points': ['./public/data/points-eau-inventaire.csv'],
      '/api/export/csv': ['./public/data/points-eau-inventaire.csv'],
      '/api/export/xlsx': ['./public/data/points-eau-inventaire.csv'],
    },
  },
};

module.exports = nextConfig;
