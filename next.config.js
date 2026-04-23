/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  httpAgentOptions: {
    keepAlive: true,
  },
  experimental: {
    proxyTimeout: 300000, // 5 minutes for long-running model calls
  },
  async rewrites() {
    return [
      {
        source: "/workshop-api/:path*",
        destination: `${process.env.WORKSHOP_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.mp4$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    return config;
  },
};

module.exports = nextConfig;
