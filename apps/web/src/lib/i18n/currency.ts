const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  ZA: "ZAR",
  EU: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  PT: "EUR",
  BE: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  BR: "BRL",
  NG: "NGN",
  KE: "KES",
  AE: "AED",
  SA: "SAR"
};

function normalizeCurrencyCode(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase();
  if (cleaned === "R") return null;
  if (!/^[A-Z]{3}$/.test(cleaned)) return null;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: cleaned }).format(1);
    return cleaned;
  } catch {
    return null;
  }
}

export function detectBrowserLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en-US";
}

export function inferCountryFromLocale(locale?: string): string | null {
  const resolved = (locale ?? detectBrowserLocale()).replace("_", "-");
  const parts = resolved.split("-");
  const region = parts.length > 1 ? parts[parts.length - 1] : "";
  return /^[A-Z]{2}$/i.test(region) ? region.toUpperCase() : null;
}

export function currencyFromCountry(countryCode?: string | null): string | null {
  if (!countryCode) return null;
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? null;
}

export function resolveCurrency(options: {
  preferredCurrency?: string | null;
  invoiceCurrencies?: Array<string | null | undefined>;
  countryCode?: string | null;
  locale?: string;
  fallback?: string;
} = {}): string {
  const preferred = normalizeCurrencyCode(options.preferredCurrency);
  if (preferred) return preferred;

  const firstInvoiceCurrency = (options.invoiceCurrencies ?? [])
    .map((currency) => normalizeCurrencyCode(currency))
    .find((currency): currency is string => Boolean(currency));
  if (firstInvoiceCurrency) return firstInvoiceCurrency;

  const countryCurrency =
    currencyFromCountry(options.countryCode ?? inferCountryFromLocale(options.locale));
  if (countryCurrency) return countryCurrency;

  return normalizeCurrencyCode(options.fallback) ?? "USD";
}

export function formatMoneyCents(
  amountCents: number,
  options: {
    currency?: string | null;
    preferredCurrency?: string | null;
    invoiceCurrencies?: Array<string | null | undefined>;
    locale?: string;
    fallback?: string;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {}
): string {
  const currency =
    normalizeCurrencyCode(options.currency) ??
    resolveCurrency({
      preferredCurrency: options.preferredCurrency,
      invoiceCurrencies: options.invoiceCurrencies,
      locale: options.locale,
      fallback: options.fallback
    });
  const locale = options.locale ?? detectBrowserLocale();

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits
  }).format(amountCents / 100);
}

