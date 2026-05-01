import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Plane, Hotel, Sparkles,
  MapPin, Clock, ExternalLink, Star, Bookmark, Ticket, ArrowRight, Camera, Link2, LogIn,
  Footprints, Compass, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import FlightDetailModal from "@/components/FlightDetailModal";
import HotelDetailModal from "@/components/HotelDetailModal";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import PhotoLightbox from "@/components/PhotoLightbox";
import TripMap, { type MapPoint } from "@/components/TripMap";
import { HotelData } from "@/contexts/TripContext";
import { FlightData } from "@/components/FlightCard";
import { ActivityData } from "@/components/ActivityCard";
import { TripPlanData } from "@/components/TripSummaryCard";
import { shareTripSummary } from "@/utils/tripSummary";
import { setWikimediaImage } from "@/utils/cityImages";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";
import { exportTripPlanPDF } from "@/utils/pdfExport";
import { createDistinctPhotoGallery } from "@/utils/photoGallery";
import { getSkyscannerUrl, getBookingDotComUrl } from "@/utils/bookingLinks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { detectLang, extractTripLangSample, getTripStrings, type TripStrings } from "@/utils/tripI18n";

/* ═══════════════════════════════════════════
   Editorial-style trip view
   ═══════════════════════════════════════════ */
type VenuePhotoMatch = {
  photo: string | null;
  thumbPhoto: string | null;
  photos: string[];
  rating: number | null;
  address: string | null;
  verified: boolean;
  matchedName: string | null;
  hasRealPhoto?: boolean;
  lat?: number | null;
  lng?: number | null;
};

const VENUE_STOP = new Set(["the", "a", "an", "of", "and", "in", "at", "on", "to", "for", "by", "de", "la", "le", "el", "il", "du", "des"]);
const venueTokens = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !VENUE_STOP.has(t));

const scoreVenueMatch = (query: string, candidate: string) => {
  const q = venueTokens(query);
  const c = venueTokens(candidate);
  if (q.length === 0 || c.length === 0) return 0;
  const cset = new Set(c);
  const shared = q.filter((t) => cset.has(t));
  if (shared.length === 0) return 0;
  const significant = shared.some((t) => t.length >= 4);
  const ratio = shared.length / Math.max(q.length, c.length);
  if (!significant && ratio < 0.6) return 0;
  return ratio + (significant ? 0.5 : 0);
};

const resolveVenuePhotoMatch = (
  venue: string,
  collection?: Record<string, VenuePhotoMatch>
): VenuePhotoMatch | null => {
  if (!venue || !collection) return null;
  const normalizedVenue = venue.toLowerCase().trim();

  if (collection[venue]) return collection[venue];

  for (const [key, value] of Object.entries(collection)) {
    const normalizedKey = key.toLowerCase().trim();
    const normalizedMatched = value?.matchedName?.toLowerCase().trim();
    if (normalizedKey === normalizedVenue || normalizedMatched === normalizedVenue) return value;
    if (normalizedKey.includes(normalizedVenue) || normalizedVenue.includes(normalizedKey)) return value;
    if (normalizedMatched && (normalizedMatched.includes(normalizedVenue) || normalizedVenue.includes(normalizedMatched))) return value;
  }

  let best: VenuePhotoMatch | null = null;
  let bestScore = 0;
  for (const [key, value] of Object.entries(collection)) {
    const candidates = [key, value?.matchedName].filter(Boolean) as string[];
    for (const candidate of candidates) {
      const score = scoreVenueMatch(venue, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = value;
      }
    }
  }

  return bestScore >= 0.9 ? best : null;
};

type TripDetailMode = "owner" | "shared";

interface TripDetailProps {
  mode?: TripDetailMode;
  /** When in "shared" mode, the slug of the shared trip (used for the Import flow). */
  shareSlug?: string;
  /** Pre-loaded snapshot for shared mode — bypasses sessionStorage. */
  initialSnapshot?: { data: TripPlanData; destination: string; enrichedImages?: any[]; itineraryVenuePhotos?: Record<string, VenuePhotoMatch> } | null;
}

