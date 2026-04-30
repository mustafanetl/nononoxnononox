import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { activity, destination, excludeNames } = body;
    if (!activity?.name || !destination) {
      return new Response(JSON.stringify({ error: "activity and destination are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel expert. Respond with ONLY valid JSON, no prose, no code fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    let content: string = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let suggestions: any[] = [];
    try { suggestions = JSON.parse(content); } catch {
      const m = content.match(/\[[\s\S]*\]/);
      if (m) { try { suggestions = JSON.parse(m[0]); } catch { suggestions = []; } }
    }
    if (!Array.isArray(suggestions)) suggestions = [];
    suggestions = suggestions.slice(0, 3);

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
      // Filter out ones with no photo (so the user always sees pics)
      const withPhotos = enriched.filter((e) => e.realPhoto);
      return new Response(JSON.stringify({ suggestions: withPhotos.length > 0 ? withPhotos : enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
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