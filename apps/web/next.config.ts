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
  // Content Security Policy — covers known CDNs + API origins.
  // Adjust `connect-src` when gateway URL changes.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* https://*.livekit.cloud wss://*.livekit.cloud https://cloud.livekit.io",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za"
    ].join("; ")
  }
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
