"use client";

import { useEffect, useMemo, useState } from "react";

type ExchangeRatesSnapshot = {
  base: string;
  fetchedAt: number;
  rates: Record<string, number>;
};

const CACHE_KEY = "maphari:fx:usd";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let memoryCache: ExchangeRatesSnapshot | null = null;

function normalizeCurrency(value?: string | null): string {
  const cleaned = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(cleaned) ? cleaned : "USD";
}

function readCachedSnapshot(): ExchangeRatesSnapshot | null {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExchangeRatesSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.fetchedAt !== "number" || !parsed.rates || typeof parsed.rates !== "object") {
      return null;
    }
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(snapshot: ExchangeRatesSnapshot): void {
  memoryCache = snapshot;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage errors.
  }
}

async function fetchUsdRates(): Promise<ExchangeRatesSnapshot | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_unix?: number;
    };
    if (payload.result !== "success" || !payload.rates) return null;
    const snapshot: ExchangeRatesSnapshot = {
      base: "USD",
      fetchedAt: payload.time_last_update_unix ? payload.time_last_update_unix * 1000 : Date.now(),
      rates: payload.rates
    };
    writeCachedSnapshot(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

export function useLiveUsdExchangeRates(): ExchangeRatesSnapshot | null {
  const [snapshot, setSnapshot] = useState<ExchangeRatesSnapshot | null>(() => readCachedSnapshot());

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedSnapshot();
    const isStale = !cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS;
    if (!isStale) return;
    void (async () => {
      const fresh = await fetchUsdRates();
      if (!cancelled && fresh) setSnapshot(fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

export function convertMoneyCents(
  amountCents: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
  snapshot: ExchangeRatesSnapshot | null
): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  if (from === to) return amountCents;
  if (!snapshot?.rates) return amountCents;

  const fromRate = from === "USD" ? 1 : snapshot.rates[from];
  const toRate = to === "USD" ? 1 : snapshot.rates[to];
  if (!fromRate || !toRate) return amountCents;

  const amountInUsd = amountCents / fromRate;
  const converted = amountInUsd * toRate;
  return Math.round(converted);
}

export function useCurrencyConverter(displayCurrency: string) {
  const snapshot = useLiveUsdExchangeRates();
  return useMemo(
    () => ({
      convert: (amountCents: number, sourceCurrency: string | null | undefined) =>
        convertMoneyCents(amountCents, sourceCurrency, displayCurrency, snapshot)
    }),
    [displayCurrency, snapshot]
  );
}
