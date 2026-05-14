import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 8000;
// Photos never expire — once cached, they stay forever until admin deletes them.

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeDestination(dest: string): string {
  return dest.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

/** Check if we have cached hero images for this destination.
 *  Admin-uploaded media always takes priority. If ANY admin hero images exist,
 *  we return ONLY those (never mix with google_places). */
async function getCachedImages(destination: string): Promise<any[] | null> {
  try {
    const db = getAdminClient();
    const norm = normalizeDestination(destination);

    const { data } = await db
      .from("destination_media")
      .select("*")
      .eq("destination", norm)
      .eq("type", "hero")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      // If admin images exist, return ONLY admin images (they take priority)
      const adminImages = data.filter((row: any) => row.source === "admin");
      const imagesToReturn = adminImages.length > 0 ? adminImages : data;

      return imagesToReturn.map((row: any) => ({
        url: row.url,
        thumbUrl: row.thumb_url,
        width: row.metadata?.width || 1200,
        height: row.metadata?.height || 800,
        attributions: row.metadata?.attributions || [],
        cached: true,
        source: row.source,
        mediaType: row.media_type || "photo",
      }));
    }
    return null;
  } catch (e) {
    console.warn("Cache read failed:", e);
    return null;
  }
}

/**
 * Check if we have cached activity/hotel photos for any of the requested
 * names. Returns whatever we have cached (even partial hits) so callers
 * can fetch only the misses from Google Places.
 *
 * IMPORTANT: If a venue has source='admin' media, it is NEVER overwritten.
 * The returned entries include an `_isAdmin` flag so callers know to skip
 * Google Places entirely for that venue.
 */
async function getCachedActivityPhotos(destination: string, names: string[]): Promise<Record<string, any>> {
  if (names.length === 0) return {};
  try {
    const db = getAdminClient();
    const norm = normalizeDestination(destination);

    const { data } = await db
      .from("destination_media")
      .select("*")
      .eq("destination", norm)
      .in("type", ["activity", "hotel"])
      .order("sort_order", { ascending: true });

    if (!data || data.length === 0) return {};

    // Group by name, preferring admin-uploaded media
    const byName: Record<string, any[]> = {};
    for (const row of data) {
      if (!row.name) continue;
      const key = row.name;
      if (!byName[key]) byName[key] = [];
      byName[key].push(row);
    }

    const result: Record<string, any> = {};
    for (const [name, rows] of Object.entries(byName)) {
      // Admin rows take absolute priority
      const adminRows = rows.filter((r: any) => r.source === "admin");
      const effectiveRows = adminRows.length > 0 ? adminRows : rows;
      const primaryRow = effectiveRows[0];

      const allPhotos = effectiveRows
        .filter((r: any) => (r.media_type || "photo") === "photo")
        .map((r: any) => r.url);
      const videoRow = effectiveRows.find((r: any) => r.media_type === "video");

      const entry = {
        photo: primaryRow.url,
        thumbPhoto: primaryRow.thumb_url,
        photos: allPhotos.length > 0 ? allPhotos : (primaryRow.metadata?.photos || [primaryRow.url]),
        rating: primaryRow.metadata?.rating || null,
        address: primaryRow.metadata?.address || null,
        verified: true,
        hasRealPhoto: true,
        matchedName: primaryRow.name,
        lat: primaryRow.metadata?.lat || null,
        lng: primaryRow.metadata?.lng || null,
        _isAdmin: adminRows.length > 0,
        videoUrl: videoRow?.url || null,
      };
      result[name] = entry;
      result[name.toLowerCase()] = entry;
    }
    return result;
  } catch (e) {
    console.warn("Activity cache read failed:", e);
    return {};
  }
}

/** Which of the requested names did NOT hit the cache?
 *  NEVER return names that have admin-uploaded media — those are permanent. */
function cacheMisses(names: string[], cached: Record<string, any>): string[] {
  return names.filter((n) => {
    const hit = cached[n] || cached[n.toLowerCase()];
    if (!hit) return true; // no cache → need to fetch
    if (hit._isAdmin) return false; // admin media → NEVER re-fetch
    return false; // has google_places cache → skip
  });
}

