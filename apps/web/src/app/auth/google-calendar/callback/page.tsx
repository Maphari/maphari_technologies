"use client";
// ════════════════════════════════════════════════════════════════════════════
// Google Calendar OAuth2 Callback — /auth/google-calendar/callback
// Exchanges the authorization code by calling the backend, then redirects
// back to the integrations page.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gatewayBaseUrl } from "@/lib/api/portal/internal";

export default function GoogleCalendarCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code  = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error || !code) {
      router.replace("/?page=integrations&error=oauth_cancelled");
      return;
    }

    void fetch(`${gatewayBaseUrl}/integrations/google-calendar/callback`, {
      method:      "POST",
      credentials: "include",
      headers:     { "content-type": "application/json" },
      body:        JSON.stringify({ code, state }),
    })
      .then((r) => r.json())
      .then((data: { success?: boolean }) => {
        if (data.success) {
          router.replace("/?page=integrations&connected=google-calendar");
        } else {
          router.replace("/?page=integrations&error=oauth_failed");
        }
      })
      .catch(() => {
        router.replace("/?page=integrations&error=oauth_failed");
      });
  }, [params, router]);

  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        height:         "100vh",
        flexDirection:  "column",
        gap:            12,
        background:     "var(--bg, #050508)",
        color:          "var(--text, #f0f0f0)",
      }}
    >
      <div style={{ fontSize: "1.5rem" }}>⏳</div>
      <div style={{ fontSize: "1.1rem" }}>Connecting Google Calendar…</div>
      <div style={{ fontSize: "0.85rem", color: "var(--muted, #888)", marginTop: 4 }}>
        You will be redirected automatically.
      </div>
    </div>
  );
}
