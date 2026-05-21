/**
 * OSRM (Open Source Routing Machine) client — walking time calculations.
 * Uses the public OSRM demo server for pedestrian routing.
 */

const OSRM_BASE = "https://router.project-osrm.org";
const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export interface WalkingSegment {
  from: string;
  to: string;
  walking_minutes: number;
  distance_m: number;
  suggestion: "walk" | "transit";
}

export interface WalkingResult {
  segments: WalkingSegment[];
  hotel_to_first: { walking_minutes: number; distance_m: number; suggestion: "walk" | "transit" } | null;
  last_to_hotel: { walking_minutes: number; distance_m: number; suggestion: "walk" | "transit" } | null;
  total_walking_km: number;
  transit_needed: string[];
}

// Threshold: if walking > 25 min, suggest transit
const TRANSIT_THRESHOLD_MINUTES = 25;

/**
 * Calculate walking times between consecutive slots using OSRM table endpoint.
 * Batches all coordinates in a single API call for efficiency.
 *
 * @param slots Array of { venue, lat, lng } in order of visit
 * @param hotel Optional hotel coordinates to include as start/end
 */
export async function calculateWalkingTimes(
  slots: Array<{ venue: string; lat: number; lng: number }>,
  hotel?: { lat: number; lng: number } | null,
): Promise<WalkingResult> {
  if (slots.length < 2 && !hotel) {
    return { segments: [], hotel_to_first: null, last_to_hotel: null, total_walking_km: 0, transit_needed: [] };
  }

  // Build coordinate list: [hotel?, slot0, slot1, ..., slotN]
  const coords: Array<{ lat: number; lng: number; label: string }> = [];
  const hotelIndex = hotel ? 0 : -1;

  if (hotel) {
    coords.push({ lat: hotel.lat, lng: hotel.lng, label: "hotel" });
  }
  for (const slot of slots) {
    coords.push({ lat: slot.lat, lng: slot.lng, label: slot.venue });
  }

  if (coords.length < 2) {
    return { segments: [], hotel_to_first: null, last_to_hotel: null, total_walking_km: 0, transit_needed: [] };
  }

  // OSRM expects lng,lat (not lat,lng!)
  const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${OSRM_BASE}/table/v1/foot/${coordString}?annotations=duration,distance`;

  console.log(`[osrm] table request: ${coords.length} points`);

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[osrm] table ${res.status}: ${await res.text()}`);
      return fallbackEstimate(slots, hotel);
    }

    const data = await res.json();
    if (data.code !== "Ok" || !data.durations || !data.distances) {
      console.warn("[osrm] table response not Ok:", data.code);
      return fallbackEstimate(slots, hotel);
    }

    const durations: number[][] = data.durations; // seconds
    const distances: number[][] = data.distances; // meters

    const segments: WalkingSegment[] = [];
    const transitNeeded: string[] = [];
    let totalDistanceM = 0;

    // Consecutive slot pairs
    const slotStartIndex = hotel ? 1 : 0;
    for (let i = slotStartIndex; i < coords.length - 1; i++) {
      const nextI = i + 1;
      const durationSec = durations[i][nextI];
      const distanceM = distances[i][nextI];
      const walkingMin = Math.round(durationSec / 60);
      const suggestion: "walk" | "transit" = walkingMin > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk";

      // Only add segment if both are actual venues (not hotel)
      if (i >= slotStartIndex && nextI > slotStartIndex - 1) {
        const fromLabel = coords[i].label;
        const toLabel = coords[nextI].label;
        if (fromLabel !== "hotel" && toLabel !== "hotel") {
          segments.push({
            from: fromLabel,
            to: toLabel,
            walking_minutes: walkingMin,
            distance_m: Math.round(distanceM),
            suggestion,
          });
          totalDistanceM += distanceM;
          if (suggestion === "transit") {
            transitNeeded.push(`${fromLabel} → ${toLabel}`);
          }
        }
      }
    }

    // Hotel to first slot
    let hotelToFirst: WalkingResult["hotel_to_first"] = null;
    if (hotel && coords.length > 1) {
      const dSec = durations[0][1];
      const dM = distances[0][1];
      const min = Math.round(dSec / 60);
      hotelToFirst = {
        walking_minutes: min,
        distance_m: Math.round(dM),
        suggestion: min > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk",
      };
      totalDistanceM += dM;
    }

    // Last slot to hotel
    let lastToHotel: WalkingResult["last_to_hotel"] = null;
    if (hotel && coords.length > 1) {
      const lastIdx = coords.length - 1;
      const dSec = durations[lastIdx][0];
      const dM = distances[lastIdx][0];
      const min = Math.round(dSec / 60);
      lastToHotel = {
        walking_minutes: min,
        distance_m: Math.round(dM),
        suggestion: min > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk",
      };
      totalDistanceM += dM;
    }

    return {
      segments,
      hotel_to_first: hotelToFirst,
      last_to_hotel: lastToHotel,
      total_walking_km: Math.round((totalDistanceM / 1000) * 10) / 10,
      transit_needed: transitNeeded,
    };
  } catch (e) {
    console.error("[osrm] error:", e);
    return fallbackEstimate(slots, hotel);
  }
}

