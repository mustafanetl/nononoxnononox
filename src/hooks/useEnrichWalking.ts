/**
 * useEnrichWalking — Fetches real walking times between itinerary slots via OSRM.
 *
 * Called after a trip plan is displayed. Progressively replaces AI-estimated
 * walking times with real OSRM-calculated durations.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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

export interface WalkingSlot {
  venue: string;
  lat: number;
  lng: number;
}

export interface UseEnrichWalkingParams {
  slots: WalkingSlot[];
  hotel?: { lat: number; lng: number } | null;
  enabled?: boolean;
}

export function useEnrichWalking({
  slots,
  hotel = null,
  enabled = true,
}: UseEnrichWalkingParams) {
  const [data, setData] = useState<WalkingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to access latest values without causing callback recreation
  const slotsRef = useRef(slots);
  const hotelRef = useRef(hotel);
  slotsRef.current = slots;
  hotelRef.current = hotel;

  const fetchWalking = useCallback(async () => {
    const currentSlots = slotsRef.current;
    const currentHotel = hotelRef.current;
    if (!currentSlots || currentSlots.length < 2) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-walking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ slots: currentSlots, hotel: currentHotel }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Walking enrichment failed: ${res.status} ${errText}`);
      }

      const result: WalkingResult = await res.json();
      setData(result);
    } catch (e) {
      console.warn("[useEnrichWalking]", e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && slots && slots.length >= 2) {
      fetchWalking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, slots.length]);

  /**
   * Get the walking time between two specific venues from the result.
   * Returns null if not found or data hasn't loaded yet.
   */
  const getWalkingTime = useCallback(
    (fromVenue: string, toVenue: string): WalkingSegment | null => {
      if (!data) return null;
      return (
        data.segments.find(
          (s) =>
            s.from.toLowerCase() === fromVenue.toLowerCase() &&
            s.to.toLowerCase() === toVenue.toLowerCase(),
        ) || null
      );
    },
    [data],
  );

  return { data, loading, error, refetch: fetchWalking, getWalkingTime };
}
