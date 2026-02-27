"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../../lib/api/gateway";
import { clearSession } from "../../lib/auth/session";

interface LogoutPageClientProps {
  nextPath: string;
}

export function LogoutPageClient({ nextPath }: LogoutPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      clearSession();
      await logout();
      router.replace(nextPath);
    })();
  }, [nextPath, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050508",
        color: "#f0ede8",
        fontFamily: "var(--font-dm-sans), sans-serif"
      }}
    >
      <p>Signing you out...</p>
    </main>
  );
}
