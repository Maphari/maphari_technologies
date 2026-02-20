import { useEffect, useState } from "react";

export function useDelayedFlag(dependency: unknown, delayMs = 200): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, dependency]);

  return enabled;
}
