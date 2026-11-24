/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint is available via `npm run lint`; we don't gate production builds on it.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Next.js dev mode (React Refresh / HMR) needs 'unsafe-eval' and a websocket
    // connection. Production keeps the stricter policy for the security story.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    const connectSrc = isDev
      ? "connect-src 'self' ws: wss: https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://api.open-meteo.com"
      : "connect-src 'self' https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://api.open-meteo.com";

    // Defense-in-depth security headers applied to every route.
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "geolocation=(self), camera=(), microphone=(), payment=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          scriptSrc,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          connectSrc,
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
