/**
 * enrich-pricing — Replaces AI-hallucinated flight/hotel prices with real data.
 *
 * Called by frontend AFTER plan generation completes.
 * Uses Travelpayouts Data API for flights and Hotellook for hotels.
 * Results are cached for 1 hour to reduce API calls.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { resolveIATA, buildSkyscannerLink } from "../_shared/iataLookup.ts";
import { searchFlights, searchHotels, buildBookingFallbackLink } from "../_shared/travelpayouts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Generate a deterministic cache key for pricing lookups.
 */
function buildCacheKey(origin: string, destination: string, startDate: string, endDate: string, budget: string): string {
  return `pricing:${origin.toLowerCase()}:${destination.toLowerCase()}:${startDate}:${endDate}:${budget}`;
}

/**
 * Check the destination_media table for cached pricing data.
 */
async function getCachedPricing(cacheKey: string): Promise<any | null> {
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("destination_media")
      .select("metadata, updated_at")
      .eq("destination", cacheKey)
      .eq("type", "pricing_cache")
      .maybeSingle();

    if (!data) return null;

    // Check if cache is still fresh (1 hour TTL)
    const cachedAt = new Date(data.updated_at).getTime();
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      return null; // expired
    }

    return data.metadata;
  } catch (e) {
    console.warn("[enrich-pricing] cache read failed:", e);
    return null;
  }
}

/**
 * Store pricing result in cache.
 */
async function cachePricing(cacheKey: string, result: any): Promise<void> {
  try {
    const db = getAdminClient();
    // Delete existing cache entry (if any), then insert new one.
    // Cannot use upsert since there's no unique constraint on (destination, type, name).
    await db.from("destination_media")
      .delete()
      .eq("destination", cacheKey)
      .eq("type", "pricing_cache");

    await db.from("destination_media").insert({
      destination: cacheKey,
      type: "pricing_cache",
      name: "pricing",
      url: "",
      source: "travelpayouts",
      media_type: "data",
      sort_order: 0,
      metadata: result,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[enrich-pricing] cache write failed:", e);
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      origin,
      destination,
      startDate,
      endDate,
      groupSize = 2,
      budget = "mid",
      currency = "EUR",
    } = body;

    // Validate required fields
    if (!origin || !destination || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: origin, destination, startDate, endDate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve IATA codes
    const originIATA = resolveIATA(origin);
    const destIATA = resolveIATA(destination);

    if (!originIATA || !destIATA) {
      // Can't look up flights without IATA codes — return fallback links only
      const fallbackUrl = buildSkyscannerLink(
        originIATA || origin.slice(0, 3).toUpperCase(),
        destIATA || destination.slice(0, 3).toUpperCase(),
        startDate,
        endDate,
      );
      return new Response(
        JSON.stringify({
          flights: { fallback_url: fallbackUrl, error: "IATA codes not found" },
          hotels: [],
          total_estimate: null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check cache first
    const cacheKey = buildCacheKey(origin, destination, startDate, endDate, budget);
    const cached = await getCachedPricing(cacheKey);
    if (cached) {
      console.log("[enrich-pricing] serving from cache");
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch real data from Travelpayouts
    const token = Deno.env.get("TRAVELPAYOUTS_TOKEN") || "";
    const marker = Deno.env.get("TRAVELPAYOUTS_MARKER") || "";

    if (!token) {
      console.warn("[enrich-pricing] TRAVELPAYOUTS_TOKEN not set");
      return new Response(
        JSON.stringify({
          flights: { fallback_url: buildSkyscannerLink(originIATA, destIATA, startDate, endDate) },
          hotels: [],
          total_estimate: null,
          error: "Pricing service not configured",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run flights and hotels in parallel
    const [flightResult, hotelResults] = await Promise.all([
      searchFlights({
        origin: originIATA,
        destination: destIATA,
        departDate: startDate,
        returnDate: endDate,
        token,
        marker,
        currency,
      }),
      searchHotels({
        city: destination,
        checkIn: startDate,
        checkOut: endDate,
        currency: currency.toLowerCase(),
        budget: budget as "budget" | "mid" | "luxury",
        limit: 5,
        marker,
        adults: groupSize,
      }),
    ]);

    // Build fallback URLs
    const skyscannerFallback = buildSkyscannerLink(originIATA, destIATA, startDate, endDate);
    const bookingFallback = buildBookingFallbackLink(destination, startDate, endDate, groupSize);

    // Calculate totals
    const flightTotal = flightResult.outbound
      ? flightResult.outbound.price * groupSize
      : null;

    // Calculate number of nights
    const nights = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    const cheapestHotel = hotelResults.length > 0
      ? hotelResults.reduce((min, h) => (h.price_per_night < min.price_per_night ? h : min), hotelResults[0])
      : null;
    const hotelTotal = cheapestHotel ? cheapestHotel.price_per_night * nights : null;

    const result = {
      flights: {
        outbound: flightResult.outbound,
        return: flightResult.return,
        fallback_url: skyscannerFallback,
      },
      hotels: hotelResults,
      hotels_fallback_url: bookingFallback,
      total_estimate: flightTotal || hotelTotal
        ? {
            flights_total: flightTotal,
            hotel_total: hotelTotal,
            nights,
            currency: currency.toUpperCase(),
            group_size: groupSize,
          }
        : null,
    };

    // Cache the result
    await cachePricing(cacheKey, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[enrich-pricing] error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error", details: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
