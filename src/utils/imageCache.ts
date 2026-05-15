/**
 * Client-side image URL cache using localStorage.
 *
 * Stores photo URLs (not the actual image bytes — those are handled by the
 * browser's HTTP cache). This prevents re-fetching the same enrichment data
 * from the server on every page visit.
 *
 * Structure: { [destination]: { [venueName]: { photos, ts } } }
 * TTL: 7 days (photos don't change often)
 */

const CACHE_KEY = "jolliday-venue-photos";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface VenuePhotoCache {
  photo: string | null;
  thumbPhoto: string | null;
  photos: string[];
  rating: number | null;
  address: string | null;
  verified: boolean;
  matchedName: string | null;
  hasRealPhoto: boolean;
}

interface CacheEntry {
  venues: Record<string, VenuePhotoCache>;
  ts: number;
}

type FullCache = Record<string, CacheEntry>;

function readFullCache(): FullCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeFullCache(cache: FullCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded — evict oldest entries
    try {
      const entries = Object.entries(cache);
      entries.sort((a, b) => a[1].ts - b[1].ts);
      // Keep only the newest half
      const keep = entries.slice(Math.floor(entries.length / 2));
      const trimmed: FullCache = {};
      for (const [k, v] of keep) trimmed[k] = v;
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up
    }
  }
}

function normalizeKey(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

/**
 * Get cached venue photos for a destination.
 * Returns null if not cached or expired.
 */
export function getCachedVenuePhotos(
  destination: string,
): Record<string, VenuePhotoCache> | null {
  const cache = readFullCache();
  const key = normalizeKey(destination);
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    // Expired — clean up
    delete cache[key];
    writeFullCache(cache);
    return null;
  }
  return entry.venues;
}

/**
 * Save venue photos to the local cache.
 */
export function setCachedVenuePhotos(
  destination: string,
  venues: Record<string, VenuePhotoCache>,
) {
  const cache = readFullCache();
  const key = normalizeKey(destination);
  const existing = cache[key]?.venues || {};
  cache[key] = {
    venues: { ...existing, ...venues },
    ts: Date.now(),
  };
  writeFullCache(cache);
}

/**
 * Get a single venue's cached photo data.
 */
export function getCachedVenuePhoto(
  destination: string,
  venueName: string,
): VenuePhotoCache | null {
  const all = getCachedVenuePhotos(destination);
  if (!all) return null;
  // Try exact match first
  if (all[venueName]) return all[venueName];
  // Try normalized match
  const normName = normalizeKey(venueName);
  for (const [k, v] of Object.entries(all)) {
    if (normalizeKey(k) === normName) return v;
  }
  return null;
}

/**
 * Cache enriched images (hero images for a destination).
 */
export function getCachedEnrichedImages(destination: string): any[] | null {
  try {
    const raw = localStorage.getItem(`jolliday-enriched-${normalizeKey(destination)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed.ts || 0) > TTL_MS) return null;
    return parsed.images || null;
  } catch {
    return null;
  }
}

export function setCachedEnrichedImages(destination: string, images: any[]) {
  try {
    localStorage.setItem(
      `jolliday-enriched-${normalizeKey(destination)}`,
      JSON.stringify({ images: images.slice(0, 8), ts: Date.now() }),
    );
  } catch {
    // Quota — ignore
  }
}
