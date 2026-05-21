/**
 * enrich-walking — Calculates real walking durations between itinerary slots.
 *
 * Called by frontend AFTER plan generation completes.
 * Uses OSRM public routing API (free, no key required).
 * Results are cached for 24 hours (coordinates don't change).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { calculateWalkingTimes } from "../_shared/osrm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Generate a deterministic cache key from slot coordinates.
 * Uses rounded coordinates (4 decimal places) to allow minor float variations.
 */
function buildCacheKey(
  slots: Array<{ lat: number; lng: number }>,
  hotel?: { lat: number; lng: number } | null,
): string {
  const coordStr = slots
    .map((s) => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`)
    .join("|");
  const hotelStr = hotel ? `H${hotel.lat.toFixed(4)},${hotel.lng.toFixed(4)}` : "nohotel";
  return `walking:${hotelStr}:${coordStr}`;
}

/**
 * Check cache for walking data.
 */
async function getCachedWalking(cacheKey: string): Promise<any | null> {
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("destination_media")
      .select("metadata, updated_at")
      .eq("destination", cacheKey)
      .eq("type", "walking_cache")
      .maybeSingle();

    if (!data) return null;

    const cachedAt = new Date(data.updated_at).getTime();
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      return null; // expired
    }

    return data.metadata;
  } catch (e) {
    console.warn("[enrich-walking] cache read failed:", e);
    return null;
  }
}

/**
 * Store walking result in cache.
 */
async function cacheWalking(cacheKey: string, result: any): Promise<void> {
  try {
    const db = getAdminClient();
    // Delete existing cache entry (if any), then insert new one.
    // Cannot use upsert since there's no unique constraint on (destination, type, name).
    await db.from("destination_media")
      .delete()
      .eq("destination", cacheKey)
      .eq("type", "walking_cache");

    await db.from("destination_media").insert({
      destination: cacheKey,
      type: "walking_cache",
      name: "walking",
      url: "",
      source: "osrm",
      media_type: "data",
      sort_order: 0,
      metadata: result,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[enrich-walking] cache write failed:", e);
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { slots, hotel } = body;

    // Validate
    if (!slots || !Array.isArray(slots) || slots.length < 2) {
      return new Response(
        JSON.stringify({ error: "Need at least 2 slots with { venue, lat, lng }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate slot structure
    for (const slot of slots) {
      if (typeof slot.lat !== "number" || typeof slot.lng !== "number") {
        return new Response(
          JSON.stringify({ error: `Invalid coordinates for slot: ${slot.venue || "unknown"}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Validate hotel if provided
    const hotelCoords = hotel && typeof hotel.lat === "number" && typeof hotel.lng === "number"
      ? { lat: hotel.lat, lng: hotel.lng }
      : null;

    // Check cache
    const cacheKey = buildCacheKey(slots, hotelCoords);
    const cached = await getCachedWalking(cacheKey);
    if (cached) {
      console.log("[enrich-walking] serving from cache");
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // OSRM public server: limit to 100 coordinates per request
    if (slots.length > 99) {
      return new Response(
        JSON.stringify({ error: "Too many slots (max 99)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate real walking times via OSRM
    const result = await calculateWalkingTimes(slots, hotelCoords);

    // Cache the result
    await cacheWalking(cacheKey, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[enrich-walking] error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error", details: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
