import type { Metadata } from "next";
import { LoginScreen } from "../../components/auth/login-screen";

export const metadata: Metadata = {
  title: "Login | Maphari Technologies",
  description: "Client access portal for Maphari Technologies.",
  robots: {
    index: false,
    follow: false
  }
};

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const next = resolvedSearchParams.next;
  const nextPathParam = Array.isArray(next) ? next[0] : next;
  return <LoginScreen nextPathParam={nextPathParam} mode="public" />;
}
