import type { Metadata } from "next";
import { headers } from "next/headers";
import { LoginScreen } from "../../../components/auth/login-screen";
import type { AppType } from "../../../proxy";

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const appType = headersList.get("x-app-type");
  const title = appType === "client" ? "Client Portal | Maphari Technologies" : "Login | Maphari Technologies";
  const description =
    appType === "client"
      ? "Client portal access for Maphari Technologies."
      : "Client access portal for Maphari Technologies.";
  return {
    title,
    description,
    robots: { index: false, follow: false }
  };
}

export default async function ClientLoginPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const next = resolvedSearchParams.next;
  const nextPathParam = Array.isArray(next) ? next[0] : next;

  const headersList = await headers();
  const rawAppType = headersList.get("x-app-type");
  const appType: AppType = rawAppType === "client" ? "client" : "public";

  return <LoginScreen nextPathParam={nextPathParam} mode="public" appType={appType} />;
}