/** Store images in cache. NEVER touch admin-uploaded media. */
async function cacheImages(destination: string, images: any[]) {
  try {
    const db = getAdminClient();
    const norm = normalizeDestination(destination);

    // Check if admin hero images exist — if so, do NOT overwrite
    const { data: adminHeroes } = await db
      .from("destination_media")
      .select("id")
      .eq("destination", norm)
      .eq("type", "hero")
      .eq("source", "admin")
      .limit(1);

    if (adminHeroes && adminHeroes.length > 0) {
      console.log(`Skipping hero cache write for ${norm} — admin media exists`);
      return;
    }

    const rows = images.map((img: any, idx: number) => ({
      destination: norm,
      type: "hero",
      name: null,
      url: img.url,
      thumb_url: img.thumbUrl || img.url,
      source: "google_places",
      media_type: "photo",
      sort_order: idx,
      metadata: {
        width: img.width,
        height: img.height,
        attributions: img.attributions || [],
      },
      updated_at: new Date().toISOString(),
    }));

    // Delete old google_places hero images only, insert new ones
    await db.from("destination_media").delete().eq("destination", norm).eq("type", "hero").eq("source", "google_places");
    if (rows.length > 0) await db.from("destination_media").insert(rows);
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

/** Store activity/hotel photos in cache. NEVER overwrite admin-uploaded media. */
async function cacheActivityPhotos(destination: string, photos: Record<string, any>, type: "activity" | "hotel") {
  try {
    const db = getAdminClient();
    const norm = normalizeDestination(destination);

    // First, find which names have admin media — those are untouchable
    const { data: adminEntries } = await db
      .from("destination_media")
      .select("name")
      .eq("destination", norm)
      .eq("type", type)
      .eq("source", "admin");

    const adminNames = new Set((adminEntries || []).map((r: any) => r.name?.toLowerCase()).filter(Boolean));

    const rows = Object.entries(photos)
      .filter(([name, v]) => {
        if ((v as any)?._isAdmin) return false; // never overwrite admin
        if (adminNames.has(name.toLowerCase())) return false; // admin exists for this name
        return (v as any)?.hasRealPhoto;
      })
      .map(([name, v]: [string, any], idx: number) => ({
        destination: norm,
        type,
        name,
        url: v.photo || v.thumbPhoto,
        thumb_url: v.thumbPhoto || v.photo,
        source: "google_places",
        media_type: "photo",
        sort_order: idx,
        metadata: {
          photos: v.photos || [],
          rating: v.rating,
          address: v.address,
          lat: v.lat,
          lng: v.lng,
          matchedName: v.matchedName,
        },
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      // Delete old google_places entries for these specific names (never admin)
      for (const row of rows) {
        await db.from("destination_media").delete()
          .eq("destination", norm)
          .eq("type", type)
          .eq("name", row.name)
          .eq("source", "google_places");
      }
      await db.from("destination_media").insert(rows);
    }
  } catch (e) {
    console.warn("Activity cache write failed:", e);
  }
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

interface GeoResult {
  lat: number;
  lng: number;
  countryCode: string;
  displayName: string;
}

async function geocode(destination: string): Promise<GeoResult | null> {
  // Try Nominatim with one retry — it's strict & flaky from edge IPs.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en&addressdetails=1`,
        { headers: { "User-Agent": "Jolliday-TravelApp/1.0 (contact@jolliday.online)" } }
      );
      if (!res.ok) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 400)); continue; }
        return null;
      }
      const data = await res.json();
      if (!data || data.length === 0) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 400)); continue; }
        return null;
      }
      const place = data[0];
      return {
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        countryCode: place.address?.country_code?.toUpperCase() || "",
        displayName: place.display_name,
      };
    } catch (e) {
      console.error(`Geocoding error (attempt ${attempt + 1}):`, e);
      if (attempt === 0) { await new Promise(r => setTimeout(r, 400)); continue; }
      return null;
    }
  }
  return null;
}

