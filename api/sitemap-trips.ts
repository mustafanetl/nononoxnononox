/**
 * Dynamic sitemap for shared trips — lists all public /p/:slug URLs.
 * Accessible at /api/sitemap-trips (referenced from robots.txt).
 *
 * Google crawls this to discover all shared trip pages.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE_URL = "https://jolliday.online";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Fetch all shared trip slugs
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_trips?select=slug,created_at&order=created_at.desc&limit=1000`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(500).send("Failed to fetch trips");
    }

    const trips: Array<{ slug: string; created_at: string }> = await response.json();

    const urls = trips.map(t => {
      const lastmod = t.created_at ? t.created_at.split("T")[0] : "2026-05-01";
      return `  <url>
    <loc>${BASE_URL}/trip-seo/${t.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (e) {
    return res.status(500).send("Error generating sitemap");
  }
}
