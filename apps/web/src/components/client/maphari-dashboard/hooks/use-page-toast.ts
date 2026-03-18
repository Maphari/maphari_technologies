import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "warning" | "info";

/** Notify function available to all client-portal pages via context. */
export type PageNotifyFn = (tone: ToastTone, title: string, subtitle?: string) => void;

export const DashboardToastCtx = createContext<PageNotifyFn>(() => {});

/** Call inside any page component to show a centralised toast. */
export function usePageToast(): PageNotifyFn {
  return useContext(DashboardToastCtx);
}
