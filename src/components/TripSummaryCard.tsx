import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  ArrowRight,
  CalendarDays,
  Activity,
} from "lucide-react";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";

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
   TripSummaryCard
   Clean, static plan card — no animations.
   Shows: city image (revealed on hover), stats (days, hotels,
   flights, activities), and a button to open the full plan.
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

  return (
    <div
      onClick={handleOpen}
      className="group mt-4 w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-200"
    >
      {/* City image — always visible, expands on hover */}
      <div className="relative h-32 group-hover:h-44 overflow-hidden transition-all duration-300 ease-in-out">
        {heroSrc ? (
          <img
            src={heroSrc}
            alt={destination}
            onError={handleHeroError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        <div className="absolute bottom-3 left-4">
          <h3 className="text-xl font-bold text-white leading-tight drop-shadow">
            {destination}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Days" value={days} icon={<CalendarDays className="h-3.5 w-3.5" />} />
          <StatTile label="Hotels" value={data.hotels.length} icon={<Hotel className="h-3.5 w-3.5" />} />
          <StatTile label="Flights" value={data.flights.length} icon={<Plane className="h-3.5 w-3.5" />} />
          <StatTile label="Activities" value={activitiesCount} icon={<Activity className="h-3.5 w-3.5" />} />
        </div>

        {/* View plan button */}
        <button
          type="button"
          className="mt-4 w-full py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          View full plan <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

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

/* Static arc showing origin → destination as a recap. */
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
