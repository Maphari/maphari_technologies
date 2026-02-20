import { AdminWorkspaceProvider } from "../../components/admin/admin-workspace-context";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminWorkspaceProvider>{children}</AdminWorkspaceProvider>;
}
