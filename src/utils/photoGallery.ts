/**
 * Photo gallery helpers for venue/destination photos.
 *
 * Pure functions (no DOM dependencies) that select and de-duplicate photo
 * URLs for the Trip Summary / Trip Detail galleries and the activity /
 * venue detail modals. Comparison tolerates query-string and case
 * differences so the same underlying image is not displayed twice.
 *
 * See Requirements 9.2 (enriched → curated hero fallback) and 11.4
 * (destination photo gallery in the Trip Detail page).
 */

const DEFAULT_MAX = 12;

/**
 * Canonical photo shape used across the gallery helpers. A bare string
 * URL is also accepted at runtime for convenience.
 */
export type Photo = {
  url: string;
  thumbUrl?: string;
  caption?: string;
};

/**
 * Inputs that can reasonably stand in for a photo: the canonical object,
 * a bare URL string, or `null` / `undefined` (which are filtered out).
 */
export type PhotoInput = Photo | string | null | undefined;

type DistinctPhotoGalleryOptions = {
  primary?: string | null;
  sources?: Array<Array<string | null | undefined> | string | null | undefined>;
  limit?: number;
};

type VenuePhotoEntry =
  | Photo
  | string
  | { url?: string | null; thumbUrl?: string | null; thumbPhoto?: string | null; caption?: string | null; photo?: string | null }
  | null
  | undefined;

type VenuePhotoMap = Record<string, VenuePhotoEntry[] | null | undefined> | null | undefined;

/**
 * A venue-shaped object that may carry photos in any of the shapes this
 * codebase has accumulated: a hero URL (`photo` / `realPhoto` / `image`
 * / `url`), a thumbnail URL (`thumbPhoto` / `thumbUrl`), or an array of
 * additional photos (`photos` / `realPhotos`). Every field is optional.
 */
export type VenueLike = {
  url?: string | null;
  photo?: string | null;
  realPhoto?: string | null;
  image?: string | null;
  realImage?: string | null;
  thumbUrl?: string | null;
  thumbPhoto?: string | null;
  photos?: Array<PhotoInput> | null;
  realPhotos?: Array<PhotoInput> | null;
  caption?: string | null;
};

/**
 * Normalize a URL for identity comparison. Strips the query string and
 * fragment, lowercases the result. Falls back to a manual split when the
 * URL is not parseable (e.g. relative paths like `/img/a.jpg`).
 */
export const normalizePhotoIdentity = (url: string): string => {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    const withoutHash = trimmed.split("#")[0] ?? trimmed;
    const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
    return withoutQuery.toLowerCase();
  }
};

const coerceToUrl = (value: PhotoInput): string | null => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof (value as Photo).url === "string") {
    return (value as Photo).url;
  }
  return null;
};

const coerceToPhoto = (value: VenuePhotoEntry): Photo | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? { url: trimmed } : null;
  }
  if (typeof value !== "object") return null;
  const record = value as {
    url?: string | null;
    photo?: string | null;
    thumbUrl?: string | null;
    thumbPhoto?: string | null;
    caption?: string | null;
  };
  const rawUrl = typeof record.url === "string" ? record.url : typeof record.photo === "string" ? record.photo : null;
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;
  const photo: Photo = { url };
  const thumb = typeof record.thumbUrl === "string" ? record.thumbUrl : typeof record.thumbPhoto === "string" ? record.thumbPhoto : null;
  if (thumb && thumb.trim()) photo.thumbUrl = thumb.trim();
  if (typeof record.caption === "string" && record.caption.trim()) photo.caption = record.caption.trim();
  return photo;
};

const clampCount = (count: unknown, fallback: number): number => {
  if (typeof count !== "number" || Number.isNaN(count)) return fallback;
  if (count <= 0) return 0;
  return Math.floor(count);
};

/**
 * Returns a unique list of photo URLs, preserving first-seen order.
 * Comparison is case-insensitive and ignores query strings / fragments so
 * `photo.jpg?w=200` and `PHOTO.jpg?w=800` collapse to a single entry.
 *
 * Null / undefined / empty / non-string entries are discarded. Photo
 * objects with a `url` field are accepted and reduced to their URL.
 */
