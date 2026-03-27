"use client";

// ════════════════════════════════════════════════════════════════════════════
// session-expired-modal.tsx — In-place session expiry overlay.
//   Renders over the dashboard (blurred backdrop) instead of redirecting.
//   The user sees their context behind the overlay and can sign in again
//   without losing their place in the portal.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { clearSession } from "../../../../lib/auth/session";

type Props = { isOpen: boolean };

export function SessionExpiredModal({ isOpen }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  if (!isOpen) return null;

  function handleSignInAgain(): void {
    if (redirecting) return;

    setRedirecting(true);
    clearSession();

    const currentPath = pathname ?? "/client";
    const search = searchParams?.toString();
    const next = currentPath + (search && search.length > 0 ? "?" + search : "");
    window.location.replace("/client/login?next=" + encodeURIComponent(next));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px) brightness(0.45)",
        background: "rgba(13,13,20,0.65)",
      }}
    >
      <div
        style={{
          background: "#1a1a24",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "40px 36px",
          maxWidth: 360,
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#b5ff4d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            fontWeight: 900,
            color: "#0d0d14",
            letterSpacing: "-0.02em",
          }}
        >
          M
        </div>

        {/* Text */}
        <div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#e8e5e0",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Session Expired
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "rgba(232,229,224,0.45)",
              lineHeight: 1.65,
            }}
          >
            Your session has timed out. Sign in again to pick up right where you left off.
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSignInAgain}
          disabled={redirecting}
          style={{
            width: "100%",
            padding: "11px 0",
            background: "#b5ff4d",
            color: "#0d0d14",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: redirecting ? "wait" : "pointer",
            opacity: redirecting ? 0.8 : 1,
            letterSpacing: "0.01em",
          }}
        >
          {redirecting ? "Opening sign-in…" : "Sign in again"}
        </button>
      </div>
    </div>
  );
}
