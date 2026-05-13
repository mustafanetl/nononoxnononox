import { describe, it, expect, beforeEach } from "vitest";
import { getCityImage, getStockCityImage, hasCuratedHero, setPlaceImage } from "./cityImages";

describe("getCityImage", () => {
  it("returns the curated Unsplash URL for a known city", () => {
    const url = getCityImage("Paris");
    expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(url).toContain("photo-1502602898657");
  });

  it("matches case-insensitively", () => {
    expect(getCityImage("paris")).toBe(getCityImage("Paris"));
    expect(getCityImage("PARIS")).toBe(getCityImage("Paris"));
  });

  it("normalizes accents and punctuation", () => {
    // São Paulo should map to the same URL as "saopaulo"
    expect(getCityImage("São Paulo")).toBe(getCityImage("Sao Paulo"));
  });

  it("extracts a token from 'City, Country' input", () => {
    expect(getCityImage("Paris, France")).toBe(getCityImage("Paris"));
    expect(getCityImage("Tokyo, Japan")).toBe(getCityImage("Tokyo"));
  });

  it("resolves popular cities listed in the spec", () => {
    const cities = [
      "Paris",
      "Tokyo",
      "New York",
      "London",
      "Rome",
      "Barcelona",
      "Dubai",
      "Sydney",
      "Istanbul",
      "Bangkok",
      "Amsterdam",
      "Lisbon",
      "Prague",
      "Vienna",
      "Singapore",
      "Bali",
      "Marrakech",
      "Cairo",
      "Rio",
      "Iceland",
      "Santorini",
      "Kyoto",
    ];
    for (const city of cities) {
      expect(hasCuratedHero(city)).toBe(true);
      expect(getCityImage(city)).toMatch(/^https:\/\/images\.unsplash\.com\//);
    }
  });

  it("falls back to a generic Unsplash URL for unknown cities", () => {
    const url = getCityImage("Zzzzzunknowncityville");
    expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(hasCuratedHero("Zzzzzunknowncityville")).toBe(false);
  });

  it("returns a stable URL for the same unknown city across calls", () => {
    const a = getCityImage("Made-up-town");
    const b = getCityImage("made up town");
    expect(a).toBe(b);
  });

  it("handles empty input without throwing", () => {
    expect(() => getCityImage("")).not.toThrow();
    expect(getCityImage("")).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it("prefers a runtime-set place image over the curated map", () => {
    const override = "https://example.com/custom-paris.jpg";
    setPlaceImage("Paris", override);
    expect(getCityImage("Paris")).toBe(override);
    // Reset so other tests are not affected: re-override with the curated URL.
    setPlaceImage("Paris", getStockCityImage("Paris"));
  });
});
