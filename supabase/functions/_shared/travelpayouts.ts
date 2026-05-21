/**
 * Travelpayouts API client — flights + hotels.
 * Used by enrich-pricing to fetch real pricing data.
 */

const FLIGHTS_CHEAP_URL = "https://api.travelpayouts.com/v1/prices/cheap";
const HOTELS_LOOKUP_URL = "https://engine.hotellook.com/api/v2/lookup.json";
const HOTELS_CACHE_URL = "https://engine.hotellook.com/api/v2/cache.json";

const FETCH_TIMEOUT = 10000; // 10s timeout per API call

function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export interface FlightResult {
  price: number;
  airline: string;
  departure_at: string;
  return_at: string;
  transfers: number;
  booking_url: string;
  source: "travelpayouts";
  price_type: "from";
}

export interface HotelResult {
  name: string;
  price_per_night: number;
  stars: number;
  rating: number | null;
  location: { lat: number; lng: number } | null;
  neighborhood: string | null;
  booking_url: string;
  photo_url: string | null;
  source: "travelpayouts";
}

/**
 * Fetch cheapest flight prices from Travelpayouts.
 * Returns prices found in last 48h (cached/indicative, not real-time).
 */
export async function searchFlights(params: {
  origin: string; // IATA code
  destination: string; // IATA code
  departDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  token: string;
  marker?: string;
  currency?: string;
}): Promise<{ outbound: FlightResult | null; return: FlightResult | null }> {
  const { origin, destination, departDate, returnDate, token, marker, currency = "EUR" } = params;

  // Travelpayouts /v1/prices/cheap uses YYYY-MM for dates
  const departMonth = departDate.slice(0, 7); // YYYY-MM
  const returnMonth = returnDate.slice(0, 7);

  const url = `${FLIGHTS_CHEAP_URL}?origin=${origin}&destination=${destination}&depart_date=${departMonth}&return_date=${returnMonth}&currency=${currency.toLowerCase()}&token=${token}`;

  console.log(`[travelpayouts] flights: ${origin} → ${destination}, ${departMonth}/${returnMonth}`);

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[travelpayouts] flights ${res.status}: ${await res.text()}`);
      return { outbound: null, return: null };
    }

    const data = await res.json();
    if (!data.success || !data.data?.[destination]) {
      console.log("[travelpayouts] no flight data found");
      return { outbound: null, return: null };
    }

    // data.data[destination] is keyed by transfer count: { "0": {...}, "1": {...} }
    const routes = data.data[destination];
    // Pick cheapest (prefer direct, then 1 stop)
    const cheapest = routes["0"] || routes["1"] || routes["2"] || Object.values(routes)[0];

    if (!cheapest) {
      return { outbound: null, return: null };
    }

    const bookingUrl = marker
      ? `https://www.aviasales.com/search/${origin}${departDate.slice(8, 10)}${departDate.slice(5, 7)}${destination}${returnDate.slice(8, 10)}${returnDate.slice(5, 7)}1?marker=${marker}`
      : `https://www.aviasales.com/search/${origin}${departDate.slice(8, 10)}${departDate.slice(5, 7)}${destination}${returnDate.slice(8, 10)}${returnDate.slice(5, 7)}1`;

    const outbound: FlightResult = {
      price: cheapest.price,
      airline: cheapest.airline || "Unknown",
      departure_at: cheapest.departure_at || departDate,
      return_at: cheapest.return_at || returnDate,
      transfers: typeof cheapest.transfers === "number" ? cheapest.transfers : (routes["0"] ? 0 : 1),
      booking_url: bookingUrl,
      source: "travelpayouts",
      price_type: "from",
    };

    // Travelpayouts returns round-trip price in one entry; split for display
    return { outbound, return: null };
  } catch (e) {
    console.error("[travelpayouts] flights error:", e);
    return { outbound: null, return: null };
  }
}

/**
 * Search for hotels in a city with real pricing from Travelpayouts/Hotellook.
 */
export async function searchHotels(params: {
  city: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  currency?: string;
  budget?: "budget" | "mid" | "luxury";
  limit?: number;
  marker?: string;
  adults?: number;
}): Promise<HotelResult[]> {
  const {
    city,
    checkIn,
    checkOut,
    currency = "eur",
    budget = "mid",
    limit = 5,
    marker,
    adults = 2,
  } = params;

  console.log(`[travelpayouts] hotels: ${city}, ${checkIn}→${checkOut}, budget=${budget}`);

  try {
    // Step 1: Get cached hotel prices for the city
    const cacheUrl = `${HOTELS_CACHE_URL}?location=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&currency=${currency}&limit=30`;

    const res = await fetchWithTimeout(cacheUrl);
    if (!res.ok) {
      console.warn(`[travelpayouts] hotels cache ${res.status}`);
      return [];
    }

    const hotels: any[] = await res.json();
    if (!Array.isArray(hotels) || hotels.length === 0) {
      console.log("[travelpayouts] no hotel data found");
      return [];
    }

    // Step 2: Sort/filter by budget tier
    let sorted: any[];
    switch (budget) {
      case "budget":
        sorted = hotels.sort((a, b) => (a.priceFrom || 9999) - (b.priceFrom || 9999));
        break;
      case "luxury":
        sorted = hotels
          .filter((h) => h.stars >= 4)
          .sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.rating || 0) - (a.rating || 0));
        break;
      case "mid":
      default:
        // Middle tier: 3-4 stars, moderate price
        sorted = hotels
          .filter((h) => h.stars >= 3)
          .sort((a, b) => (a.priceFrom || 9999) - (b.priceFrom || 9999));
        // Skip the cheapest 20% to avoid hostels masquerading as hotels
        const skipCount = Math.floor(sorted.length * 0.2);
        sorted = sorted.slice(skipCount);
        break;
    }

    // Step 3: Map to result format
    const results: HotelResult[] = sorted.slice(0, limit).map((h) => {
      const bookingBase = `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
      const bookingUrl = marker ? `${bookingBase}&marker=${marker}` : bookingBase;

      const photoUrl = h.hotelId
        ? `https://photo.hotellook.com/image_v2/crop/h${h.hotelId}_1/320/240.auto`
        : null;

      return {
        name: h.hotelName || h.hotel || "Hotel",
        price_per_night: h.priceFrom || h.priceAvg || 0,
        stars: h.stars || 0,
        rating: h.rating || null,
        location: h.location ? { lat: h.location.lat, lng: h.location.lon || h.location.lng } : null,
        neighborhood: h.locationName || null,
        booking_url: bookingUrl,
        photo_url: photoUrl,
        source: "travelpayouts" as const,
      };
    });

    return results;
  } catch (e) {
    console.error("[travelpayouts] hotels error:", e);
    return [];
  }
}

/**
 * Build a Booking.com fallback deeplink.
 */
export function buildBookingFallbackLink(
  city: string,
  checkIn: string,
  checkOut: string,
  adults = 2,
  affiliateId?: string,
): string {
  const base = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1`;
  return affiliateId ? `${base}&aid=${affiliateId}` : base;
}
