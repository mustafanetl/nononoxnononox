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

interface GeoResult {
  lat: number;
  lng: number;
  countryCode: string;
  displayName: string;
}

async function geocode(destination: string): Promise<GeoResult | null> {
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en&addressdetails=1`,
      { headers: { "User-Agent": "Jolliday-TravelApp/1.0" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const place = data[0];
    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      countryCode: place.address?.country_code?.toUpperCase() || "",
      displayName: place.display_name,
    };
  } catch (e) {
    console.error("Geocoding error:", e);
    return null;
  }
}

async function getWeather(lat: number, lng: number): Promise<any> {
  try {
    const res = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`
    );
    return await res.json();
  } catch (e) {
    console.error("Weather error:", e);
    return null;
  }
}

async function getCountryInfo(countryCode: string): Promise<any> {
  if (!countryCode) return null;
  try {
    const res = await fetchWithTimeout(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,currencies,languages,timezones,capital`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (e) {
    console.error("Country info error:", e);
    return null;
  }
}

async function getExchangeRate(currencyCode: string): Promise<any> {
  if (!currencyCode || currencyCode === "USD") return { base: "USD", rate: 1 };
  try {
    const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { base: "USD", rate: data.rates?.[currencyCode] || null, currency: currencyCode };
  } catch (e) {
    console.error("Exchange rate error:", e);
    return null;
  }
}

async function getGooglePlacePhotos(destination: string, limit = 6): Promise<any[]> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set, skipping place photos");
    return [];
  }
  try {
    // Text Search to find the destination place
    const searchRes = await fetchWithTimeout(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos,places.displayName",
        },
        body: JSON.stringify({ textQuery: destination, maxResultCount: 1 }),
      }
    );
    if (!searchRes.ok) {
      console.error("Google Places search error:", await searchRes.text());
      return [];
    }
    const searchData = await searchRes.json();
    const place = searchData.places?.[0];
    if (!place?.photos?.length) return [];

    // Get photo URLs (up to limit)
    const photos = place.photos.slice(0, limit);
    return photos.map((photo: any) => ({
      url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`,
      thumbUrl: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${apiKey}`,
      width: photo.widthPx || 800,
      height: photo.heightPx || 600,
      attributions: photo.authorAttributions || [],
    }));
  } catch (e) {
    console.error("Google Places photos error:", e);
    return [];
  }
}

async function searchXoteloHotels(destination: string, limit = 6): Promise<any[]> {
  try {
    // Step 1: Search for location key
    const searchRes = await fetchWithTimeout(
      `https://data.xotelo.com/api/search?query=${encodeURIComponent(destination)}&location_type=geo`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const locationKey = searchData?.result?.location_key;
    if (!locationKey) return [];

    // Step 2: Get hotel list for this location
    const listRes = await fetchWithTimeout(
      `https://data.xotelo.com/api/list?location_key=${locationKey}&limit=${limit}&sort=best_value`
    );
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const hotels = listData?.result?.hotels || listData?.result || [];

    return (Array.isArray(hotels) ? hotels : []).slice(0, limit).map((h: any, idx: number) => ({
      id: `xotelo-${h.hotel_key || idx}`,
      name: h.name || "Hotel",
      stars: h.hotel_class || h.stars || 3,
      pricePerNight: h.price?.avg || h.price?.min || 0,
      currency: "$",
      image: "default",
      location: h.address || destination,
      description: h.subcategory || h.type || "Hotel accommodation",
      realImage: h.photo || h.image || null,
      priceRange: h.price ? { min: h.price.min || 0, max: h.price.max || 0 } : null,
      rating: h.rating || h.overall_rating || null,
      isLive: true,
      hotelKey: h.hotel_key || null,
      lat: h.latitude || null,
      lng: h.longitude || null,
    }));
  } catch (e) {
    console.error("Xotelo hotel search error:", e);
    return [];
  }
}

async function getGoogleNearbyPlaces(lat: number, lng: number, limit = 8): Promise<any[]> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set, skipping nearby places");
    return [];
  }
  try {
    const res = await fetchWithTimeout(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.location,places.primaryType,places.editorialSummary",
        },
        body: JSON.stringify({
          includedTypes: ["tourist_attraction", "museum", "restaurant", "park", "cafe"],
          maxResultCount: limit,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: 10000.0 },
          },
          rankPreference: "POPULARITY",
        }),
      }
    );
    if (!res.ok) {
      console.error("Google Nearby Search error:", await res.text());
      return [];
    }
    const data = await res.json();
    const places = data.places || [];

    return places.map((p: any) => {
      const photoRef = p.photos?.[0]?.name;
      return {
        title: p.displayName?.text || "Unknown",
        description: p.editorialSummary?.text || p.formattedAddress || "",
        lat: p.location?.latitude || lat,
        lng: p.location?.longitude || lng,
        thumbnail: photoRef
          ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`
          : null,
        rating: p.rating || null,
        userRatingsTotal: p.userRatingCount || 0,
        priceLevel: p.priceLevel || null,
        type: p.primaryType || "point_of_interest",
        distance: null,
      };
    });
  } catch (e) {
    console.error("Google nearby places error:", e);
    return [];
  }
}

function weatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 65) return "Rainy";
  if (code <= 67) return "Freezing rain";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, travelMonth } = await req.json();

    if (!destination || typeof destination !== "string") {
      return new Response(JSON.stringify({ error: "destination is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching destination: ${destination}`);

    // Step 1: Geocode
    const geo = await geocode(destination);
    if (!geo) {
      return new Response(JSON.stringify({ error: "Could not find destination", destination }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: All APIs in parallel (including country → exchange rate in two phases)
    const [weatherData, countryData, googleImages, googlePlaces, xoteloHotels] = await Promise.all([
      getWeather(geo.lat, geo.lng),
      geo.countryCode ? getCountryInfo(geo.countryCode) : null,
      getGooglePlacePhotos(destination),
      getGoogleNearbyPlaces(geo.lat, geo.lng),
      searchXoteloHotels(destination),
    ]);

    // Extract currency and fetch exchange rate in parallel with nothing blocking
    let currencyCode = "";
    let currencyName = "";
    if (countryData?.currencies) {
      const codes = Object.keys(countryData.currencies);
      if (codes.length > 0) {
        currencyCode = codes[0];
        currencyName = countryData.currencies[codes[0]]?.name || codes[0];
      }
    }

    const exchangeData = currencyCode ? await getExchangeRate(currencyCode) : null;

    // Build weather summary
    let weatherSummary = null;
    if (weatherData?.daily) {
      const daily = weatherData.daily;
      const temps_max = daily.temperature_2m_max || [];
      const temps_min = daily.temperature_2m_min || [];
      const precip = daily.precipitation_sum || [];
      const codes = daily.weathercode || [];

      const avgHigh = temps_max.length > 0 ? Math.round(temps_max.reduce((a: number, b: number) => a + b, 0) / temps_max.length) : null;
      const avgLow = temps_min.length > 0 ? Math.round(temps_min.reduce((a: number, b: number) => a + b, 0) / temps_min.length) : null;
      const totalPrecip = precip.reduce((a: number, b: number) => a + b, 0);
      const dominantCode = codes.length > 0 ? codes[Math.floor(codes.length / 2)] : 0;

      weatherSummary = {
        destination,
        tempHigh: avgHigh,
        tempLow: avgLow,
        conditions: weatherCodeToCondition(dominantCode),
        rainfall: totalPrecip < 1 ? "Minimal" : totalPrecip < 10 ? "Light" : totalPrecip < 30 ? "Moderate" : "Heavy",
        forecast: daily.time?.map((date: string, i: number) => ({
          date,
          high: temps_max[i],
          low: temps_min[i],
          precipitation: precip[i],
          condition: weatherCodeToCondition(codes[i] || 0),
        })) || [],
        isLive: true,
      };
    }

    // Build country info
    let countryInfo = null;
    if (countryData) {
      const languages = countryData.languages
        ? Object.values(countryData.languages).join(", ")
        : "Unknown";

      countryInfo = {
        destination,
        currency: currencyCode ? `${currencyCode} (${currencyName})` : "Unknown",
        language: languages,
        timezone: countryData.timezones?.[0] || "Unknown",
        exchangeRate: exchangeData?.rate
          ? `1 USD ≈ ${exchangeData.rate} ${currencyCode}`
          : null,
        isLive: true,
      };
    }

    const result = {
      destination,
      geo: { lat: geo.lat, lng: geo.lng, countryCode: geo.countryCode },
      weather: weatherSummary,
      country: countryInfo,
      exchange: exchangeData,
      images: googleImages,
      places: googlePlaces,
      hotels: xoteloHotels,
    };

    console.log(`Enrichment complete for ${destination}: ${googleImages.length} images, ${googlePlaces.length} places, ${xoteloHotels.length} hotels`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Enrich error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
