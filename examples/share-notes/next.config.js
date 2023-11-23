/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/view/:path*",
        destination: "/view",
      },
    ];
  },
};

module.exports = nextConfig;
