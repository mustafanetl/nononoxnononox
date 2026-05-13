import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  Sparkles,
  MapPin,
  ArrowRight,
  CalendarDays,
  Share2,
  Download,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/Logo";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";
import { shareTripCard } from "@/utils/shareCardImage";

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
   The "your plan is ready" moment that appears in chat.

   Post-redesign: cinematic hero + stat tiles + route recap
   (origin → destination arc when available) + Share card button
   that exports a 9:16 IG-Story JPEG of the plan. Same click →
   /trip/view handoff and same data contract.
   ───────────────────────────────────────────────────────────── */

type Props = {
  data: TripPlanData;
  destination: string;
  enrichedImages?: any[];
  /** Optional origin (from user prompt or preferences) for the recap arc. */
  origin?: string;
  /** Venue-level photo matches from enrich-destination, keyed by venue name. */
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
  const [sharing, setSharing] = useState(false);
  const [shareDone, setShareDone] = useState(false);

  const handleOpen = () => {
    // Slim down venue photos to avoid exceeding sessionStorage limits
    // and prevent React crashes from massive data during render.
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
    } catch (e) {
      // If sessionStorage is full, store without photos
      sessionStorage.setItem(
        "jolliday-trip-detail",
        JSON.stringify({ data, destination }),
      );
    }
    navigate("/trip/view");
  };

  const days = data.itinerary.length;
  const stops =
    data.itinerary.reduce(
      (s: number, d: any) => s + (Array.isArray(d?.slots) ? d.slots.length : 0),
      0,
    ) || data.activities.length;

  const resolvedOrigin = (origin || data.flights[0]?.from || "").trim();
  const stockHero = useCityHeroImage(destination);
  const enrichedHero = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl;
  // Prefer the verified Google Places photo when we have one, because it's
  // always actually the right city. Stock is an excellent fast-first-paint
  // fallback while enrichment is in flight.
  const preferredHero = enrichedHero || stockHero;
  const [heroSrc, setHeroSrc] = useState<string | undefined>(preferredHero);
  // If the preferred hero URL changes (e.g. enrichment arrives late), swap it in.
  useEffect(() => {
    if (preferredHero && preferredHero !== heroSrc) setHeroSrc(preferredHero);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredHero]);
  // Fallback chain for onError: enrichedHero → stockHero → none.
  const handleHeroError = () => {
    if (heroSrc === enrichedHero && stockHero && stockHero !== enrichedHero) {
      setHeroSrc(stockHero);
      return;
    }
    setHeroSrc(undefined);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    try {
      const dayTitles = data.itinerary
        .slice(0, 4)
        .map((d: any) => d.title)
        .filter(Boolean);
      const result = await shareTripCard({
        destination,
        origin: resolvedOrigin || undefined,
        days,
        stops,
        stays: data.hotels.length,
        flights: data.flights.length,
        dayTitles,
      });
      if (result === "shared") {
        toast.success("Shared!");
      } else if (result === "downloaded") {
        toast.success("Share card saved", {
          description: "Post it on your stories and tag @jolliday",
        });
      } else {
        toast.error("Couldn't create the share card");
      }
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2200);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      onClick={handleOpen}
      className="mt-4 w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 animate-stagger-in animate-share-breathe"
    >
      {/* ── Cinematic hero ── */}
      <div className="relative h-64 overflow-hidden">
        {heroSrc ? (
          <img
            src={heroSrc}
            alt={destination}
            onError={handleHeroError}
            className="w-full h-full object-cover animate-ken-burns animate-punch-in"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-accent/30 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/80" />
        <div className="absolute inset-0 noise-overlay opacity-40" />

        {/* Share pill, top-right */}
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-foreground text-xs font-semibold shadow-md hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-wait press-bounce animate-hero-rise"
          style={{ animationDelay: "0.38s" }}
          aria-label="Share trip card"
        >
          {sharing ? (
            <Download className="h-3.5 w-3.5 animate-pulse" />
          ) : shareDone ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          <span>{shareDone ? "Saved" : sharing ? "Building…" : "Share"}</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p
            className="text-[10px] uppercase tracking-[0.35em] text-white/85 mb-3 inline-flex items-center gap-2 animate-hero-rise"
            style={{ animationDelay: "0.05s" }}
          >
            <LogoMark size={12} color="currentColor" /> Your Jolliday
          </p>
          <h3
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[0.95] drop-shadow-lg"
            aria-label={destination}
          >
            {destination.split("").map((ch, i) => (
              <span
                key={i}
                className="letter-rise"
                style={{ animationDelay: `${0.18 + i * 0.04}s` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h3>
          {days > 0 && (
            <p
              className="mt-2 text-white/80 text-sm animate-hero-rise"
              style={{ animationDelay: "0.32s" }}
            >
              {days} {days === 1 ? "day" : "days"} crafted just for you
            </p>
          )}
        </div>
      </div>

      {/* ── Stat tiles overlapping hero ── */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          <StatTile
            label="Days"
            value={days}
            icon={<CalendarDays className="h-3 w-3" />}
            delay="0.4s"
          />
          <StatTile
            label="Stops"
            value={stops}
            icon={<MapPin className="h-3 w-3" />}
            delay="0.45s"
          />
          <StatTile
            label="Stays"
            value={data.hotels.length}
            icon={<Hotel className="h-3 w-3" />}
            delay="0.5s"
          />
          <StatTile
            label="Flights"
            value={data.flights.length}
            icon={<Plane className="h-3 w-3" />}
            delay="0.55s"
          />
        </div>
      </div>

      {/* ── Route recap (origin → destination arc) ── */}
      {resolvedOrigin && (
        <div
          className="px-5 pt-5 animate-hero-rise"
          style={{ animationDelay: "0.58s" }}
        >
          <RouteRecap origin={resolvedOrigin} destination={destination} />
        </div>
      )}

      {/* ── Day rail teaser ── */}
      {days > 0 && (
        <div
          className={`px-5 ${resolvedOrigin ? "pt-4" : "pt-5"} animate-hero-rise`}
          style={{ animationDelay: "0.62s" }}
        >
          <DayRailMini itinerary={data.itinerary} />
        </div>
      )}

      {/* ── CTA ── */}
      <div className="p-4 pt-4">
        <div
          className="w-full py-3 rounded-2xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity animate-hero-rise press-bounce"
          style={{ animationDelay: "0.7s" }}
        >
          <Sparkles className="h-3.5 w-3.5" /> Open full plan{" "}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};

export const StatTile = ({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delay?: string;
}) => (
  <div
    className="rounded-xl border border-border bg-card/95 backdrop-blur p-2 text-center shadow-sm animate-hero-rise"
    style={{ animationDelay: delay }}
  >
    <div className="text-base sm:text-lg font-bold text-foreground leading-none">
      {value}
    </div>
    <div className="mt-1 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1 justify-center">
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
          {/* plane glyph mid-arc */}
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