export const dedupePhotos = (urls: Array<PhotoInput> | null | undefined): string[] => {
  if (!Array.isArray(urls)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const url = coerceToUrl(raw);
    if (typeof url !== "string") continue;
    const trimmed = url.trim();
    if (!trimmed) continue;
    const identity = normalizePhotoIdentity(trimmed);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    result.push(trimmed);
  }
  return result;
};

type SelectGalleryPhotosParams = {
  enriched?: Array<PhotoInput> | null;
  curated?: Array<PhotoInput> | null;
  venuePhotos?: VenuePhotoMap;
  max?: number;
};

/**
 * Select a prioritized, deduplicated, capped list of photos for a
 * gallery.
 *
 * Priority order:
 *   1. `enriched`     — destination photos from enrich-destination (Google Places)
 *   2. `venuePhotos`  — per-venue photos keyed by venue id (flattened)
 *   3. `curated`      — curated stock fallbacks
 *
 * Duplicates across the three sources are removed via {@link dedupePhotos}
 * and the final list is truncated to `max` entries (default 12).
 */
export const selectGalleryPhotos = ({
  enriched,
  curated,
  venuePhotos,
  max = DEFAULT_MAX,
}: SelectGalleryPhotosParams): string[] => {
  const limit = clampCount(max, DEFAULT_MAX);
  if (limit === 0) return [];

  const pool: PhotoInput[] = [];

  if (Array.isArray(enriched)) pool.push(...enriched);

  if (venuePhotos && typeof venuePhotos === "object") {
    for (const entries of Object.values(venuePhotos)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        const photo = coerceToPhoto(entry);
        if (photo) pool.push(photo);
      }
    }
  }

  if (Array.isArray(curated)) pool.push(...curated);

  return dedupePhotos(pool).slice(0, limit);
};

/**
 * Pick up to `count` destination photos, preferring enriched photos from
 * Google Places over curated city/generic fallbacks. Duplicates across
 * sources (same URL ignoring query string/case) are removed.
 *
 * Returns an array of canonical {@link Photo} objects. Accepts strings
 * or `Photo` objects on input, and gracefully handles null / undefined
 * / empty arrays.
 *
 * @param enrichedImages Photos from enrich-destination (preferred).
 * @param cityImages     Curated or generic fallback photos.
 * @param count          Maximum number of photos to return. Defaults to
 *                       {@link DEFAULT_MAX} (12). Values <= 0 yield [].
 *
 * Validates Requirements 9.2, 11.4.
 */
export const pickDestinationPhotos = (
  enrichedImages?: Array<PhotoInput> | null,
  cityImages?: Array<PhotoInput> | null,
  count: number = DEFAULT_MAX,
): Photo[] => {
  const limit = clampCount(count, DEFAULT_MAX);
  if (limit === 0) return [];

  const pool: VenuePhotoEntry[] = [];
  if (Array.isArray(enrichedImages)) pool.push(...enrichedImages);
  if (Array.isArray(cityImages)) pool.push(...cityImages);

  const seen = new Set<string>();
  const result: Photo[] = [];
  for (const entry of pool) {
    const photo = coerceToPhoto(entry);
    if (!photo) continue;
    const identity = normalizePhotoIdentity(photo.url);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    result.push(photo);
    if (result.length >= limit) break;
  }
  return result;
};

/**
 * Select up to `max` deduplicated photo URLs for a single venue-like
 * object. This is the convenience helper named in task 5.6; it gathers
 * every known photo field on the venue (hero, thumbnail, and photo
 * arrays), strips duplicates via {@link dedupePhotos}, and truncates to
 * `max` entries.
 *
 * Accepted fields (all optional, any combination):
 *   - `url` / `photo` / `realPhoto` / `image` / `realImage` — hero image
 *   - `thumbUrl` / `thumbPhoto`                              — thumbnail
 *   - `photos` / `realPhotos`                                — extra photos
 *
 * Null / undefined venues yield an empty list.
 *
 * Validates Requirements 9.2, 11.4.
 */
