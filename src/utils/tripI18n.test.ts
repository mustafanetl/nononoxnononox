import { describe, it, expect } from "vitest";
import { t, translations, SUPPORTED_LOCALES, type SupportedLocale } from "./tripI18n";

describe("tripI18n translations coverage", () => {
  it("ships dictionaries for all 10 supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual([
      "en", "sv", "es", "fr", "de", "it", "pt", "nl", "da", "no",
    ]);
    for (const locale of SUPPORTED_LOCALES) {
      expect(translations[locale]).toBeDefined();
      expect(Object.keys(translations[locale]).length).toBeGreaterThan(0);
    }
  });

  it("contains every trip-detail UI key called out in the spec in every locale", () => {
    const requiredKeys = [
      "trip.trip_detail",
      "trip.itinerary",
      "trip.day",
      "trip.days",
      "trip.stops",
      "trip.stays",
      "trip.hotel",
      "trip.hotels",
      "trip.flight",
      "trip.flights",
      "trip.activity",
      "trip.activities",
      "trip.packing_list",
      "trip.weather",
      "trip.travel_info",
      "trip.visa",
      "trip.language",
      "trip.timezone",
      "trip.export_pdf",
      "trip.share_trip",
      "common.open",
      "common.close",
      "common.back",
      "common.loading",
      "common.error",
    ];
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale];
      for (const key of requiredKeys) {
        expect(dict[key], `Missing key ${key} in locale ${locale}`).toBeTruthy();
      }
    }
  });
});

describe("t(key, locale)", () => {
  it("returns the localized string for a valid key and locale", () => {
    expect(t("trip.days", "en")).toBe("Days");
    expect(t("trip.days", "sv")).toBe("Dagar");
    expect(t("trip.days", "fr")).toBe("Jours");
    expect(t("trip.export_pdf", "de")).toBe("PDF exportieren");
  });

  it("defaults to English when locale is omitted", () => {
    expect(t("trip.days")).toBe("Days");
    expect(t("common.close")).toBe("Close");
  });

  it("falls back to English when a key is missing in the requested locale", () => {
    // Inject a temporary key into en only to prove cross-locale fallback.
    const tempKey = "__fallback_probe__";
    (translations.en as Record<string, string>)[tempKey] = "english-only";
    try {
      expect(t(tempKey, "sv")).toBe("english-only");
      expect(t(tempKey, "no")).toBe("english-only");
    } finally {
      delete (translations.en as Record<string, string>)[tempKey];
    }
  });

  it("returns the key itself when the key is missing in every dictionary", () => {
    expect(t("nonexistent.key", "en")).toBe("nonexistent.key");
    expect(t("nonexistent.key", "sv")).toBe("nonexistent.key");
  });

  it("falls back to English when locale is not supported", () => {
    // Cast through unknown to simulate untyped callers (e.g. from URL params).
    const bogusLocale = "xx" as unknown as SupportedLocale;
    expect(t("trip.days", bogusLocale)).toBe("Days");
  });
});
