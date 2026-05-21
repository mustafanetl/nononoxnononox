/**
 * enrich-booking-links — Constructs affiliate deeplinks for bookable activities.
 *
 * Builds GetYourGuide and Viator search deeplinks for each activity.
 * No external API call needed — pure URL construction with affiliate IDs.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
 */
function buildGYGLink(activityName: string, city: string, partnerId: string): string {
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

    const links: BookingLink[] = (activities as ActivityInput[])
      .filter((a) => a.name && a.city)
      .slice(0, 30) // cap at 30 activities
      .map((activity) => {
        const gygUrl = buildGYGLink(activity.name, activity.city, gygPartnerId);
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
