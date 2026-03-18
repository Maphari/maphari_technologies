import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/components/auth/reset-password-screen";

export const metadata: Metadata = {
  title: "Reset Password | Maphari Technologies",
  description: "Set a new password for your Maphari account.",
  robots: { index: false, follow: false }
};

interface ResetPasswordPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? "");
  return <ResetPasswordScreen token={token} />;
}
