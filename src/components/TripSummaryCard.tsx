import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  CalendarDays,
  Compass,
  ArrowUpRight,
  Star,
  Cloud,
} from "lucide-react";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";
import { useDestinationVideo } from "@/hooks/useCityImages";
import { LogoMark } from "@/components/Logo";

export type TripPlanData = {
  flights: FlightData[];
  hotels: HotelData[];
  activities: ActivityData[];
  itinerary: ItineraryData[];
  timeline: TimelineLeg[];
  travelInfo: TravelInfoData | null;
  quickReplies: string[];
  text: string;
  weather?: any;
};

/* ─────────────────────────────────────────────────────────────
   TripSummaryCard — Jolliday postcard
   • 4:3 cinematic hero with brand stamp + watermark
   • Highlight strip: hotel + signature activity
   • Day-by-day teaser
   • Brand CTA
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
            lat: typeof (val as any).lat === "number" ? (val as any).lat : null,
            lng: typeof (val as any).lng === "number" ? (val as any).lng : null,
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

  const weather: any = (data as any).weather;
  const period = weather?.period || data.travelInfo?.bestTimeToVisit || null;
  const weatherTemp = weather?.temperature || null;

  // Day-by-day teaser (up to 3)
  const firstSlotTitle = (d: any): string => {
    if (Array.isArray(d?.slots) && d.slots.length > 0) {
      const slot = d.slots[0];
      return slot.title || slot.name || slot.activity || slot.venue || "";
    }
    return d?.title || "";
  };
  const dayTeasers = data.itinerary.slice(0, 3).map((d, i) => ({
    num: i + 1,
    teaser: firstSlotTitle(d),
  }));

  // Top hotel + signature activity for the highlight row
  const topHotel = data.hotels[0];
  const signatureActivity = data.activities[0];

  return (
    <div
      onClick={handleOpen}
      className="group/card relative mt-4 w-full max-w-md cursor-pointer select-none rounded-3xl overflow-hidden bg-card border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_14px_36px_-14px_rgba(0,0,0,0.18)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_50px_-18px_rgba(0,0,0,0.25)] transition-shadow duration-300"
    >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        {heroVideoUrl ? (
          <video
            src={heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover/card:scale-[1.04]"
          />
        ) : heroSrc ? (
          <img
            src={heroSrc}
            alt={destination}
            onError={handleHeroError}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover/card:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 32%))",
            }}
          >
            <Compass className="h-12 w-12 text-white/30" strokeWidth={1.25} />
          </div>
        )}

        {/* Bottom shadow for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Brand stamp top-left */}
        <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-sm">
          <LogoMark size={12} color="white" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Jolliday
          </span>
        </div>

        {/* Period top-right */}
        {period && (
          <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/95 shadow-sm">
            <CalendarDays className="h-3 w-3 text-neutral-700" />
            <span className="text-[10px] font-semibold tracking-tight text-neutral-900">
              {period}
            </span>
          </div>
        )}

        {/* Decorative star — bottom right, subtle */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.12] pointer-events-none">
          <LogoMark size={120} color="white" />
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 mb-1">
            {days} day{days === 1 ? "" : "s"}
            {origin ? ` · from ${origin}` : ""}
          </p>
          <h2
            className="text-[2rem] sm:text-[2.5rem] font-extrabold tracking-tight text-white leading-[0.98] drop-shadow-md"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            {destination}
          </h2>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {/* Inline meta row */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <Meta icon={<Hotel className="h-3 w-3" />} value={data.hotels.length} label={data.hotels.length === 1 ? "hotel" : "hotels"} />
          <span className="w-px h-3 bg-black/10" />
          <Meta icon={<Plane className="h-3 w-3" />} value={data.flights.length} label="flights" />
          <span className="w-px h-3 bg-black/10" />
          <Meta icon={<MapPin className="h-3 w-3" />} value={activitiesCount} label="stops" />
          <span className="w-px h-3 bg-black/10" />
          <Meta icon={<CalendarDays className="h-3 w-3" />} value={days} label={days === 1 ? "day" : "days"} />
        </div>

        {/* Highlight row — hotel + signature activity (no photos) */}
        {(topHotel || signatureActivity) && (
          <div className="space-y-2 pt-1">
            {topHotel && (
              <HighlightRow
                kicker="STAY"
                title={topHotel.name}
                subtitle={topHotel.location || topHotel.neighborhood}
                rating={(topHotel as any).rating}
              />
            )}
            {signatureActivity && (
              <HighlightRow
                kicker="DON'T MISS"
                title={signatureActivity.name}
                subtitle={signatureActivity.neighborhood || signatureActivity.category}
              />
            )}
          </div>
        )}

        {/* Day teasers */}
        {dayTeasers.some((d) => d.teaser) && (
          <div className="space-y-1.5 pt-3 border-t border-black/[0.06]">
            {dayTeasers.map(
              (d) =>
                d.teaser && (
                  <div key={d.num} className="flex items-baseline gap-3 text-[12px]">
                    <span
                      className="shrink-0 text-[9px] font-bold tracking-[0.18em] tabular-nums"
                      style={{ color: "hsl(234 62% 47%)" }}
                    >
                      DAY 0{d.num}
                    </span>
                    <span className="text-foreground/85 truncate">{d.teaser}</span>
                  </div>
                ),
            )}
            {data.itinerary.length > 3 && (
              <p className="text-[10px] text-muted-foreground/70 italic pl-[3.25rem]">
                +{data.itinerary.length - 3} more day{data.itinerary.length - 3 === 1 ? "" : "s"} inside
              </p>
            )}
          </div>
        )}

        {/* Weather strip — small, atmospheric */}
        {weatherTemp && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
            <Cloud className="h-3 w-3" />
            <span>
              Expect <span className="font-semibold text-foreground">{weatherTemp}</span>
              {weather?.conditions ? ` · ${weather.conditions}` : ""}
            </span>
          </div>
        )}

        {/* CTA — brand indigo */}
        <button
          type="button"
          className="group/btn w-full flex items-center justify-between rounded-xl pl-4 pr-2 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.99] shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 38%))",
          }}
        >
          <span className="inline-flex items-center gap-2">
            <LogoMark size={14} color="white" />
            Open the full plan
          </span>
          <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover/btn:translate-x-0.5">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </div>
  );
};

/* ─── Inline meta for the single-line stat row ─────────────────── */
const Meta = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) => (
  <div className="flex items-center gap-1 text-foreground min-w-0">
    <span className="text-muted-foreground/70 shrink-0">{icon}</span>
    <span className="font-bold tabular-nums">{value}</span>
    <span className="text-muted-foreground/80 lowercase truncate">{label}</span>
  </div>
);

/* ─── Highlight row — kicker + title + subtitle ─────────────────── */
const HighlightRow = ({
  kicker,
  title,
  subtitle,
  rating,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  rating?: number;
}) => (
  <div className="flex items-baseline gap-3 text-[12px]">
    <span
      className="shrink-0 text-[9px] font-bold tracking-[0.18em] tabular-nums w-[3.25rem]"
      style={{ color: "hsl(234 62% 47%)" }}
    >
      {kicker}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground truncate">{title}</span>
        {rating && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 shrink-0">
            <Star className="h-2.5 w-2.5 fill-current" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="block text-[10px] text-muted-foreground truncate">{subtitle}</span>
      )}
    </div>
  </div>
);

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
