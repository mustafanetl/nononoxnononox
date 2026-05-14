import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  CalendarDays,
  Compass,
  ArrowUpRight,
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
   TripSummaryCard — editorial edition
   Restrained, considered, mobile-first.
   Inspired by Airbnb listings, Apple TV cards, Cereal magazine.
   One accent color, generous whitespace, real typographic hierarchy.
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

  // Trip period from weather block or first slot date
  const weather: any = (data as any).weather;
  const period = weather?.period || data.travelInfo?.bestTimeToVisit || null;

  // Country pulled from travelInfo for the typographic kicker
  const country = data.travelInfo?.country || data.hotels[0]?.location?.split(",").pop()?.trim() || null;

  return (
    <div
      onClick={handleOpen}
      className="group/card relative mt-4 w-full max-w-md cursor-pointer select-none rounded-3xl overflow-hidden bg-card border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_48px_-16px_rgba(0,0,0,0.18)] transition-shadow duration-300"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-neutral-100">
        {heroVideoUrl ? (
          <video
            src={heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover/card:scale-[1.04]"
          />
        ) : heroSrc ? (
          <img
            src={heroSrc}
            alt={destination}
            onError={handleHeroError}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover/card:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
            <Compass className="h-12 w-12 text-white/20" strokeWidth={1.25} />
          </div>
        )}

        {/* Single soft gradient — bottom only, deep but warm */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* Optional period chip — quiet, top-right */}
        {period && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">
            <span className="text-[10px] font-medium tracking-tight text-neutral-900">
              {period}
            </span>
          </div>
        )}

        {/* Title block — bottom-left, editorial style */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-6 sm:pb-6">
          {country && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 mb-2">
              {country}
            </p>
          )}
          <h2 className="font-serif text-[2.5rem] sm:text-[3rem] leading-[0.95] tracking-tight text-white">
            {destination}
          </h2>

          {origin && (
            <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-white/85">
              <span className="font-medium">{origin}</span>
              <span className="w-3 h-px bg-white/40" />
              <span className="font-medium">{destination}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAILS ──────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Quiet meta row */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/5">
          <MetaPill icon={<CalendarDays className="h-3.5 w-3.5" />} value={days} label={days === 1 ? "day" : "days"} />
          <span className="w-px h-4 bg-black/10" />
          <MetaPill icon={<Hotel className="h-3.5 w-3.5" />} value={data.hotels.length} label={data.hotels.length === 1 ? "stay" : "stays"} />
          <span className="w-px h-4 bg-black/10" />
          <MetaPill icon={<Plane className="h-3.5 w-3.5" />} value={data.flights.length} label="flights" />
          <span className="w-px h-4 bg-black/10" />
          <MetaPill icon={<MapPin className="h-3.5 w-3.5" />} value={activitiesCount} label="stops" />
        </div>

        {/* Day previews — clean editorial list */}
        {data.itinerary.length > 0 && (
          <DayList itinerary={data.itinerary} />
        )}

        {/* CTA */}
        <button
          type="button"
          className="group/btn w-full flex items-center justify-between rounded-2xl bg-foreground text-background pl-5 pr-3 py-3 text-sm font-medium transition-all hover:opacity-95 active:scale-[0.99]"
        >
          <span>Open the full plan</span>
          <span className="w-8 h-8 rounded-full bg-background/15 flex items-center justify-center transition-transform duration-200 group-hover/btn:translate-x-0.5">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </button>
      </div>
    </div>
  );
};

/* ─── Quiet meta pill — icon + number + label ──────────────────── */
const MetaPill = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) => (
  <div className="flex-1 flex flex-col items-center text-center min-w-0">
    <div className="text-muted-foreground/70 mb-1.5">{icon}</div>
    <div className="text-base font-semibold text-foreground leading-none tabular-nums">
      {value}
    </div>
    <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 lowercase truncate w-full">
      {label}
    </div>
  </div>
);

/* ─── Editorial day list — Day 01 · Title ───────────────────────── */
const DayList = ({ itinerary }: { itinerary: ItineraryData[] }) => {
  const firstSlotTitle = (d: any): string => {
    if (Array.isArray(d?.slots) && d.slots.length > 0) {
      const slot = d.slots[0];
      return slot.title || slot.name || slot.activity || slot.venue || "";
    }
    return d?.title || "";
  };
  const days = itinerary.slice(0, 3).map((d, i) => ({
    num: String(i + 1).padStart(2, "0"),
    teaser: firstSlotTitle(d),
  }));

  if (days.every((d) => !d.teaser)) return null;

  return (
    <div className="space-y-2.5">
      {days.map((d) => (
        d.teaser && (
          <div key={d.num} className="flex items-baseline gap-3 text-sm">
            <span className="shrink-0 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 tabular-nums">
              DAY {d.num}
            </span>
            <span className="text-foreground/85 truncate">{d.teaser}</span>
          </div>
        )
      ))}
      {itinerary.length > 3 && (
        <div className="flex items-baseline gap-3 text-sm">
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/50 tabular-nums">
            +{itinerary.length - 3}
          </span>
          <span className="text-muted-foreground/70 italic">more days inside</span>
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
