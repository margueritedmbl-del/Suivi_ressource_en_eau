/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/dashboard/points-eau": ["./public/data/points-eau-inventaire.csv"],
      "/api/map/points": ["./public/data/points-eau-inventaire.csv"],
      "/api/export/csv": ["./public/data/points-eau-inventaire.csv"],
      "/api/export/xlsx": ["./public/data/points-eau-inventaire.csv"],
    },
  },
};

module.exports = nextConfig;
