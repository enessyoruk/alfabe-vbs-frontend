/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  webpack(config, { isServer }) {
    if (!isServer) {
      const alias = config.resolve.alias || {};
      alias["node:console"] = false;
      alias["node:fs"] = false;
      alias["node:path"] = false;
      alias["node:buffer"] = false;
      alias["node:util"] = false;
      config.resolve.alias = alias;
    }
    return config;
  },

  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
