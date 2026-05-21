/**
 * useEnrichPricing — Fetches real flight + hotel prices from Travelpayouts.
 *
 * Called after a trip plan is displayed. Progressively replaces AI-estimated
 * prices with real data from the enrich-pricing edge function.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface EnrichedFlightData {
  price: number;
  airline: string;
  departure_at: string;
  return_at: string;
  transfers: number;
  booking_url: string;
  source: "travelpayouts";
  price_type: "from";
}

export interface EnrichedHotelData {
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

export interface PricingResult {
  flights: {
    outbound: EnrichedFlightData | null;
    return: EnrichedFlightData | null;
    fallback_url: string;
  };
  hotels: EnrichedHotelData[];
  hotels_fallback_url?: string;
  total_estimate: {
    flights_total: number | null;
    hotel_total: number | null;
    nights: number;
    currency: string;
    group_size: number;
  } | null;
}

export interface UseEnrichPricingParams {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize?: number;
  budget?: "budget" | "mid" | "luxury";
  currency?: string;
  enabled?: boolean;
}

export function useEnrichPricing({
  origin,
  destination,
  startDate,
  endDate,
  groupSize = 2,
  budget = "mid",
  currency = "EUR",
  enabled = true,
}: UseEnrichPricingParams) {
  const [data, setData] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to access latest values without recreating the callback
  const paramsRef = useRef({ origin, destination, startDate, endDate, groupSize, budget, currency });
  paramsRef.current = { origin, destination, startDate, endDate, groupSize, budget, currency };

  const fetchPricing = useCallback(async () => {
    const p = paramsRef.current;
    if (!p.origin || !p.destination || !p.startDate || !p.endDate) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          origin: p.origin,
          destination: p.destination,
          startDate: p.startDate,
          endDate: p.endDate,
          groupSize: p.groupSize,
          budget: p.budget,
          currency: p.currency,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Pricing enrichment failed: ${res.status} ${errText}`);
      }

      const result: PricingResult = await res.json();
      setData(result);
    } catch (e) {
      console.warn("[useEnrichPricing]", e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && origin && destination && startDate && endDate) {
      fetchPricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, origin, destination, startDate, endDate]);

  return { data, loading, error, refetch: fetchPricing };
}
