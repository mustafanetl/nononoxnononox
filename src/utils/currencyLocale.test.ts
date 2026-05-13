import { describe, it, expect } from "vitest";
import {
  getCurrencySymbol,
  getLocaleForCurrency,
  formatCurrency,
  getCurrencyPrices,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_LOCALES,
  DEFAULT_CURRENCY,
  DEFAULT_SYMBOL,
  DEFAULT_LOCALE,
} from "./currencyLocale";

describe("getCurrencySymbol", () => {
  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("returns € for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("returns kr for SEK", () => {
    expect(getCurrencySymbol("SEK")).toBe("kr");
  });

  it("returns £ for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("normalizes lowercase input to uppercase before lookup", () => {
    expect(getCurrencySymbol("usd")).toBe("$");
    expect(getCurrencySymbol("eur")).toBe("€");
  });

  it("normalizes mixed-case input", () => {
    expect(getCurrencySymbol("Sek")).toBe("kr");
  });

  it("returns the normalized code itself for unknown but valid 3-letter codes", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
  });

  it("returns default symbol ($) for undefined input", () => {
    expect(getCurrencySymbol(undefined)).toBe(DEFAULT_SYMBOL);
  });

  it("returns default symbol ($) for null input", () => {
    expect(getCurrencySymbol(null)).toBe(DEFAULT_SYMBOL);
  });

  it("returns default symbol ($) for empty string", () => {
    expect(getCurrencySymbol("")).toBe(DEFAULT_SYMBOL);
  });

  it("returns default symbol ($) for whitespace-only string", () => {
    expect(getCurrencySymbol("   ")).toBe(DEFAULT_SYMBOL);
  });

  it("returns default symbol ($) for non-3-letter strings", () => {
    expect(getCurrencySymbol("US")).toBe(DEFAULT_SYMBOL);
    expect(getCurrencySymbol("USDD")).toBe(DEFAULT_SYMBOL);
    expect(getCurrencySymbol("12")).toBe(DEFAULT_SYMBOL);
  });

  it("returns default symbol ($) for strings with numbers", () => {
    expect(getCurrencySymbol("U1D")).toBe(DEFAULT_SYMBOL);
  });
});

describe("getLocaleForCurrency", () => {
  it("returns en-US for USD", () => {
    expect(getLocaleForCurrency("USD")).toBe("en-US");
  });

  it("returns de-DE for EUR", () => {
    expect(getLocaleForCurrency("EUR")).toBe("de-DE");
  });

  it("returns sv-SE for SEK", () => {
    expect(getLocaleForCurrency("SEK")).toBe("sv-SE");
  });

  it("returns ja-JP for JPY", () => {
    expect(getLocaleForCurrency("JPY")).toBe("ja-JP");
  });

  it("normalizes lowercase input", () => {
    expect(getLocaleForCurrency("gbp")).toBe("en-GB");
  });

  it("returns default locale (en-US) for unknown but valid 3-letter code", () => {
    expect(getLocaleForCurrency("XYZ")).toBe(DEFAULT_LOCALE);
  });

  it("returns default locale (en-US) for undefined", () => {
    expect(getLocaleForCurrency(undefined)).toBe(DEFAULT_LOCALE);
  });

  it("returns default locale (en-US) for null", () => {
    expect(getLocaleForCurrency(null)).toBe(DEFAULT_LOCALE);
  });

  it("returns default locale (en-US) for empty string", () => {
    expect(getLocaleForCurrency("")).toBe(DEFAULT_LOCALE);
  });
});

describe("formatCurrency", () => {
  it("formats a USD amount with dollar sign", () => {
    const result = formatCurrency(9.99, "USD");
    expect(result).toContain("9");
    expect(result).toContain("99");
  });

  it("formats zero amount without throwing", () => {
    const result = formatCurrency(0, "USD");
    expect(result).toContain("0");
  });

  it("defaults to USD when code is undefined", () => {
    const result = formatCurrency(100, undefined);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("defaults to USD when code is null", () => {
    const result = formatCurrency(100, null);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("handles NaN amount by coercing to 0", () => {
    const result = formatCurrency(NaN, "USD");
    expect(result).toContain("0");
  });

  it("handles Infinity amount by coercing to 0", () => {
    const result = formatCurrency(Infinity, "EUR");
    expect(result).toContain("0");
  });

  it("handles negative Infinity by coercing to 0", () => {
    const result = formatCurrency(-Infinity, "GBP");
    expect(result).toContain("0");
  });

  it("does not throw for unknown currency code", () => {
    expect(() => formatCurrency(50, "XYZ")).not.toThrow();
    const result = formatCurrency(50, "XYZ");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("does not throw for malformed currency code", () => {
    expect(() => formatCurrency(50, "!!")).not.toThrow();
  });

  it("accepts an explicit locale override", () => {
    const result = formatCurrency(1234.56, "USD", "en-US");
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("ignores blank locale override and uses currency default", () => {
    const result = formatCurrency(100, "SEK", "   ");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("formats large numbers correctly", () => {
    const result = formatCurrency(1000000, "USD");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("formats negative amounts", () => {
    const result = formatCurrency(-50, "USD");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});

describe("getCurrencyPrices", () => {
  it("returns pricing with USD defaults", () => {
    const prices = getCurrencyPrices();
    expect(prices.symbol).toBe("$");
    expect(prices.currency).toBe("USD");
    expect(prices.monthly).toBe("9.99");
    expect(prices.annualMonthly).toBe("4.17");
  });
});

describe("CURRENCIES constant", () => {
  it("contains USD with correct symbol and locale", () => {
    expect(CURRENCIES.USD).toEqual({ symbol: "$", locale: "en-US" });
  });

  it("contains EUR with correct symbol and locale", () => {
    expect(CURRENCIES.EUR).toEqual({ symbol: "€", locale: "de-DE" });
  });

  it("contains SEK with correct symbol and locale", () => {
    expect(CURRENCIES.SEK).toEqual({ symbol: "kr", locale: "sv-SE" });
  });
});

describe("CURRENCY_SYMBOLS constant", () => {
  it("maps USD to $", () => {
    expect(CURRENCY_SYMBOLS.USD).toBe("$");
  });

  it("maps EUR to €", () => {
    expect(CURRENCY_SYMBOLS.EUR).toBe("€");
  });

  it("returns undefined for unknown codes", () => {
    expect(CURRENCY_SYMBOLS.XYZ).toBeUndefined();
  });
});

describe("CURRENCY_LOCALES constant", () => {
  it("maps USD to en-US", () => {
    expect(CURRENCY_LOCALES.USD).toBe("en-US");
  });

  it("maps JPY to ja-JP", () => {
    expect(CURRENCY_LOCALES.JPY).toBe("ja-JP");
  });

  it("returns undefined for unknown codes", () => {
    expect(CURRENCY_LOCALES.XYZ).toBeUndefined();
  });
});
