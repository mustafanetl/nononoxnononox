import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceRateLimit,
  rateLimitResponse,
  resolveAuth,
} from "../_shared/auth.ts";
import { callChat, type ChatMessage } from "../_shared/aiProvider.ts";

const TIMEOUT_MS = 8000;
function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function googlePlacesLookup(name: string, destination: string, apiKey: string) {
  try {
    const res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.photos,places.rating,places.formattedAddress,places.location",
      },
      body: JSON.stringify({ textQuery: `${name}, ${destination}`, maxResultCount: 3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const place = (data.places || []).find((p: any) => p.photos?.length > 0) || (data.places || [])[0];
    if (!place) return null;
    const photoRef = place.photos?.[0]?.name;
    const photos = (place.photos || []).slice(0, 4).map((p: any) =>
      `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${apiKey}`
    );
    return {
      matchedName: place.displayName?.text || name,
      address: place.formattedAddress || null,
      rating: place.rating || null,
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      photo: photoRef ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1600&key=${apiKey}` : null,
      photos,
      verified: !!photoRef,
    };
  } catch (e) {
    console.error("Places lookup failed for", name, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth + rate-limit (swap feature gets the same daily bucket as chat).
    const ctx = await resolveAuth(req);
    const limitCheck = await enforceRateLimit(ctx, "suggest-activity-alternatives");
    if (!limitCheck.ok) {
      return rateLimitResponse(limitCheck.limit);
    }

    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { activity, destination, excludeNames } = body;
    if (!activity?.name || !destination) {
      return new Response(JSON.stringify({ error: "activity and destination are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const AI_KEY = OPENROUTER_API_KEY || GROQ_API_KEY || GEMINI_API_KEY;
    if (!AI_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const exclusions = [activity.name, ...(Array.isArray(excludeNames) ? excludeNames : [])].filter(Boolean);

    const prompt = `User is in ${destination} and wants alternatives to this place:
- Name: ${activity.name}
- Category: ${activity.category}
- Vibe: ${activity.description || activity.why || ""}
- Neighborhood: ${activity.neighborhood || "anywhere in the city"}

Suggest exactly 3 REAL, well-known alternative venues in ${destination} that fit the same category and vibe but are DIFFERENT places.
Do NOT suggest any of these (already used): ${exclusions.join(", ")}.

Respond with ONLY a JSON array, no prose, no markdown fences:
[
  {"name":"Real Venue Name","category":"${activity.category}","duration":"~2 hours","price":40,"currency":"$","neighborhood":"District","hours":"lunch–late","bookAhead":false,"why":"One opinionated sentence why this beats the original.","description":"Short 1-2 sentence vibe description."},
  ...
]

Rules: only famous, easy-to-verify venues. Realistic prices. Same currency as original (${activity.currency || "$"}).`;

    // Single AI path through the shared provider wrapper.
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a travel expert. Respond with ONLY valid JSON, no prose, no code fences." },
      { role: "user", content: prompt },
    ];
    const result = await callChat(messages, AI_KEY, 2048);
    if (result.error) {
      console.error("AI error:", result.status, result.error);
      return new Response(
        JSON.stringify({ error: "AI request failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    let content = result.text;
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let suggestions: any[] = [];
    try { suggestions = JSON.parse(content); } catch {
      const m = content.match(/\[[\s\S]*\]/);
      if (m) { try { suggestions = JSON.parse(m[0]); } catch { suggestions = []; } }
    }
    if (!Array.isArray(suggestions)) suggestions = [];

    // Hard filter: drop anything that matches an excluded name (normalized).
    const norm = (s: string) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const excludeSet = new Set(exclusions.map(norm).filter(Boolean));
    const isExcluded = (name: string) => {
      const n = norm(name);
      if (!n) return false;
      if (excludeSet.has(n)) return true;
      for (const ex of excludeSet) {
        if (ex.length >= 4 && (n.includes(ex) || ex.includes(n))) return true;
      }
      return false;
    };
    suggestions = suggestions.filter((s: any) => s?.name && !isExcluded(s.name)).slice(0, 6);

    // Enrich each with Google Places (photo + coords)
    if (GOOGLE_KEY) {
      const enriched = await Promise.all(suggestions.map(async (s) => {
        const lookup = await googlePlacesLookup(s.name, destination, GOOGLE_KEY);
        return {
          id: crypto.randomUUID(),
          name: lookup?.matchedName || s.name,
          category: s.category || activity.category,
          duration: s.duration || "~2 hours",
          price: typeof s.price === "number" ? s.price : 30,
          currency: s.currency || activity.currency || "$",
          image: activity.image || "food",
          occasion: activity.occasion || "",
          description: s.description || "",
          neighborhood: s.neighborhood || activity.neighborhood || "",
          hours: s.hours || "check hours",
          bookAhead: !!s.bookAhead,
          why: s.why || "",
          lat: lookup?.lat ?? undefined,
          lng: lookup?.lng ?? undefined,
          realPhoto: lookup?.photo || undefined,
          realPhotos: lookup?.photos || [],
          verified: !!lookup?.verified,
          verifiedAddress: lookup?.address || null,
          verifiedRating: lookup?.rating || null,
        };
      }));
      // Filter again post-enrichment (Google may resolve to the matched/excluded venue),
      // then prefer ones with photos.
      const cleaned = enriched.filter((e) => !isExcluded(e.name));
      const withPhotos = cleaned.filter((e) => e.realPhoto);
      const out = (withPhotos.length > 0 ? withPhotos : cleaned).slice(0, 3);
      limitCheck.commit().catch(() => {});
      return new Response(JSON.stringify({ suggestions: out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    limitCheck.commit().catch(() => {});
    return new Response(JSON.stringify({ suggestions: suggestions.slice(0, 3) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-activity-alternatives error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});