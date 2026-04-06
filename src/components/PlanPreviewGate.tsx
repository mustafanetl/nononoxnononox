import { Plane, Hotel, Sparkles, MapPin, Calendar, ArrowRight } from "lucide-react";

import { getCityImage } from "@/utils/cityImages";
import { TripPlanData } from "@/components/TripSummaryCard";

interface PlanPreviewGateProps {
  data: TripPlanData;
  destination: string;
  enrichedImages?: any[];
  onUpgrade: () => void;
}

const PlanPreviewGate = ({ data, destination, enrichedImages, onUpgrade }: PlanPreviewGateProps) => {
  const days = data.itinerary.length;
  const heroImg = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl || getCityImage(destination, 800, 500);

  return (
    <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
      {/* Hero image — taller for impact */}
      <div className="relative h-52">
        <img src={heroImg} alt={destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-4 w-4 text-white/90" />
            <h3 className="text-xl font-bold text-white">{destination}</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            {days > 0 && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{days} days</span>}
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{data.activities.length} activities</span>
            {data.hotels.length > 0 && <span className="flex items-center gap-1"><Hotel className="h-3 w-3" />{data.hotels.length} hotels</span>}
            {data.flights.length > 0 && <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{data.flights.length} flights</span>}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="p-5 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-foreground">
          Your {destination} plan is ready ✨
        </p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Full itinerary, hotels & booking links inside
        </p>
        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          View Full Plan
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PlanPreviewGate;
