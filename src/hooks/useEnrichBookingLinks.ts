/**
 * useEnrichBookingLinks — Fetches affiliate deeplinks for activities.
 *
 * Calls the enrich-booking-links edge function to build Viator
 * affiliate links for each activity in the plan.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface BookingLink {
  activity: string;
  booking_url: string;
  provider: "viator";
  secondary_url?: string;
  secondary_provider?: "viator";
}

export interface UseEnrichBookingLinksParams {
  activities: Array<{ name: string; city: string; category?: string }>;
  enabled?: boolean;
}

export function useEnrichBookingLinks({
  activities,
  enabled = true,
}: UseEnrichBookingLinksParams) {
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to access latest activities without causing callback recreation
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;

  const fetchLinks = useCallback(async () => {
    const currentActivities = activitiesRef.current;
    if (!currentActivities || currentActivities.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-booking-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ activities: currentActivities }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Booking links enrichment failed: ${res.status} ${errText}`);
      }

      const result = await res.json();
      setLinks(result.links || []);
    } catch (e) {
      console.warn("[useEnrichBookingLinks]", e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && activities && activities.length > 0) {
      fetchLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activities.length]);

  /**
   * Get booking link for a specific activity name.
   */
  const getLinkForActivity = useCallback(
    (activityName: string): BookingLink | null => {
      return (
        links.find(
          (l) => l.activity.toLowerCase() === activityName.toLowerCase(),
        ) || null
      );
    },
    [links],
  );

  return { links, loading, error, refetch: fetchLinks, getLinkForActivity };
}
