import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Plane, Hotel, Sparkles,
  MapPin, Clock, ExternalLink, Star, Bookmark, Ticket, ArrowRight, Camera, Link2, LogIn,
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
import { exportTripPlanPDF } from "@/utils/pdfExport";
import { createDistinctPhotoGallery } from "@/utils/photoGallery";
import { getSkyscannerUrl, getBookingDotComUrl } from "@/utils/bookingLinks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  if (!tripData) return null;
  const { data, destination } = tripData;

  const heroImg = tripData.enrichedImages?.[0]?.url || tripData.enrichedImages?.[0]?.thumbUrl;
  const secondaryImg = tripData.enrichedImages?.[1]?.url || tripData.enrichedImages?.[1]?.thumbUrl;

  const days = data.itinerary.length || 1;
  const flightsCost = data.flights.reduce((s, f) => s + f.price, 0);
  const hotelsCost = data.hotels.reduce((s, h) => s + h.pricePerNight * days, 0);
  const activitiesCost = data.activities.reduce((s, a) => s + a.price, 0);
  const totalBudget = flightsCost + hotelsCost + activitiesCost;
  const currency = data.flights[0]?.currency || data.hotels[0]?.currency || data.activities[0]?.currency || "$";

  const mapPoints: MapPoint[] = [
    ...data.hotels.filter((h: any) => h.lat && h.lng).map((h: any) => ({
      name: h.name, lat: h.lat, lng: h.lng, type: "hotel" as const, day: 1,
    })),
    ...data.activities.filter((a: any) => a.lat && a.lng).map((a: any, i: number) => ({
      name: a.name, lat: a.lat, lng: a.lng, type: "activity" as const,
      day: data.itinerary.length > 0 ? ((i % data.itinerary.length) + 1) : undefined,
    })),
  ];

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
            <span className="font-semibold">Shared trip</span>
            <span className="opacity-70 hidden sm:inline"> · Sign up to import & customize this plan</span>
          </span>
          <Button size="sm" variant="secondary" onClick={handleImport} disabled={importing}
            className="h-7 gap-1.5 shrink-0">
            <LogIn className="h-3.5 w-3.5" /> {importing ? "Importing..." : "Import this trip"}
          </Button>
        </div>
      )}
      {/* ── Magazine Hero ── */}
      <div className="relative h-[58vh] min-h-[420px] max-h-[640px] overflow-hidden">
        {heroImg ? (
          <img src={heroImg} alt={destination} className="w-full h-full object-cover scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-accent/30 flex items-center justify-center">
            <MapPin className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-background" />

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
                  <Bookmark className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportPDF}
                  className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare} disabled={sharing}
              className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
              {isShared ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {isShared ? "Copy link" : sharing ? "Creating..." : "Share link"}
            </Button>
            {isShared && (
              <Button size="sm" onClick={handleImport} disabled={importing}
                className="gap-1.5 bg-white text-black hover:bg-white/90">
                <LogIn className="h-3.5 w-3.5" /> {importing ? "Importing..." : "Import"}
              </Button>
            )}
          </div>
        </div>

        {/* Hero title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-10 pb-10">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/80 mb-3">Your Jolliday</p>
            <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight leading-[0.95] drop-shadow-lg">
              {destination}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90 text-sm">
              {data.itinerary.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">{data.itinerary.length}</span> days
                </span>
              )}
              {data.activities.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">{data.activities.length}</span> experiences
                </span>
              )}
              {data.hotels.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">{data.hotels.length}</span> stays
                </span>
              )}
              {totalBudget > 0 && (
                <span className="flex items-center gap-1.5">
                  from <span className="font-semibold text-white">{currency}{totalBudget.toLocaleString()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pull-quote intro ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 -mt-2 mb-10 sm:mb-14">
        {data.text && (
          <p className="text-xl sm:text-2xl font-semibold text-foreground leading-snug tracking-tight">
            {data.text.split("\n").find(l => l.trim().length > 30)?.slice(0, 240) || `A handcrafted ${days}-day plan in ${destination}.`}
          </p>
        )}
      </div>

      {/* ── Map (if available) ── */}
      {mapPoints.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mb-12">
          <TripMap points={mapPoints} activeDay={null} onMarkerClick={() => {}} />
        </div>
      )}

      {/* ── Flights ── */}
      {data.flights.length > 0 && (
        <Section eyebrow="Getting there" title="Flights" maxWidth="max-w-3xl">
          <div className="space-y-3">
            {data.flights.map((f, i) => (
              <FlightRow key={f.id || i} flight={f}
                onClick={() => { setSelectedFlight(f); setFlightModalOpen(true); }} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Hotels ── */}
      {data.hotels.length > 0 && (
        <Section eyebrow="Where you'll stay" title="Hotels" maxWidth="max-w-5xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {data.hotels.map((h, i) => (
              <HotelCardBig key={h.id || i} hotel={h}
                onClick={() => { setSelectedHotel(h); setHotelModalOpen(true); }} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Day-by-day itinerary (the centerpiece) ── */}
      {data.itinerary.length > 0 && (
        <Section eyebrow="The plan" title="Day by day" maxWidth="max-w-4xl">
          <div className="space-y-14">
            {data.itinerary.map((day) => {
              const dayPhoto = photoForDay(day.day);
              return (
                <article key={day.day} className="group">
                  {/* Day banner */}
                  <div className="relative h-56 sm:h-72 rounded-3xl overflow-hidden mb-5">
                    {dayPhoto ? (
                      <img src={dayPhoto} alt={day.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/80">Day {day.day}</p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 leading-tight">
                        {day.title}
                      </h3>
                    </div>
                  </div>

                  {/* Slots */}
                  {day.slots && day.slots.length > 0 ? (
                    <ol className="relative pl-6 sm:pl-8 border-l-2 border-border space-y-5">
                      {day.slots.map((slot, sIdx) => (
                        <li key={sIdx} className="relative">
                          <span className="absolute -left-[33px] sm:-left-[37px] top-1.5 w-3.5 h-3.5 rounded-full bg-foreground ring-4 ring-background" />
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
                              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
                                {/* Hero photo column */}
                                <button
                                  type="button"
                                  onClick={openModal}
                                  className="relative h-44 sm:h-40 sm:w-40 rounded-2xl overflow-hidden group/photo bg-gradient-to-br from-primary/15 via-muted to-accent/15"
                                >
                                  {heroPhoto ? (
                                    <img
                                      src={heroPhoto}
                                      alt={slot.venue}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
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
                                    <div className="flex items-center gap-1.5 mt-3 text-[11px] italic text-muted-foreground/80">
                                      <ArrowRight className="h-3 w-3" /> {slot.transitNext}
                                    </div>
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
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Activities gallery ── */}
      {data.activities.length > 0 && (
        <Section eyebrow="Don't miss" title="Experiences" maxWidth="max-w-5xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.activities.map((a, i) => (
              <ActivityTile key={a.id || i} activity={a}
                onClick={() => {
                  setSelectedActivity(a);
                  setActivitySource({ kind: "activity", activityId: a.id });
                  setActivityModalOpen(true);
                }} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Closing strip ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 mt-16 pt-10 border-t border-border text-center">
        {secondaryImg && (
          <div className="relative h-40 sm:h-56 rounded-2xl overflow-hidden mb-6">
            <img src={secondaryImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Crafted by Jolliday · prices are estimates · enjoy the trip ✦
        </p>
      </div>

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

const FlightRow = ({ flight: f, onClick }: { flight: FlightData; onClick: () => void }) => (
  <div onClick={onClick}
    className="group relative p-5 rounded-2xl bg-card border border-border transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-foreground/20">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="text-center shrink-0">
          <p className="text-xl font-bold text-foreground">{f.departureTime}</p>
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
          <p className="text-xl font-bold text-foreground">{f.arrivalTime}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{f.to}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xl font-bold text-foreground">{f.currency}{f.price}</p>
        <p className="text-xs text-muted-foreground">{f.airline}</p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{f.date}</span>
      <a href={getSkyscannerUrl(f.from, f.to, f.date)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        Search on Skyscanner <ExternalLink className="h-3 w-3" />
      </a>
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

const ActivityTile = ({ activity: a, onClick }: { activity: ActivityData; onClick: () => void }) => (
  <div onClick={onClick}
    className="group rounded-2xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-foreground/20 hover:-translate-y-0.5">
    <div className="relative h-48 overflow-hidden">
      {a.realPhoto ? (
        <img src={a.realPhoto} alt={a.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute top-3 left-3">
        <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-foreground">
          {a.category || "experience"}
        </span>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <h3 className="font-bold text-base leading-tight text-foreground">{a.name}</h3>
      {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration}</span>
        <span className="font-bold text-foreground">{a.currency}{a.price}</span>
      </div>
    </div>
  </div>
);

export default TripDetail;
