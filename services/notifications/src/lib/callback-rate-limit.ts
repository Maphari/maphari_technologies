const callbackWindowState = new Map<string, { count: number; windowStartedAt: number }>();

export function enforceCallbackRateLimit(provider: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = callbackWindowState.get(provider);

  if (!current || now - current.windowStartedAt > windowMs) {
    callbackWindowState.set(provider, { count: 1, windowStartedAt: now });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  callbackWindowState.set(provider, current);
  return true;
}

export function clearCallbackRateLimitState(): void {
  callbackWindowState.clear();
}
