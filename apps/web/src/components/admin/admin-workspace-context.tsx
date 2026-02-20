"use client";

import { createContext, useContext } from "react";
import { useAdminWorkspace } from "../../lib/auth/use-admin-workspace";

type AdminWorkspaceContextValue = ReturnType<typeof useAdminWorkspace>;

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(null);

interface AdminWorkspaceProviderProps {
  children: React.ReactNode;
}

export function AdminWorkspaceProvider({ children }: AdminWorkspaceProviderProps) {
  const workspace = useAdminWorkspace();
  return <AdminWorkspaceContext.Provider value={workspace}>{children}</AdminWorkspaceContext.Provider>;
}

export function useAdminWorkspaceContext(): AdminWorkspaceContextValue {
  const context = useContext(AdminWorkspaceContext);
  if (!context) {
    throw new Error("useAdminWorkspaceContext must be used within AdminWorkspaceProvider");
  }

  return context;
}