async function getCountryInfo(countryCode: string): Promise<any> {
  if (!countryCode) return null;
  try {
    const res = await fetchWithTimeout(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,currencies,languages,timezones,capital`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (e) {
    console.error("Country info error:", e);
    return null;
  }
}

async function getExchangeRate(currencyCode: string): Promise<any> {
  if (!currencyCode || currencyCode === "USD") return { base: "USD", rate: 1 };
  try {
    const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { base: "USD", rate: data.rates?.[currencyCode] || null, currency: currencyCode };
  } catch (e) {
    console.error("Exchange rate error:", e);
    return null;
  }
}

// Fetch iconic destination photos
async function getGooglePlacePhotos(destination: string, limit = 6): Promise<any[]> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) return [];
  // Two-stage strategy:
  //   1) Cityscape/skyline query (no type filter) → wide landscape city shots.
  //   2) Fall back to landmarks/attractions if stage 1 yields nothing.
  const runQuery = async (textQuery: string, includedType?: string, maxResultCount = 3) => {
    const body: any = { textQuery, maxResultCount };
    if (includedType) body.includedType = includedType;
    try {
      const res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos,places.displayName",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.places || [];
    } catch (e) {
      console.error("Google Places photos query error:", e);
      return [];
    }
  };

  const collectPhotos = (places: any[], landscapeOnly = false): any[] => {
    const out: any[] = [];
    for (const place of places) {
      if (!place.photos?.length) continue;
      for (const photo of place.photos) {
        const w = photo.widthPx || 800;
        const h = photo.heightPx || 600;
        if (landscapeOnly && w < h * 1.25) continue;
        // Drop tiny / low-res photos that look bad as a full-bleed hero.
        if (landscapeOnly && w < 1200) continue;
        out.push({
          url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1920&key=${apiKey}`,
          thumbUrl: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`,
          width: w,
          height: h,
          attributions: photo.authorAttributions || [],
        });
      }
    }
    return out;
  };

  // Run several queries in parallel and prefer wide cityscape shots first.
  // For each query, grab the FIRST photo from each place (Google's top photo
  // is usually the most representative — later photos are often interiors,
  // close-ups, or random snapshots).
  const collectFirstPhotos = (places: any[], landscapeOnly = false): any[] => {
    const out: any[] = [];
    for (const place of places) {
      const photo = place.photos?.[0];
      if (!photo) continue;
      const w = photo.widthPx || 800;
      const h = photo.heightPx || 600;
      // Loosened: any landscape (w > h) photo at least 900px wide.
      // The previous threshold (w >= h*1.25 AND w >= 1200) was rejecting
      // perfectly good cityscape shots, falling back to interior fillers.
      if (landscapeOnly && (w <= h || w < 900)) continue;
      out.push({
        url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1920&key=${apiKey}`,
        thumbUrl: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`,
        width: w,
        height: h,
        attributions: photo.authorAttributions || [],
      });
    }
    return out;
  };

  const [skylinePlaces, downtownPlaces, viewpointPlaces, landmarkPlaces] = await Promise.all([
    runQuery(`${destination} skyline aerial view`, undefined, 4),
    runQuery(`${destination} city center downtown`, undefined, 4),
    runQuery(`${destination} viewpoint panorama`, undefined, 3),
    runQuery(`famous landmarks in ${destination}`, "tourist_attraction", 4),
  ]);

  // Hero candidates: strict landscape only.
  const heroCandidates = [
    ...collectFirstPhotos(skylinePlaces, true),
    ...collectFirstPhotos(downtownPlaces, true),
    ...collectFirstPhotos(viewpointPlaces, true),
    ...collectFirstPhotos(landmarkPlaces, true),
  ];

  // Filler for remaining slots: landmarks (any aspect, but still first photo).
  const fillerPhotos = collectFirstPhotos(landmarkPlaces, false);

  const merged = [...heroCandidates, ...fillerPhotos];
  // De-dup by photo URL
  const seen = new Set<string>();
  const unique = merged.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
  return unique.slice(0, limit);
}

// Normalize name for fuzzy matching
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Word-token Jaccard-style similarity. Drops stopwords; requires at least
// one significant (>=4 char) shared token AND >=0.5 overlap ratio.
const STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "in", "at", "on", "to", "for", "by",
  "restaurant", "cafe", "café", "bar", "hotel", "resort", "museum", "park",
  "national", "the", "le", "la", "el", "il", "de", "du", "des",
]);
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}
function nameMatches(query: string, candidate: string): boolean {
  const q = tokenize(query);
  const c = tokenize(candidate);
  if (q.length === 0 || c.length === 0) return false;
  const cset = new Set(c);
  const shared = q.filter((t) => cset.has(t));
  if (shared.length === 0) return false;
  const hasSignificant = shared.some((t) => t.length >= 4);
  // If every query token is present in the candidate, accept it — this
  // handles short queries like "Aura" vs "Restaurant Aura Rotterdam".
  if (shared.length === q.length && hasSignificant) return true;
  const ratio = shared.length / Math.max(q.length, c.length);
  return hasSignificant && ratio >= 0.4;
}

// Per-activity Google Places validation + photo
async function searchAndValidateActivities(
  activities: string[],
  destination: string
): Promise<Record<string, { photo: string | null; thumbPhoto: string | null; photos: string[]; rating: number | null; address: string | null; verified: boolean; matchedName: string | null }>> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey || activities.length === 0) return {};

  const results: Record<string, any> = {};
  const batch = Array.from(new Set(activities.filter(Boolean))).slice(0, 15);
  const promises = batch.map(async (actName) => {
    try {
      // ALWAYS scope the lookup to the destination city so we don't pull
      // a same-named venue from another city (e.g. an "Aura" in another country).
      const cityScopedQuery = `${actName}, ${destination}`;
      const res = await fetchWithTimeout(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.photos,places.rating,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            textQuery: cityScopedQuery,
            maxResultCount: 5,
          }),
        }
      );
      if (!res.ok) {
        results[actName] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, matchedName: null };
        return;
      }
      const data = await res.json();
      const places = data.places || [];

      // Strict match: name overlap AND the place address must contain the destination city.
      // This prevents pulling a same-named venue from a different city.
      const destTokens = tokenize(destination);
      const addressMatchesCity = (addr: string) => {
        if (!addr) return false;
        const aTokens = new Set(tokenize(addr));
        return destTokens.some((t) => t.length >= 3 && aTokens.has(t));
      };
      let bestPlace: any = null;
      for (const place of places) {
        const placeName = place.displayName?.text || "";
        const addr = place.formattedAddress || "";
        if (
          nameMatches(actName, placeName) &&
          addressMatchesCity(addr) &&
          place.photos?.length > 0
        ) {
          bestPlace = place;
          break;
        }
      }

      // Fallback 1: name matches and there's a photo — accept even if address
      // city-token check fails. Many cities have different local names
      // (Gothenburg/Göteborg, Munich/München, Florence/Firenze, Vienna/Wien,
      // Copenhagen/København) so the address won't contain our English token.
      // The query was already city-scoped, so Google's top result is
      // overwhelmingly in that city.
      if (!bestPlace) {
        for (const place of places) {
          const placeName = place.displayName?.text || "";
          if (nameMatches(actName, placeName) && place.photos?.length > 0) {
            bestPlace = place;
            break;
          }
        }
      }

      // Fallback 2: any first result with a photo — the search was already
      // city-scoped ("{name}, {city}"), so trust Google's ranking.
      if (!bestPlace) {
        for (const place of places) {
          if (place.photos?.length > 0) {
            bestPlace = place;
            break;
          }
        }
      }

      if (!bestPlace) {
        results[actName] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, hasRealPhoto: false, matchedName: null };
        return;
      }

      const photoRef = bestPlace.photos?.[0]?.name;
      const hasRealPhoto = !!photoRef;
      const allPhotoUrls: string[] = hasRealPhoto
        ? bestPlace.photos.slice(0, 4).map((p: any) =>
            `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${apiKey}`
          )
        : [];
      results[actName] = {
        photo: hasRealPhoto ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1600&key=${apiKey}` : null,
        thumbPhoto: hasRealPhoto ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}` : null,
        photos: allPhotoUrls,
        rating: bestPlace.rating || null,
        address: bestPlace.formattedAddress || null,
        verified: hasRealPhoto,
        hasRealPhoto,
        matchedName: bestPlace.displayName?.text || null,
        lat: typeof bestPlace.location?.latitude === "number" ? bestPlace.location.latitude : null,
        lng: typeof bestPlace.location?.longitude === "number" ? bestPlace.location.longitude : null,
      };
    } catch (e) {
      console.error(`Activity validation error for "${actName}":`, e);
      results[actName] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, matchedName: null };
    }
  });

  await Promise.all(promises);
  return results;
}

// Per-hotel Google Places validation + photo
async function searchAndValidateHotels(
  hotelNames: string[],
  destination: string
): Promise<Record<string, { photo: string | null; thumbPhoto: string | null; photos: string[]; rating: number | null; address: string | null; verified: boolean; matchedName: string | null }>> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey || hotelNames.length === 0) return {};

  const results: Record<string, any> = {};
  const batch = hotelNames.slice(0, 15);
  const promises = batch.map(async (name) => {
    try {
      const cityScopedQuery = `${name} hotel, ${destination}`;
      const res = await fetchWithTimeout(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.photos,places.rating,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            textQuery: cityScopedQuery,
            maxResultCount: 5,
            includedType: "lodging",
          }),
        }
      );
      if (!res.ok) {
        results[name] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, matchedName: null };
        return;
      }
      const data = await res.json();
      const places = data.places || [];

      const destTokens = tokenize(destination);
      const addressMatchesCity = (addr: string) => {
        if (!addr) return false;
        const aTokens = new Set(tokenize(addr));
        return destTokens.some((t) => t.length >= 3 && aTokens.has(t));
      };
      let bestPlace: any = null;
      for (const place of places) {
        const placeName = place.displayName?.text || "";
        const addr = place.formattedAddress || "";
        if (
          nameMatches(name, placeName) &&
          addressMatchesCity(addr) &&
          place.photos?.length > 0
        ) {
          bestPlace = place;
          break;
        }
      }

      // Fallback 1: name match with photo (handles cities with different
      // local names, e.g. Gothenburg → Göteborg).
      if (!bestPlace) {
        for (const place of places) {
          const placeName = place.displayName?.text || "";
          if (nameMatches(name, placeName) && place.photos?.length > 0) {
            bestPlace = place;
            break;
          }
        }
      }

      // Fallback 2: any first lodging result with a photo (query was
      // city-scoped + lodging type, so trust Google's ranking).
      if (!bestPlace) {
        for (const place of places) {
          if (place.photos?.length > 0) {
            bestPlace = place;
            break;
          }
        }
      }

      if (!bestPlace?.photos?.[0]?.name) {
        results[name] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, hasRealPhoto: false, matchedName: null };
        return;
      }

      const allPhotos = bestPlace.photos.slice(0, 3).map((p: any) =>
        `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${apiKey}`
      );
      const photoRef = bestPlace.photos[0].name;
      results[name] = {
        photo: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1600&key=${apiKey}`,
        thumbPhoto: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`,
        photos: allPhotos,
        rating: bestPlace.rating || null,
        address: bestPlace.formattedAddress || null,
        verified: true,
        hasRealPhoto: true,
        matchedName: bestPlace.displayName?.text || null,
        lat: typeof bestPlace.location?.latitude === "number" ? bestPlace.location.latitude : null,
        lng: typeof bestPlace.location?.longitude === "number" ? bestPlace.location.longitude : null,
      };
    } catch (e) {
      console.error(`Hotel validation error for "${name}":`, e);
      results[name] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, matchedName: null };
    }
  });
  await Promise.all(promises);
  return results;
}

// Search a single city for a Google Places photo (for flights)
async function searchCityPhoto(
  city: string
): Promise<{ photo: string; thumbPhoto: string } | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey || !city) return null;
  try {
    const res = await fetchWithTimeout(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: city, maxResultCount: 1 }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photoRef = data.places?.[0]?.photos?.[0]?.name;
    if (!photoRef) return null;
    return {
      photo: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1600&key=${apiKey}`,
      thumbPhoto: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`,
    };
  } catch (e) {
    console.error(`City photo search error for "${city}":`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, travelMonth, activities, hotelNames, imageOnly } = await req.json();

    if (!destination || typeof destination !== "string") {
      return new Response(JSON.stringify({ error: "destination is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // imageOnly mode: just fetch Google Places photos, skip everything else
    if (imageOnly) {
      console.log(`Image-only enrichment for: ${destination}`);
      // Check cache first
      const cached = await getCachedImages(destination);
      if (cached) {
        console.log(`Cache HIT (imageOnly) for ${destination}: ${cached.length} images`);
        return new Response(JSON.stringify({ destination, images: cached }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const images = await getGooglePlacePhotos(destination, 8);
      // Store in cache for next time
      if (images.length > 0) await cacheImages(destination, images);
      return new Response(JSON.stringify({ destination, images }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching destination: ${destination}`, activities?.length ? `with ${activities.length} activities` : "");

    // ── CACHE CHECK: hero images ──
    const cachedHeroImages = await getCachedImages(destination);
    const activityNames: string[] = Array.isArray(activities) ? activities : [];
    const hotelNamesList: string[] = Array.isArray(hotelNames) ? hotelNames : [];
    const cachedActivityPhotos = await getCachedActivityPhotos(destination, activityNames);
    const cachedHotelPhotos = await getCachedActivityPhotos(destination, hotelNamesList);

    if (cachedHeroImages) {
      console.log(`Cache HIT for ${destination}: ${cachedHeroImages.length} hero images`);
    }

    const geo = await geocode(destination);
    if (!geo) {
      console.warn(`Geocode failed for "${destination}" — returning photos-only enrichment`);
      const images = cachedHeroImages || await getGooglePlacePhotos(destination, 6).catch(() => []);
      if (!cachedHeroImages && images.length > 0) await cacheImages(destination, images);
      return new Response(JSON.stringify({ destination, images, partial: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine cache misses — only call Google Places for names we don't already have.
    const activityMisses = cacheMisses(activityNames, cachedActivityPhotos);
    const hotelMisses = cacheMisses(hotelNamesList, cachedHotelPhotos);
    const hasHeroCache = !!cachedHeroImages;
    const hasAnyActivityCache = Object.keys(cachedActivityPhotos).length > 0;
    const hasAnyHotelCache = Object.keys(cachedHotelPhotos).length > 0;

    // All APIs in parallel — cache provides the base, fresh calls fill the gaps.
    const [countryData, googleImages, freshActivityResults, freshHotelResults] = await Promise.all([
      geo.countryCode ? getCountryInfo(geo.countryCode) : null,
      hasHeroCache ? Promise.resolve(cachedHeroImages) : getGooglePlacePhotos(destination),
      activityMisses.length > 0 ? searchAndValidateActivities(activityMisses, destination) : Promise.resolve({}),
      hotelMisses.length > 0 ? searchAndValidateHotels(hotelMisses, destination) : Promise.resolve({}),
    ]);

    // Merge cached + fresh — fresh wins on conflict (shouldn't happen because misses are disjoint).
    const activityResults = { ...cachedActivityPhotos, ...freshActivityResults };
    const hotelResults = { ...cachedHotelPhotos, ...freshHotelResults };

    // ── CACHE WRITE: store only the fresh results for next time ──
    if (!hasHeroCache && Array.isArray(googleImages) && googleImages.length > 0) {
      await cacheImages(destination, googleImages);
    }
    if (Object.keys(freshActivityResults).length > 0) {
      await cacheActivityPhotos(destination, freshActivityResults, "activity");
    }
    if (Object.keys(freshHotelResults).length > 0) {
      await cacheActivityPhotos(destination, freshHotelResults, "hotel");
    }

    // Silence lint warnings for the unused "any cache" flags — they're helpful for debugging.
    void hasAnyActivityCache;
    void hasAnyHotelCache;

    let currencyCode = "";
    let currencyName = "";
    if (countryData?.currencies) {
      const codes = Object.keys(countryData.currencies);
      if (codes.length > 0) {
        currencyCode = codes[0];
        currencyName = countryData.currencies[codes[0]]?.name || codes[0];
      }
    }

    const exchangeData = currencyCode ? await getExchangeRate(currencyCode) : null;

    let countryInfo = null;
    if (countryData) {
      const languages = countryData.languages
        ? Object.values(countryData.languages).join(", ")
        : "Unknown";

      countryInfo = {
        destination,
        currency: currencyCode ? `${currencyCode} (${currencyName})` : "Unknown",
        language: languages,
        timezone: countryData.timezones?.[0] || "Unknown",
        exchangeRate: exchangeData?.rate
          ? `1 USD ≈ ${exchangeData.rate} ${currencyCode}`
          : null,
        isLive: true,
      };
    }

    // Count verified items
    const verifiedActivities = Object.values(activityResults).filter((a: any) => a.verified).length;
    const verifiedHotels = Object.values(hotelResults).filter((h: any) => h.verified).length;

    const result = {
      destination,
      geo: { lat: geo.lat, lng: geo.lng, countryCode: geo.countryCode },
      country: countryInfo,
      exchange: exchangeData,
      images: googleImages,
      activityPhotos: activityResults,
      hotelPhotos: hotelResults,
      verification: {
        activitiesTotal: activityNames.length,
        activitiesVerified: verifiedActivities,
        hotelsTotal: hotelNamesList.length,
        hotelsVerified: verifiedHotels,
      },
    };

    console.log(`Enrichment complete for ${destination}: ${googleImages.length} images, ${verifiedActivities}/${activityNames.length} activities verified, ${verifiedHotels}/${hotelNamesList.length} hotels verified`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Enrich error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