export const selectVenuePhotos = (
  venue: VenueLike | null | undefined,
  max: number = DEFAULT_MAX,
): string[] => {
  const limit = clampCount(max, DEFAULT_MAX);
  if (limit === 0) return [];
  if (!venue || typeof venue !== "object") return [];

  const pool: Array<PhotoInput> = [];
  const pushIfString = (value: unknown) => {
    if (typeof value === "string" && value.trim()) pool.push(value);
  };

  // Hero fields: any of these may be the preferred photo.
  pushIfString(venue.url);
  pushIfString(venue.photo);
  pushIfString(venue.realPhoto);
  pushIfString(venue.image);
  pushIfString(venue.realImage);

  // Thumbnail fields are included so callers that only have a thumb
  // still get a usable entry.
  pushIfString(venue.thumbUrl);
  pushIfString(venue.thumbPhoto);

  // Additional photo arrays.
  if (Array.isArray(venue.photos)) pool.push(...venue.photos);
  if (Array.isArray(venue.realPhotos)) pool.push(...venue.realPhotos);

  return dedupePhotos(pool).slice(0, limit);
};

/**
 * Pick up to `count` photos for a specific venue from a map keyed by
 * venue identifier (for example the venue name or matched place id).
 * Returns deduplicated canonical {@link Photo} objects. Gracefully
 * handles missing keys, null entries, and empty arrays.
 *
 * Validates Requirement 11.4.
 */
export const pickVenuePhotos = (
  venueKey: string | null | undefined,
  allVenuePhotos: VenuePhotoMap,
  count: number = DEFAULT_MAX,
): Photo[] => {
  const limit = clampCount(count, DEFAULT_MAX);
  if (limit === 0) return [];
  if (typeof venueKey !== "string" || !venueKey.trim()) return [];
  if (!allVenuePhotos || typeof allVenuePhotos !== "object") return [];

  const entries = allVenuePhotos[venueKey] ?? allVenuePhotos[venueKey.trim()];
  if (!Array.isArray(entries)) return [];

  const seen = new Set<string>();
  const result: Photo[] = [];
  for (const entry of entries) {
    const photo = coerceToPhoto(entry);
    if (!photo) continue;
    const identity = normalizePhotoIdentity(photo.url);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    result.push(photo);
    if (result.length >= limit) break;
  }
  return result;
};

/**
 * Select the best single photo URL from a list, preferring entries that
 * have a full-size `url` and (where possible) an accompanying `thumbUrl`.
 * Accepts bare string URLs in addition to canonical {@link Photo}
 * objects. Returns `undefined` when no usable photo is present.
 *
 * "Best" is defined as the first entry satisfying, in priority order:
 *   1. has both a non-empty `url` and a non-empty `thumbUrl`
 *   2. has a non-empty `url` (string or object)
 *
 * Null / undefined / empty / malformed entries are skipped.
 *
 * Used to pick a hero photo for a venue / destination when multiple
 * candidates are available. Validates Requirements 9.2, 11.4.
 */
export const selectBestPhoto = (
  photos: Array<PhotoInput> | null | undefined,
): string | undefined => {
  if (!Array.isArray(photos)) return undefined;

  let firstValid: string | undefined;

  for (const raw of photos) {
    const url = coerceToUrl(raw);
    if (typeof url !== "string") continue;
    const trimmed = url.trim();
    if (!trimmed) continue;

    if (firstValid === undefined) firstValid = trimmed;

    if (raw && typeof raw === "object") {
      const thumb = (raw as Photo).thumbUrl;
      if (typeof thumb === "string" && thumb.trim()) {
        return trimmed;
      }
    }
  }

  return firstValid;
};

/**
 * Legacy helper retained for existing callers (ActivityDetailModal,
 * TripDetail). Builds a distinct gallery from a primary URL + additional
 * source lists, preserving order and applying an optional limit.
 */
export const createDistinctPhotoGallery = ({
  primary,
  sources = [],
  limit,
}: DistinctPhotoGalleryOptions): string[] => {
  const pool: Array<string | null | undefined> = [];
  if (typeof primary === "string") pool.push(primary);
  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const value of source) pool.push(value);
    } else if (typeof source === "string") {
      pool.push(source);
    }
  }
  const gallery = dedupePhotos(pool);
  return typeof limit === "number" ? gallery.slice(0, Math.max(0, Math.floor(limit))) : gallery;
};
