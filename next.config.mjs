/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// Dev ve prod için connect-src'yi ayırıyoruz
const connectSrc = isDev
  ? "connect-src 'self' https: http://localhost:3000 http://localhost:3001 https://localhost:3000 https://localhost:3001"
  : "connect-src 'self' https:";

const csp = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ""} https: blob:`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.google.com.tr",
  connectSrc,
  "font-src 'self' data: https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

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

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
