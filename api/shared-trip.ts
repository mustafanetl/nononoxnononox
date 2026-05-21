/**
 * Vercel Serverless Function — serves SEO-optimized HTML for shared trips.
 *
 * Accessible at /trip-seo/:slug — provides Google-readable HTML with full
 * itinerary content, meta tags, structured data, and internal links.
 *
 * The canonical URL points to /p/:slug (the interactive SPA version).
 * Google indexes the content here and shows the canonical in search results.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE_URL = "https://jolliday.online";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;

  if (!slug) {
    return res.status(400).send("Missing slug");
  }

  // For human users who have JS enabled, the React app will take over.
  // We serve the same SEO HTML to everyone — React hydrates on top of it.
  // This is the same pattern as Next.js SSR.
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/shared_trips?slug=eq.${slug}&select=title,destination,data_json,created_at&limit=1`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(404).send("Trip not found");
    }

    const trips = await response.json();
    if (!trips || trips.length === 0) {
      return res.status(404).send("Trip not found");
    }

    const trip = trips[0];
    const planData = trip.data_json?.data || trip.data_json;
    const destination = trip.destination || "a destination";
    const title = trip.title || `Trip to ${destination}`;

    // Build itinerary content
    const days = Array.isArray(planData?.itinerary) ? planData.itinerary.length : 0;
    const activitiesCount = Array.isArray(planData?.activities) ? planData.activities.length : 0;
    const hotels = Array.isArray(planData?.hotels) ? planData.hotels : [];
    const hotelName = hotels[0]?.name || "";
    const description = `${days}-day trip to ${destination} with ${activitiesCount} activities${hotelName ? `, staying at ${hotelName}` : ""}. Day-by-day itinerary planned with Jolliday AI.`;

    let itineraryHtml = "";
    if (Array.isArray(planData?.itinerary)) {
      for (const day of planData.itinerary) {
        itineraryHtml += `<h3>Day ${day.day}: ${day.title || ""}</h3><ul>`;
        if (Array.isArray(day.slots)) {
          for (const slot of day.slots) {
            itineraryHtml += `<li><strong>${slot.time || ""}</strong> — ${slot.venue || slot.activity || ""}${slot.neighborhood ? ` (${slot.neighborhood})` : ""}</li>`;
          }
        }
        itineraryHtml += "</ul>";
      }
    }

    let activitiesHtml = "";
    if (Array.isArray(planData?.activities) && planData.activities.length > 0) {
      activitiesHtml = "<h3>Activities</h3><ul>";
      for (const a of planData.activities.slice(0, 12)) {
        activitiesHtml += `<li>${a.name}${a.category ? ` — ${a.category}` : ""}</li>`;
      }
      activitiesHtml += "</ul>";
    }

    const canonicalUrl = `${BASE_URL}/p/${slug}`;

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
<meta property="og:image" content="${BASE_URL}/og-image.png">
<meta property="og:site_name" content="Jolliday">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": title,
  "description": description,
  "touristType": "Leisure",
  "itinerary": { "@type": "ItemList", "numberOfItems": days }
})}</script>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:2rem 1rem;color:#1a1a1a;line-height:1.7">
<nav><a href="${BASE_URL}" style="font-weight:bold;text-decoration:none;color:#2d42b3">Jolliday</a> — AI Trip Planner</nav>
<h1>${title}</h1>
<p style="color:#666">${days} days · ${activitiesCount} activities · ${destination}</p>
<p>${description}</p>
<a href="${canonicalUrl}" style="display:inline-block;margin:1.5rem 0;background:#2d42b3;color:white;padding:0.75rem 1.5rem;border-radius:9999px;text-decoration:none;font-weight:600">View full interactive trip →</a>
<h2>Itinerary</h2>
${itineraryHtml}
${activitiesHtml}
<hr style="margin-top:3rem;border:none;border-top:1px solid #eee">
<p style="margin-top:1.5rem;color:#666;font-size:0.9rem">Planned with <a href="${BASE_URL}">Jolliday AI</a>. <a href="${BASE_URL}/chat?q=Plan+a+trip+to+${encodeURIComponent(destination)}">Plan your own ${destination} trip →</a></p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send("Error loading trip");
  }
}