/**
 * Haversine distance between two points (meters).
 */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fallback: estimate walking time from straight-line distance.
 * Assumes ~1.3x multiplier for city walking and 5 km/h speed.
 */
function fallbackEstimate(
  slots: Array<{ venue: string; lat: number; lng: number }>,
  hotel?: { lat: number; lng: number } | null,
): WalkingResult {
  const WALK_SPEED_MS = 5000 / 3600; // 5 km/h in m/s
  const DETOUR_FACTOR = 1.3;

  const segments: WalkingSegment[] = [];
  const transitNeeded: string[] = [];
  let totalDistanceM = 0;

  for (let i = 0; i < slots.length - 1; i++) {
    const dist = haversineM(slots[i].lat, slots[i].lng, slots[i + 1].lat, slots[i + 1].lng) * DETOUR_FACTOR;
    const walkingMin = Math.round(dist / WALK_SPEED_MS / 60);
    const suggestion: "walk" | "transit" = walkingMin > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk";
    segments.push({
      from: slots[i].venue,
      to: slots[i + 1].venue,
      walking_minutes: walkingMin,
      distance_m: Math.round(dist),
      suggestion,
    });
    totalDistanceM += dist;
    if (suggestion === "transit") transitNeeded.push(`${slots[i].venue} → ${slots[i + 1].venue}`);
  }

  let hotelToFirst: WalkingResult["hotel_to_first"] = null;
  let lastToHotel: WalkingResult["last_to_hotel"] = null;

  if (hotel && slots.length > 0) {
    const d1 = haversineM(hotel.lat, hotel.lng, slots[0].lat, slots[0].lng) * DETOUR_FACTOR;
    const min1 = Math.round(d1 / WALK_SPEED_MS / 60);
    hotelToFirst = { walking_minutes: min1, distance_m: Math.round(d1), suggestion: min1 > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk" };
    totalDistanceM += d1;

    const dLast = haversineM(slots[slots.length - 1].lat, slots[slots.length - 1].lng, hotel.lat, hotel.lng) * DETOUR_FACTOR;
    const minLast = Math.round(dLast / WALK_SPEED_MS / 60);
    lastToHotel = { walking_minutes: minLast, distance_m: Math.round(dLast), suggestion: minLast > TRANSIT_THRESHOLD_MINUTES ? "transit" : "walk" };
    totalDistanceM += dLast;
  }

  return {
    segments,
    hotel_to_first: hotelToFirst,
    last_to_hotel: lastToHotel,
    total_walking_km: Math.round((totalDistanceM / 1000) * 10) / 10,
    transit_needed: transitNeeded,
  };
}
