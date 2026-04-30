import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Plane, Hotel, Sparkles,
  MapPin, Clock, ExternalLink, Star, Bookmark, Ticket, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import FlightDetailModal from "@/components/FlightDetailModal";
import HotelDetailModal from "@/components/HotelDetailModal";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import TripMap, { type MapPoint } from "@/components/TripMap";
import { HotelData } from "@/contexts/TripContext";
import { FlightData } from "@/components/FlightCard";
import { ActivityData } from "@/components/ActivityCard";
import { TripPlanData } from "@/components/TripSummaryCard";
import { shareTripSummary } from "@/utils/tripSummary";
import { setWikimediaImage } from "@/utils/cityImages";
import { exportTripPlanPDF } from "@/utils/pdfExport";
import { getSkyscannerUrl, getBookingDotComUrl } from "@/utils/bookingLinks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ═══════════════════════════════════════════
   Editorial-style trip view
   ═══════════════════════════════════════════ */
const TripDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tripData, setTripData] = useState<{ data: TripPlanData; destination: string; enrichedImages?: any[] } | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
  }, [navigate]);

  // Re-enrich on mount: pulls real Google Places photos for activities,
  // hotels, and the destination hero — even if the user navigated here
  // before the chat page finished its own enrichment, or if the trip was
  // reopened from "My Trips" without cached photos.
  useEffect(() => {
    if (!tripData) return;
    const { data, destination } = tripData;
    if (!destination) return;

    const needsActivityPhotos = data.activities.some((a: any) => !a.realPhoto);
    const needsHotelPhotos = data.hotels.some((h: any) => !h.realImage);
    const needsHeroImages = !tripData.enrichedImages || tripData.enrichedImages.length === 0;
    if (!needsActivityPhotos && !needsHotelPhotos && !needsHeroImages) return;

    let cancelled = false;
    (async () => {
      try {
        const activityNames = data.activities.map((a: any) => a.name).filter(Boolean);
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

        const activityPhotos = enrich.activityPhotos || {};
        const hotelPhotos = enrich.hotelPhotos || {};
        const images = enrich.images || [];

        const newActivities = data.activities.map((a: any) => {
          if (a.realPhoto) return a;
          const m = activityPhotos[a.name];
          if (m?.hasRealPhoto && (m.thumbPhoto || m.photo)) {
            return { ...a, realPhoto: m.thumbPhoto || m.photo, verified: true };
          }
          // Fallback: use a destination hero image so cards aren't empty
          if (images.length > 0) {
            const idx = data.activities.indexOf(a) % images.length;
            return { ...a, realPhoto: images[idx].thumbUrl || images[idx].url };
          }
          return a;
        });
        const newHotels = data.hotels.map((h: any) => {
          if (h.realImage) return h;
          const m = hotelPhotos[h.name];
          if (m?.hasRealPhoto && (m.thumbPhoto || m.photo)) {
            return { ...h, realImage: m.thumbPhoto || m.photo, verified: true };
          }
          if (images.length > 0) {
            const idx = data.hotels.indexOf(h) % images.length;
            return { ...h, realImage: images[idx].thumbUrl || images[idx].url };
          }
          return h;
        });

        const merged = {
          ...tripData,
          data: { ...data, activities: newActivities, hotels: newHotels },
          enrichedImages: tripData.enrichedImages?.length ? tripData.enrichedImages : images,
        };
        setTripData(merged);
        sessionStorage.setItem("jolliday-trip-detail", JSON.stringify(merged));
        if (images.length > 0) setWikimediaImage(destination, images[0].thumbUrl || images[0].url);
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

  // pick a photo for each day from activities mapped to that day
  const photoForDay = (dayNum: number): string | undefined => {
    const acts = data.activities.filter((_, i) => data.itinerary.length > 0 && ((i % data.itinerary.length) + 1) === dayNum);
    const withPhoto = acts.find((a: any) => a.realPhoto);
    if (withPhoto?.realPhoto) return withPhoto.realPhoto;
    // fallback to any activity photo or hero
    const anyAct = data.activities.find((a: any) => a.realPhoto);
    return (anyAct as any)?.realPhoto || tripData.enrichedImages?.[(dayNum - 1) % Math.max(tripData.enrichedImages?.length || 1, 1)]?.thumbUrl;
  };

  const handleShare = async () => {
    try {
      await shareTripSummary([{ role: "assistant" as const, content: data.text }]);
      toast.success("Trip summary copied!");
    } catch { toast.error("Couldn't share"); }
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}
            className="rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="gap-1.5 bg-white text-black hover:bg-white/90">
              <Bookmark className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportPDF}
              className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}
              className="gap-1.5 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
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
                          <div className="flex items-baseline gap-3 mb-1">
                            <span className="text-xs font-mono font-semibold text-muted-foreground tabular-nums">{slot.time}</span>
                            {slot.bookAhead && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                <Ticket className="h-3 w-3" /> Book ahead
                              </span>
                            )}
                          </div>
                          <h4 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
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
                          {slot.transitNext && slot.transitNext !== "—" && sIdx < day.slots!.length - 1 && (
                            <div className="flex items-center gap-1.5 mt-3 text-[11px] italic text-muted-foreground/80">
                              <ArrowRight className="h-3 w-3" /> {slot.transitNext}
                            </div>
                          )}
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
                onClick={() => { setSelectedActivity(a); setActivityModalOpen(true); }} />
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
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-9">
              <Bookmark className="h-3.5 w-3.5" /> {saving ? "..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 w-9 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="h-9 w-9 p-0">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <ActivityDetailModal activity={selectedActivity} open={activityModalOpen} onOpenChange={setActivityModalOpen} />
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
