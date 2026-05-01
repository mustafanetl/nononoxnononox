import { useEffect, useState } from "react";
import {
  fetchWikipediaCityImage,
  getStockCityImage,
  hasCuratedHero,
} from "@/utils/cityImages";

/**
 * Returns the best available hero image URL for a city, in this priority:
 *   1. Curated hand-picked stock hero (instant, for ~80 popular cities).
 *   2. Wikipedia lead image (free, accurate, any city — fetched async, cached).
 *   3. The deterministic generic fallback from the stock pool.
 *
 * The returned string is always renderable; callers can also pass an extra
 * override (e.g. a Google Places photo) and combine via `override || hero`.
 */
export const useCityHeroImage = (city: string | undefined | null): string => {
  const safeCity = (city || "").trim();
  // Synchronous best guess — used as the first paint and as the final fallback.
  const stock = getStockCityImage(safeCity);
  const [resolved, setResolved] = useState<string>(stock);

  useEffect(() => {
    setResolved(getStockCityImage(safeCity));
    if (!safeCity) return;
    if (hasCuratedHero(safeCity)) return; // curated wins, no need for Wikipedia
    let cancelled = false;
    fetchWikipediaCityImage(safeCity).then((url) => {
      if (cancelled) return;
      if (url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [safeCity]);

  return resolved;
};
