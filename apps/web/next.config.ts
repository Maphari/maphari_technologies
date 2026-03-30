import type { NextConfig } from "next";

// ── Security headers ──────────────────────────────────────────────────────────
// Applied to every response. CSP is intentionally permissive for the dev
// environment; tighten `script-src` and `connect-src` before production.
const securityHeaders = [
  // Prevent the page from being loaded in an iframe (clickjacking)
  { key: "X-Frame-Options",          value: "DENY" },
  // Stop MIME sniffing
  { key: "X-Content-Type-Options",   value: "nosniff" },
  // Don't send Referer to cross-origin destinations
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features (camera/mic allowed for video call pages)
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=()"
  },
  // Force HTTPS for 1 year (preload-ready). Remove if not on HTTPS yet.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains"
  },

];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
