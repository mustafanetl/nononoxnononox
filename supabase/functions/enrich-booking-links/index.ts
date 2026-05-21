/**
 * enrich-booking-links — Constructs affiliate deeplinks for bookable activities.
 *
 * Builds GetYourGuide and Viator search deeplinks for each activity.
 * No external API call needed — pure URL construction with affiliate IDs.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ActivityInput {
  name: string;
  city: string;
  category?: string;
}

interface BookingLink {
  activity: string;
  booking_url: string;
  provider: "getyourguide" | "viator";
  secondary_url?: string;
  secondary_provider?: "viator" | "getyourguide";
}

/**
 * Build a GetYourGuide search deeplink.
 * If we have a direct activity URL from our scraped DB, use that instead.
 */
function buildGYGLink(activityName: string, city: string, partnerId: string, directUrl?: string): string {
  // Prefer direct activity URL (from our scraped GYG data) — much higher conversion
  if (directUrl && directUrl.includes("getyourguide.com")) {
    const sep = directUrl.includes("?") ? "&" : "?";
    return partnerId ? `${directUrl}${sep}partner_id=${partnerId}` : directUrl;
  }
  // Fallback: search URL
  const query = encodeURIComponent(`${activityName} ${city}`);
  const base = `https://www.getyourguide.com/s/?q=${query}`;
  return partnerId ? `${base}&partner_id=${partnerId}` : base;
}

/**
 * Build a Viator search deeplink.
 */
function buildViatorLink(activityName: string, city: string): string {
  const query = encodeURIComponent(`${activityName} ${city}`);
  return `https://www.viator.com/searchResults/all?text=${query}`;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { activities, partner_id } = body;

    // Validate
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return new Response(
        JSON.stringify({ error: "Need at least 1 activity with { name, city }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use env var if no partner_id passed in request
    const gygPartnerId = partner_id || Deno.env.get("GETYOURGUIDE_PARTNER_ID") || "";

    // Look up scraped GYG activity URLs from our DB for direct linking
    let gygLookup: Record<string, string> = {};
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      if (supabaseUrl && serviceKey) {
        const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        // Get all GYG activities for the cities in this request
        const cities = [...new Set((activities as ActivityInput[]).map(a => a.city.toLowerCase().trim()))];
        for (const city of cities) {
          const { data } = await db
            .from("destination_media")
            .select("name, metadata")
            .eq("destination", city)
            .eq("type", "gyg_activity")
            .limit(100);
          if (data) {
            for (const row of data) {
              const url = (row.metadata as any)?.activity_url || (row.metadata as any)?.affiliate_url;
              if (url && row.name) {
                gygLookup[row.name.toLowerCase()] = url;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("[enrich-booking-links] DB lookup failed, using search URLs:", e);
    }

    const links: BookingLink[] = (activities as ActivityInput[])
      .filter((a) => a.name && a.city)
      .slice(0, 30) // cap at 30 activities
      .map((activity) => {
        // Try to find a direct GYG URL from our scraped data
        const directUrl = gygLookup[activity.name.toLowerCase()] || undefined;
        const gygUrl = buildGYGLink(activity.name, activity.city, gygPartnerId, directUrl);
        const viatorUrl = buildViatorLink(activity.name, activity.city);

        return {
          activity: activity.name,
          booking_url: gygUrl,
          provider: "getyourguide" as const,
          secondary_url: viatorUrl,
          secondary_provider: "viator" as const,
        };
      });

    return new Response(JSON.stringify({ links }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[enrich-booking-links] error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error", details: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
