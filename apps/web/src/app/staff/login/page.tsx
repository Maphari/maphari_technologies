import type { Metadata } from "next";
import { LoginScreen } from "../../../components/auth/login-screen";

export const metadata: Metadata = {
  title: "Staff Login | Maphari Technologies",
  description: "Staff workspace access for Maphari Technologies.",
  robots: { index: false, follow: false }
};

interface StaffLoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StaffLoginPage({ searchParams }: StaffLoginPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const next = resolved.next;
  const nextPathParam = Array.isArray(next) ? next[0] : next;
  const registered = resolved.registered;
  const registeredSuccess = registered === "1" || registered?.[0] === "1";

  return (
    <LoginScreen
      nextPathParam={nextPathParam}
      mode="internal"
      appType="staff"
      registeredSuccess={registeredSuccess}
    />
  );
}
