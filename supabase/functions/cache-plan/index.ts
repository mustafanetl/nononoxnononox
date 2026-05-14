import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getAdminClient } from "../_shared/auth.ts";

/**
 * POST /functions/v1/cache-plan
 *
 * Saves a completed AI plan to the cache so identical future requests
 * can be served instantly without calling the AI again.
 *
 * Body: { destination, duration, vibe, travelerType, origin?, content }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { destination, duration, vibe, travelerType, origin, content } = body;

    // Validate required fields
    if (!destination || !duration || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: destination, duration, content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Content must look like a real plan (has structured blocks)
    if (!/```(activities|itinerary)\b/.test(content)) {
      return new Response(
        JSON.stringify({ error: "Content does not appear to be a valid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build normalized cache key
    const normalizedDest = String(destination).toLowerCase().trim();
    const normalizedVibe = String(vibe || "mixed").toLowerCase().trim();
    const normalizedType = String(travelerType || "couple").toLowerCase().trim();
    const dur = parseInt(String(duration), 10);

    if (isNaN(dur) || dur < 1 || dur > 30) {
      return new Response(
        JSON.stringify({ error: "Duration must be between 1 and 30" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cacheKey = `${normalizedDest}|${dur}|${normalizedVibe}|${normalizedType}`;

    const admin = getAdminClient();

    // Insert only — never overwrite existing cached plans.
    // If a plan already exists for this key, skip silently.
    const { data: existing } = await admin
      .from("cached_plans")
      .select("id")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (existing) {
      // Already cached — don't overwrite
      console.log(`[cache-plan] already cached key=${cacheKey}, skipping`);
      return new Response(
        JSON.stringify({ ok: true, cacheKey, cached: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: dbError } = await admin.from("cached_plans").insert({
      cache_key: cacheKey,
      destination: normalizedDest,
      duration: dur,
      vibe: normalizedVibe,
      traveler_type: normalizedType,
      origin: origin ? String(origin).toLowerCase().trim() : null,
      plan_content: content,
      hit_count: 0,
    });

    if (dbError) {
      console.error("cache-plan insert error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save plan to cache" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[cache-plan] saved key=${cacheKey}`);

    return new Response(
      JSON.stringify({ ok: true, cacheKey }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("cache-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
