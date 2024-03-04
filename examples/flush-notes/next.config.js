/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
