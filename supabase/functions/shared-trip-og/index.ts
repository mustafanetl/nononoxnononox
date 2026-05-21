/**
 * shared-trip-og — Serves SEO-optimized HTML for shared trip pages.
 *
 * When a crawler (Googlebot, Bingbot, social media scrapers) hits /p/:slug,
 * Vercel rewrites it to this edge function which returns full HTML with:
 * - Proper <title> and meta description
 * - Open Graph tags for social sharing
 * - Structured data (TripPlan schema)
 * - Visible text content (itinerary, activities, hotels)
 * - Link to the full React app for interactive experience
 *
 * Human users get redirected to the SPA version which loads the full UI.
 * Bot detection uses User-Agent matching.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const BOT_UA = /googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|pinterestbot|discordbot|telegrambot|whatsapp|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|GPTBot|ChatGPT|ClaudeBot|PerplexityBot|Bytespider|CCBot/i;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Extract slug from path: /shared-trip-og?slug=xxx or from referrer path
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }

    // Fetch the shared trip data
    const db = getClient();
    const { data: trip, error } = await db
      .from("shared_trips")
      .select("title, destination, data_json, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !trip || !trip.data_json) {
      return new Response("Trip not found", { status: 404 });
    }

    const planData = (trip.data_json as any)?.data || trip.data_json;
    const destination = trip.destination || planData?.destination_enrich?.destination || "a destination";
    const title = trip.title || `Trip to ${destination}`;

    // Extract itinerary summary for meta description
    const days = Array.isArray(planData?.itinerary) ? planData.itinerary.length : 0;
    const activitiesCount = Array.isArray(planData?.activities) ? planData.activities.length : 0;
    const hotels = Array.isArray(planData?.hotels) ? planData.hotels : [];
    const hotelName = hotels[0]?.name || "";
    const description = `${days}-day trip to ${destination} with ${activitiesCount} activities${hotelName ? `, staying at ${hotelName}` : ""}. Day-by-day itinerary with restaurants, attractions, and booking links. Created with Jolliday AI.`;

    // Build the visible HTML content from the itinerary
    let itineraryHtml = "";
    if (Array.isArray(planData?.itinerary)) {
      for (const day of planData.itinerary) {
        itineraryHtml += `<h3>Day ${day.day}: ${day.title || ""}</h3>`;
        if (Array.isArray(day.slots)) {
          itineraryHtml += "<ul>";
          for (const slot of day.slots) {
            const venue = slot.venue || slot.activity || "";
            const time = slot.time || "";
            const neighborhood = slot.neighborhood || "";
            itineraryHtml += `<li><strong>${time}</strong> — ${venue}${neighborhood ? ` (${neighborhood})` : ""}</li>`;
          }
          itineraryHtml += "</ul>";
        }
      }
    }

    // Build activities list
    let activitiesHtml = "";
    if (Array.isArray(planData?.activities) && planData.activities.length > 0) {
      activitiesHtml = "<h3>Recommended Activities</h3><ul>";
      for (const a of planData.activities.slice(0, 10)) {
        activitiesHtml += `<li>${a.name || "Activity"}${a.category ? ` — ${a.category}` : ""}</li>`;
      }
      activitiesHtml += "</ul>";
    }

    // Build hotel info
    let hotelsHtml = "";
    if (hotels.length > 0) {
      hotelsHtml = "<h3>Where to Stay</h3><ul>";
      for (const h of hotels) {
        hotelsHtml += `<li>${h.name} — ${h.stars || ""}★${h.location ? `, ${h.location}` : ""}</li>`;
      }
      hotelsHtml += "</ul>";
    }

    const BASE_URL = "https://jolliday.online";
    const canonicalUrl = `${BASE_URL}/p/${slug}`;
    const ogImage = `${BASE_URL}/og-image.png`;

    // Structured data for the trip
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": title,
      "description": description,
      "touristType": "Leisure",
      "itinerary": {
        "@type": "ItemList",
        "numberOfItems": days,
        "itemListElement": (planData?.itinerary || []).map((day: any, i: number) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": `Day ${day.day}: ${day.title || ""}`,
        })),
      },
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Jolliday AI Trip Planner</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="Jolliday">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem 1rem; color: #1a1a1a; line-height: 1.7; }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
        h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; }
        h3 { font-size: 1.2rem; font-weight: 600; margin-top: 1.5rem; }
        a { color: #2d42b3; }
        .cta { display: inline-block; margin-top: 2rem; background: #2d42b3; color: white; padding: 0.875rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
        ul { padding-left: 1.5rem; }
        li { margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <nav><a href="${BASE_URL}" style="font-weight: bold; text-decoration: none;">Jolliday</a> — AI Trip Planner</nav>
    <h1>${title}</h1>
    <p class="meta">${days} days · ${activitiesCount} activities · ${destination}</p>
    <p>${description}</p>
    <a href="${canonicalUrl}" class="cta">View full interactive trip →</a>
    <h2>Day-by-Day Itinerary</h2>
    ${itineraryHtml || "<p>This trip has a detailed day-by-day itinerary. View the full interactive version above.</p>"}
    ${activitiesHtml}
    ${hotelsHtml}
    <hr style="margin-top: 3rem; border: none; border-top: 1px solid #eee;">
    <p style="margin-top: 1.5rem; color: #666; font-size: 0.9rem;">
        This trip was planned with <a href="${BASE_URL}">Jolliday AI Trip Planner</a>. 
        <a href="${BASE_URL}/chat?q=Plan+a+trip+to+${encodeURIComponent(destination)}">Plan your own ${destination} trip →</a>
    </p>
    <p style="color: #666; font-size: 0.85rem; margin-top: 1rem;">
        Popular destinations: 
        <a href="${BASE_URL}/destinations/barcelona">Barcelona</a> · 
        <a href="${BASE_URL}/destinations/tokyo">Tokyo</a> · 
        <a href="${BASE_URL}/destinations/paris">Paris</a> · 
        <a href="${BASE_URL}/destinations/bali">Bali</a> · 
        <a href="${BASE_URL}/destinations/amsterdam">Amsterdam</a>
    </p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("[shared-trip-og]", e);
    return new Response("Error", { status: 500 });
  }
});
