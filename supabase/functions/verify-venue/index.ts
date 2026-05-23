/**
 * verify-venue — Verify venues via Google Places API & store photos
 * 
 * Accepts a batch of venue names, verifies each via Google Places,
 * downloads up to 4 photos, stores them in Supabase Storage,
 * and updates venue_cache with verified=true/false.
 * 
 * POST /verify-venue
 * Body: { venues: [{name, destination}], destination?: string }
 * 
 * Called by: node scripts/venue-pipeline.mjs --step verify
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!GOOGLE_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    const venues: Array<{ name: string; destination: string }> = body.venues || [];
    const destination = body.destination || "rotterdam";

    if (!venues.length) {
      return new Response(JSON.stringify({ error: "No venues provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size
    const batch = venues.slice(0, 10);
    const results: any[] = [];

    for (const venue of batch) {
      const venueName = venue.name;
      const dest = venue.destination || destination;

      // Check if already verified
      const { data: existing } = await supabase
        .from("venue_cache")
        .select("verified")
        .eq("name", venueName)
        .eq("destination", dest)
        .single();

      if (existing?.verified === true || existing?.verified === false) {
        results.push({ name: venueName, status: "cached", verified: existing.verified });
        continue;
      }

      // Search Google Places
      const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.businessStatus,places.regularOpeningHours,places.photos,places.websiteUri",
        },
        body: JSON.stringify({ textQuery: `${venueName}, ${dest}`, maxResultCount: 3 }),
      });

      if (!searchRes.ok) {
        results.push({ name: venueName, status: "error", detail: `API ${searchRes.status}` });
        continue;
      }

      const searchData = await searchRes.json();
      const places = searchData.places || [];

      if (!places.length || places[0].businessStatus === "CLOSED_PERMANENTLY") {
        // Mark as false
        await supabase.from("venue_cache").upsert({
          name: venueName, destination: dest, verified: false,
          verification_date: new Date().toISOString(),
        }, { onConflict: "name,destination" });
        results.push({ name: venueName, status: "not_found" });
        continue;
      }

      const place = places[0];

      // Download up to 4 photos
      const photoRefs = (place.photos || []).slice(0, 4);
      const storedPhotos: any[] = [];

      for (let i = 0; i < photoRefs.length; i++) {
        const photoName = photoRefs[i].name;
        if (!photoName) continue;

        try {
          const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_KEY}`;
          const photoRes = await fetch(photoUrl, { redirect: "follow" });
          if (!photoRes.ok) continue;

          const imgBytes = new Uint8Array(await photoRes.arrayBuffer());
          if (imgBytes.length < 1000) continue;

          const path = `${dest}/venues/${place.id}/photo_${i}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from("destination-media")
            .upload(path, imgBytes, { contentType: "image/jpeg", upsert: true });

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from("destination-media")
              .getPublicUrl(path);
            storedPhotos.push({ url: publicUrl, index: i });
          }
        } catch (e) {
          console.error(`Photo ${i} failed for ${venueName}:`, e);
        }
      }

      // Parse hours
      let hours = null;
      if (place.regularOpeningHours?.weekdayDescriptions) {
        hours = place.regularOpeningHours.weekdayDescriptions;
      }

      // Map types to category
      const typeMap: Record<string, string> = {
        restaurant: "dining", food: "dining", cafe: "cafe", bakery: "cafe",
        bar: "nightlife", night_club: "nightlife", museum: "culture",
        art_gallery: "culture", tourist_attraction: "sightseeing",
        park: "outdoor", shopping_mall: "shopping", spa: "experience",
      };
      let category = "sightseeing";
      for (const t of (place.types || [])) {
        if (typeMap[t]) { category = typeMap[t]; break; }
      }

      // Upsert to venue_cache
      await supabase.from("venue_cache").upsert({
        name: venueName,
        destination: dest,
        verified: true,
        google_place_id: place.id,
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        address: place.formattedAddress,
        rating: place.rating,
        review_count: place.userRatingCount,
        category,
        google_types: place.types || [],
        hours,
        website: place.websiteUri || null,
        photos: storedPhotos,
        photo_count: storedPhotos.length,
        verification_date: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
      }, { onConflict: "name,destination" });

      results.push({
        name: venueName, status: "verified",
        rating: place.rating, photos: storedPhotos.length,
      });
    }

    return new Response(JSON.stringify({ results, processed: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-venue error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
