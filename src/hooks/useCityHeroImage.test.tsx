import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { useCityHeroImage } from "./useCityHeroImage";
import { getStockCityImage, hasCuratedHero } from "@/utils/cityImages";

// Helper to clear the Wikipedia session cache between tests so we can exercise
// the async path deterministically.
const clearWikiSessionCache = () => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("jolliday-wiki-img:")) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

describe("useCityHeroImage", () => {
  beforeEach(() => {
    clearWikiSessionCache();
    vi.restoreAllMocks();
  });

  it("returns an imageUrl + loading flag and resolves a curated city synchronously", () => {
    // Paris is curated → no Wikipedia round-trip needed.
    expect(hasCuratedHero("Paris")).toBe(true);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useCityHeroImage("Paris"));

    expect(result.current.imageUrl).toBe(getStockCityImage("Paris"));
    expect(result.current.loading).toBe(false);
    // Curated hero should skip Wikipedia entirely.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to the stock pool for empty input without loading state", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useCityHeroImage(""));

    expect(result.current.imageUrl).toBe(getStockCityImage(""));
    expect(result.current.loading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches Wikipedia for non-curated cities and upgrades imageUrl when a lead image is returned", async () => {
    const wikiUrl = "https://upload.wikimedia.org/fake-zzzznewtown-lead.jpg";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ originalimage: { source: wikiUrl } }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    expect(hasCuratedHero("Zzzznewtown")).toBe(false);

    const { result } = renderHook(() => useCityHeroImage("Zzzznewtown"));

    // First paint: deterministic stock fallback + loading=true while Wikipedia fetch is pending.
    expect(result.current.imageUrl).toBe(getStockCityImage("Zzzznewtown"));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.imageUrl).toBe(wikiUrl);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps the stock fallback when Wikipedia returns no image and clears loading", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { result } = renderHook(() => useCityHeroImage("Anotherunknowncity"));
    const stock = getStockCityImage("Anotherunknowncity");
    expect(result.current.imageUrl).toBe(stock);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.imageUrl).toBe(stock);
  });

  it("re-resolves when the city input changes", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result, rerender } = renderHook(
      ({ city }: { city: string }) => useCityHeroImage(city),
      { initialProps: { city: "Paris" } }
    );
    expect(result.current.imageUrl).toBe(getStockCityImage("Paris"));

    await act(async () => {
      rerender({ city: "Tokyo" });
    });
    expect(result.current.imageUrl).toBe(getStockCityImage("Tokyo"));
    // Both curated → no network calls either way.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
