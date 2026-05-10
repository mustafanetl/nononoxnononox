import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceRateLimit,
  rateLimitResponse,
  resolveAuth,
} from "../_shared/auth.ts";

/**
 * AI2 reviewer — replaced by a real Google Places fact-checker.
 * For every venue in the plan (activities, hotels, itinerary slots) we hit
 * Google Places Text Search. If a venue has no real match we flag it.
 * On success we patch the plan blocks with verified lat/lng + matched names.
 */

type Block = { type: string; raw: string; json: any; fullMatch: string };

const BLOCK_TYPES = ["activities", "hotels", "itinerary"];

function extractBlocks(planText: string): Block[] {
  const blocks: Block[] = [];
  for (const type of BLOCK_TYPES) {
    const re = new RegExp("```" + type + "\\s*([\\s\\S]*?)```", "g");
    for (const m of planText.matchAll(re)) {
      const raw = m[1].trim();
      try {
        const json = JSON.parse(raw);
        blocks.push({ type, raw, json, fullMatch: m[0] });
      } catch { /* skip un-parseable */ }
    }
  }
  return blocks;
}

function inferDestination(planText: string, hint?: string): string {
  if (hint && hint.trim()) return hint.trim();
  const m = planText.match(/```destination_enrich\s*([\s\S]*?)```/);
  if (m) {
    try {
      const j = JSON.parse(m[1].trim());
      if (j.destination) return String(j.destination);
    } catch { /* */ }
  }
  const ti = planText.match(/```travelinfo\s*([\s\S]*?)```/);
  if (ti) {
    try {
      const j = JSON.parse(ti[1].trim());
      if (j.destination) return String(j.destination);
    } catch { /* */ }
  }
  return "";
}

function collectVenues(blocks: Block[]): { name: string; kind: "activity" | "hotel" | "itinerary"; ref: any; field: string }[] {
  const venues: { name: string; kind: "activity" | "hotel" | "itinerary"; ref: any; field: string }[] = [];
  for (const b of blocks) {
    if (b.type === "activities" && Array.isArray(b.json)) {
      for (const a of b.json) {
        if (a && typeof a.name === "string" && a.name.trim()) {
          venues.push({ name: a.name, kind: "activity", ref: a, field: "name" });
        }
      }
    } else if (b.type === "hotels" && Array.isArray(b.json)) {
      for (const h of b.json) {
        if (h && typeof h.name === "string" && h.name.trim()) {
          venues.push({ name: h.name, kind: "hotel", ref: h, field: "name" });
        }
      }
    } else if (b.type === "itinerary" && Array.isArray(b.json)) {
      for (const day of b.json) {
        if (Array.isArray(day?.slots)) {
          for (const slot of day.slots) {
            const venueName = typeof slot.venue === "string" && slot.venue.trim() ? slot.venue : null;
            if (venueName) {
              venues.push({ name: venueName, kind: "itinerary", ref: slot, field: "venue" });
            }
          }
        }
      }
    }
  }
  return venues;
}

