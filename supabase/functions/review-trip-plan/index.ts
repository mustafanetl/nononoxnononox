import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import {
  corsHeaders,
  enforceRateLimit,
  rateLimitResponse,
  resolveAuth,
} from "../_shared/auth.ts";
import { extractBlocksWithRaw } from "../_shared/planParser.ts";

/** Service-role Supabase client for reading/writing destination_media cache. */
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

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
    const found = extractBlocksWithRaw(planText, type);
    for (const b of found) {
      blocks.push({ type, raw: b.raw, json: b.json, fullMatch: b.fullMatch });
    }
  }
  return blocks;
}

function inferDestination(planText: string, hint?: string): string {
  if (hint && hint.trim()) return hint.trim();
  const enrich = extractBlocksWithRaw(planText, "destination_enrich");
  if (enrich.length > 0 && typeof enrich[0].json?.destination === "string") {
    return String(enrich[0].json.destination);
  }
  const travelInfo = extractBlocksWithRaw(planText, "travelinfo");
  if (travelInfo.length > 0 && typeof travelInfo[0].json?.destination === "string") {
    return String(travelInfo[0].json.destination);
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

/**
 * Structural completeness checks — independent of Google verification.
 *
 * A plan can have every venue pass verification and still be garbage
 * (e.g. day 2 is an empty array, or a day has no dinner). These checks
 * catch the "quarter-a-plan" failure mode the AI sometimes falls into on
 * short trips.
 *
 * Mode-aware:
 *   TRIP  = has flights OR hotels, or multi-day itinerary → strict rules
 *           (6-8 slots/day, breakfast + lunch + dinner every day).
 *   LOCAL = single-day plan with no flights/hotels (date night, things to
 *           do tonight, etc.) → loose rules (≥ 3 slots, no meal requirement).
 */
function checkItineraryCompleteness(blocks: Block[]): string[] {
  const issues: string[] = [];
  const itineraryBlock = blocks.find((b) => b.type === "itinerary");
  const hasFlights = blocks.some((b) => b.type === "flights");
  const hasHotels = blocks.some((b) => b.type === "hotels");
  if (!itineraryBlock) {
    // Presence of an itinerary is enforced by the trip-mode flow in the
    // client (we only run the reviewer on structured plans). We still want
    // to call it out when it's missing entirely for a trip-mode response.
    const hasActivities = blocks.some((b) => b.type === "activities");
    if (hasActivities) {
      issues.push(
        `Plan is missing an itinerary block. Emit a \`\`\`itinerary\`\`\` block with every day from day:1 onward, each with 6-8 slots including breakfast, lunch, and dinner.`,
      );
    }
    return issues;
  }

  const days = Array.isArray(itineraryBlock.json) ? itineraryBlock.json : [];
  if (days.length === 0) {
    issues.push(
      `Itinerary array is empty. Emit at least one day with 6-8 slots including breakfast, lunch, and dinner.`,
    );
    return issues;
  }

  // LOCAL/DATE detection: single-day plan with no flights AND no hotels.
  const isLocalMode = !hasFlights && !hasHotels && days.length === 1;
  const minSlotsPerDay = isLocalMode ? 3 : 6;
  const enforceMeals = !isLocalMode;

  // Detect day-number gaps (e.g. day 1 and day 3 but no day 2).
  // Only meaningful for TRIP mode (LOCAL is always single-day).
  const dayNums = days
    .map((d: any) => (typeof d?.day === "number" ? d.day : null))
    .filter((n: number | null): n is number => n !== null)
    .sort((a, b) => a - b);
  if (!isLocalMode && dayNums.length > 0) {
    const maxDay = dayNums[dayNums.length - 1];
    for (let i = 1; i <= maxDay; i++) {
      if (!dayNums.includes(i)) {
        issues.push(
          `Itinerary is missing day ${i}. Every day from day:1 through day:${maxDay} must be present with 6-8 slots.`,
        );
      }
    }
  }

  for (const day of days) {
    const dayNum = typeof day?.day === "number" ? day.day : "?";
    const slots = Array.isArray(day?.slots) ? day.slots : [];

    if (slots.length === 0) {
      issues.push(
        isLocalMode
          ? `Day ${dayNum} has no slots. Add 3-6 real stops with specific venue names, times, and neighborhoods.`
          : `Day ${dayNum} has no slots. Add 6-8 real slots with specific venue names, covering breakfast, lunch, dinner, and sightseeing in between.`,
      );
      continue;
    }

    // Detect arrival/departure days by checking the earliest slot time.
    // If the first slot starts at 11:00+ it's likely an arrival day (flew in).
    // If the last slot ends before 16:00 it's likely a departure day.
    const slotTimes = slots.map((s: any) => {
      const m = (s?.time || "").match(/^(\d{1,2}):(\d{2})/);
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    }).filter((t: number | null): t is number => t !== null);
    const earliestSlot = slotTimes.length > 0 ? Math.min(...slotTimes) : 0;
    const latestSlot = slotTimes.length > 0 ? Math.max(...slotTimes) : 24 * 60;
    const isArrivalDay = dayNum === 1 && earliestSlot >= 11 * 60;
    const isLastDay = dayNum === dayNums[dayNums.length - 1];
    const isDepartureDay = isLastDay && latestSlot <= 18 * 60;

    // Relaxed slot minimum for arrival/departure days (4 instead of 6)
    const effectiveMinSlots = (isArrivalDay || isDepartureDay) ? 4 : minSlotsPerDay;

    if (slots.length < effectiveMinSlots) {
      issues.push(
        isLocalMode
          ? `Day ${dayNum} only has ${slots.length} slot${slots.length === 1 ? "" : "s"} — this plan needs at least ${minSlotsPerDay}. Add more real stops.`
          : `Day ${dayNum} only has ${slots.length} slot${slots.length === 1 ? "" : "s"} — minimum is ${effectiveMinSlots} per day. Add more real stops (cafés, neighborhood walks, dessert spots, sunset bars, museums) to reach ${effectiveMinSlots}-8.`,
      );
    }

    // Meals check only applies to TRIP-mode plans. Date-night / things-to-do
    // plans cover an evening or afternoon and don't need breakfast/lunch.
    // Arrival days (first slot after 11:00) don't need breakfast.
    // Departure days don't strictly need dinner.
    if (enforceMeals) {
      const toMinutes = (t: string): number | null => {
        const m = (t || "").match(/^(\d{1,2}):(\d{2})/);
        if (!m) return null;
        return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      };
      const mealRegex =
        /breakfast|brunch|lunch|dinner|café|cafe|restaurant|bakery|bistro|trattoria|izakaya|ramen|sushi|market|food hall/i;

      let hasBreakfast = false;
      let hasLunch = false;
      let hasDinner = false;

      for (const s of slots) {
        const text = `${s?.activity || ""} ${s?.venue || ""}`;
        const minutes = toMinutes(s?.time || "");
        const looksLikeMeal = mealRegex.test(text);
        if (!looksLikeMeal && minutes === null) continue;

        if (
          (minutes !== null && minutes >= 7 * 60 && minutes <= 10 * 60 + 30 && looksLikeMeal) ||
          /breakfast|brunch|bakery/i.test(text)
        ) {
          hasBreakfast = true;
        }
        if (
          (minutes !== null && minutes >= 11 * 60 + 30 && minutes <= 14 * 60 + 30 && looksLikeMeal) ||
          /\blunch\b/i.test(text)
        ) {
          hasLunch = true;
        }
        if (
          (minutes !== null && minutes >= 18 * 60 + 30 && minutes <= 21 * 60 + 30 && looksLikeMeal) ||
          /\bdinner\b/i.test(text)
        ) {
          hasDinner = true;
        }
      }

      const missingMeals: string[] = [];
      // Skip breakfast check on arrival days (traveler hasn't arrived yet)
      if (!hasBreakfast && !isArrivalDay) missingMeals.push("breakfast (7:00-10:00)");
      if (!hasLunch) missingMeals.push("lunch (11:30-14:30)");
      // Skip dinner check on departure days (traveler may be flying out)
      if (!hasDinner && !isDepartureDay) missingMeals.push("dinner (18:30-21:30)");
      if (missingMeals.length > 0) {
        issues.push(
          `Day ${dayNum} is missing ${missingMeals.join(", ")}. Add a slot at a real, named venue for each missing meal.`,
        );
      }
    }

    // Catch generic placeholder venues that will fail Google verification anyway
    const placeholders =
      /\b(local café|local cafe|nearby restaurant|a local|your hotel|hotel area|nearby bar|unnamed|tbd|local spot)\b/i;
    for (const s of slots) {
      if (typeof s?.venue === "string" && placeholders.test(s.venue)) {
        issues.push(
          `Day ${dayNum} slot "${s.venue}" uses a generic placeholder. Replace with a real, famous venue name in the destination.`,
        );
      }
    }
  }

  return issues;
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

/** Check if a venue already exists in our server-side cache (destination_media table).
 *  If it does, we already verified it before — no need to call Google Places again. */
async function checkVenueCache(venueName: string, destination: string): Promise<{ cached: boolean; lat?: number; lng?: number; placeId?: string; matchedName?: string } | null> {
  try {
    const sb = getServiceClient();
    const norm = destination.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
    const { data, error } = await sb
      .from("destination_media")
      .select("venue_name, metadata")
      .eq("destination", norm)
      .eq("venue_name", venueName.trim())
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const meta = data[0].metadata || {};
    return {
      cached: true,
      lat: meta.lat ?? undefined,
      lng: meta.lng ?? undefined,
      placeId: meta.placeId ?? undefined,
      matchedName: meta.matchedName ?? data[0].venue_name ?? undefined,
    };
  } catch {
    return null;
  }
}

/** After verifying a venue via Google Places, save it to the cache so future
 *  lookups skip the API call entirely. */
async function saveVenueToCache(venueName: string, destination: string, lat?: number, lng?: number, placeId?: string, matchedName?: string): Promise<void> {
  try {
    const sb = getServiceClient();
    const norm = destination.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
    await sb.from("destination_media").insert({
      destination: norm,
      venue_name: venueName.trim(),
      media_url: "", // No photo URL from verification — enrich-destination handles photos
      media_type: "photo",
      source: "google_places",
      sort_order: 0,
      is_hero: false,
      metadata: { lat, lng, placeId, matchedName, verified: true, verifiedAt: new Date().toISOString() },
    });
  } catch {
    // Non-critical — fail silently
  }
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

    // Structural completeness check first — independent of Google verification.
    // Catches the "short trip, empty day 2" failure mode even when venues
    // themselves are real. Fail-fast: if the plan is structurally broken,
    // skip the (more expensive) Places verification and ask the AI to fix
    // the structure before we re-verify on the next pass.
    const structuralIssues = checkItineraryCompleteness(blocks);
    if (structuralIssues.length > 0) {
      console.log(`Plan rejected (structural): ${structuralIssues.length} issue(s)`);
      limitCheck.commit().catch(() => {});
      return new Response(
        JSON.stringify({ approved: false, issues: structuralIssues.slice(0, 12) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (venues.length === 0) {
      limitCheck.commit().catch(() => {});
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

    // Step 1: Check cache for all venues first — skip Google Places for cached ones
    const verifications: Record<string, Awaited<ReturnType<typeof verifyVenue>>> = {};
    const uncachedNames: string[] = [];

    for (const name of uniqueNames) {
      const cached = await checkVenueCache(name, destination);
      if (cached?.cached) {
        // Already verified before — use cached data, skip Google Places entirely
        verifications[name] = {
          matched: true,
          lat: cached.lat,
          lng: cached.lng,
          placeId: cached.placeId,
          matchedName: cached.matchedName,
        };
      } else {
        uncachedNames.push(name);
      }
    }

    const cachedCount = uniqueNames.length - uncachedNames.length;
    if (cachedCount > 0) {
      console.log(`  → ${cachedCount} venues found in cache (skipped Google Places)`);
    }
    if (uncachedNames.length > 0) {
      console.log(`  → ${uncachedNames.length} venues need Google Places verification`);
    }

    // Step 2: Only call Google Places for venues NOT in cache
    const CONCURRENCY = 6;
    for (let i = 0; i < uncachedNames.length; i += CONCURRENCY) {
      const slice = uncachedNames.slice(i, i + CONCURRENCY);
      const results = await Promise.all(slice.map(n => verifyVenue(n, destination, apiKey)));
      slice.forEach((n, idx) => {
        verifications[n] = results[idx];
        // Save newly verified venues to cache for future lookups
        if (results[idx].matched) {
          saveVenueToCache(n, destination, results[idx].lat, results[idx].lng, results[idx].placeId, results[idx].matchedName);
        }
      });
    }

    // Patch verified venues back into the block JSON
    const issues: string[] = [];
    for (const v of venues) {
      const r = verifications[v.name];
      if (r?.matched) {
        // Country enforcement: reject venues that resolve outside the
        // destination country. ISO country code is the primary signal; a
        // tight 150 km haversine radius is only a last-resort fallback
        // when Google didn't return address components. 300 km was too
        // loose — Stockholm's 300 km circle covers Denmark, Norway,
        // Finland, and the Baltic states.
        let outsideCountry = false;
        if (destCountry && r.countryCode && r.countryCode !== destCountry) {
          outsideCountry = true;
        } else if (
          destGeo &&
          !r.countryCode &&
          typeof r.lat === "number" &&
          typeof r.lng === "number" &&
          haversineKm(destGeo.lat, destGeo.lng, r.lat, r.lng) > 150
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
      limitCheck.commit().catch(() => {});
      return new Response(JSON.stringify({ approved: false, issues: issues.slice(0, 12) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enrichedPlan = rebuildPlanText(planText, blocks);
    console.log(`Plan approved: ${uniqueNames.length} venues all verified`);
    limitCheck.commit().catch(() => {});
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