const TripDetail: React.FC<TripDetailProps> = ({ mode = "owner", shareSlug, initialSnapshot = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isShared = mode === "shared";
  const [tripData, setTripData] = useState<{
    data: TripPlanData;
    destination: string;
    enrichedImages?: any[];
    itineraryVenuePhotos?: Record<string, VenuePhotoMatch>;
  } | null>(initialSnapshot);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  // Tracks WHERE the open activity came from, so Swap can replace the right item.
  // - { kind: "activity", activityId } → replace in data.activities
  // - { kind: "slot", dayNum, slotIdx } → replace in data.itinerary[day].slots[slot]
  const [activitySource, setActivitySource] = useState<
    | { kind: "activity"; activityId: string }
    | { kind: "slot"; dayNum: number; slotIdx: number }
    | null
  >(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVenue, setLightboxVenue] = useState<string>("");
  const [lightboxOnDetails, setLightboxOnDetails] = useState<(() => void) | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [importing, setImporting] = useState(false);
  // Show a slim sticky action bar on desktop after the user scrolls past the hero.
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isShared) {
      // Shared mode: snapshot is provided by parent route.
      if (initialSnapshot) setTripData(initialSnapshot);
      return;
    }
    const raw = sessionStorage.getItem("jolliday-trip-detail");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setTripData(parsed);
        if (parsed.enrichedImages?.length > 0 && parsed.destination) {
          setWikimediaImage(parsed.destination, parsed.enrichedImages[0].thumbUrl || parsed.enrichedImages[0].url);
        }
      } catch { navigate("/chat"); }
    } else { navigate("/chat"); }
  }, [navigate, isShared, initialSnapshot]);

  // Re-enrich on mount: pulls real Google Places photos for activities,
  // hotels, and the destination hero — even if the user navigated here
  // before the chat page finished its own enrichment, or if the trip was
  // reopened from "My Trips" without cached photos.
  useEffect(() => {
    if (!tripData) return;
    const { data, destination } = tripData;
    if (!destination) return;

    const itineraryVenues = data.itinerary.flatMap((day: any) =>
      Array.isArray(day?.slots) ? day.slots.map((slot: any) => slot?.venue).filter(Boolean) : []
    );
    const needsActivityPhotos = data.activities.some(
      (a: any) => !a.realPhoto || !Array.isArray(a.realPhotos) || a.realPhotos.length === 0
    );
    const needsHotelPhotos = data.hotels.some((h: any) => !h.realImage);
    const needsHeroImages = !tripData.enrichedImages || tripData.enrichedImages.length === 0;
    const needsItineraryVenuePhotos = itineraryVenues.some(
      (venue) => !resolveVenuePhotoMatch(venue, tripData.itineraryVenuePhotos)
    );
    if (!needsActivityPhotos && !needsHotelPhotos && !needsHeroImages && !needsItineraryVenuePhotos) return;

    let cancelled = false;
    (async () => {
      try {
        const activityNames = Array.from(new Set([
          ...data.activities.map((a: any) => a.name).filter(Boolean),
          ...itineraryVenues,
        ]));
        const hotelNamesList = data.hotels.map((h: any) => h.name).filter(Boolean);
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-destination`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              destination,
              activities: activityNames,
              hotelNames: hotelNamesList,
            }),
          }
        );
        if (!res.ok) return;
        const enrich = await res.json();
        if (cancelled) return;

        const activityPhotos = (enrich.activityPhotos || {}) as Record<string, VenuePhotoMatch>;
        const hotelPhotos = enrich.hotelPhotos || {};
        const images = enrich.images || [];

        const newActivities = data.activities.map((a: any) => {
          const m = resolveVenuePhotoMatch(a.name, activityPhotos);
          const next: any = { ...a };
          if (m?.hasRealPhoto && (m.thumbPhoto || m.photo)) {
            // Always prefer full-size photo for hero usage; thumb only as last-resort fallback
            if (!next.realPhoto) next.realPhoto = m.photo || m.thumbPhoto;
            next.verified = true;
          }
          // Keep up to 4 real place photos; never mix in unrelated destination images.
          next.realPhotos = createDistinctPhotoGallery({
            primary: next.realPhoto,
            sources: [m?.photos, next.realPhotos],
            limit: 4,
          });
          if (!next.realPhoto && next.realPhotos.length > 0) {
            next.realPhoto = next.realPhotos[0];
          }
          return next;
        });
        const newHotels = data.hotels.map((h: any) => {
          if (h.realImage) return h;
          const m = hotelPhotos[h.name];
          if (m?.hasRealPhoto && (m.thumbPhoto || m.photo)) {
            return { ...h, realImage: m.photo || m.thumbPhoto, verified: true };
          }
          if (images.length > 0) {
            const idx = data.hotels.indexOf(h) % images.length;
            return { ...h, realImage: images[idx].url || images[idx].thumbUrl };
          }
          return h;
        });

        const merged = {
          ...tripData,
          data: { ...data, activities: newActivities, hotels: newHotels },
          enrichedImages: tripData.enrichedImages?.length ? tripData.enrichedImages : images,
          itineraryVenuePhotos: {
            ...(tripData.itineraryVenuePhotos || {}),
            ...activityPhotos,
          },
        };
        setTripData(merged);
        sessionStorage.setItem("jolliday-trip-detail", JSON.stringify(merged));
        if (images.length > 0) setWikimediaImage(destination, images[0].url || images[0].thumbUrl);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData?.destination]);

  // Hook must be called unconditionally — call before any early return.
  const stockHeroImg = useCityHeroImage(tripData?.destination || "");

  if (!tripData) return null;
  const { data, destination } = tripData;

  // Detect the language the user planned this trip in (from AI-generated text/itinerary)
  // and pull the localized UI string bundle. Falls back to English when uncertain.
  const tripLang = detectLang(extractTripLangSample(data));
  const t = getTripStrings(tripLang);

  // Prefer the first landscape image so the hero banner doesn't get a portrait/macro shot.
  const enrichedImgs = tripData.enrichedImages || [];
  const heroPick =
    enrichedImgs.find((i: any) => (i?.width || 0) >= (i?.height || 0) * 1.2) ||
    enrichedImgs[0];
  const heroImg = heroPick?.url || heroPick?.thumbUrl;
  const secondaryImg =
    enrichedImgs.find((i: any) => i && i !== heroPick)?.url ||
    enrichedImgs.find((i: any) => i && i !== heroPick)?.thumbUrl;

  // Hero photo: prefer a curated stock photo (instant), fall back to
  // Wikipedia's lead image (always actually the right city), and only then
  // to a Google Places photo.
  const heroImgFinal = stockHeroImg || heroImg;

  const days = data.itinerary.length || 1;
  const flightsCost = data.flights.reduce((s, f) => s + f.price, 0);
  const hotelsCost = data.hotels.reduce((s, h) => s + h.pricePerNight * days, 0);
  const activitiesCost = data.activities.reduce((s, a) => s + a.price, 0);
  const totalBudget = flightsCost + hotelsCost + activitiesCost;
  const currency = data.flights[0]?.currency || data.hotels[0]?.currency || data.activities[0]?.currency || "$";

  // pick a photo for each day from venues actually scheduled on that day
  const photoForDay = (dayNum: number): string | undefined => {
    const day = data.itinerary.find((d: any) => d.day === dayNum);
    const slots: any[] = day?.slots || [];

    // 1) Try each slot venue in order — look up its verified Google Places photo
    for (const slot of slots) {
      const m = resolveVenuePhotoMatch(slot?.venue, tripData.itineraryVenuePhotos);
      const p = m?.photo || m?.thumbPhoto;
      if (p) return p;
      const matched = matchActivity(slot?.venue);
      if (matched?.realPhoto) return matched.realPhoto;
    }

    // 2) Fallback to a generic destination hero image (NOT another day's activity)
    const fallback = tripData.enrichedImages?.[(dayNum - 1) % Math.max(tripData.enrichedImages?.length || 1, 1)];
    return fallback?.url || fallback?.thumbUrl;
  };

  // Match a slot venue name to an activity (token-overlap, case-insensitive)
  const matchActivity = (venue: string): any | null => {
    if (!venue) return null;
    let best: any = null;
    let bestScore = 0;
    for (const a of data.activities as any[]) {
      const score = scoreVenueMatch(venue, a.name);
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return bestScore >= 0.9 ? best : null;
  };

  // Resolve a slot to a renderable ActivityData (matched activity OR synthetic).
  // Used by both the day-by-day timeline AND the map-marker click.
  const resolveSlotActivity = (
    slot: any,
    dayNum: number,
    slotIdx: number
  ): { activity: ActivityData; matched: any | null; reels: string[] } => {
    const matched = matchActivity(slot?.venue);
    const slotPhotoMatch = resolveVenuePhotoMatch(slot?.venue, tripData!.itineraryVenuePhotos);
    const heroPhoto: string | undefined =
      slotPhotoMatch?.photo || slotPhotoMatch?.thumbPhoto || matched?.realPhoto;
    const reels = createDistinctPhotoGallery({
      primary: heroPhoto,
      sources: [slotPhotoMatch?.photos, matched?.realPhotos],
      limit: 4,
    });
    if (matched) {
      return { activity: matched, matched, reels };
    }
    const synthetic: ActivityData = {
      id: `${dayNum}-${slotIdx}-${slot?.venue || "stop"}`,
      name: slot?.venue || "Stop",
      category: "sightseeing",
      duration: slot?.duration || "",
      price: slot?.cost || 0,
      currency,
      image: heroPhoto || "",
      occasion: "",
      description: slot?.activity || `A highlighted stop in your ${destination} plan.`,
      neighborhood: slotPhotoMatch?.address || slot?.neighborhood,
      bookAhead: slot?.bookAhead,
      realPhoto: heroPhoto,
      realPhotos: reels,
      verified: !!slotPhotoMatch?.verified,
      verifiedAddress: slotPhotoMatch?.address || slot?.neighborhood,
      verifiedRating: slotPhotoMatch?.rating || null,
    } as ActivityData;
    return { activity: synthetic, matched: null, reels };
  };

  const openSlotModal = (dayNum: number, slotIdx: number) => {
    const day = data.itinerary.find((d: any) => d.day === dayNum);
    const slot = day?.slots?.[slotIdx];
    if (!slot) return;
    const { activity } = resolveSlotActivity(slot, dayNum, slotIdx);
    setSelectedActivity(activity);
    setActivitySource({ kind: "slot", dayNum, slotIdx });
    setActivityModalOpen(true);
  };

  // Coordinates for a slot, sourced from the matched activity card.
  const slotCoords = (slot: any): { lat: number; lng: number } | null => {
    // Prefer Google Places coords from the venue-photo enrichment
    const pm = resolveVenuePhotoMatch(slot?.venue, tripData?.itineraryVenuePhotos);
    if (pm && typeof pm.lat === "number" && typeof pm.lng === "number") {
      return { lat: pm.lat, lng: pm.lng };
    }
    // Fallback to a matched activity card
    const m = matchActivity(slot?.venue);
    if (m && typeof m.lat === "number" && typeof m.lng === "number") {
      return { lat: m.lat, lng: m.lng };
    }
    return null;
  };

  // Build map pins from the actual itinerary slots (the source of truth the user sees).
  // Declared AFTER matchActivity / slotCoords so we don't TDZ.
  const slotPins: MapPoint[] = [];
  for (const day of data.itinerary as any[]) {
    const slots = day?.slots || [];
    let order = 0;
    slots.forEach((slot: any, slotIdx: number) => {
      const coords = slotCoords(slot);
      if (!coords) return;
      order += 1;
      const matched = matchActivity(slot?.venue);
      const slotPhotoMatch = resolveVenuePhotoMatch(slot?.venue, tripData.itineraryVenuePhotos);
      const photo =
        slotPhotoMatch?.thumbPhoto ||
        slotPhotoMatch?.photo ||
        matched?.realPhoto;
      slotPins.push({
        name: slot.venue,
        lat: coords.lat,
        lng: coords.lng,
        type: "activity",
        day: day.day,
        order,
        slotIdx,
        photo,
      });
    });
  }
  if (slotPins.length === 0) {
    data.activities
      .filter((a: any) => typeof a.lat === "number" && typeof a.lng === "number")
      .forEach((a: any, i: number) => {
        slotPins.push({
          name: a.name,
          lat: a.lat,
          lng: a.lng,
          type: "activity",
          order: i + 1,
          photo: a.realPhoto || (Array.isArray(a.realPhotos) ? a.realPhotos[0] : undefined),
        });
      });
  }
  const hotelPins: MapPoint[] = data.hotels
    .map((h: any) => {
      // Resolve coords: hotel object first, then Places photo-match
      let lat: number | null = typeof h.lat === "number" ? h.lat : null;
      let lng: number | null = typeof h.lng === "number" ? h.lng : null;
      if (lat == null || lng == null) {
        const pm = resolveVenuePhotoMatch(h.name, tripData?.itineraryVenuePhotos);
        if (pm && typeof pm.lat === "number" && typeof pm.lng === "number") {
          lat = pm.lat;
          lng = pm.lng;
        }
      }
      if (lat == null || lng == null) return null;
      const photo =
        (typeof h.realPhoto === "string" && h.realPhoto) ||
        (Array.isArray(h.realPhotos) && h.realPhotos.find((p: any) => typeof p === "string" && p)) ||
        (typeof h.image === "string" && h.image) ||
        (typeof h.thumbPhoto === "string" && h.thumbPhoto) ||
        undefined;
      return {
        name: h.name,
        lat,
        lng,
        type: "hotel" as const,
        photo: photo || undefined,
      } as MapPoint;
    })
    .filter((x: MapPoint | null): x is MapPoint => x !== null);
  const mapPoints: MapPoint[] = [...slotPins, ...hotelPins];

  const handleShare = async () => {
    // Shared-mode: copy the current public URL.
    if (isShared) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      } catch { toast.error("Couldn't copy link"); }
      return;
    }
    if (!user) {
      toast.error("Sign in to create a shareable link");
      navigate("/auth");
      return;
    }
    setSharing(true);
    try {
      // Generate a short, URL-safe slug.
      const slug = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
        .join("");
      const snapshot = {
        data: tripData!.data,
        destination: tripData!.destination,
        enrichedImages: tripData!.enrichedImages || [],
        itineraryVenuePhotos: tripData!.itineraryVenuePhotos || {},
      };
      const { error } = await supabase.from("shared_trips").insert({
        slug,
        owner_user_id: user.id,
        title: `Trip to ${destination}`,
        destination,
        data_json: snapshot as any,
      });
      if (error) throw error;
      const url = `${window.location.origin}/p/${slug}`;
      try { await navigator.clipboard.writeText(url); } catch {}
      if ((navigator as any).share) {
        try { await (navigator as any).share({ title: `Trip to ${destination}`, url }); } catch {}
      }
      toast.success("Share link copied!", { description: url });
    } catch (e) {
      toast.error("Couldn't create share link");
    } finally {
      setSharing(false);
    }
  };

  const handleImport = async () => {
    if (!user) {
      // Stash intent and redirect to auth.
      try { sessionStorage.setItem("jolliday-pending-import-slug", shareSlug || ""); } catch {}
      toast.message("Create an account to import this trip");
      navigate(`/auth?next=${encodeURIComponent(window.location.pathname + "?import=1")}`);
      return;
    }
    setImporting(true);
    try {
      const { error } = await supabase.from("saved_trips").insert({
        user_id: user.id,
        title: `Trip to ${destination}`,
        destination,
        data_json: tripData!.data as any,
        status: "planning",
      });
      if (error) throw error;
      // Hand off to owner-mode trip view.
      sessionStorage.setItem("jolliday-trip-detail", JSON.stringify({
        data: tripData!.data,
        destination: tripData!.destination,
        enrichedImages: tripData!.enrichedImages || [],
        itineraryVenuePhotos: tripData!.itineraryVenuePhotos || {},
      }));
      toast.success("Trip imported to your account!");
      navigate("/trip/view");
    } catch {
      toast.error("Couldn't import trip");
    } finally {
      setImporting(false);
    }
  };

  const handleExportPDF = () => {
    exportTripPlanPDF({ data, destination });
    toast.success("PDF downloaded!");
  };

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save trips"); navigate("/auth"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_trips").insert({
        user_id: user.id, title: `Trip to ${destination}`, destination,
        data_json: data as any, status: "planning",
      });
      if (error) throw error;
      toast.success("Trip saved!");
    } catch { toast.error("Couldn't save trip"); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-12">
      {isShared && (
        <div className="sticky top-0 z-50 bg-foreground text-background px-4 py-2.5 text-sm flex items-center justify-between gap-3">
          <span className="truncate">
            <span className="font-semibold">{t.sharedTrip}</span>
            <span className="opacity-70 hidden sm:inline"> · {t.sharedTripSubtitle}</span>
          </span>
          <Button size="sm" variant="secondary" onClick={handleImport} disabled={importing}
            className="h-7 gap-1.5 shrink-0">
            <LogIn className="h-3.5 w-3.5" /> {importing ? t.importing : t.importTrip}
          </Button>
        </div>
      )}
      {/* Desktop sticky action bar — appears after user scrolls past hero */}
      <div
        className={`hidden sm:block sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border transition-all duration-200 ${
          showStickyBar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(isShared ? "/" : "/chat")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold tracking-tight text-foreground truncate">{destination}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isShared && (
              <>
                <Button size="sm" variant="default" onClick={handleSave} disabled={saving} className="h-8 gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" /> {saving ? t.saving : t.saveTrip}
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPDF} className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" /> {t.downloadPdf}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleShare} disabled={sharing} className="h-8 gap-1.5">
              {isShared ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {isShared ? t.copyLink : sharing ? t.sharing : t.shareTrip}
            </Button>
            {isShared && (
              <Button size="sm" onClick={handleImport} disabled={importing} className="h-8 gap-1.5">
                <LogIn className="h-3.5 w-3.5" /> {importing ? "..." : t.importTrip}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* ── Cinematic Hero ── */}
      <div className="relative h-[62vh] min-h-[460px] max-h-[680px] overflow-hidden">
        {heroImgFinal ? (
          <img src={heroImgFinal} alt={destination}
            className="w-full h-full object-cover animate-ken-burns" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-accent/30 flex items-center justify-center">
            <MapPin className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-background" />
        <div className="absolute inset-0 noise-overlay" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 sm:px-8 pt-4 flex items-center justify-between z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate(isShared ? "/" : "/chat")}
            className="rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            {!isShared && (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}
                  className="gap-1.5 bg-white text-black hover:bg-white/90">
                  <Bookmark className="h-3.5 w-3.5" /> {saving ? t.saving : t.saveTrip}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportPDF}
                  className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
                  <Download className="h-3.5 w-3.5" /> {t.downloadPdf}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare} disabled={sharing}
              className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
              {isShared ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {isShared ? t.copyLink : sharing ? t.sharing : t.shareTrip}
            </Button>
            {isShared && (
              <Button size="sm" onClick={handleImport} disabled={importing}
                className="gap-1.5 bg-white text-black hover:bg-white/90">
                <LogIn className="h-3.5 w-3.5" /> {importing ? t.importing : t.importTrip}
              </Button>
            )}
          </div>
        </div>

        {/* Hero title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-10 pb-12">
          <div className="max-w-5xl mx-auto">
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-white/85 mb-4 animate-hero-rise inline-flex items-center gap-2"
              style={{ animationDelay: "0.05s" }}
            >
              <Compass className="h-3.5 w-3.5" /> {t.yourJolliday}
            </p>
            <h1
              className="text-5xl sm:text-7xl lg:text-[88px] font-bold text-white tracking-tight leading-[0.95] drop-shadow-2xl animate-hero-rise"
              style={{ animationDelay: "0.18s" }}
            >
              {destination}
            </h1>
            <p
              className="mt-5 max-w-xl text-white/85 text-base sm:text-lg leading-relaxed animate-hero-rise"
              style={{ animationDelay: "0.32s" }}
            >
              {t.daysSubtitle(days)}
            </p>
          </div>
        </div>
        {/* Scroll cue */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-[10px] tracking-[0.3em] uppercase animate-hero-rise hidden sm:block"
             style={{ animationDelay: "0.5s" }}>
          {t.scroll}
        </div>
      </div>

      {/* ── At-a-glance stats ── */}
      <Reveal>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-12 sm:-mt-16 relative z-10 mb-14 sm:mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatTile label={t.days} value={data.itinerary.length || days} icon={<CalendarDays className="h-3.5 w-3.5" />} />
            <StatTile label={t.stops} value={
              data.itinerary.reduce((s: number, d: any) => s + (Array.isArray(d?.slots) ? d.slots.length : 0), 0)
              || data.activities.length
            } icon={<MapPin className="h-3.5 w-3.5" />} />
            <StatTile label={t.stays} value={data.hotels.length} icon={<Hotel className="h-3.5 w-3.5" />} />
            <StatTile label={t.from} value={totalBudget > 0 ? `${currency}${totalBudget.toLocaleString()}` : "—"} icon={<Sparkles className="h-3.5 w-3.5" />} />
          </div>
        </div>
      </Reveal>

      {/* ── Map + intro quote ── */}
      {mapPoints.length > 0 && (
        <Reveal>
          <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-16">
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-stretch">
              <div className="relative rounded-3xl overflow-hidden border border-border">
                <TripMap
                  points={mapPoints}
                  onMarkerClick={({ name, type, day, slotIdx }) => {
                    if (type === "hotel") {
                      const hotel = data.hotels.find((h: any) => h.name === name) || data.hotels[0];
                      if (hotel) { setSelectedHotel(hotel); setHotelModalOpen(true); }
                      return;
                    }
                    if (day != null && typeof slotIdx === "number") { openSlotModal(day, slotIdx); return; }
                    const activity = data.activities.find((a: any) => a.name === name);
                    if (activity) {
                      setSelectedActivity(activity);
                      setActivitySource({ kind: "activity", activityId: activity.id });
                      setActivityModalOpen(true);
                    }
                  }}
                />
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{t.theStory}</p>
                  <p className="text-lg sm:text-xl font-semibold text-foreground leading-snug tracking-tight">
                    {data.text?.split("\n").find(l => l.trim().length > 30)?.slice(0, 220)
                      || t.storyFallback(days, destination)}
                  </p>
                </div>
                <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> {t.tapPin}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Logistics: Flights + Hotels side-by-side ── */}
      {(data.flights.length > 0 || data.hotels.length > 0) && (
        <Reveal>
          <Section eyebrow={t.logistics} title={t.logisticsTitle} maxWidth="max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-6">
              {data.flights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <Plane className="h-3.5 w-3.5" /> {t.flights}
                  </div>
                  <div className="space-y-3">
                    {data.flights.map((f, i) => (
                      <FlightRow key={f.id || i} flight={f}
                        t={t}
                        onClick={() => { setSelectedFlight(f); setFlightModalOpen(true); }} />
                    ))}
                  </div>
                </div>
              )}
              {data.hotels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <Hotel className="h-3.5 w-3.5" /> {t.hotels}
                  </div>
                  <div className="space-y-3">
                    {data.hotels.map((h, i) => (
                      <HotelRow key={h.id || i} hotel={h}
                        t={t}
                        onClick={() => { setSelectedHotel(h); setHotelModalOpen(true); }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </Reveal>
      )}

      {/* ── Day-by-day itinerary (the centerpiece) ── */}
      {data.itinerary.length > 0 && (
        <Section eyebrow={t.thePlan} title={t.dayByDay} maxWidth="max-w-5xl">
          {/* Sticky day rail */}
          <DayRail days={data.itinerary.map((d: any) => ({ day: d.day, title: d.title }))} dayLabel={t.day} />
          <div className="space-y-20 sm:space-y-24 mt-10">
            {data.itinerary.map((day, dayIdx) => {
              const dayPhoto = photoForDay(day.day);
              const reverse = dayIdx % 2 === 1;
              return (
                <Reveal key={day.day}>
                <article id={`day-${day.day}`} className="group scroll-mt-24">
                  {/* Day banner with big outlined number */}
                  <div className={`grid gap-5 lg:gap-7 mb-6 ${reverse ? "lg:grid-cols-[1fr_1.4fr]" : "lg:grid-cols-[1.4fr_1fr]"}`}>
                    <div className={`relative h-56 sm:h-72 lg:h-80 rounded-3xl overflow-hidden ${reverse ? "lg:order-2" : ""}`}>
                      {dayPhoto ? (
                        <img src={dayPhoto} alt={day.title}
                          className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                      <div className="absolute top-4 left-5">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">
                          {t.day} {day.day}
                        </span>
                      </div>
                    </div>
                    <div className={`flex flex-col justify-center ${reverse ? "lg:order-1 lg:items-end lg:text-right" : ""}`}>
                      <p
                        className="text-[100px] sm:text-[140px] font-bold leading-none tracking-tighter text-transparent"
                        style={{ WebkitTextStroke: "1.5px hsl(var(--foreground))" }}
                      >
                        {String(day.day).padStart(2, "0")}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-2 leading-tight">
                        {day.title}
                      </h3>
                      {day.slots && day.slots.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t.stopsStartsAt(day.slots.length, day.slots[0]?.time || "")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Slots */}
                  {day.slots && day.slots.length > 0 ? (
                    <ol className="relative pl-7 sm:pl-9 border-l-2 border-border space-y-7">
                      {day.slots.map((slot, sIdx) => (
                        <li key={sIdx} className="relative">
                          <span className="absolute -left-[34px] sm:-left-[42px] top-1 w-7 h-7 rounded-full bg-foreground text-background ring-4 ring-background flex items-center justify-center text-[11px] font-bold tabular-nums">
                            {sIdx + 1}
                          </span>
                          {(() => {
                            const matched = matchActivity(slot.venue);
                            const slotPhotoMatch = resolveVenuePhotoMatch(slot.venue, tripData.itineraryVenuePhotos);
                            // Hero is rendered ~160px wide but at 2x DPR; prefer full-res photo for sharpness
                            const heroPhoto: string | undefined = slotPhotoMatch?.photo || slotPhotoMatch?.thumbPhoto || matched?.realPhoto;
                            const reels = createDistinctPhotoGallery({
                              primary: heroPhoto,
                              sources: [slotPhotoMatch?.photos, matched?.realPhotos],
                              limit: 4,
                            });
                            const supportingReels = reels.slice(1);
                            const openModal = () => {
                              if (matched) {
                                setSelectedActivity(matched);
                                setActivitySource({ kind: "slot", dayNum: day.day, slotIdx: sIdx });
                                setActivityModalOpen(true);
                                return;
                              }
                              // Always open the modal so every slot can be swapped,
                              // even when we don't have a matching activity card or photo yet.
                              setSelectedActivity({
                                id: `${day.day}-${sIdx}-${slot.venue}`,
                                name: slot.venue,
                                category: "sightseeing",
                                duration: slot.duration || "",
                                price: slot.cost || 0,
                                currency,
                                image: heroPhoto || "",
                                occasion: "",
                                description: slot.activity || `A highlighted stop in your ${destination} plan.`,
                                neighborhood: slotPhotoMatch?.address || slot.neighborhood,
                                bookAhead: slot.bookAhead,
                                realPhoto: heroPhoto,
                                realPhotos: reels,
                                verified: !!slotPhotoMatch?.verified,
                                verifiedAddress: slotPhotoMatch?.address || slot.neighborhood,
                                verifiedRating: slotPhotoMatch?.rating || null,
                              } as ActivityData);
                              setActivitySource({ kind: "slot", dayNum: day.day, slotIdx: sIdx });
                              setActivityModalOpen(true);
                            };
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 sm:gap-5 transition-transform duration-300 hover:-translate-y-0.5">
                                {/* Hero photo column */}
                                <button
                                  type="button"
                                  onClick={openModal}
                                  className="relative h-44 sm:h-44 sm:w-[180px] rounded-2xl overflow-hidden group/photo bg-gradient-to-br from-primary/15 via-muted to-accent/15 ring-1 ring-border hover:ring-foreground/30 transition"
                                >
                                  {heroPhoto ? (
                                    <img
                                      src={heroPhoto}
                                      alt={slot.venue}
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <MapPin className="h-7 w-7 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-background/85 backdrop-blur text-[9px] font-semibold tracking-wide text-foreground">
                                    {slot.time}
                                  </span>
                                  {reels.length > 1 && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur text-[9px] font-semibold text-white inline-flex items-center gap-1">
                                      <Camera className="h-2.5 w-2.5" />
                                      {reels.length}
                                    </span>
                                  )}
                                </button>

                                {/* Text column */}
                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-3 mb-1">
                                    <span className="text-xs font-mono font-semibold text-muted-foreground tabular-nums">{slot.time}</span>
                                    {slot.bookAhead && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        <Ticket className="h-3 w-3" /> Book ahead
                                      </span>
                                    )}
                                  </div>
                                  <h4
                                    className="text-base sm:text-lg font-semibold text-foreground leading-snug cursor-pointer hover:underline underline-offset-4"
                                    onClick={openModal}
                                  >
                                    {slot.venue}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-0.5">{slot.activity}</p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    {slot.neighborhood && (
                                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {slot.neighborhood}</span>
                                    )}
                                    {slot.duration && (
                                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {slot.duration}</span>
                                    )}
                                    {slot.cost > 0 && (
                                      <span className="font-semibold text-foreground">{currency}{slot.cost}</span>
                                    )}
                                  </div>

                                  {/* Reels-style strip */}
                                  {supportingReels.length >= 1 && (
                                    <div
                                      className="mt-3 flex gap-1.5 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
                                      style={{ scrollbarWidth: "none" }}
                                    >
                                      {supportingReels.slice(0, 6).map((src, ri) => {
                                        const isLastVisible = ri === 5 && supportingReels.length > 6;
                                        const extra = supportingReels.length - 6;
                                        return (
                                          <button
                                            key={ri}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxPhotos(reels);
                                              setLightboxIndex(ri + 1);
                                              setLightboxVenue(slot.venue);
                                              setLightboxOnDetails(() => (matched ? openModal : undefined));
                                              setLightboxOpen(true);
                                            }}
                                            className="relative shrink-0 snap-start w-20 h-28 rounded-xl overflow-hidden ring-1 ring-border hover:ring-foreground/60 hover:scale-[1.02] transition group/thumb"
                                          >
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/15 transition" />
                                            {isLastVisible && (
                                              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-sm font-semibold">
                                                +{extra}
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {slot.transitNext && slot.transitNext !== "—" && sIdx < day.slots!.length - 1 && (
                                    <TransitPill text={slot.transitNext} />
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="space-y-2 text-sm text-muted-foreground pl-1">
                      {day.morning && <p>🌅 {day.morning}</p>}
                      {day.afternoon && <p>☀️ {day.afternoon}</p>}
                      {day.evening && <p>🌙 {day.evening}</p>}
                    </div>
                  )}
                </article>
                </Reveal>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Activities gallery ── */}
      {data.activities.length > 0 && (
        <Reveal>
          <Section eyebrow="Don't miss" title="Experiences" maxWidth="max-w-6xl">
            <div className="bento-grid">
              {data.activities.map((a, i) => (
                <ActivityTile
                  key={a.id || i}
                  activity={a}
                  variant={i === 0 ? "feature" : i % 4 === 1 ? "tall" : "regular"}
                  onClick={() => {
                    setSelectedActivity(a);
                    setActivitySource({ kind: "activity", activityId: a.id });
                    setActivityModalOpen(true);
                  }}
                />
              ))}
            </div>
          </Section>
        </Reveal>
      )}

      {/* ── Closing share card ── */}
      <Reveal>
        <ClosingCard
          destination={destination}
          days={days}
          backgroundImage={secondaryImg}
          isShared={isShared}
          onShare={handleShare}
          onExportPDF={handleExportPDF}
          onSave={handleSave}
          saving={saving}
          sharing={sharing}
        />
      </Reveal>

      {/* ── Floating mobile actions ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="bg-card/90 backdrop-blur-xl border-t border-border px-4 py-3">
          <div className="flex items-center justify-end gap-2 max-w-3xl mx-auto">
            {isShared ? (
              <>
                <Button variant="outline" size="sm" onClick={handleShare} className="h-9 gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Copy link
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing} className="gap-1.5 h-9">
                  <LogIn className="h-3.5 w-3.5" /> {importing ? "..." : "Import"}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-9">
                  <Bookmark className="h-3.5 w-3.5" /> {saving ? "..." : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 w-9 p-0">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing} className="h-9 gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> {sharing ? "..." : "Share"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <ActivityDetailModal
        activity={selectedActivity}
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        destination={destination}
        excludeNames={(() => {
          const names = new Set<string>();
          for (const a of (data.activities as any[])) if (a?.name) names.add(a.name);
          for (const d of (data.itinerary as any[])) {
            if (Array.isArray(d?.slots)) for (const s of d.slots) if (s?.venue) names.add(s.venue);
          }
          return Array.from(names);
        })()}
        onReplace={(newActivity) => {
          if (!activitySource) return;
          const next = JSON.parse(JSON.stringify(tripData)) as typeof tripData;
          if (activitySource.kind === "activity") {
            const idx = next!.data.activities.findIndex((a: any) => a.id === activitySource.activityId);
            if (idx >= 0) next!.data.activities[idx] = { ...newActivity } as any;
          } else {
            const day = next!.data.itinerary.find((d: any) => d.day === activitySource.dayNum);
            if (day && Array.isArray(day.slots) && day.slots[activitySource.slotIdx]) {
              const prev = day.slots[activitySource.slotIdx];
              day.slots[activitySource.slotIdx] = {
                ...prev,
                venue: newActivity.name,
                activity: newActivity.description || prev.activity,
                duration: newActivity.duration || prev.duration,
                cost: typeof newActivity.price === "number" ? newActivity.price : prev.cost,
                neighborhood: newActivity.neighborhood || prev.neighborhood,
                bookAhead: newActivity.bookAhead ?? prev.bookAhead,
              };
            }
            // Also stash the photo so the slot's hero updates immediately.
            if (newActivity.realPhoto || (newActivity.realPhotos && newActivity.realPhotos.length > 0)) {
              next!.itineraryVenuePhotos = {
                ...(next!.itineraryVenuePhotos || {}),
                [newActivity.name]: {
                  photo: newActivity.realPhoto || newActivity.realPhotos?.[0] || null,
                  thumbPhoto: newActivity.realPhoto || newActivity.realPhotos?.[0] || null,
                  photos: newActivity.realPhotos || (newActivity.realPhoto ? [newActivity.realPhoto] : []),
                  rating: newActivity.verifiedRating || null,
                  address: newActivity.verifiedAddress || newActivity.neighborhood || null,
                  verified: !!newActivity.verified,
                  matchedName: newActivity.name,
                  hasRealPhoto: !!(newActivity.realPhoto || newActivity.realPhotos?.length),
                },
              };
            }
          }
          setTripData(next);
          try { sessionStorage.setItem("jolliday-trip-detail", JSON.stringify(next)); } catch {}
        }}
      />
      <PhotoLightbox
        photos={lightboxPhotos}
        startIndex={lightboxIndex}
        venueName={lightboxVenue}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onViewDetails={lightboxOnDetails}
      />
    </div>
  );
};

/* ───── Sub-components ───── */

const Section = ({
  eyebrow, title, children, maxWidth = "max-w-4xl",
}: { eyebrow: string; title: string; children: React.ReactNode; maxWidth?: string }) => (
  <section className={`${maxWidth} mx-auto px-4 sm:px-8 mb-16`}>
    <div className="mb-6 sm:mb-8">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
    {children}
  </section>
);

/** Lightweight scroll-reveal: fades + slides children in once on first viewport entry. */
const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className || ""}`}>
      {children}
    </div>
  );
};

/** Animated count-up for numeric stats. Falls through for non-numeric values. */
const useCountUp = (target: number, durationMs = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
};

const StatTile: React.FC<{ label: string; value: number | string; icon?: React.ReactNode }> = ({ label, value, icon }) => {
  const isNumeric = typeof value === "number";
  const counted = useCountUp(isNumeric ? value : 0);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
        {isNumeric ? counted : value}
      </p>
    </div>
  );
};

/** Sticky day rail — pill nav with scroll-spy across day-N anchors. */
const DayRail: React.FC<{ days: { day: number; title: string }[] }> = ({ days }) => {
  const [active, setActive] = useState<number>(days[0]?.day ?? 1);
  useEffect(() => {
    if (days.length === 0) return;
    const observers: IntersectionObserver[] = [];
    const seen = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).id; // day-N
          const n = parseInt(id.replace("day-", ""), 10);
          if (Number.isFinite(n)) seen.set(n, e.intersectionRatio);
        });
        // pick the day with the highest visible ratio
        let best = active;
        let bestRatio = -1;
        seen.forEach((ratio, n) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = n; }
        });
        if (bestRatio > 0) setActive(best);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    days.forEach((d) => {
      const el = document.getElementById(`day-${d.day}`);
      if (el) io.observe(el);
    });
    observers.push(io);
    return () => observers.forEach((o) => o.disconnect());
  }, [days, active]);

  if (days.length <= 1) return null;
  return (
    <div className="sticky top-14 sm:top-16 z-30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-2 bg-background/85 backdrop-blur-md border-y border-border">
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {days.map((d) => {
          const isActive = d.day === active;
          return (
            <button
              key={d.day}
              onClick={() => {
                const el = document.getElementById(`day-${d.day}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all
                ${isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Day {d.day}
              <span className="hidden sm:inline opacity-60 font-normal"> · {d.title.slice(0, 22)}{d.title.length > 22 ? "…" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Pill that shows transit info (walk/transit) between two slots. */
const TransitPill: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-4 flex items-center gap-2">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground text-[11px] font-medium">
      <Footprints className="h-3 w-3" />
      {text}
    </span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

/** Branded closing card — pause-worthy moment at the end of the page. */
const ClosingCard: React.FC<{
  destination: string;
  days: number;
  backgroundImage?: string;
  isShared: boolean;
  onShare: () => void;
  onExportPDF: () => void;
  onSave: () => void;
  saving: boolean;
  sharing: boolean;
}> = ({ destination, days, backgroundImage, isShared, onShare, onExportPDF, onSave, saving, sharing }) => (
  <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-20 mb-12">
    <div className="relative overflow-hidden rounded-3xl border border-border min-h-[280px]">
      {backgroundImage ? (
        <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/80" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="relative z-10 p-8 sm:p-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-[0.35em] mb-4">
          <Compass className="h-3.5 w-3.5" /> Crafted by Jolliday
        </div>
        <h3 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight max-w-2xl">
          {days} unforgettable days in {destination}.
        </h3>
        <p className="mt-3 text-sm text-white/70 max-w-md">
          Save it, share it, or export a PDF for the road. Prices are estimates — the memories aren't.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {!isShared && (
            <Button onClick={onSave} disabled={saving} size="lg"
              className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-6">
              <Bookmark className="h-4 w-4" /> {saving ? "Saving..." : "Save trip"}
            </Button>
          )}
          <Button onClick={onShare} disabled={sharing} size="lg" variant="outline"
            className="gap-2 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white h-11 px-6">
            {isShared ? <Link2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {isShared ? "Copy link" : sharing ? "Creating..." : "Share trip"}
          </Button>
          {!isShared && (
            <Button onClick={onExportPDF} size="lg" variant="outline"
              className="gap-2 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white h-11 px-6">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const FlightRow = ({ flight: f, onClick }: { flight: FlightData; onClick: () => void }) => (
  <div onClick={onClick}
    className="group relative p-4 rounded-2xl bg-card border border-border transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-foreground/30 hover:-translate-y-0.5">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="text-center shrink-0">
          <p className="text-lg font-bold text-foreground tabular-nums">{f.departureTime}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{f.from}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 px-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> {f.duration}
          </span>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <Plane className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="text-center shrink-0">
          <p className="text-lg font-bold text-foreground tabular-nums">{f.arrivalTime}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{f.to}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-foreground">{f.currency}{f.price}</p>
        <p className="text-xs text-muted-foreground">{f.airline}</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{f.date}</span>
      <a href={getSkyscannerUrl(f.from, f.to, f.date)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        Search on Skyscanner <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

/** Compact hotel row used inside the side-by-side Logistics block. */
const HotelRow = ({ hotel: h, onClick }: { hotel: HotelData; onClick: () => void }) => (
  <div onClick={onClick}
    className="group flex gap-3 p-3 rounded-2xl bg-card border border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-foreground/30 hover:-translate-y-0.5">
    <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-accent/15">
      {h.realImage ? (
        <img src={h.realImage} alt={h.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Hotel className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base leading-tight text-foreground line-clamp-2">{h.name}</h3>
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            {Array.from({ length: h.stars }).map((_, j) => (
              <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="h-3 w-3" /> <span className="truncate">{h.location}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-bold text-foreground">{h.currency}{h.pricePerNight}<span className="text-[10px] font-normal text-muted-foreground">/night</span></span>
        <a href={getBookingDotComUrl(h.name, h.location)} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          Booking.com <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  </div>
);

const HotelCardBig = ({ hotel: h, onClick }: { hotel: HotelData; onClick: () => void }) => (
  <div onClick={onClick}
    className="group rounded-2xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-foreground/20">
    <div className="relative h-56 overflow-hidden">
      {h.realImage ? (
        <img src={h.realImage} alt={h.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
          <Hotel className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-[11px] font-bold">
        {h.currency}{h.pricePerNight}/night
      </div>
    </div>
    <div className="p-5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-lg leading-tight text-foreground">{h.name}</h3>
        <div className="flex items-center gap-0.5 shrink-0 mt-1">
          {Array.from({ length: h.stars }).map((_, j) => (
            <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {h.location}
      </div>
      {h.description && <p className="text-sm text-muted-foreground line-clamp-2">{h.description}</p>}
      <a href={getBookingDotComUrl(h.name, h.location)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline pt-1">
        Check on Booking.com <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

/** Bento-aware activity tile — supports feature/tall/regular sizing within `.bento-grid`. */
const ActivityTile = ({
  activity: a,
  onClick,
  variant = "regular",
}: {
  activity: ActivityData;
  onClick: () => void;
  variant?: "feature" | "tall" | "regular";
}) => {
  const variantClass =
    variant === "feature" ? "bento-feature" : variant === "tall" ? "bento-tall" : "";
  const isFeature = variant === "feature";
  return (
    <div
      onClick={onClick}
      className={`${variantClass} group relative rounded-3xl overflow-hidden cursor-pointer border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 hover:border-foreground/30`}
    >
      <div className="absolute inset-0">
        {a.realPhoto ? (
          <img
            src={a.realPhoto}
            alt={a.name}
            className="w-full h-full object-cover transition-transform duration-[1100ms] group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/15" />
      </div>
      {/* Variant-only minimum heights for mobile (where the bento grid collapses) */}
      <div className={`relative ${isFeature ? "min-h-[360px]" : "min-h-[260px]"}`}>
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-foreground">
            {a.category || "experience"}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h3
            className={`font-bold leading-tight text-white tracking-tight ${
              isFeature ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
            }`}
          >
            {a.name}
          </h3>
          {a.description && isFeature && (
            <p className="text-sm text-white/85 line-clamp-2 mt-2 max-w-lg">{a.description}</p>
          )}
          <div className="flex items-center justify-between pt-3 text-xs text-white/85">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {a.duration}
            </span>
            <span className="font-bold text-white">
              {a.currency}
              {a.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
