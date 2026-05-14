import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Fetch photos from TripAdvisor Content API for a list of venues in a destination.
 * Flow:
 *   1. Search location → get locationId
 *   2. Fetch photos for that locationId
 *   3. Return the best (largest) photo URLs
 *
 * The TripAdvisor referer must match an approved domain in the API key restrictions.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("TRIPADVISOR_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "TRIPADVISOR_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { destination, venues } = await req.json();
    if (!destination || !Array.isArray(venues) || venues.length === 0) {
      return new Response(JSON.stringify({ error: "destination and venues array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      "accept": "application/json",
      "Referer": "https://jolliday.online",
    };

    const result: Record<string, { photo: string | null; allPhotos: string[]; locationId: string | null; rating: number | null }> = {};

    for (const venue of venues.slice(0, 12)) {
      try {
        // 1. Search for the location
        const searchQuery = `${venue} ${destination}`;
        const searchUrl = `https://api.content.tripadvisor.com/api/v1/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(searchQuery)}&language=en`;
        const searchRes = await fetchWithTimeout(searchUrl, { 
          headers: {
            ...headers,
            "accept": "application/json",
          }
        });

        if (!searchRes.ok) {
          const errText = await searchRes.text();
          console.warn(`Search failed for "${venue}": ${searchRes.status} ${errText.slice(0, 200)}`);
          result[venue] = { photo: null, allPhotos: [], locationId: null, rating: null };
          continue;
        }

        const searchData = await searchRes.json();
        const locationId = searchData?.data?.[0]?.location_id;
        const rating = searchData?.data?.[0]?.rating ? parseFloat(searchData.data[0].rating) : null;

        if (!locationId) {
          result[venue] = { photo: null, allPhotos: [], locationId: null, rating: null };
          continue;
        }

        // 2. Fetch photos for that location
        const photosUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?key=${apiKey}&language=en`;
        const photosRes = await fetchWithTimeout(photosUrl, { headers });

        if (!photosRes.ok) {
          result[venue] = { photo: null, allPhotos: [], locationId, rating };
          continue;
        }

        const photosData = await photosRes.json();
        const photos = photosData?.data || [];

        // Get the largest version of each photo
        const photoUrls = photos
          .map((p: any) => {
            const sizes = p?.images || {};
            return sizes.original?.url || sizes.large?.url || sizes.medium?.url || sizes.small?.url;
          })
          .filter(Boolean)
          .slice(0, 4);

        result[venue] = {
          photo: photoUrls[0] || null,
          allPhotos: photoUrls,
          locationId,
          rating,
        };
      } catch (e) {
        console.error(`TripAdvisor error for "${venue}":`, (e as Error).message);
        result[venue] = { photo: null, allPhotos: [], locationId: null, rating: null };
      }
    }

    return new Response(JSON.stringify({ destination, photos: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tripadvisor-photos crash", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
