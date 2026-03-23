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
        background: "#030309",
        backgroundImage:
          "radial-gradient(ellipse 900px 700px at 18% 28%, rgba(200,241,53,0.07) 0%, transparent 60%), radial-gradient(ellipse 700px 600px at 82% 78%, rgba(200,241,53,0.04) 0%, transparent 55%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          background: "rgba(8, 6, 20, 0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center"
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#c8f135",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)",
              fontWeight: 800,
              fontSize: 20,
              color: "#0a0a0a"
            }}
          >
            M
          </div>
          <span
            style={{
              fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)",
              fontWeight: 700,
              fontSize: 18,
              color: "#f0ede8",
              marginLeft: 10
            }}
          >
            Maphari
          </span>
        </div>

        {/* Error code */}
        <div
          style={{
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            color: "#c8f135",
            marginBottom: 16,
            letterSpacing: "-4px"
          }}
        >
          404
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)",
            fontSize: 24,
            fontWeight: 700,
            color: "#f0ede8",
            margin: "0 0 12px"
          }}
        >
          Page not found
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 15,
            color: "rgba(240,237,232,0.5)",
            margin: "0 0 40px",
            lineHeight: 1.6
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Head back to a dashboard to continue working.
        </p>

        {/* Buttons */}
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
              background: "#c8f135",
              color: "#0a0a0a",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              fontFamily: "var(--font-syne, 'Syne', system-ui, sans-serif)"
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
              color: "rgba(240,237,232,0.45)",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.10)"
            }}
          >
            Go home
          </Link>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            fontSize: 11,
            letterSpacing: "0.06em",
            color: "rgba(240,237,232,0.20)"
          }}
        >
          MAPHARI TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}
