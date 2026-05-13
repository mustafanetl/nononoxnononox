/**
 * Currency + locale formatter utilities.
 *
 * Public surface:
 *   - CURRENCIES                    → Map of ISO 4217 code → { symbol, locale }
 *   - CURRENCY_SYMBOLS              → Map of ISO 4217 code → symbol
 *   - CURRENCY_LOCALES              → Map of ISO 4217 code → BCP-47 locale
 *   - getCurrencySymbol(code)       → "$" / "€" / "£" / "¥" …
 *   - getLocaleForCurrency(code)    → "en-US" / "de-DE" / "ja-JP" …
 *   - formatCurrency(amount, code?) → "$9.99" / "1 234,56 €" …
 *   - getCurrencyPrices()           → Pricing copy for the subscription UI
 *
 * Design notes:
 *   - Currency codes are normalized to upper-case before lookup.
 *   - Unknown / missing codes fall back to USD / "$" so the UI never
 *     shows `undefined` or throws.
 *   - `formatCurrency` uses `Intl.NumberFormat` and is defensive against
 *     runtime environments that reject exotic currency codes — on failure
 *     it falls back to `symbol + amount`.
 *
 * _Requirements: 11.6, 15.1_
 */

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

/** Describes a single currency's display metadata. */
export interface CurrencyInfo {
  /** Human-friendly currency symbol, e.g. "$", "€", "kr". */
  symbol: string;
  /** BCP-47 locale to use with `Intl.NumberFormat`. */
  locale: string;
}

/** Pricing copy for the subscription UI. */
export interface CurrencyPrices {
  symbol: string;
  currency: string;
  /** Monthly plan price as a display string, e.g. "9.99". */
  monthly: string;
  /** Annual plan price expressed per-month as a display string, e.g. "4.17". */
  annualMonthly: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_SYMBOL = "$";
export const DEFAULT_LOCALE = "en-US";

/**
 * Map of commonly-encountered ISO 4217 currency codes to their display
 * metadata. This is a best-effort curated list — callers should rely on the
 * provided helpers for fallback behavior rather than indexing directly.
 */
export const CURRENCIES: Readonly<Record<string, CurrencyInfo>> = {
  // North America
  USD: { symbol: "$",    locale: "en-US" },
  CAD: { symbol: "CA$",  locale: "en-CA" },
  MXN: { symbol: "MX$",  locale: "es-MX" },

  // Oceania
  AUD: { symbol: "A$",   locale: "en-AU" },
  NZD: { symbol: "NZ$",  locale: "en-NZ" },

  // Europe
  EUR: { symbol: "€",    locale: "de-DE" },
  GBP: { symbol: "£",    locale: "en-GB" },
  CHF: { symbol: "CHF",  locale: "de-CH" },
  SEK: { symbol: "kr",   locale: "sv-SE" },
  NOK: { symbol: "kr",   locale: "nb-NO" },
  DKK: { symbol: "kr",   locale: "da-DK" },
  ISK: { symbol: "kr",   locale: "is-IS" },
  PLN: { symbol: "zł",   locale: "pl-PL" },
  CZK: { symbol: "Kč",   locale: "cs-CZ" },
  HUF: { symbol: "Ft",   locale: "hu-HU" },
  RON: { symbol: "lei",  locale: "ro-RO" },
  BGN: { symbol: "лв",   locale: "bg-BG" },
  RUB: { symbol: "₽",    locale: "ru-RU" },
  UAH: { symbol: "₴",    locale: "uk-UA" },
  TRY: { symbol: "₺",    locale: "tr-TR" },

  // Asia
  JPY: { symbol: "¥",    locale: "ja-JP" },
  CNY: { symbol: "¥",    locale: "zh-CN" },
  HKD: { symbol: "HK$",  locale: "en-HK" },
  TWD: { symbol: "NT$",  locale: "zh-TW" },
  KRW: { symbol: "₩",    locale: "ko-KR" },
  SGD: { symbol: "S$",   locale: "en-SG" },
  INR: { symbol: "₹",    locale: "en-IN" },
  THB: { symbol: "฿",    locale: "th-TH" },
  VND: { symbol: "₫",    locale: "vi-VN" },
  IDR: { symbol: "Rp",   locale: "id-ID" },
  MYR: { symbol: "RM",   locale: "ms-MY" },
  PHP: { symbol: "₱",    locale: "en-PH" },

  // South America
  BRL: { symbol: "R$",   locale: "pt-BR" },
  ARS: { symbol: "AR$",  locale: "es-AR" },
  CLP: { symbol: "CL$",  locale: "es-CL" },
  COP: { symbol: "CO$",  locale: "es-CO" },

  // Middle East & Africa
  ILS: { symbol: "₪",    locale: "he-IL" },
  AED: { symbol: "د.إ",  locale: "ar-AE" },
  SAR: { symbol: "﷼",    locale: "ar-SA" },
  QAR: { symbol: "﷼",    locale: "ar-QA" },
  EGP: { symbol: "E£",   locale: "ar-EG" },
  MAD: { symbol: "د.م.", locale: "fr-MA" },
  ZAR: { symbol: "R",    locale: "en-ZA" },
  NGN: { symbol: "₦",    locale: "en-NG" },
  KES: { symbol: "KSh",  locale: "sw-KE" },
};

/** Code → symbol projection derived from {@link CURRENCIES}. */
export const CURRENCY_SYMBOLS: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(CURRENCIES).map(([code, info]) => [code, info.symbol]),
    ),
  );

