import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, Sparkles, MapPin, ArrowRight, Compass, CalendarDays } from "lucide-react";
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

const TripSummaryCard = ({ data, destination, enrichedImages }: { data: TripPlanData; destination: string; enrichedImages?: any[] }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    sessionStorage.setItem(
      "jolliday-trip-detail",
      JSON.stringify({ data, destination, enrichedImages }),
    );
    navigate("/trip/view");
  };

  const days = data.itinerary.length;
  const stops = data.itinerary.reduce(
    (s: number, d: any) => s + (Array.isArray(d?.slots) ? d.slots.length : 0),
    0,
  ) || data.activities.length;
  const stockHero = useCityHeroImage(destination);
  const heroImg = stockHero || enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl;

  return (
    <div
        onClick={handleClick}
        className="mt-4 w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 animate-stagger-in"
      >
        {/* ── Cinematic hero ── */}
        <div className="relative h-64 overflow-hidden">
          {heroImg ? (
            <img
              src={heroImg}
              alt={destination}
              className="w-full h-full object-cover animate-ken-burns animate-punch-in"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-accent/30 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/80" />
          <div className="absolute inset-0 noise-overlay opacity-40" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p
              className="text-[10px] uppercase tracking-[0.35em] text-white/85 mb-3 inline-flex items-center gap-2 animate-hero-rise"
              style={{ animationDelay: "0.05s" }}
            >
              <Compass className="h-3 w-3" /> Your Jolliday
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
            <StatTile label="Days" value={days} icon={<CalendarDays className="h-3 w-3" />} delay="0.4s" />
            <StatTile label="Stops" value={stops} icon={<MapPin className="h-3 w-3" />} delay="0.45s" />
            <StatTile label="Stays" value={data.hotels.length} icon={<Hotel className="h-3 w-3" />} delay="0.5s" />
            <StatTile label="Flights" value={data.flights.length} icon={<Plane className="h-3 w-3" />} delay="0.55s" />
          </div>
        </div>

        {/* ── Day rail teaser ── */}
        {days > 0 && (
          <div
            className="px-5 pt-5 animate-hero-rise"
            style={{ animationDelay: "0.6s" }}
          >
            <DayRailMini itinerary={data.itinerary} />
          </div>
        )}

        {/* ── CTA ── */}
        <div className="p-4 pt-4">
          <div
            className="w-full py-3 rounded-2xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity animate-hero-rise"
            style={{ animationDelay: "0.7s" }}
          >
            <Sparkles className="h-3.5 w-3.5" /> Open full plan <ArrowRight className="h-3.5 w-3.5" />
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
    <div className="text-base sm:text-lg font-bold text-foreground leading-none">{value}</div>
    <div className="mt-1 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1 justify-center">
      <span className="text-muted-foreground/70">{icon}</span>
      {label}
    </div>
  </div>
);

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
