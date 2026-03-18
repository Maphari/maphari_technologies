// ════════════════════════════════════════════════════════════════════════════
// not-found.tsx — Maphari Technologies branded 404 page
// ════════════════════════════════════════════════════════════════════════════
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found | Maphari Technologies",
  description: "The page you are looking for does not exist.",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mk-bg, #f7f8fa)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        padding: "24px"
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {/* Logo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 48,
            textDecoration: "none"
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#12d6c5",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-syne, system-ui, sans-serif)",
              fontWeight: 800,
              fontSize: 18,
              color: "#0b1220"
            }}
          >
            M
          </div>
          <span
            style={{
              fontFamily: "var(--font-syne, system-ui, sans-serif)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--mk-text, #1b1f2a)"
            }}
          >
            Maphari
          </span>
        </div>

        {/* 404 number */}
        <div
          style={{
            fontFamily: "var(--font-dm-mono, monospace)",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            color: "#12d6c5",
            marginBottom: 16,
            letterSpacing: "-4px"
          }}
        >
          404
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-syne, system-ui, sans-serif)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--mk-text, #1b1f2a)",
            margin: "0 0 12px"
          }}
        >
          Page not found
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: 15,
            color: "var(--mk-muted, #5c6475)",
            margin: "0 0 40px",
            lineHeight: 1.6
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Head back to a dashboard to continue working.
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <Link
            href="/internal-login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              background: "#12d6c5",
              color: "#0b1220",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              fontFamily: "var(--font-syne, system-ui, sans-serif)"
            }}
          >
            Sign in →
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              background: "transparent",
              color: "var(--mk-muted, #5c6475)",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
              border: "1px solid var(--mk-border, #e6e8ee)"
            }}
          >
            Go home
          </Link>
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 48,
            fontFamily: "var(--font-dm-mono, monospace)",
            fontSize: 11,
            color: "var(--mk-muted, #5c6475)",
            letterSpacing: "0.06em"
          }}
        >
          MAPHARI TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}
