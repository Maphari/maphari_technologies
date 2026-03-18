import type { Metadata } from "next";
import { headers } from "next/headers";
import { LoginScreen } from "../../../components/auth/login-screen";
import type { AppType } from "../../../proxy";

export const metadata: Metadata = {
  title: "Sign In | Maphari Technologies",
  description: "Staff and admin workspace access for Maphari Technologies.",
  robots: { index: false, follow: false }
};

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InternalLoginPage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : {};
  const next = resolved.next;
  const nextPathParam = Array.isArray(next) ? next[0] : next;
  const registered = resolved.registered;
  const registeredSuccess = registered === "1" || registered?.[0] === "1";

  // On staff/admin subdomains, proxy.ts redirects /internal/login to the single-role page.
  // On root domain / local dev ("both"), show both tabs.
  const headersList = await headers();
  const rawAppType = headersList.get("x-app-type");
  const appType: AppType = rawAppType === "staff" ? "staff" : rawAppType === "admin" ? "admin" : "both";

  return (
    <LoginScreen
      nextPathParam={nextPathParam}
      mode="internal"
      appType={appType}
      registeredSuccess={registeredSuccess}
    />
  );
}