/** Code → locale projection derived from {@link CURRENCIES}. */
export const CURRENCY_LOCALES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(CURRENCIES).map(([code, info]) => [code, info.locale]),
    ),
  );

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Normalize any user-supplied currency code to a 3-letter uppercase string.
 * Returns `null` for anything that doesn't look like an ISO 4217 code.
 */
function normalizeCode(code: string | null | undefined): string | null {
  if (typeof code !== "string") return null;
  const trimmed = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) return null;
  return trimmed;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Return a human-friendly symbol for a given ISO 4217 currency code.
 *
 * Falls back to the normalized code itself when the code is valid but
 * unknown (e.g. "XYZ" → "XYZ"), and to `"$"` when the input is missing
 * or malformed.
 */
export function getCurrencySymbol(code: string | null | undefined): string {
  const normalized = normalizeCode(code);
  if (!normalized) return DEFAULT_SYMBOL;
  return CURRENCIES[normalized]?.symbol ?? normalized;
}

/**
 * Return a best-effort BCP-47 locale string for a given currency code.
 * Defaults to `en-US` when the code is missing or unknown.
 */
export function getLocaleForCurrency(code: string | null | undefined): string {
  const normalized = normalizeCode(code);
  if (!normalized) return DEFAULT_LOCALE;
  return CURRENCIES[normalized]?.locale ?? DEFAULT_LOCALE;
}

/**
 * Format a numeric amount as currency using `Intl.NumberFormat`.
 *
 * - `code` defaults to `USD` when missing / malformed.
 * - `locale` defaults to the locale associated with `code` via
 *   {@link getLocaleForCurrency}.
 * - Non-finite amounts (NaN, ±Infinity) are coerced to `0`.
 * - If the runtime rejects the currency (e.g. obscure code), falls back to
 *   `symbol + fixed amount` rather than throwing.
 */
export function formatCurrency(
  amount: number,
  code?: string | null,
  locale?: string | null,
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalized = normalizeCode(code) ?? DEFAULT_CURRENCY;
  const effectiveLocale =
    (typeof locale === "string" && locale.trim().length > 0
      ? locale
      : null) ?? getLocaleForCurrency(normalized);

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: "currency",
      currency: normalized,
      currencyDisplay: "symbol",
    }).format(safeAmount);
  } catch {
    const symbol = getCurrencySymbol(normalized);
    let formatted: string;
    try {
      formatted = safeAmount.toLocaleString(effectiveLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      formatted = safeAmount.toFixed(2);
    }
    return `${symbol}${formatted}`;
  }
}

/**
 * Return pricing copy for the subscription UI. Defaults to USD; future
 * iterations can localize based on the user's region.
 *
 * Values align with Requirement 15.1: $9.99/month monthly plan and
 * $4.17/month annual plan (billed $49.99/year).
 */
export function getCurrencyPrices(): CurrencyPrices {
  return {
    symbol: DEFAULT_SYMBOL,
    currency: DEFAULT_CURRENCY,
    monthly: "9.99",
    annualMonthly: "4.17",
  };
}