async function geocodeCountry(destination: string): Promise<{ countryCode: string; lat: number; lng: number } | null> {
  if (!destination) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en&addressdetails=1`,
      { signal: ctrl.signal, headers: { "User-Agent": "Jolliday-TravelApp/1.0 (contact@jolliday.online)" } }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const place = data[0];
    const cc = (place.address?.country_code || "").toUpperCase();
    return { countryCode: cc, lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function verifyVenue(name: string, destination: string, apiKey: string): Promise<{ matched: boolean; lat?: number; lng?: number; placeId?: string; matchedName?: string; countryCode?: string } > {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.addressComponents",
      },
      body: JSON.stringify({
        textQuery: destination ? `${name} ${destination}` : name,
        maxResultCount: 3,
      }),
    });
    clearTimeout(t);
    if (!res.ok) return { matched: false };
    const data = await res.json();
    const places = data.places || [];
    if (places.length === 0) return { matched: false };

    // Token-overlap match: at least one significant word from the venue name
    // must appear in the matched place displayName.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 3);
    const wantedTokens = new Set(norm(name));
    for (const p of places) {
      const dn = p.displayName?.text || "";
      const haveTokens = new Set(norm(dn));
      let overlap = 0;
      for (const w of wantedTokens) if (haveTokens.has(w)) overlap++;
      const ok = wantedTokens.size > 0 && overlap >= Math.min(1, wantedTokens.size);
      if (ok) {
        const countryComp = (p.addressComponents || []).find((c: any) =>
          Array.isArray(c.types) && c.types.includes("country")
        );
        const countryCode = (countryComp?.shortText || "").toUpperCase();
        return {
          matched: true,
          lat: p.location?.latitude,
          lng: p.location?.longitude,
          placeId: p.id,
          matchedName: dn,
          countryCode,
        };
      }
    }
    return { matched: false };
  } catch (e) {
    console.warn("verifyVenue error", name, (e as Error).message);
    return { matched: false };
  }
}

function rebuildPlanText(planText: string, blocks: Block[]): string {
  let out = planText;
  for (const b of blocks) {
    const fenced = "```" + b.type + "\n" + JSON.stringify(b.json, null, 2) + "\n```";
    out = out.replace(b.fullMatch, fenced);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth + rate limit. The reviewer runs per-chat-response (up to 3x via
    // revision loop), so it gets its own bucket. Same limits as rzuma-chat
    // are plenty; the main bottleneck is the chat call itself.
    const ctx = await resolveAuth(req);
    const limitCheck = await enforceRateLimit(ctx, "review-trip-plan");
    if (!limitCheck.ok) {
      return rateLimitResponse(limitCheck.limit);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.planText !== "string" || !body.planText.trim()) {
      return new Response(
        JSON.stringify({ error: "planText (string) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planText: string = body.planText;
    const destination = inferDestination(planText, body.destinationHint);
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      console.warn("GOOGLE_PLACES_API_KEY missing — fail-open");
      return new Response(JSON.stringify({ approved: true, issues: [], skipped: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blocks = extractBlocks(planText);
    if (blocks.length === 0) {
      return new Response(JSON.stringify({ approved: true, issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const venues = collectVenues(blocks);
    if (venues.length === 0) {
      return new Response(JSON.stringify({ approved: true, issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // De-dup by name to avoid double Places calls for the same venue
    const uniqueNames = Array.from(new Set(venues.map(v => v.name)));
    console.log(`Verifying ${uniqueNames.length} unique venues for "${destination}"`);

    // Resolve destination country once so we can reject out-of-country venues.
    const destGeo = await geocodeCountry(destination);
    const destCountry = destGeo?.countryCode || "";

    const verifications: Record<string, Awaited<ReturnType<typeof verifyVenue>>> = {};
    const CONCURRENCY = 6;
    for (let i = 0; i < uniqueNames.length; i += CONCURRENCY) {
      const slice = uniqueNames.slice(i, i + CONCURRENCY);
      const results = await Promise.all(slice.map(n => verifyVenue(n, destination, apiKey)));
      slice.forEach((n, idx) => { verifications[n] = results[idx]; });
    }

    // Patch verified venues back into the block JSON
    const issues: string[] = [];
    for (const v of venues) {
      const r = verifications[v.name];
      if (r?.matched) {
        // Country enforcement: reject venues that resolve outside the
        // destination country. Use ISO country code first, fall back to
        // a 300km radius check from the city center if Google didn't
        // return address components.
        let outsideCountry = false;
        if (destCountry && r.countryCode && r.countryCode !== destCountry) {
          outsideCountry = true;
        } else if (
          destGeo &&
          typeof r.lat === "number" &&
          typeof r.lng === "number" &&
          haversineKm(destGeo.lat, destGeo.lng, r.lat, r.lng) > 300
        ) {
          outsideCountry = true;
        }

        if (outsideCountry) {
          issues.push(
            `${v.kind === "hotel" ? "Hotel" : v.kind === "activity" ? "Activity" : "Itinerary venue"} "${v.name}" is OUTSIDE ${destination}${destCountry ? ` (${destCountry})` : ""} — Google placed it in ${r.countryCode || "another region"}. Replace with a real venue physically located IN ${destination}.`
          );
          continue;
        }

        // Use real coords + matched display name
        if (typeof r.lat === "number" && typeof r.lng === "number") {
          v.ref.lat = r.lat;
          v.ref.lng = r.lng;
        }
        if (r.matchedName && v.kind !== "itinerary") {
          // Only update top-level activity/hotel name — itinerary slots keep their description
          v.ref[v.field] = r.matchedName;
        } else if (r.matchedName && v.kind === "itinerary") {
          v.ref.venue = r.matchedName;
        }
        if (r.placeId) v.ref.placeId = r.placeId;
      } else {
        issues.push(
          `${v.kind === "hotel" ? "Hotel" : v.kind === "activity" ? "Activity" : "Itinerary venue"} "${v.name}"${destination ? ` in ${destination}` : ""} — could not verify on Google Maps. Replace with a well-known real venue${destination ? ` in ${destination}` : ""}.`
        );
      }
    }

    if (issues.length > 0) {
      console.log(`Plan rejected: ${issues.length} unverified venues`);
      return new Response(JSON.stringify({ approved: false, issues: issues.slice(0, 12) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enrichedPlan = rebuildPlanText(planText, blocks);
    console.log(`Plan approved: ${uniqueNames.length} venues all verified`);
    return new Response(JSON.stringify({ approved: true, issues: [], enrichedPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-trip-plan crash", e);
    return new Response(JSON.stringify({ approved: true, issues: [], skipped: "exception" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});