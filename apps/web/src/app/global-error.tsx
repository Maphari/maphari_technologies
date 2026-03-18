"use client";

// ════════════════════════════════════════════════════════════════════════════
// global-error.tsx — Root-level error boundary (catches layout errors too)
// Replaces the entire HTML tree so it must include <html> and <body>.
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
    console.error("[GlobalError:root]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "24px"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
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
                fontWeight: 800,
                fontSize: 18,
                color: "#0b1220"
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#f0ede8" }}>
              Maphari
            </span>
          </div>

          <div
            style={{
              fontFamily: "monospace",
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

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0ede8", margin: "0 0 12px" }}>
            Something went wrong
          </h1>

          <p style={{ fontSize: 15, color: "#8a8fa8", margin: "0 0 40px", lineHeight: 1.6 }}>
            A critical error occurred loading the application.
            {error.digest && (
              <span style={{ display: "block", marginTop: 8, fontFamily: "monospace", fontSize: 11 }}>
                Error ref: {error.digest}
              </span>
            )}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 20px",
                background: "#12d6c5",
                color: "#0b1220",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: "pointer"
              }}
            >
              Try again
            </button>
            <a
              href="/internal-login"
              style={{
                padding: "10px 20px",
                background: "transparent",
                color: "#8a8fa8",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              Back to login
            </a>
          </div>

          <div style={{ marginTop: 48, fontFamily: "monospace", fontSize: 11, color: "#8a8fa8", letterSpacing: "0.06em" }}>
            MAPHARI TECHNOLOGIES
          </div>
        </div>
      </body>
    </html>
  );
}
