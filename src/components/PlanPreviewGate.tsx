import { Lock, Plane, Hotel, Sparkles, MapPin, Calendar } from "lucide-react";

import { getCityImage } from "@/utils/cityImages";
import { TripPlanData } from "@/components/TripSummaryCard";

interface PlanPreviewGateProps {
  data: TripPlanData;
  destination: string;
  enrichedImages?: any[];
  onUpgrade: () => void;
}

const PlanPreviewGate = ({ data, destination, enrichedImages, onUpgrade }: PlanPreviewGateProps) => {
  const teaserActivities = data.activities.slice(0, 2);
  const hiddenCount = data.activities.length - 2;
  const days = data.itinerary.length;
  const heroImg = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl || getCityImage(destination, 800, 400);

  return (
    <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden">
      {/* Hero image */}
      <div className="relative h-36">
        <img src={heroImg} alt={destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-white/90" />
            <h3 className="text-lg font-bold text-white">{destination}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/80">
            {days > 0 && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{days} days</span>}
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{data.activities.length} activities</span>
            {data.hotels.length > 0 && <span className="flex items-center gap-1"><Hotel className="h-3 w-3" />{data.hotels.length} hotels</span>}
            {data.flights.length > 0 && <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{data.flights.length} flights</span>}
          </div>
        </div>
      </div>

      {/* Teaser activities */}
      <div className="p-3 space-y-2">
        {teaserActivities.map((act, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {act.realPhoto ? (
                <img src={act.realPhoto} alt={act.name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{act.name}</p>
              {(act as any).time && <p className="text-[10px] text-muted-foreground">{(act as any).time}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Blurred locked section */}
      <div className="relative">
        <div className="p-3 space-y-2 blur-[6px] select-none pointer-events-none" aria-hidden>
          {[...Array(Math.min(hiddenCount, 3))].map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-2 w-1/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card via-card/90 to-transparent">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground text-center px-4">
            Your {destination} plan is ready
          </p>
          <p className="text-[11px] text-muted-foreground text-center mt-0.5 mb-3 px-4">
            {hiddenCount > 0 ? `+${hiddenCount} more activities, ` : ""}full itinerary & booking links
          </p>
          <button
            onClick={onUpgrade}
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Unlock Full Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanPreviewGate;
