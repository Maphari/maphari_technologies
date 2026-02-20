import type { Metadata } from "next";
import { LoginScreen } from "../../components/auth/login-screen";

export const metadata: Metadata = {
  title: "Internal Login | Maphari Technologies",
  description: "Internal staff and admin access for Maphari Technologies.",
  robots: {
    index: false,
    follow: false
  }
};

interface InternalLoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InternalLoginPage({ searchParams }: InternalLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const next = resolvedSearchParams.next;
  const nextPathParam = Array.isArray(next) ? next[0] : next;
  return <LoginScreen nextPathParam={nextPathParam} mode="internal" />;
}
