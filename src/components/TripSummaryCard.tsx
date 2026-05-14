import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  CalendarDays,
  Sparkles,
  Compass,
} from "lucide-react";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";
import { useDestinationVideo } from "@/hooks/useCityImages";

export type TripPlanData = {
  flights: FlightData[];
  hotels: HotelData[];
  activities: ActivityData[];
  itinerary: ItineraryData[];
  timeline: TimelineLeg[];
  travelInfo: TravelInfoData | null;
  quickReplies: string[];
  text: string;
};

/* ─────────────────────────────────────────────────────────────
   TripSummaryCard — premium edition
   A magazine-cover style card with:
   • Cinematic full-bleed hero (video or image)
   • Layered glass overlays for typography
   • Dynamic gradient accents
   • Polaroid-style activity peek strip
   • Subtle parallax + reveal animations on hover
   ───────────────────────────────────────────────────────────── */

type Props = {
  data: TripPlanData;
  destination: string;
  enrichedImages?: any[];
  origin?: string;
  itineraryVenuePhotos?: Record<string, any>;
};

const TripSummaryCard = ({
  data,
  destination,
  enrichedImages,
  origin,
  itineraryVenuePhotos,
}: Props) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    let slimVenuePhotos: Record<string, any> | undefined;
    if (itineraryVenuePhotos) {
      slimVenuePhotos = {};
      for (const [key, val] of Object.entries(itineraryVenuePhotos)) {
        if (val && typeof val === "object") {
          slimVenuePhotos[key] = {
            photo: (val as any).photo || (val as any).thumbPhoto || null,
            thumbPhoto: (val as any).thumbPhoto || null,
            photos: Array.isArray((val as any).photos) ? (val as any).photos.slice(0, 4) : [],
            rating: (val as any).rating || null,
            address: (val as any).address || null,
            verified: (val as any).verified || false,
            matchedName: (val as any).matchedName || null,
            hasRealPhoto: (val as any).hasRealPhoto || false,
          };
        }
      }
    }
    try {
      sessionStorage.setItem(
        "jolliday-trip-detail",
        JSON.stringify({ data, destination, enrichedImages: enrichedImages?.slice(0, 5), itineraryVenuePhotos: slimVenuePhotos }),
      );
    } catch {
      sessionStorage.setItem(
        "jolliday-trip-detail",
        JSON.stringify({ data, destination }),
      );
    }
    navigate("/trip/view");
  };

  const days = data.itinerary.length;
  const activitiesCount =
    data.itinerary.reduce(
      (s: number, d: any) => s + (Array.isArray(d?.slots) ? d.slots.length : 0),
      0,
    ) || data.activities.length;

  const { imageUrl: stockHero } = useCityHeroImage(destination);
  const heroVideoUrl = useDestinationVideo(destination);
  const enrichedHero = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl;
  const preferredHero = enrichedHero || stockHero;
  const [heroSrc, setHeroSrc] = useState<string | undefined>(preferredHero);

  useEffect(() => {
    if (preferredHero && preferredHero !== heroSrc) setHeroSrc(preferredHero);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredHero]);

  const handleHeroError = () => {
    if (heroSrc === enrichedHero && stockHero && stockHero !== enrichedHero) {
      setHeroSrc(stockHero);
      return;
    }
    setHeroSrc(undefined);
  };

  // Pick top 3 activity photos for the polaroid strip
  const photoStrip = (data.activities || [])
    .slice(0, 6)
    .map((a) => {
      const venuePhoto = itineraryVenuePhotos?.[a.name]?.photo || itineraryVenuePhotos?.[a.name]?.thumbPhoto;
      return {
        name: a.name,
        photo: venuePhoto || a.realPhoto || a.image || null,
        category: a.category,
      };
    })
    .filter((p) => p.photo)
    .slice(0, 4);

  // Build a tagline based on the trip vibe
  const firstActivity = data.activities[0];
  const tagline = data.travelInfo?.destination
    ? `${days} day${days === 1 ? "" : "s"} in ${destination}`
    : `${days} day${days === 1 ? "" : "s"} of magic`;

  // Trip period from weather block or first slot date
  const weather: any = (data as any).weather;
  const period = weather?.period || data.travelInfo?.bestTimeToVisit || null;

  return (
    <div
      onClick={handleOpen}
      className="group/card relative mt-4 w-full max-w-md cursor-pointer select-none"
    >
      {/* Outer glow on hover */}
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-primary/40 via-fuchsia-400/30 to-amber-300/40 opacity-0 group-hover/card:opacity-100 blur-xl transition-opacity duration-500" />

      <div className="relative rounded-[24px] overflow-hidden bg-neutral-950 shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover/card:shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-shadow duration-500">

        {/* ── HERO LAYER ─────────────────────────────────────────── */}
        <div className="relative h-[420px] overflow-hidden">
          {heroVideoUrl ? (
            <video
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-110 group-hover/card:scale-105 transition-transform duration-[1500ms] ease-out"
            />
          ) : heroSrc ? (
            <img
              src={heroSrc}
              alt={destination}
              onError={handleHeroError}
              className="absolute inset-0 w-full h-full object-cover scale-110 group-hover/card:scale-105 transition-transform duration-[1500ms] ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-800 flex items-center justify-center">
              <Compass className="h-16 w-16 text-white/30" strokeWidth={1.5} />
            </div>
          )}

          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-500/10 mix-blend-overlay" />

          {/* Top-left chip — "Your trip" */}
          <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-sm">
            <Sparkles className="h-3 w-3 text-white" fill="white" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Your trip
            </span>
          </div>

          {/* Top-right chip — period if known */}
          {period && (
            <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
              <CalendarDays className="h-3 w-3 text-white" />
              <span className="text-[11px] font-semibold text-white truncate max-w-[140px]">
                {period}
              </span>
            </div>
          )}

          {/* ── BOTTOM CONTENT — DESTINATION TITLE ─────────────── */}
          <div className="absolute inset-x-0 bottom-0 p-6 pb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-1.5">
              {tagline}
            </p>
            <h2 className="text-[2.75rem] sm:text-5xl font-black tracking-tight text-white leading-[0.95] drop-shadow-lg">
              {destination}
            </h2>

            {/* Origin → Destination */}
            {origin && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/90">
                <span className="font-medium">{origin}</span>
                <Plane className="h-3 w-3 rotate-45" />
                <span className="font-semibold">{destination}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── POLAROID PHOTO STRIP ─────────────────────────────── */}
        {photoStrip.length > 0 && (
          <div className="absolute -bottom-2 right-5 flex gap-2 z-10">
            {photoStrip.slice(0, 3).map((p, i) => (
              <div
                key={p.name + i}
                className="w-14 h-14 rounded-xl overflow-hidden border-[3px] border-white shadow-lg ring-1 ring-black/5 transform transition-transform duration-300"
                style={{
                  transform: `rotate(${(i - 1) * 4}deg) translateY(${i % 2 === 0 ? 0 : -4}px)`,
                }}
              >
                <img
                  src={p.photo!}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── DETAILS LAYER ────────────────────────────────────── */}
        <div className="relative bg-white p-5 pt-7">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <PremiumStat label="Days" value={days} icon={<CalendarDays className="h-3.5 w-3.5" />} accent="primary" />
            <PremiumStat label="Hotels" value={data.hotels.length} icon={<Hotel className="h-3.5 w-3.5" />} accent="fuchsia" />
            <PremiumStat label="Flights" value={data.flights.length} icon={<Plane className="h-3.5 w-3.5" />} accent="amber" />
            <PremiumStat label="Stops" value={activitiesCount} icon={<MapPin className="h-3.5 w-3.5" />} accent="emerald" />
          </div>

          {/* Day teaser strip */}
          {data.itinerary.length > 0 && (
            <DayTeaserPreview itinerary={data.itinerary} />
          )}

          {/* CTA button */}
          <button
            type="button"
            className="mt-5 w-full relative overflow-hidden rounded-2xl py-3.5 font-semibold text-sm text-white shadow-lg group/btn transition-transform active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, hsl(234 62% 52%) 0%, hsl(280 70% 55%) 50%, hsl(330 80% 60%) 100%)",
            }}
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              Open the full plan
              <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
            </span>
            {/* Shimmer */}
            <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Premium stat tile with accent gradient ───────────────────── */
const accentMap = {
  primary: "from-primary/10 to-primary/5 text-primary",
  fuchsia: "from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
  emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
} as const;

const PremiumStat = ({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: keyof typeof accentMap;
}) => (
  <div className={`relative rounded-2xl p-3 text-center bg-gradient-to-br ${accentMap[accent]} border border-black/[0.04] overflow-hidden`}>
    <div className={`flex items-center justify-center mb-1 ${accentMap[accent].split(" ").pop()}`}>
      {icon}
    </div>
    <div className="text-xl font-black text-foreground leading-none">{value}</div>
    <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  </div>
);

/* ─── Day teaser — shows day 1–3 highlight one-liners ──────────── */
const DayTeaserPreview = ({ itinerary }: { itinerary: ItineraryData[] }) => {
  const firstSlotTitle = (d: any): string => {
    if (Array.isArray(d?.slots) && d.slots.length > 0) {
      const slot = d.slots[0];
      return slot.title || slot.name || slot.activity || slot.venue || "";
    }
    return d?.title || "";
  };
  const days = itinerary.slice(0, 3).map((d, i) => ({
    num: i + 1,
    teaser: firstSlotTitle(d),
  }));

  return (
    <div className="space-y-1.5">
      {days.map((d) => (
        <div
          key={d.num}
          className="flex items-center gap-2.5 text-xs"
        >
          <span className="shrink-0 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
            {d.num}
          </span>
          <span className="text-muted-foreground truncate">{d.teaser || "—"}</span>
        </div>
      ))}
      {itinerary.length > 3 && (
        <div className="flex items-center gap-2.5 text-xs">
          <span className="shrink-0 w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground text-[10px] font-bold flex items-center justify-center">
            +{itinerary.length - 3}
          </span>
          <span className="text-muted-foreground/70">more days inside</span>
        </div>
      )}
    </div>
  );
};

/* ─── Backwards-compat exports (used by PlanPreviewGate, etc.) ──── */

export const StatTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delay?: string;
}) => (
  <div className="rounded-lg border border-border bg-muted/50 p-2 text-center">
    <div className="text-base font-bold text-foreground leading-none">
      {value}
    </div>
    <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-center">
      <span className="text-muted-foreground/70">{icon}</span>
      {label}
    </div>
  </div>
);

export const RouteRecap = ({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) => {
  const trim = (s: string) => (s.length > 18 ? s.slice(0, 17) + "…" : s);
  return (
    <div className="relative rounded-2xl bg-muted/40 border border-border/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-foreground shrink-0" />
          <span className="text-[11px] font-semibold text-foreground truncate">
            {trim(origin)}
          </span>
        </div>
        <svg
          viewBox="0 0 180 40"
          className="flex-1 h-8"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 4 26 Q 90 2 176 26"
            fill="none"
            stroke="hsl(234 62% 47%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 4"
          />
          <g transform="translate(90, 9)">
            <circle r="8" fill="white" stroke="hsl(234 62% 47%)" strokeWidth="1.2" />
            <g transform="translate(-5, -5)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5-.2.4-.1.8.3 1.1L8 10l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 4.2 6c.3.4.7.5 1.1.3.4-.2.6-.6.5-1.1Z"
                  fill="hsl(234 62% 47%)"
                />
              </svg>
            </g>
          </g>
        </svg>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-foreground truncate">
            {trim(destination)}
          </span>
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        </div>
      </div>
    </div>
  );
};

export const DayRailMini = ({ itinerary }: { itinerary: ItineraryData[] }) => {
  const dots = itinerary.slice(0, 8);
  const firstSlotTitle = (d: any): string => {
    if (Array.isArray(d?.slots) && d.slots.length > 0) {
      return d.slots[0].title || d.slots[0].name || d.title || "";
    }
    return d?.title || "";
  };
  const teaserParts = itinerary
    .slice(0, 3)
    .map((d, i) => `Day ${i + 1} — ${firstSlotTitle(d)}`)
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {dots.map((_, i) => (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${
                i === 0 ? "bg-foreground" : "border border-border bg-background"
              }`}
            />
            {i < dots.length - 1 && (
              <div className="flex-1 border-t border-dashed border-border" />
            )}
          </div>
        ))}
      </div>
      {teaserParts.length > 0 && (
        <p className="text-[11px] text-muted-foreground truncate">
          {teaserParts.join("  ·  ")}
          {itinerary.length > 3 ? "  ·  …" : ""}
        </p>
      )}
    </div>
  );
};

export default TripSummaryCard;
