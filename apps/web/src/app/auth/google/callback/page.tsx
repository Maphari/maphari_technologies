"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { googleOAuthExchange } from "@/lib/api/gateway";
import { saveSession } from "@/lib/auth/session";

// ── /auth/google/callback ─────────────────────────────────────────────────────
// Google redirects here after the user grants consent.
// We exchange the authorization code for an internal session, save it,
// and redirect to the appropriate dashboard.
export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code") ?? "";
    const error = searchParams.get("error") ?? "";

    if (error || !code) {
      // Google returned an error (e.g. user denied consent)
      router.replace(`/internal-login?error=google_oauth_${error || "missing_code"}`);
      return;
    }

    googleOAuthExchange(code).then((result) => {
      if (!result.success || !result.data) {
        const errCode = result.error?.code ?? "exchange_failed";
        router.replace(`/internal-login?error=${encodeURIComponent(errCode)}`);
        return;
      }

      const session = result.data;
      saveSession(session);

      const role = session.user.role;
      if (role === "ADMIN") {
        router.replace("/admin");
      } else if (role === "STAFF") {
        router.replace("/staff");
      } else {
        router.replace("/portal");
      }
    }).catch(() => {
      router.replace("/internal-login?error=google_oauth_network");
    });
  }, [searchParams, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        background: "#0a0a0e",
        color: "#fff",
        fontFamily: "sans-serif",
        fontSize: "14px",
        gap: "12px"
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Signing you in with Google…
    </div>
  );
}
