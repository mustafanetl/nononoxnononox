import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WikiImage {
  title: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  license: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 6 } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Searching Wikimedia images for: ${query}`);

    // Search Wikimedia Commons for images
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=800&format=json&origin=*`;

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Jolliday-TravelApp/1.0 (travel planning app)" },
    });

    if (!res.ok) {
      console.error("Wikimedia API error:", res.status);
      return new Response(JSON.stringify({ images: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const pages = data.query?.pages || {};

    const images: WikiImage[] = Object.values(pages)
      .filter((page: any) => page.imageinfo && page.imageinfo.length > 0)
      .map((page: any) => {
        const info = page.imageinfo[0];
        const ext = info.extmetadata || {};
        return {
          title: page.title?.replace("File:", "") || "",
          url: info.url || "",
          thumbUrl: info.thumburl || info.url || "",
          width: info.width || 0,
          height: info.height || 0,
          license: ext.LicenseShortName?.value || "CC",
        };
      })
      // Filter out SVGs, icons, and tiny images
      .filter((img: WikiImage) => {
        const isPhoto = !img.url.endsWith(".svg") && !img.url.endsWith(".gif");
        const isBigEnough = img.width >= 400 && img.height >= 300;
        return isPhoto && isBigEnough;
      });

    console.log(`Found ${images.length} images for: ${query}`);

    return new Response(JSON.stringify({ images, query }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Wikimedia search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", images: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
