"use client";

// ════════════════════════════════════════════════════════════════════════════
// error.tsx — Global runtime error boundary for the Next.js app router
// Catches unhandled errors in any route segment below the root layout.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev; swap for a real error-tracking service in prod
    console.error("[GlobalError]", error);
  }, [error]);

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
            marginBottom: 48
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

        {/* Code */}
        <div
          style={{
            fontFamily: "var(--font-dm-mono, monospace)",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            color: "#ff5f5f",
            marginBottom: 16,
            letterSpacing: "-4px"
          }}
        >
          500
        </div>

        <h1
          style={{
            fontFamily: "var(--font-syne, system-ui, sans-serif)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--mk-text, #1b1f2a)",
            margin: "0 0 12px"
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "var(--mk-muted, #5c6475)",
            margin: "0 0 40px",
            lineHeight: 1.6
          }}
        >
          An unexpected error occurred. Try refreshing the page or returning to a dashboard.
          {error.digest && (
            <span
              style={{
                display: "block",
                marginTop: 8,
                fontFamily: "var(--font-dm-mono, monospace)",
                fontSize: 11,
                color: "var(--mk-muted, #5c6475)"
              }}
            >
              Error ref: {error.digest}
            </span>
          )}
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            onClick={reset}
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
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-syne, system-ui, sans-serif)"
            }}
          >
            Try again
          </button>
          <a
            href="/internal-login"
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
            Back to login
          </a>
        </div>

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
