/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint is available via `npm run lint`; we don't gate production builds on it.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
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
          // Next.js injects small inline bootstrap scripts; styles use inline for Tailwind runtime.
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          // Air-quality + geocoding providers called from the browser.
          "connect-src 'self' https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://api.open-meteo.com",
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
