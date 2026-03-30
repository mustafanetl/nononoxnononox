import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrichRequest {
  destination: string;
  travelMonth?: string;
}

interface GeoResult {
  lat: number;
  lng: number;
  countryCode: string;
  displayName: string;
}

async function geocode(destination: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en`,
      { headers: { "User-Agent": "Jolliday-TravelApp/1.0" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const place = data[0];
    // Extract country code from display_name or use address
    const countryCode = place.address?.country_code?.toUpperCase() || "";
    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      countryCode,
      displayName: place.display_name,
    };
  } catch (e) {
    console.error("Geocoding error:", e);
    return null;
  }
}

async function getWeather(lat: number, lng: number): Promise<any> {
  try {
    const res = await fetch(
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
    // Try by country code first, fall back to name
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,currencies,languages,timezones,capital`);
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
    const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { base: "USD", rate: data.rates?.[currencyCode] || null, currency: currencyCode };
  } catch (e) {
    console.error("Exchange rate error:", e);
    return null;
  }
}

// Map WMO weather codes to human-readable conditions
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
    const { destination, travelMonth } = (await req.json()) as EnrichRequest;

    if (!destination) {
      return new Response(JSON.stringify({ error: "destination is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching destination: ${destination}`);

    // Step 1: Geocode (needed for weather)
    const geo = await geocode(destination);
    if (!geo) {
      return new Response(JSON.stringify({ error: "Could not find destination", destination }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Call remaining APIs in parallel
    const [weatherData, countryData] = await Promise.all([
      getWeather(geo.lat, geo.lng),
      geo.countryCode ? getCountryInfo(geo.countryCode) : null,
    ]);

    // Extract currency code from country data
    let currencyCode = "";
    let currencyName = "";
    if (countryData?.currencies) {
      const codes = Object.keys(countryData.currencies);
      if (codes.length > 0) {
        currencyCode = codes[0];
        currencyName = countryData.currencies[codes[0]]?.name || codes[0];
      }
    }

    // Step 3: Get exchange rate (depends on country data)
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
      const timezone = countryData.timezones?.[0] || "Unknown";

      countryInfo = {
        destination,
        currency: currencyCode ? `${currencyCode} (${currencyName})` : "Unknown",
        language: languages,
        timezone,
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
    };

    console.log(`Enrichment complete for ${destination}`);

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
