/**
 * Booking link URL builders.
 *
 * Requirement 22.5 — the app generates outbound links to Skyscanner
 * (parameterized with origin, destination, and departure date) for flight
 * searches, and to Booking.com (parameterized with destination/location)
 * for hotel searches. Both builders produce clean, properly encoded URLs
 * and degrade gracefully when inputs are missing or empty.
 */

const SKYSCANNER_BASE = "https://www.skyscanner.com";
const BOOKING_BASE = "https://www.booking.com";

/** Coerce nullable string input to a trimmed string. */
const normalize = (value: string | undefined | null): string =>
  typeof value === "string" ? value.trim() : "";

/** Encode a single URL path segment (safe for airport codes, dates, city names). */
const encodeSegment = (value: string): string => encodeURIComponent(value);

export interface SkyscannerParams {
  /** Origin — typically a 3-letter IATA code, but free text is tolerated. */
  from: string;
  /** Destination — IATA code or city name. */
  to: string;
  /** Departure date — any string; consumer is responsible for format. */
  date: string;
  /** Optional return date — when present, builds a round-trip deep link. */
  returnDate?: string;
}

/**
 * Build a clean Skyscanner deep link for a flight search.
 *
 * Format:
 *   One-way:    `https://www.skyscanner.com/transport/flights/{from}/{to}/{date}/`
 *   Round-trip: `https://www.skyscanner.com/transport/flights/{from}/{to}/{date}/{returnDate}/`
 *
 * - Whitespace is trimmed from each segment.
 * - Segments are URL-encoded to keep the link valid when values contain
 *   spaces or non-ASCII characters.
 * - When either origin or destination is missing, returns the generic
 *   Skyscanner flights landing page instead of a broken URL.
 * - When only the date is missing, returns a partial deep link without a
 *   trailing date segment so Skyscanner still resolves the route.
 * - `returnDate` is only appended when `date` is also present; a lone
 *   return date is silently dropped since Skyscanner's route requires the
 *   outbound leg first.
 */
export const buildSkyscannerUrl = ({
  from,
  to,
  date,
  returnDate,
}: SkyscannerParams): string => {
  const f = normalize(from);
  const t = normalize(to);
  const d = normalize(date);
  const r = normalize(returnDate);

  if (!f || !t) return `${SKYSCANNER_BASE}/flights`;

  const segments = [encodeSegment(f), encodeSegment(t)];
  if (d) {
    segments.push(encodeSegment(d));
    if (r) segments.push(encodeSegment(r));
  }
  return `${SKYSCANNER_BASE}/transport/flights/${segments.join("/")}/`;
};

export interface BookingUrlParams {
  /** Destination (city, region, hotel name, or free-text search). */
  destination: string;
  /** Optional check-in date (passed through as-is, typically YYYY-MM-DD). */
  checkIn?: string;
  /** Optional check-out date (passed through as-is, typically YYYY-MM-DD). */
  checkOut?: string;
}

/**
 * Build a clean Booking.com search URL from a destination string.
 *
 * Format: `https://www.booking.com/searchresults.html?ss={destination}[&checkin=...&checkout=...]`
 *
 * - `destination` is placed in the `ss` (search string) query parameter,
 *   which Booking.com's fuzzy matcher uses to resolve cities and hotels.
 * - Query values are encoded via `URLSearchParams`, so spaces, commas, and
 *   unicode are safe.
 * - When `destination` is empty/whitespace, returns the search results
 *   landing page.
 * - Check-in / check-out are optional; they are appended only when present.
 */
export const buildBookingUrl = ({
  destination,
  checkIn,
  checkOut,
}: BookingUrlParams): string => {
  const dest = normalize(destination);

  const params = new URLSearchParams();
  if (dest) params.set("ss", dest);

  const ci = normalize(checkIn);
  const co = normalize(checkOut);
  if (ci) params.set("checkin", ci);
  if (co) params.set("checkout", co);

  const qs = params.toString();
  return qs
    ? `${BOOKING_BASE}/searchresults.html?${qs}`
    : `${BOOKING_BASE}/searchresults.html`;
};

export interface BookingHotelParams {
  /** Hotel name. */
  name: string;
  /** Hotel location (city, region, or full address). */
  location: string;
  /** Optional check-in date (passed through as-is, typically YYYY-MM-DD). */
  checkIn?: string;
  /** Optional check-out date (passed through as-is, typically YYYY-MM-DD). */
  checkOut?: string;
}

/**
 * Build a Booking.com search URL from a hotel name + location pair.
 *
 * Convenience wrapper around {@link buildBookingUrl} for call sites that
 * have the hotel name and location as separate fields; they are joined
 * with a single space into the `ss` search string.
 */
export const buildBookingHotelUrl = ({
  name,
  location,
  checkIn,
  checkOut,
}: BookingHotelParams): string => {
  const parts = [normalize(name), normalize(location)].filter(Boolean);
  return buildBookingUrl({
    destination: parts.join(" "),
    checkIn,
    checkOut,
  });
};

/**
 * @deprecated Use `buildSkyscannerUrl({ from, to, date })` instead.
 * Retained for existing call sites during migration (task 11.5).
 */
export const getSkyscannerUrl = (from: string, to: string, date: string): string =>
  buildSkyscannerUrl({ from, to, date });

/**
 * @deprecated Use `buildBookingHotelUrl({ name, location })` instead.
 * Retained for existing call sites during migration (task 11.6).
 */
export const getBookingDotComUrl = (hotelName: string, location: string): string =>
  buildBookingHotelUrl({ name: hotelName, location });
