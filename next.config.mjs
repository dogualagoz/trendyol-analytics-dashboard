/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.dsmcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.trendyol.com",
      },
    ],
  },
};

export default nextConfig;
