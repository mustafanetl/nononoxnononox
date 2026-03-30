import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WikiPlace {
  title: string;
  description: string;
  lat: number;
  lng: number;
  thumbnail: string | null;
  pageId: number;
  distance: number;
}

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "User-Agent": "Jolliday-TravelApp/1.0" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, lat, lng, radius = 10000, limit = 10 } = await req.json();

    let coordLat = lat;
    let coordLng = lng;

    // If no coords provided, geocode the destination
    if ((!coordLat || !coordLng) && destination) {
      const geo = await geocodeCity(destination);
      if (!geo) {
        return new Response(JSON.stringify({ places: [], error: "Could not geocode destination" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      coordLat = geo.lat;
      coordLng = geo.lng;
    }

    if (!coordLat || !coordLng) {
      return new Response(JSON.stringify({ error: "lat/lng or destination required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Searching Wikipedia places near ${coordLat},${coordLng} (${destination || "unknown"})`);

    // Step 1: Geosearch for nearby articles
    const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${coordLat}|${coordLng}&gsradius=${radius}&gslimit=${limit}&format=json&origin=*`;
    const geoRes = await fetch(geoUrl, {
      headers: { "User-Agent": "Jolliday-TravelApp/1.0" },
    });
    const geoData = await geoRes.json();
    const geoResults = geoData.query?.geosearch || [];

    if (geoResults.length === 0) {
      return new Response(JSON.stringify({ places: [], destination }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Get extracts + thumbnails for found pages
    const pageIds = geoResults.map((r: any) => r.pageid).join("|");
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts|pageimages&exintro=1&explaintext=1&exsentences=2&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;
    const detailRes = await fetch(detailUrl, {
      headers: { "User-Agent": "Jolliday-TravelApp/1.0" },
    });
    const detailData = await detailRes.json();
    const pages = detailData.query?.pages || {};

    const places: WikiPlace[] = geoResults.map((geo: any) => {
      const page = pages[geo.pageid] || {};
      return {
        title: geo.title,
        description: page.extract?.substring(0, 200) || "",
        lat: geo.lat,
        lng: geo.lon,
        thumbnail: page.thumbnail?.source || null,
        pageId: geo.pageid,
        distance: geo.dist,
      };
    });

    console.log(`Found ${places.length} places near ${destination || `${coordLat},${coordLng}`}`);

    return new Response(JSON.stringify({ places, destination, center: { lat: coordLat, lng: coordLng } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Wikipedia places error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", places: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
