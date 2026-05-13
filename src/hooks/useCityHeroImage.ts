import { useEffect, useState } from "react";
import {
  fetchWikipediaCityImage,
  getStockCityImage,
  hasCuratedHero,
} from "@/utils/cityImages";

export interface CityHeroImage {
  /**
   * Best-available hero image URL for the city. Always non-empty so callers can
   * use it as an `<img>` src directly. The value may upgrade once an async
   * Wikipedia lookup resolves for cities without a curated hero.
   */
  imageUrl: string;
  /**
   * `true` while an async Wikipedia lookup is in flight for a non-curated city.
   * Remains `false` for empty input, curated cities (instant resolution), and
   * after the async lookup settles.
   */
  loading: boolean;
}

/**
 * Resolve a hero image URL for a city using the following priority chain:
 *   1. Curated hand-picked stock hero (instant, for ~80 popular cities).
 *   2. Wikipedia lead image via REST (free, accurate, any city — async + cached).
 *   3. Deterministic generic fallback from the stock pool.
 *
 * Returns `{ imageUrl, loading }`:
 * - `imageUrl` is always renderable (starts as the synchronous stock best-guess
 *   and upgrades to the Wikipedia image once fetched when applicable).
 * - `loading` is `true` only while awaiting Wikipedia for non-curated cities.
 *
 * Validates: Requirements 22.3, 22.4, 30.2.
 */
export const useCityHeroImage = (
  city: string | undefined | null
): CityHeroImage => {
  const safeCity = (city || "").trim();
  // Synchronous best guess — used as the first paint and as the final fallback.
  const initialStock = getStockCityImage(safeCity);
  const [imageUrl, setImageUrl] = useState<string>(initialStock);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Re-seed with the deterministic stock pick whenever the city changes.
    setImageUrl(getStockCityImage(safeCity));
    if (!safeCity) {
      setLoading(false);
      return;
    }
    if (hasCuratedHero(safeCity)) {
      // Curated wins — no Wikipedia round-trip needed.
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWikipediaCityImage(safeCity)
      .then((url) => {
        if (cancelled) return;
        if (url) setImageUrl(url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [safeCity]);

  return { imageUrl, loading };
};
