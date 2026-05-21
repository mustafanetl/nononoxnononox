/**
 * useTripEnrichment — Orchestrates all post-plan enrichment calls.
 *
 * After a trip plan is generated and displayed, this hook coordinates:
 * 1. enrich-pricing → real flight + hotel prices
 * 2. enrich-walking → real walking times between slots
 * 3. enrich-booking-links → affiliate deeplinks for activities
 *
 * Results are returned as progressive enhancement data that the trip detail
 * page can merge into its display without blocking the initial render.
 */

import { useState, useEffect, useRef } from "react";
import type { PricingResult } from "./useEnrichPricing";
import type { WalkingResult, WalkingSlot } from "./useEnrichWalking";
import type { BookingLink } from "./useEnrichBookingLinks";

export interface TripEnrichmentParams {
  /** City the traveler departs from */
  origin: string;
  /** Destination city */
  destination: string;
  /** Trip start date YYYY-MM-DD */
  startDate: string;
  /** Trip end date YYYY-MM-DD */
  endDate: string;
  /** Number of travelers */
  groupSize?: number;
  /** Budget tier */
  budget?: "budget" | "mid" | "luxury";
  /** Currency code */
  currency?: string;
  /** Itinerary slots with coordinates (for walking) */
  daySlots: Array<{
    day: number;
    slots: WalkingSlot[];
  }>;
  /** Hotel coordinates (for walking to/from first/last) */
  hotel?: { lat: number; lng: number } | null;
  /** Activities with names + city (for booking links) */
  activities: Array<{ name: string; city: string; category?: string }>;
  /** Whether enrichment should run */
  enabled?: boolean;
}

export interface TripEnrichmentResult {
  pricing: PricingResult | null;
  walking: Record<number, WalkingResult>; // keyed by day number
  bookingLinks: BookingLink[];
  loading: {
    pricing: boolean;
    walking: boolean;
    bookingLinks: boolean;
  };
  errors: {
    pricing: string | null;
    walking: string | null;
    bookingLinks: string | null;
  };
  /** Whether any enrichment data has loaded */
  hasData: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Main orchestration hook for trip enrichment.
 * Calls all three enrichment endpoints in parallel after the plan loads.
 */
export function useTripEnrichment(params: TripEnrichmentParams): TripEnrichmentResult {
  const {
    origin,
    destination,
    startDate,
    endDate,
    groupSize = 2,
    budget = "mid",
    currency = "EUR",
    daySlots,
    hotel,
    activities,
    enabled = true,
  } = params;

  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [walking, setWalking] = useState<Record<number, WalkingResult>>({});
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [loadingWalking, setLoadingWalking] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [errorPricing, setErrorPricing] = useState<string | null>(null);
  const [errorWalking, setErrorWalking] = useState<string | null>(null);
  const [errorLinks, setErrorLinks] = useState<string | null>(null);

  // Track whether we've already fetched for each enrichment type
  const pricingFetchedRef = useRef<string>("");
  const walkingFetchedRef = useRef<string>("");
  const linksFetchedRef = useRef<string>("");

  // 1. Pricing enrichment — depends on origin/destination/dates
  useEffect(() => {
    if (!enabled || !origin || !destination || !startDate || !endDate) return;
    const fingerprint = `${origin}:${destination}:${startDate}:${endDate}:${groupSize}:${budget}:${currency}`;
    if (pricingFetchedRef.current === fingerprint) return;
    pricingFetchedRef.current = fingerprint;

    setLoadingPricing(true);
    fetch(`${SUPABASE_URL}/functions/v1/enrich-pricing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ origin, destination, startDate, endDate, groupSize, budget, currency }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(`${res.status}`)))
      .then((data) => setPricing(data))
      .catch((e) => setErrorPricing(String(e)))
      .finally(() => setLoadingPricing(false));
  }, [enabled, origin, destination, startDate, endDate, groupSize, budget, currency]);

  // 2. Walking enrichment — depends on resolved slot coordinates
  useEffect(() => {
    if (!enabled) return;
    const totalSlots = daySlots.reduce((sum, d) => sum + d.slots.length, 0);
    if (totalSlots < 2) return; // need at least 2 points for walking
    const fingerprint = `walk:${totalSlots}:${destination}`;
    if (walkingFetchedRef.current === fingerprint) return;
    walkingFetchedRef.current = fingerprint;

    setLoadingWalking(true);
    const walkingPromises = daySlots
      .filter((d) => d.slots.length >= 2)
      .map((dayData) =>
        fetch(`${SUPABASE_URL}/functions/v1/enrich-walking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ slots: dayData.slots, hotel }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((result) => (result ? { day: dayData.day, result } : null))
          .catch(() => null),
      );

    Promise.all(walkingPromises)
      .then((results) => {
        const map: Record<number, WalkingResult> = {};
        for (const r of results) {
          if (r) map[r.day] = r.result;
        }
        setWalking(map);
      })
      .catch((e) => setErrorWalking(String(e)))
      .finally(() => setLoadingWalking(false));
  }, [enabled, daySlots, hotel, destination]);

  // 3. Booking links enrichment — depends on activity list
  useEffect(() => {
    if (!enabled || activities.length === 0) return;
    const fingerprint = `links:${activities.length}:${destination}`;
    if (linksFetchedRef.current === fingerprint) return;
    linksFetchedRef.current = fingerprint;

    setLoadingLinks(true);
    fetch(`${SUPABASE_URL}/functions/v1/enrich-booking-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ activities }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(`${res.status}`)))
      .then((data) => setBookingLinks(data.links || []))
      .catch((e) => setErrorLinks(String(e)))
      .finally(() => setLoadingLinks(false));
  }, [enabled, activities, destination]);

  return {
    pricing,
    walking,
    bookingLinks,
    loading: {
      pricing: loadingPricing,
      walking: loadingWalking,
      bookingLinks: loadingLinks,
    },
    errors: {
      pricing: errorPricing,
      walking: errorWalking,
      bookingLinks: errorLinks,
    },
    hasData: !!(pricing || Object.keys(walking).length > 0 || bookingLinks.length > 0),
  };
}
