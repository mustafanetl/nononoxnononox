import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 8000;

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
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en&addressdetails=1`,
      { headers: { "User-Agent": "Jolliday-TravelApp/1.0" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const place = data[0];
    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      countryCode: place.address?.country_code?.toUpperCase() || "",
      displayName: place.display_name,
    };
  } catch (e) {
    console.error("Geocoding error:", e);
    return null;
  }
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
  try {
    const searchRes = await fetchWithTimeout(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos,places.displayName",
        },
        body: JSON.stringify({
          textQuery: `famous landmarks and attractions in ${destination}`,
          maxResultCount: 3,
          includedType: "tourist_attraction",
        }),
      }
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const places = searchData.places || [];
    if (places.length === 0) return [];

    const allPhotos: any[] = [];
    for (const place of places) {
      if (!place.photos?.length) continue;
      for (const photo of place.photos.slice(0, Math.ceil(limit / places.length))) {
        allPhotos.push({
          url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`,
          thumbUrl: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`,
          width: photo.widthPx || 800,
          height: photo.heightPx || 600,
          attributions: photo.authorAttributions || [],
        });
      }
    }
    return allPhotos.slice(0, limit);
  } catch (e) {
    console.error("Google Places photos error:", e);
    return [];
  }
}

// Normalize name for fuzzy matching
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Per-activity Google Places validation + photo
async function searchAndValidateActivities(
  activities: string[],
  destination: string
): Promise<Record<string, { photo: string | null; thumbPhoto: string | null; rating: number | null; address: string | null; verified: boolean; matchedName: string | null }>> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey || activities.length === 0) return {};

  const results: Record<string, any> = {};
  const batch = activities.slice(0, 8);
  const promises = batch.map(async (actName) => {
    try {
      const res = await fetchWithTimeout(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.photos,places.rating,places.formattedAddress",
          },
          body: JSON.stringify({
            textQuery: `${actName} in ${destination}`,
            maxResultCount: 3,
          }),
        }
      );
      if (!res.ok) {
        results[actName] = { photo: null, thumbPhoto: null, rating: null, address: null, verified: false, matchedName: null };
        return;
      }
      const data = await res.json();
      const places = data.places || [];
      
      // Find best matching place
      const normalizedQuery = normalizeName(actName);
      let bestPlace = null;
      let isVerified = false;

      for (const place of places) {
        const placeName = place.displayName?.text || "";
        const normalizedPlace = normalizeName(placeName);
        // Check if names have meaningful overlap
        if (normalizedPlace.includes(normalizedQuery) || normalizedQuery.includes(normalizedPlace) ||
            // Check for significant word overlap
            normalizedQuery.split("").filter((c: string) => normalizedPlace.includes(c)).length > normalizedQuery.length * 0.5) {
          bestPlace = place;
          isVerified = true;
          break;
        }
      }

      // Fallback: use first result with photos but mark as unverified
      if (!bestPlace) {
        bestPlace = places.find((p: any) => p.photos?.length > 0) || places[0];
        // If the first result exists, it's a weak match
        isVerified = false;
      }

      if (!bestPlace) {
        results[actName] = { photo: null, thumbPhoto: null, rating: null, address: null, verified: false, matchedName: null };
        return;
      }

      const photoRef = bestPlace.photos?.[0]?.name;
      results[actName] = {
        photo: photoRef ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}` : null,
        thumbPhoto: photoRef ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}` : null,
        rating: bestPlace.rating || null,
        address: bestPlace.formattedAddress || null,
        verified: isVerified && !!photoRef,
        matchedName: bestPlace.displayName?.text || null,
      };
    } catch (e) {
      console.error(`Activity validation error for "${actName}":`, e);
      results[actName] = { photo: null, thumbPhoto: null, rating: null, address: null, verified: false, matchedName: null };
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
  const batch = hotelNames.slice(0, 8);
  const promises = batch.map(async (name) => {
    try {
      const res = await fetchWithTimeout(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.photos,places.rating,places.formattedAddress",
          },
          body: JSON.stringify({
            textQuery: `${name} hotel in ${destination}`,
            maxResultCount: 3,
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

      const normalizedQuery = normalizeName(name);
      let bestPlace = null;
      let isVerified = false;

      for (const place of places) {
        const placeName = place.displayName?.text || "";
        const normalizedPlace = normalizeName(placeName);
        if (normalizedPlace.includes(normalizedQuery) || normalizedQuery.includes(normalizedPlace)) {
          bestPlace = place;
          isVerified = true;
          break;
        }
      }

      if (!bestPlace) {
        bestPlace = places.find((p: any) => p.photos?.length > 0) || places[0];
        isVerified = false;
      }

      if (!bestPlace?.photos?.[0]?.name) {
        results[name] = { photo: null, thumbPhoto: null, photos: [], rating: null, address: null, verified: false, matchedName: bestPlace?.displayName?.text || null };
        return;
      }

      const allPhotos = bestPlace.photos.slice(0, 3).map((p: any) =>
        `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${apiKey}`
      );
      const photoRef = bestPlace.photos[0].name;
      results[name] = {
        photo: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`,
        thumbPhoto: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`,
        photos: allPhotos,
        rating: bestPlace.rating || null,
        address: bestPlace.formattedAddress || null,
        verified: isVerified,
        matchedName: bestPlace.displayName?.text || null,
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
      photo: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`,
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
      const images = await getGooglePlacePhotos(destination, 3);
      return new Response(JSON.stringify({ destination, images }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching destination: ${destination}`, activities?.length ? `with ${activities.length} activities` : "");

    const geo = await geocode(destination);
    if (!geo) {
      return new Response(JSON.stringify({ error: "Could not find destination", destination }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All APIs in parallel
    const activityNames: string[] = Array.isArray(activities) ? activities : [];
    const hotelNamesList: string[] = Array.isArray(hotelNames) ? hotelNames : [];
    const [countryData, googleImages, activityResults, hotelResults] = await Promise.all([
      geo.countryCode ? getCountryInfo(geo.countryCode) : null,
      getGooglePlacePhotos(destination),
      activityNames.length > 0 ? searchAndValidateActivities(activityNames, destination) : Promise.resolve({}),
      hotelNamesList.length > 0 ? searchAndValidateHotels(hotelNamesList, destination) : Promise.resolve({}),
    ]);

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
